'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { RM, PageHeader } from '@/components/admin/primitives'

type ErrorLevel = 'info' | 'warning' | 'error' | 'critical'

type ErrorDoc = {
  id: string | number
  signature?: string
  level?: ErrorLevel
  subsystem?: string
  name?: string
  message?: string
  route?: string
  count?: number
  firstSeenAt?: string
  lastSeenAt?: string
  resolved?: boolean
  createdAt?: string
}

type PageResult = {
  docs: ErrorDoc[]
  totalDocs?: number
  unavailable?: boolean
}

const EMPTY: PageResult = { docs: [], totalDocs: 0 }
const UNAVAILABLE: PageResult = { docs: [], totalDocs: 0, unavailable: true }

function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - (n - 1))
  return startOfDayUTC(d).toISOString()
}

function isoHoursAgo(n: number): string {
  const d = new Date()
  d.setUTCHours(d.getUTCHours() - n)
  return d.toISOString()
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

function truncate(s: string | undefined, max: number): string {
  if (!s) return '—'
  return s.length > max ? s.slice(0, max) + '…' : s
}

async function fetchErrors(params: Record<string, string>): Promise<PageResult> {
  const qs = new URLSearchParams(params)
  try {
    const res = await fetch(`/api/errorLog?${qs.toString()}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (res.status === 404) return UNAVAILABLE
    if (!res.ok) return EMPTY
    const json = await res.json()
    return {
      docs: Array.isArray(json?.docs) ? json.docs : [],
      totalDocs:
        typeof json?.totalDocs === 'number' ? json.totalDocs : (json?.docs?.length ?? 0),
    }
  } catch {
    return EMPTY
  }
}

type Totals = {
  active: number
  critical24: number
  total7: number
  total30: number
}

type DailyBucket = { dayIso: string; label: string; count: number }

function buildDailyBuckets(docs: ErrorDoc[]): DailyBucket[] {
  const buckets = new Map<string, DailyBucket>()
  const today = startOfDayUTC(new Date())
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    buckets.set(key, { dayIso: key, label, count: 0 })
  }
  for (const doc of docs) {
    const iso = doc.lastSeenAt || doc.createdAt
    if (!iso) continue
    const key = iso.slice(0, 10)
    const b = buckets.get(key)
    if (!b) continue
    b.count += Number(doc.count || 1)
  }
  return Array.from(buckets.values())
}

function levelColor(level: ErrorLevel | string | undefined): string {
  if (level === 'info') return RM.teal
  if (level === 'warning') return RM.ochre
  return RM.burgundy
}

const ErrorsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totals, setTotals] = useState<Totals>({
    active: 0,
    critical24: 0,
    total7: 0,
    total30: 0,
  })
  const [rows, setRows] = useState<ErrorDoc[]>([])
  const [daily, setDaily] = useState<DailyBucket[]>([])
  const [includeResolved, setIncludeResolved] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const m30Start = isoDaysAgo(30)
      const m7Start = isoDaysAgo(7)
      const h24Start = isoHoursAgo(24)

      const whereRows: Record<string, string> = {
        sort: '-count',
        limit: '20',
        depth: '0',
      }
      if (!includeResolved) whereRows['where[resolved][equals]'] = 'false'

      const [activeRes, crit24Res, m7Res, m30Res, topRes, chartRes] = await Promise.all([
        fetchErrors({ 'where[resolved][equals]': 'false', limit: '0', depth: '0' }),
        fetchErrors({
          'where[level][equals]': 'critical',
          'where[lastSeenAt][greater_than_equal]': h24Start,
          limit: '0',
          depth: '0',
        }),
        fetchErrors({
          'where[lastSeenAt][greater_than_equal]': m7Start,
          limit: '0',
          depth: '0',
        }),
        fetchErrors({
          'where[lastSeenAt][greater_than_equal]': m30Start,
          limit: '0',
          depth: '0',
        }),
        fetchErrors(whereRows),
        fetchErrors({
          'where[lastSeenAt][greater_than_equal]': m30Start,
          sort: '-lastSeenAt',
          limit: '500',
          depth: '0',
        }),
      ])

      if (cancelled) return

      if (
        activeRes.unavailable ||
        crit24Res.unavailable ||
        m7Res.unavailable ||
        m30Res.unavailable ||
        topRes.unavailable ||
        chartRes.unavailable
      ) {
        setUnavailable(true)
        setLoading(false)
        return
      }

      setTotals({
        active: activeRes.totalDocs ?? 0,
        critical24: crit24Res.totalDocs ?? 0,
        total7: m7Res.totalDocs ?? 0,
        total30: m30Res.totalDocs ?? 0,
      })
      setRows(topRes.docs)
      setDaily(buildDailyBuckets(chartRes.docs))
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
  }, [includeResolved])

  const maxDaily = useMemo(() => {
    const m = daily.reduce((acc, d) => (d.count > acc ? d.count : acc), 0)
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
        title="Erreurs système"
        sub="Erreurs serveur dédupliquées — 30 derniers jours"
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

      {unavailable && (
        <div
          style={{
            marginBottom: 20,
            padding: '14px 18px',
            background: RM.paper,
            border: `1px solid ${RM.rule}`,
            borderRadius: 6,
            color: RM.inkSoft,
            fontFamily: RM.fSerif,
            fontStyle: 'italic',
          }}
        >
          Aucune donnée — la collection errorLog n’est pas encore disponible.
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <Tile
          label="Erreurs actives"
          value={loading ? '…' : fmtInt(totals.active)}
          accent={RM.burgundy}
        />
        <Tile
          label="Critiques 24h"
          value={loading ? '…' : fmtInt(totals.critical24)}
          accent={RM.burgundy}
        />
        <Tile label="Total 7 jours" value={loading ? '…' : fmtInt(totals.total7)} />
        <Tile label="Total 30 jours" value={loading ? '…' : fmtInt(totals.total30)} />
      </div>

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
          Occurrences par jour — 30 derniers jours
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
            const h = b.count > 0 ? Math.max(2, (b.count / maxDaily) * 150) : 2
            return (
              <div
                key={b.dayIso}
                title={`${b.label} — ${fmtInt(b.count)} occurrences`}
                style={{
                  flex: 1,
                  height: h,
                  background: b.count > 0 ? RM.burgundy : RM.ruleStrong,
                  borderRadius: '3px 3px 0 0',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: RM.creamSoft,
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              color: RM.inkSoft,
              fontWeight: 600,
            }}
          >
            Erreurs les plus fréquentes
          </div>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: RM.inkSoft,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={includeResolved}
              onChange={(e) => setIncludeResolved(e.target.checked)}
              style={{ accentColor: RM.teal }}
            />
            Inclure résolues
          </label>
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
                <Th>Niveau</Th>
                <Th>Sous-système</Th>
                <Th>Message</Th>
                <Th align="right">Occurrences</Th>
                <Th>Dernière occurrence</Th>
                <Th>Route</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: RM.inkSoft }}>
                    Chargement…
                  </td>
                </tr>
              )}
              {!loading && !unavailable && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      color: RM.inkSoft,
                      fontFamily: RM.fSerif,
                      fontStyle: 'italic',
                    }}
                  >
                    Aucune erreur enregistrée.
                  </td>
                </tr>
              )}
              {!loading &&
                !unavailable &&
                rows.map((d) => (
                  <tr
                    key={String(d.id)}
                    onClick={() => {
                      window.location.href = `/admin/collections/errorLog/${d.id}`
                    }}
                    style={{
                      borderTop: `1px solid ${RM.rule}`,
                      cursor: 'pointer',
                    }}
                  >
                    <Td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 600,
                          background: levelColor(d.level),
                          color: '#fff',
                          textTransform: 'uppercase',
                          letterSpacing: 0.6,
                        }}
                      >
                        {d.level || 'error'}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ fontFamily: RM.fMono, fontSize: 11 }}>
                        {d.subsystem || '—'}
                      </span>
                    </Td>
                    <Td>{truncate(d.message, 80)}</Td>
                    <Td align="right">
                      <span style={{ fontFamily: RM.fMono, color: RM.burgundy }}>
                        {fmtInt(Number(d.count || 0))}
                      </span>
                    </Td>
                    <Td>{fmtDateTime(d.lastSeenAt)}</Td>
                    <Td>
                      <span style={{ fontFamily: RM.fMono, fontSize: 11 }}>
                        {d.route || '—'}
                      </span>
                    </Td>
                  </tr>
                ))}
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

export default ErrorsDashboard
