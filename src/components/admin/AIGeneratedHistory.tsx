'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import {
  Download,
  FileText,
  Globe,
  History,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react'
import { RM } from '@/components/admin/primitives/tokens'

type AuditEntry = {
  id: string | number
  action?: string | null
  subsystem?: string | null
  model?: string | null
  collectionTarget?: string | null
  fieldTarget?: string | null
  entryId?: string | null
  promptTokens?: number | null
  completionTokens?: number | null
  costEur?: number | null
  durationMs?: number | null
  ok?: boolean | null
  errorCode?: string | null
  actorId?: string | null
  ipHash?: string | null
  createdAt?: string | null
  timestamp?: string | null
}

type ApiResponse = {
  docs?: AuditEntry[]
  totalDocs?: number
}

const SUBSYSTEM_ICON: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  'ai-generate': Sparkles,
  'ai-geo': FileText,
  'ai-moderate': Shield,
  'ai-embedding': Globe,
  'ai-vision': ImageIcon,
  'ai-seo': Search,
  'ai-pipeline': Sparkles,
  other: History,
}

const SUBSYSTEM_LABEL: Record<string, string> = {
  'ai-generate': 'Génération',
  'ai-geo': 'GEO',
  'ai-moderate': 'Conformité',
  'ai-embedding': 'Embedding',
  'ai-vision': 'Vision',
  'ai-seo': 'SEO',
  'ai-pipeline': 'Pipeline',
  other: 'Autre',
}

function formatTokens(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  return `${Math.round(n / 1000)}k`
}

function formatCost(eur?: number | null): string {
  if (eur == null || !Number.isFinite(eur)) return '—'
  return `${eur.toFixed(4)} €`
}

function formatRelative(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diffMs = Date.now() - d.getTime()
  const sec = Math.round(diffMs / 1000)
  if (sec < 5) return "à l'instant"
  if (sec < 60) return `il y a ${sec}s`
  const min = Math.round(sec / 60)
  if (min < 60) return `il y a ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `il y a ${h} h`
  const days = Math.round(h / 24)
  if (days < 7) return `il y a ${days} j`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const AIGeneratedHistory: React.FC = () => {
  const docInfo = useDocumentInfo() as { collectionSlug?: string; id?: string | number }
  const collectionSlug = docInfo?.collectionSlug
  const id = docInfo?.id

  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshHover, setRefreshHover] = useState(false)
  const [downloadHover, setDownloadHover] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const canFetch = Boolean(collectionSlug && id)

  const fetchHistory = useCallback(async () => {
    if (!canFetch) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError(null)
    try {
      const url =
        `/api/auditLog?` +
        `where[collectionTarget][equals]=${encodeURIComponent(String(collectionSlug))}` +
        `&where[entryId][equals]=${encodeURIComponent(String(id))}` +
        `&sort=-createdAt&limit=20`
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        signal: ctrl.signal,
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as ApiResponse
      if (ctrl.signal.aborted) return
      setEntries(Array.isArray(data?.docs) ? data.docs : [])
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      setError(msg)
      setEntries([])
    } finally {
      if (!ctrl.signal.aborted) setLoading(false)
    }
  }, [canFetch, collectionSlug, id])

  useEffect(() => {
    if (!canFetch) return
    fetchHistory()
    return () => {
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionSlug, id])

  const handleDownload = useCallback(() => {
    if (!entries.length) return
    const payload = {
      collection: collectionSlug,
      entryId: String(id),
      generatedAt: new Date().toISOString(),
      entries,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `ai-history-${collectionSlug}-${String(id)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(href)
  }, [entries, collectionSlug, id])

  const containerStyle: React.CSSProperties = useMemo(
    () => ({
      background: RM.paper,
      border: `1px solid ${RM.rule}`,
      borderRadius: 8,
      padding: 16,
      fontFamily: RM.fSans,
      color: RM.ink,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      marginBottom: 12,
    }),
    [],
  )

  const headerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 10,
    fontFamily: RM.fSans,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: RM.teal,
  }

  if (!id) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <History size={12} color={RM.ochre} />
          <span>Historique IA</span>
        </div>
        <div style={{ fontSize: 12, color: RM.inkSoft, lineHeight: 1.45 }}>
          L&apos;historique IA apparaîtra après la première sauvegarde.
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={headerStyle}>
          <History size={12} color={RM.ochre} />
          <span>Historique IA</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!entries.length}
            aria-label="Tout télécharger en JSON"
            title="Tout télécharger en JSON"
            onMouseEnter={() => setDownloadHover(true)}
            onMouseLeave={() => setDownloadHover(false)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              cursor: entries.length ? 'pointer' : 'not-allowed',
              color: entries.length
                ? downloadHover
                  ? RM.teal
                  : RM.inkSoft
                : RM.ruleStrong,
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'color 0.12s ease',
            }}
          >
            <Download size={12} />
          </button>
          <button
            type="button"
            onClick={fetchHistory}
            disabled={loading}
            aria-label="Rafraîchir l'historique"
            title="Rafraîchir"
            onMouseEnter={() => setRefreshHover(true)}
            onMouseLeave={() => setRefreshHover(false)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              cursor: loading ? 'wait' : 'pointer',
              color: refreshHover ? RM.teal : RM.inkSoft,
              display: 'inline-flex',
              alignItems: 'center',
              opacity: loading ? 0.55 : 1,
              transition: 'color 0.12s ease, opacity 0.12s ease',
            }}
          >
            <RefreshCw
              size={12}
              style={{ animation: loading ? 'rm-aih-spin 1s linear infinite' : undefined }}
            />
          </button>
        </div>
      </div>

      {loading && entries.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 36,
                background: RM.cream,
                border: `1px solid ${RM.rule}`,
                borderRadius: 6,
              }}
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, color: RM.burgundy }}>
            Impossible de charger l&apos;historique.
          </div>
          <button
            type="button"
            onClick={fetchHistory}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              color: RM.teal,
              border: `1px solid ${RM.ruleStrong}`,
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              fontFamily: RM.fSans,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div style={{ fontSize: 12, color: RM.inkSoft, lineHeight: 1.45 }}>
          Aucune action IA enregistrée pour ce document.
        </div>
      )}

      {!error && entries.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {entries.map((entry) => (
            <HistoryRow key={String(entry.id)} entry={entry} />
          ))}
        </ul>
      )}

      <div
        style={{
          fontSize: 10,
          color: RM.inkSoft,
          fontStyle: 'italic',
          borderTop: `1px solid ${RM.rule}`,
          paddingTop: 8,
          lineHeight: 1.4,
        }}
      >
        Conformité AI Act (UE, art. 50) — historique des contributions IA sur ce
        document.
      </div>

      <style>{`@keyframes rm-aih-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const HistoryRow: React.FC<{ entry: AuditEntry }> = ({ entry }) => {
  const subsystem = entry.subsystem || 'other'
  const Icon = SUBSYSTEM_ICON[subsystem] || History
  const label = SUBSYSTEM_LABEL[subsystem] || subsystem
  const when = entry.createdAt || entry.timestamp
  const totalTokens =
    (entry.promptTokens || 0) + (entry.completionTokens || 0)
  const errored = entry.ok === false

  return (
    <li
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 8,
        border: `1px solid ${RM.rule}`,
        borderRadius: 6,
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: errored ? '#F4DDDC' : RM.cream,
            color: errored ? RM.burgundy : RM.teal,
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 10,
            fontFamily: RM.fSans,
            letterSpacing: '0.02em',
          }}
        >
          <Icon size={10} />
          <span>{label}</span>
        </span>
        {entry.fieldTarget && (
          <span
            title={entry.fieldTarget}
            style={{
              fontSize: 11,
              color: RM.ink,
              fontFamily: RM.fSerif,
              fontWeight: 600,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {entry.fieldTarget}
          </span>
        )}
        <span style={{ fontSize: 10, color: RM.inkSoft, whiteSpace: 'nowrap' }}>
          {formatRelative(when)}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          fontSize: 10,
          color: RM.inkSoft,
          fontFamily: RM.fSans,
        }}
      >
        {entry.model && <span title="Modèle">{entry.model}</span>}
        {totalTokens > 0 && (
          <span title="Tokens (prompt + completion)">{formatTokens(totalTokens)} tk</span>
        )}
        {entry.costEur != null && (
          <span title="Coût en euros">{formatCost(entry.costEur)}</span>
        )}
        {entry.actorId && (
          <span title="Utilisateur" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entry.actorId}
          </span>
        )}
        {errored && entry.errorCode && (
          <span style={{ color: RM.burgundy }} title="Code erreur">
            {entry.errorCode}
          </span>
        )}
      </div>
    </li>
  )
}

export default AIGeneratedHistory
