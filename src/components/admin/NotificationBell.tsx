'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@payloadcms/ui'
import { Bell, X } from 'lucide-react'
import { RM } from '@/components/admin/primitives/tokens'

type NotifType = 'info' | 'success' | 'warning' | 'error' | 'critical'

type NotifDoc = {
  id: string | number
  type?: NotifType
  subsystem?: string
  title?: string
  body?: string | null
  link?: string | null
  targetRole?: 'all' | 'admin' | 'editor' | null
  readBy?: Array<{ userId?: string } | null> | null
  dismissedBy?: Array<{ userId?: string } | null> | null
  expiresAt?: string | null
  createdAt?: string
}

const POLL_INTERVAL_MS = 30_000
const FETCH_LIMIT = 20

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

function isVisibleForUser(doc: NotifDoc, userId: string, role: string | undefined): boolean {
  const target = doc.targetRole || 'admin'
  if (target !== 'all' && target !== role) return false
  if (doc.expiresAt) {
    const t = Date.parse(doc.expiresAt)
    if (!Number.isNaN(t) && t < Date.now()) return false
  }
  const readIds = toUserIds(doc.readBy)
  const dismissedIds = toUserIds(doc.dismissedBy)
  if (readIds.includes(userId) || dismissedIds.includes(userId)) return false
  return true
}

function relativeTime(iso?: string): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `il y a ${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `il y a ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `il y a ${hr} h`
  const days = Math.floor(hr / 24)
  if (days < 7) return `il y a ${days} j`
  const d = new Date(t)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth()
  const userId = String((user as any)?.id ?? '')
  const role = (user as any)?.role as string | undefined

  const [open, setOpen] = useState(false)
  const [docs, setDocs] = useState<NotifDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [hoverBell, setHoverBell] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const fetchDocs = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('sort', '-createdAt')
      params.set('limit', String(FETCH_LIMIT))
      params.set('depth', '0')
      const res = await fetch(`/api/notifications?${params.toString()}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) return
      const json = await res.json()
      const next = Array.isArray(json?.docs) ? (json.docs as NotifDoc[]) : []
      setDocs(next)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    fetchDocs()
    const t = setInterval(fetchDocs, POLL_INTERVAL_MS)
    return () => clearInterval(t)
  }, [userId, fetchDocs])

  // Close popover on outside click.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (wrapperRef.current && target && !wrapperRef.current.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const visible = useMemo(
    () => docs.filter((d) => isVisibleForUser(d, userId, role)),
    [docs, userId, role],
  )
  const unreadCount = visible.length
  const panelItems = visible.slice(0, 10)

  const markOne = async (id: string | number, action: 'read' | 'dismiss') => {
    try {
      const res = await fetch(`/api/notifications/${id}/mark`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) return
      // Optimistic update: remove from the list so the badge decreases.
      setDocs((prev) => prev.filter((d) => String(d.id) !== String(id)))
    } catch {
      /* silent */
    }
  }

  if (!userId) return null

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHoverBell(true)}
        onMouseLeave={() => setHoverBell(false)}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 8,
          background: hoverBell ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: 'none',
          color: RM.cream,
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} non lues`}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 8,
              background: RM.burgundy,
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              fontFamily: RM.fSans,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Panneau notifications"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 360,
            maxHeight: 500,
            background: RM.paper,
            border: `1px solid ${RM.ruleStrong}`,
            borderRadius: 8,
            boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: RM.fSans,
            color: RM.ink,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: `1px solid ${RM.rule}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: RM.creamSoft,
            }}
          >
            <span
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                fontWeight: 600,
                color: RM.inkSoft,
              }}
            >
              Notifications
            </span>
            <span style={{ fontSize: 11, color: RM.inkSoft }}>
              {loading ? 'Chargement…' : `${unreadCount} non lues`}
            </span>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {panelItems.length === 0 && (
              <div
                style={{
                  padding: '36px 18px',
                  textAlign: 'center',
                  color: RM.inkSoft,
                  fontFamily: RM.fSerif,
                  fontStyle: 'italic',
                  fontSize: 13,
                }}
              >
                Aucune notification.
              </div>
            )}
            {panelItems.map((d) => {
              const color = typeColor(d.type)
              const href = d.link || undefined
              const titleNode = (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      marginTop: 6,
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: RM.ink,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {d.title || '—'}
                    </div>
                    {d.body && (
                      <div
                        style={{
                          fontSize: 12,
                          color: RM.inkSoft,
                          marginTop: 2,
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 2,
                          overflow: 'hidden',
                        }}
                      >
                        {d.body}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 10,
                        color: RM.inkSoft,
                        marginTop: 4,
                        fontFamily: RM.fMono,
                      }}
                    >
                      {d.subsystem || 'other'} · {relativeTime(d.createdAt)}
                    </div>
                  </div>
                </div>
              )

              return (
                <div
                  key={String(d.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    borderBottom: `1px solid ${RM.rule}`,
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.background = RM.creamSoft
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  }}
                >
                  {href ? (
                    <Link
                      href={href}
                      onClick={() => {
                        void markOne(d.id, 'read')
                        setOpen(false)
                      }}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {titleNode}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void markOne(d.id, 'read')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        textAlign: 'left',
                        color: 'inherit',
                        display: 'flex',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {titleNode}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Marquer comme lu"
                    title="Marquer comme lu"
                    onClick={(e) => {
                      e.stopPropagation()
                      void markOne(d.id, 'read')
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: `1px solid ${RM.rule}`,
                      background: 'transparent',
                      color: RM.inkSoft,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )
            })}
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderTop: `1px solid ${RM.rule}`,
              background: RM.creamSoft,
              textAlign: 'center',
            }}
          >
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: RM.teal,
                textDecoration: 'none',
              }}
            >
              Voir tout
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
