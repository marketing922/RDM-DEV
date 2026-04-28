'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { RM, PageHeader } from '@/components/admin/primitives'

const AI_SUBSYSTEMS = [
  'ai-generate',
  'ai-geo',
  'ai-moderate',
  'ai-pipeline',
  'ai-embedding',
] as const

type AuditDoc = {
  id: string | number
  action?: string
  subsystem?: string
  model?: string
  collectionTarget?: string
  fieldTarget?: string
  user?: any
  actorId?: string | null
  promptTokens?: number | null
  completionTokens?: number | null
  costEur?: number | null
  durationMs?: number | null
  ok?: boolean
  errorCode?: string | null
  createdAt?: string
  timestamp?: string
}

type PageResult = {
  docs: AuditDoc[]
  totalDocs?: number
  totalPages?: number
  page?: number
  hasNextPage?: boolean
}

const EMPTY: PageResult = { docs: [], totalDocs: 0, totalPages: 1, page: 1, hasNextPage: false }

function startOfTodayUTCIso(): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return d.toISOString()
}

function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function thirtyDaysAgoIso(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 29) // inclusive window: today + 29 prior days = 30 days
  return startOfDayUTC(d).toISOString()
}

function buildSubsystemQuery(): string {
  // Payload REST uses where[field][in]=a,b,c
  return AI_SUBSYSTEMS.map(encodeURIComponent).join(',')
}

function fmtEur(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(4)
}

function fmtInt(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR')
}

function fmtDateTime(iso?: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function resolveUserLabel(u: any): string {
  if (!u) return '—'
  if (typeof u === 'string') return u
  if (typeof u === 'object') {
    const name =
      (u.firstName && u.lastName && `${u.firstName} ${u.lastName}`) ||
      u.email ||
      u.name ||
      u.id
    return String(name || '—')
  }
  return '—'
}

async function fetchAudit(params: Record<string, string>): Promise<PageResult> {
  const qs = new URLSearchParams(params)
  try {
    const res = await fetch(`/api/auditLog?${qs.toString()}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return EMPTY
    const json = await res.json()
    return {
      docs: Array.isArray(json?.docs) ? json.docs : [],
      totalDocs: typeof json?.totalDocs === 'number' ? json.totalDocs : (json?.docs?.length ?? 0),
      totalPages: json?.totalPages,
      page: json?.page,
      hasNextPage: json?.hasNextPage,
    }
  } catch {
    return EMPTY
  }
}

type Totals = {
  todayCount: number
  todayCost: number
  m30Count: number
  m30Cost: number
}

type DailyBucket = { dayIso: string; label: string; cost: number; count: number }

function buildDailyBuckets(docs: AuditDoc[]): DailyBucket[] {
  const buckets = new Map<string, DailyBucket>()
  const today = startOfDayUTC(new Date())
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    })
    buckets.set(key, { dayIso: key, label, cost: 0, count: 0 })
  }
  for (const doc of docs) {
    const iso = doc.createdAt || doc.timestamp
    if (!iso) continue
    const key = iso.slice(0, 10)
    const b = buckets.get(key)
    if (!b) continue
    b.cost += Number(doc.costEur || 0)
    b.count += 1
  }
  return Array.from(buckets.values())
}

const AIUsageDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totals, setTotals] = useState<Totals>({
    todayCount: 0,
    todayCost: 0,
    m30Count: 0,
    m30Cost: 0,
  })
  const [recent, setRecent] = useState<AuditDoc[]>([])
  const [daily, setDaily] = useState<DailyBucket[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)

      const todayStart = startOfTodayUTCIso()
      const m30Start = thirtyDaysAgoIso()
      const subsystemIn = buildSubsystemQuery()

      // We rely on the REST endpoint for AuditLog. For totals we request
      // limit=0 which returns totalDocs but no docs (cheap).
      const [todayRes, m30Res, recentRes, m30Docs] = await Promise.all([
        fetchAudit({
          'where[subsystem][in]': subsystemIn,
          'where[createdAt][greater_than_equal]': todayStart,
          limit: '0',
          depth: '0',
        }),
        fetchAudit({
          'where[subsystem][in]': subsystemIn,
          'where[createdAt][greater_than_equal]': m30Start,
          limit: '0',
          depth: '0',
        }),
        fetchAudit({
          'where[subsystem][in]': subsystemIn,
          sort: '-createdAt',
          limit: '20',
          depth: '1',
        }),
        // For the chart we pull up to 1000 rows on the 30d window.
        fetchAudit({
          'where[subsystem][in]': subsystemIn,
          'where[createdAt][greater_than_equal]': m30Start,
          sort: '-createdAt',
          limit: '1000',
          depth: '0',
        }),
      ])

      if (cancelled) return

      // totalDocs comes from the REST response; when the endpoint is happy,
      // even limit=0 returns the accurate totalDocs.
      const todayCount = todayRes.totalDocs ?? 0
      const m30Count = m30Res.totalDocs ?? 0

      // Sum cost by iterating m30 docs; today cost is derived from those filtered.
      const todayStartMs = new Date(todayStart).getTime()
      let todayCost = 0
      let m30Cost = 0
      for (const d of m30Docs.docs) {
        const c = Number(d.costEur || 0)
        m30Cost += c
        const iso = d.createdAt || d.timestamp
        if (iso && new Date(iso).getTime() >= todayStartMs) {
          todayCost += c
        }
      }

      setTotals({ todayCount, todayCost, m30Count, m30Cost })
      setRecent(recentRes.docs)
      setDaily(buildDailyBuckets(m30Docs.docs))
      setLoading(false)
    }
    load().catch((e) => {
      if (!cancelled) {
        setError(e?.message || 'Erreur inconnue')
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const maxDaily = useMemo(() => {
    const m = daily.reduce((acc, d) => (d.cost > acc ? d.cost : acc), 0)
    return m > 0 ? m : 1
  }, [daily])

  return (
    <div
      style={{
        padding: '32px 32px 60px',
        fontFamily: RM.fSans,
        color: RM.ink,
        background: RM.cream,
        minHeight: '100%',
      }}
    >
      <PageHeader
        eyebrow="OBSERVABILITÉ"
        title="Consommation IA"
        sub="Tokens, coûts et dérives — 30 derniers jours"
      />

      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: '10px 14px',
            background: RM.paper,
            border: `1px solid ${RM.burgundy}`,
            borderRadius: 6,
            color: RM.burgundy,
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <Tile label="Appels aujourd'hui" value={loading ? '…' : fmtInt(totals.todayCount)} />
        <Tile
          label="Coût aujourd'hui (EUR)"
          value={loading ? '…' : fmtEur(totals.todayCost)}
          accent={RM.burgundy}
        />
        <Tile label="Appels 30 jours" value={loading ? '…' : fmtInt(totals.m30Count)} />
        <Tile
          label="Coût 30 jours (EUR)"
          value={loading ? '…' : fmtEur(totals.m30Cost)}
          accent={RM.burgundy}
        />
      </div>

      {/* Chart */}
      <div
        style={{
          background: RM.paper,
          border: `1px solid ${RM.rule}`,
          borderRadius: 8,
          padding: '20px 22px',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: RM.inkSoft,
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          Coût journalier (EUR) — 30 derniers jours
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 4,
            height: 160,
            borderBottom: `1px solid ${RM.rule}`,
            paddingBottom: 4,
          }}
        >
          {daily.map((b) => {
            const h = b.cost > 0 ? Math.max(2, (b.cost / maxDaily) * 150) : 2
            return (
              <div
                key={b.dayIso}
                title={`${b.label} — ${fmtEur(b.cost)} EUR · ${b.count} appels`}
                style={{
                  flex: 1,
                  height: h,
                  background: b.cost > 0 ? RM.teal : RM.ruleStrong,
                  borderRadius: '3px 3px 0 0',
                  transition: 'background 120ms ease',
                  cursor: 'default',
                }}
              />
            )
          })}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontSize: 10,
            color: RM.inkSoft,
            fontFamily: RM.fMono,
          }}
        >
          <span>{daily[0]?.label ?? ''}</span>
          <span>{daily[Math.floor(daily.length / 2)]?.label ?? ''}</span>
          <span>{daily[daily.length - 1]?.label ?? ''}</span>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: RM.paper,
          border: `1px solid ${RM.rule}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${RM.rule}`,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: RM.inkSoft,
            fontWeight: 600,
            background: RM.creamSoft,
          }}
        >
          Derniers appels IA
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
              fontFamily: RM.fSans,
            }}
          >
            <thead>
              <tr style={{ background: RM.creamSoft, color: RM.inkSoft }}>
                <Th>Date</Th>
                <Th>Subsystem</Th>
                <Th>Collection</Th>
                <Th>Champ</Th>
                <Th>Utilisateur</Th>
                <Th align="right">Tokens</Th>
                <Th align="right">Coût (EUR)</Th>
                <Th>État</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: RM.inkSoft }}>
                    Chargement…
                  </td>
                </tr>
              )}
              {!loading && recent.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      color: RM.inkSoft,
                      fontFamily: RM.fSerif,
                      fontStyle: 'italic',
                    }}
                  >
                    Aucun appel IA enregistré.
                  </td>
                </tr>
              )}
              {!loading &&
                recent.map((d) => {
                  const pt = Number(d.promptTokens || 0)
                  const ct = Number(d.completionTokens || 0)
                  const tokens = pt + ct
                  const ok = d.ok !== false && !d.errorCode
                  return (
                    <tr
                      key={String(d.id)}
                      style={{ borderTop: `1px solid ${RM.rule}` }}
                    >
                      <Td>{fmtDateTime(d.createdAt || d.timestamp)}</Td>
                      <Td>
                        <span style={{ fontFamily: RM.fMono, fontSize: 11 }}>
                          {d.subsystem || '—'}
                        </span>
                      </Td>
                      <Td>{d.collectionTarget || '—'}</Td>
                      <Td>
                        <span style={{ fontFamily: RM.fMono, fontSize: 11 }}>
                          {d.fieldTarget || '—'}
                        </span>
                      </Td>
                      <Td>{resolveUserLabel(d.user) || d.actorId || '—'}</Td>
                      <Td align="right">
                        <span style={{ fontFamily: RM.fMono }}>
                          {tokens > 0 ? fmtInt(tokens) : '—'}
                        </span>
                      </Td>
                      <Td align="right">
                        <span style={{ fontFamily: RM.fMono, color: RM.burgundy }}>
                          {d.costEur != null ? fmtEur(Number(d.costEur)) : '—'}
                        </span>
                      </Td>
                      <Td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 600,
                            background: ok ? RM.stone : RM.burgundy,
                            color: ok ? RM.teal : '#fff',
                          }}
                        >
                          {ok ? 'OK' : d.errorCode || 'ERR'}
                        </span>
                      </Td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const Tile: React.FC<{ label: string; value: string; accent?: string }> = ({
  label,
  value,
  accent,
}) => (
  <div
    style={{
      background: RM.paper,
      border: `1px solid ${RM.rule}`,
      borderRadius: 8,
      padding: '18px 20px',
    }}
  >
    <div
      style={{
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        color: RM.inkSoft,
        fontWeight: 600,
        marginBottom: 10,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: RM.fDisplay,
        fontSize: 38,
        color: accent || RM.teal,
        lineHeight: 1,
        fontWeight: 400,
      }}
    >
      {value}
    </div>
  </div>
)

const Th: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({
  children,
  align = 'left',
}) => (
  <th
    style={{
      padding: '10px 16px',
      textAlign: align,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      fontWeight: 600,
      color: RM.inkSoft,
    }}
  >
    {children}
  </th>
)

const Td: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({
  children,
  align = 'left',
}) => (
  <td
    style={{
      padding: '12px 16px',
      textAlign: align,
      color: RM.ink,
      verticalAlign: 'middle',
    }}
  >
    {children}
  </td>
)

export default AIUsageDashboard
