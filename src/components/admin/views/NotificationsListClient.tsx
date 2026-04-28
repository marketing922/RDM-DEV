'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@payloadcms/ui'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { RM, cmsBtn, PageHeader } from '@/components/admin/primitives'

type NotifType = 'info' | 'success' | 'warning' | 'error' | 'critical'

type NotifDoc = {
  id: string | number
  type?: NotifType
  subsystem?: string
  title?: string
  body?: string | null
  link?: string | null
  source?: string | null
  targetRole?: 'all' | 'admin' | 'editor' | null
  readBy?: Array<{ userId?: string } | null> | null
  dismissedBy?: Array<{ userId?: string } | null> | null
  expiresAt?: string | null
  createdAt?: string
}

type PageResult = {
  docs: NotifDoc[]
  totalDocs?: number
  totalPages?: number
  page?: number
}

const EMPTY: PageResult = { docs: [], totalDocs: 0, totalPages: 1, page: 1 }
const PAGE_SIZE = 20

const SUBSYSTEMS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Tous sous-systèmes' },
  { value: 'ai', label: 'IA' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'security', label: 'Sécurité' },
  { value: 'content', label: 'Contenu' },
  { value: 'system', label: 'Système' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'contact', label: 'Contact' },
  { value: 'order', label: 'Commande' },
  { value: 'other', label: 'Autre' },
]

const TYPES: Array<{ value: string; label: string }> = [
  { value: '', label: 'Tous types' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Succès' },
  { value: 'warning', label: 'Avertissement' },
  { value: 'error', label: 'Erreur' },
  { value: 'critical', label: 'Critique' },
]

const READ_OPTIONS: Array<{ value: 'all' | 'unread' | 'read'; label: string }> = [
  { value: 'all', label: 'Toutes' },
  { value: 'unread', label: 'Non lues' },
  { value: 'read', label: 'Lues' },
]

function typeColor(type?: NotifType): string {
  switch (type) {
    case 'critical':
    case 'error':
      return RM.burgundy
    case 'warning':
      return RM.ochre
    case 'success':
      return RM.teal
    default:
      return RM.teal
  }
}

function typeLabel(t?: NotifType): string {
  switch (t) {
    case 'critical':
      return 'Critique'
    case 'error':
      return 'Erreur'
    case 'warning':
      return 'Avertissement'
    case 'success':
      return 'Succès'
    default:
      return 'Info'
  }
}

function toUserIds(arr: NotifDoc['readBy']): string[] {
  if (!Array.isArray(arr)) return []
  const out: string[] = []
  for (const e of arr) {
    if (e && typeof e === 'object' && typeof e.userId === 'string') {
      out.push(e.userId)
    }
  }
  return out
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

async function fetchNotifications(params: Record<string, string>): Promise<PageResult> {
  const qs = new URLSearchParams(params)
  try {
    const res = await fetch(`/api/notifications?${qs.toString()}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return EMPTY
    const json = await res.json()
    return {
      docs: Array.isArray(json?.docs) ? json.docs : [],
      totalDocs: typeof json?.totalDocs === 'number' ? json.totalDocs : 0,
      totalPages: typeof json?.totalPages === 'number' ? json.totalPages : 1,
      page: typeof json?.page === 'number' ? json.page : 1,
    }
  } catch {
    return EMPTY
  }
}

const GRID_COLS = '110px 120px 2.2fr 110px 140px 100px'

const NotificationsListClient: React.FC = () => {
  const { user } = useAuth()
  const userId = String((user as any)?.id ?? '')

  const [page, setPage] = useState(1)
  const [subsystem, setSubsystem] = useState('')
  const [type, setType] = useState('')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<PageResult>(EMPTY)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params: Record<string, string> = {
      sort: '-createdAt',
      limit: String(PAGE_SIZE),
      page: String(page),
      depth: '0',
    }
    if (subsystem) params['where[subsystem][equals]'] = subsystem
    if (type) params['where[type][equals]'] = type
    const data = await fetchNotifications(params)
    setResult(data)
    setLoading(false)
  }, [page, subsystem, type])

  useEffect(() => {
    load()
  }, [load])

  // Client-side filter for read/unread (needs userId).
  const filteredDocs = useMemo(() => {
    if (readFilter === 'all') return result.docs
    return result.docs.filter((d) => {
      const ids = toUserIds(d.readBy)
      const isRead = ids.includes(userId)
      return readFilter === 'read' ? isRead : !isRead
    })
  }, [result.docs, readFilter, userId])

  const totalPages = result.totalPages ?? 1
  const totalDocs = result.totalDocs ?? 0
  const canPrev = page > 1
  const canNext = page < totalPages

  const markOne = async (id: string | number, action: 'read' | 'dismiss') => {
    try {
      const res = await fetch(`/api/notifications/${id}/mark`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) return
      // Optimistic: inject userId so the row reflects the new state.
      setResult((prev) => ({
        ...prev,
        docs: prev.docs.map((d) => {
          if (String(d.id) !== String(id)) return d
          const field = action === 'read' ? 'readBy' : 'dismissedBy'
          const current = toUserIds(d[field] as NotifDoc['readBy'])
          if (current.includes(userId)) return d
          const nextIds = [...current, userId].map((uid) => ({ userId: uid }))
          return { ...d, [field]: nextIds }
        }),
      }))
    } catch {
      /* silent */
    }
  }

  const markAllRead = async () => {
    if (!userId) return
    setBusy(true)
    const targets = filteredDocs.filter((d) => !toUserIds(d.readBy).includes(userId))
    // Sequential to avoid hammering the server.
    for (const d of targets) {
      // eslint-disable-next-line no-await-in-loop
      await markOne(d.id, 'read')
    }
    setBusy(false)
  }

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
        eyebrow="SYSTÈME"
        title="Notifications"
        sub={`${totalDocs} notifications totales`}
        right={
          <button
            type="button"
            onClick={markAllRead}
            disabled={busy || loading}
            style={{
              ...cmsBtn.primary,
              opacity: busy || loading ? 0.6 : 1,
              cursor: busy || loading ? 'not-allowed' : 'pointer',
            }}
          >
            <Check size={14} /> Tout marquer lu
          </button>
        }
      />

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 20,
          alignItems: 'center',
        }}
      >
        <select
          value={subsystem}
          onChange={(e) => {
            setPage(1)
            setSubsystem(e.target.value)
          }}
          style={selectStyle}
        >
          {SUBSYSTEMS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => {
            setPage(1)
            setType(e.target.value)
          }}
          style={selectStyle}
        >
          {TYPES.map((o) => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={readFilter}
          onChange={(e) => setReadFilter(e.target.value as 'all' | 'unread' | 'read')}
          style={selectStyle}
        >
          {READ_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
            display: 'grid',
            gridTemplateColumns: GRID_COLS,
            background: RM.creamSoft,
            padding: '12px 20px',
            borderBottom: `1px solid ${RM.rule}`,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            color: RM.inkSoft,
            fontWeight: 600,
          }}
        >
          <span>Type</span>
          <span>Sous-système</span>
          <span>Titre · Message</span>
          <span>Source</span>
          <span>Date</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        {loading && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: RM.inkSoft,
              fontFamily: RM.fSerif,
              fontStyle: 'italic',
            }}
          >
            Chargement…
          </div>
        )}

        {!loading && filteredDocs.length === 0 && (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: RM.inkSoft,
              fontSize: 13,
              fontFamily: RM.fSerif,
              fontStyle: 'italic',
            }}
          >
            Aucune notification ne correspond aux filtres.
          </div>
        )}

        {!loading &&
          filteredDocs.map((d, idx) => {
            const color = typeColor(d.type)
            const isRead = toUserIds(d.readBy).includes(userId)
            const href = d.link || undefined
            const isLast = idx === filteredDocs.length - 1
            return (
              <div
                key={String(d.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID_COLS,
                  padding: '14px 20px',
                  borderBottom: isLast ? 'none' : `1px solid ${RM.rule}`,
                  alignItems: 'center',
                  background: isRead ? 'transparent' : 'rgba(255, 245, 213, 0.35)',
                }}
              >
                <span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 9px',
                      borderRadius: 999,
                      background: color,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                    }}
                  >
                    {typeLabel(d.type)}
                  </span>
                </span>
                <span
                  style={{ fontFamily: RM.fMono, fontSize: 11, color: RM.inkSoft }}
                >
                  {d.subsystem || 'other'}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                  {href ? (
                    <Link
                      href={href}
                      onClick={() => {
                        if (!isRead) void markOne(d.id, 'read')
                      }}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: RM.teal,
                        textDecoration: 'none',
                        fontFamily: RM.fSans,
                        lineHeight: 1.3,
                      }}
                    >
                      {d.title || '—'}
                    </Link>
                  ) : (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: RM.ink,
                        lineHeight: 1.3,
                      }}
                    >
                      {d.title || '—'}
                    </span>
                  )}
                  {d.body && (
                    <span
                      style={{
                        fontSize: 12,
                        color: RM.inkSoft,
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        overflow: 'hidden',
                      }}
                    >
                      {d.body}
                    </span>
                  )}
                </span>
                <span
                  style={{ fontFamily: RM.fMono, fontSize: 11, color: RM.inkSoft }}
                >
                  {d.source || '—'}
                </span>
                <span style={{ fontSize: 12, color: RM.inkSoft }}>
                  {fmtDateTime(d.createdAt)}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    gap: 6,
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  {!isRead && (
                    <button
                      type="button"
                      title="Marquer comme lu"
                      aria-label="Marquer comme lu"
                      onClick={() => void markOne(d.id, 'read')}
                      style={iconBtnStyle}
                    >
                      <Check size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Ignorer"
                    aria-label="Ignorer"
                    onClick={() => void markOne(d.id, 'dismiss')}
                    style={iconBtnStyle}
                  >
                    <X size={13} />
                  </button>
                </span>
              </div>
            )
          })}

        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderTop: `1px solid ${RM.rule}`,
              background: RM.creamSoft,
            }}
          >
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev}
              style={{
                ...cmsBtn.ghost,
                opacity: canPrev ? 1 : 0.4,
                cursor: canPrev ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ChevronLeft size={14} /> Précédent
            </button>
            <span style={{ fontSize: 12, color: RM.inkSoft }}>
              Page {page} sur {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={!canNext}
              style={{
                ...cmsBtn.ghost,
                opacity: canNext ? 1 : 0.4,
                cursor: canNext ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Suivant <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  background: RM.paper,
  border: `1px solid ${RM.ruleStrong}`,
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: RM.fSans,
  color: RM.ink,
  cursor: 'pointer',
}

const iconBtnStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 6,
  border: `1px solid ${RM.rule}`,
  background: 'transparent',
  color: RM.inkSoft,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export default NotificationsListClient
