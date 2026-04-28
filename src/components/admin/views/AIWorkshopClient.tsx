'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Sparkles,
  Leaf,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Upload,
  Calendar,
  Power,
  Zap,
} from 'lucide-react'
import { RM, PageHeader, cmsBtn, cmsInput } from '@/components/admin/primitives'

// ---------------------------------------------------------------------------
// Types — mirrors the productionRun collection contract.
// ---------------------------------------------------------------------------

type Kind = 'wiki' | 'blog'
type Mode = 'autonomous' | 'import-json'
type ConflictPolicy = 'fail'
type Locale = 'fr' | 'en'

type RunStatus =
  | 'queued'
  | 'researching'
  | 'extracting'
  | 'generating-fields'
  | 'generating-geo'
  | 'generating-seo'
  | 'fetching-images'
  | 'moderating'
  | 'creating-doc'
  | 'uploading-images'
  | 'publishing'
  | 'done'
  | 'failed'

type StepStatus = 'pending' | 'ok' | 'failed'

type RunStep = {
  name: string
  status: StepStatus
  durationMs?: number
  errorMessage?: string
}

type ProductionRun = {
  id: number | string
  kind: Kind
  seed: string
  mode: Mode
  conflictPolicy: ConflictPolicy
  status: RunStatus
  brief?: string
  steps?: RunStep[]
  totalCostEur?: number
  totalDurationMs?: number
  docCollection?: 'wikiEntries' | 'blogPosts'
  docId?: string | number
  docSlug?: string
  publishedAt?: string
  errorCode?: string
  errorMessage?: string
  warnings?: Array<{ message: string }>
  initiatedBy?: 'admin-ui' | 'api-key' | 'cli' | 'cron'
  actorId?: string
  locale?: Locale
  createdAt: string
  updatedAt?: string
}

type RunListResponse = {
  docs: ProductionRun[]
  totalDocs?: number
  totalPages?: number
  page?: number
  hasNextPage?: boolean
}

const EMPTY_LIST: RunListResponse = {
  docs: [],
  totalDocs: 0,
  totalPages: 1,
  page: 1,
  hasNextPage: false,
}

const TABS = [
  'NOUVELLE PRODUCTION',
  "FILE D'ATTENTE",
  'HISTORIQUE',
  'COÛTS',
  'PROGRAMMATION',
] as const
type TabKey = (typeof TABS)[number]

const STATUS_LABELS: Record<RunStatus, string> = {
  queued: 'En file',
  researching: 'Recherche',
  extracting: 'Extraction',
  'generating-fields': 'Champs',
  'generating-geo': 'Géo',
  'generating-seo': 'SEO',
  'fetching-images': 'Images',
  moderating: 'Modération',
  'creating-doc': 'Création',
  'uploading-images': 'Upload',
  publishing: 'Publication',
  done: 'Publié',
  failed: 'Échec',
}

const TERMINAL: ReadonlyArray<RunStatus> = ['done', 'failed']

// ---------------------------------------------------------------------------
// Formatting helpers.
// ---------------------------------------------------------------------------

function fmtEur(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(4)
}

function fmtEur2(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(2)
}

function fmtInt(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR')
}

function fmtDuration(ms: number | undefined | null): string {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return '—'
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  const rest = sec % 60
  return `${min}m ${rest}s`
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

function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - (n - 1))
  return startOfDayUTC(d).toISOString()
}

function startOfMonthUTCIso(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

function statusColor(status: RunStatus | string | undefined): {
  bg: string
  fg: string
} {
  if (status === 'done') return { bg: '#E8F0EE', fg: RM.teal }
  if (status === 'failed') return { bg: '#EEE7E3', fg: RM.burgundy }
  return { bg: '#FDEFE0', fg: RM.ochre }
}

function currentStepLabel(run: ProductionRun): string {
  if (TERMINAL.includes(run.status)) return STATUS_LABELS[run.status] || run.status
  // The step currently in flight is the most recent pending step or the run status itself.
  const pending = (run.steps || []).find((s) => s.status === 'pending')
  if (pending?.name) return pending.name
  return STATUS_LABELS[run.status] || run.status
}

function elapsedMs(run: ProductionRun, now: number): number {
  const start = new Date(run.createdAt).getTime()
  if (!Number.isFinite(start)) return 0
  if (TERMINAL.includes(run.status) && run.totalDurationMs && run.totalDurationMs > 0) {
    return run.totalDurationMs
  }
  return Math.max(0, now - start)
}

// ---------------------------------------------------------------------------
// Network helpers.
// ---------------------------------------------------------------------------

async function fetchRuns(params: Record<string, string>): Promise<RunListResponse> {
  const qs = new URLSearchParams(params)
  try {
    const res = await fetch(`/api/productionRun?${qs.toString()}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return EMPTY_LIST
    const json = await res.json()
    return {
      docs: Array.isArray(json?.docs) ? json.docs : [],
      totalDocs:
        typeof json?.totalDocs === 'number' ? json.totalDocs : (json?.docs?.length ?? 0),
      totalPages: json?.totalPages,
      page: json?.page,
      hasNextPage: json?.hasNextPage,
    }
  } catch {
    return EMPTY_LIST
  }
}

async function fetchRun(id: string | number): Promise<ProductionRun | null> {
  try {
    const res = await fetch(`/api/productionRun/${encodeURIComponent(String(id))}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    return (await res.json()) as ProductionRun
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Toast hook (lightweight, file-local).
// ---------------------------------------------------------------------------

type Toast = { id: number; tone: 'info' | 'error'; message: string }

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(1)
  const push = useCallback((tone: Toast['tone'], message: string) => {
    const id = seq.current++
    setToasts((prev) => [...prev, { id, tone, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])
  return { toasts, push }
}

// ---------------------------------------------------------------------------
// Main component.
// ---------------------------------------------------------------------------

const AIWorkshopClient: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('NOUVELLE PRODUCTION')
  const { toasts, push } = useToasts()
  const [selectedRun, setSelectedRun] = useState<ProductionRun | null>(null)
  // Programmation tab dirty-state guard.
  const [programDirty, setProgramDirty] = useState(false)

  const onLaunched = useCallback(
    (runId: number | string) => {
      push('info', `Production démarrée — runId ${runId}`)
      setActiveTab("FILE D'ATTENTE")
    },
    [push],
  )

  const requestTabChange = useCallback(
    (next: TabKey) => {
      if (next === activeTab) return
      if (activeTab === 'PROGRAMMATION' && programDirty) {
        const ok = window.confirm('Modifications non enregistrées, quitter ?')
        if (!ok) return
        setProgramDirty(false)
      }
      setActiveTab(next)
    },
    [activeTab, programDirty],
  )

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
      <style>{`@keyframes rm-aiworkshop-spin { to { transform: rotate(360deg); } }`}</style>
      <PageHeader
        eyebrow="ATELIER IA"
        title="Atelier IA"
        sub="Production de contenu — wiki & blog"
        right={
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: RM.burgundy,
              fontFamily: RM.fMono,
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
            }}
          >
            <Sparkles size={16} aria-hidden />
            <span>Pipeline autonome</span>
          </div>
        }
      />

      {/* Toast region */}
      <div
        aria-live="polite"
        role="status"
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              minWidth: 280,
              maxWidth: 420,
              padding: '12px 16px',
              borderRadius: 8,
              background: RM.paper,
              border: `1px solid ${t.tone === 'error' ? RM.burgundy : RM.teal}`,
              color: t.tone === 'error' ? RM.burgundy : RM.teal,
              fontSize: 13,
              fontWeight: 500,
              boxShadow: '0 8px 24px rgba(30, 26, 22, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {t.tone === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: `1px solid ${RM.rule}`,
          marginBottom: 28,
        }}
      >
        {TABS.map((t) => {
          const active = t === activeTab
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => requestTabChange(t)}
              style={{
                padding: '12px 20px',
                fontFamily: RM.fMono,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: active ? RM.teal : RM.inkSoft,
                borderBottom: active ? `2px solid ${RM.burgundy}` : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                borderRadius: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {t === 'PROGRAMMATION' && (
                <Calendar size={12} aria-hidden style={{ marginRight: 2 }} />
              )}
              {t}
            </button>
          )
        })}
      </div>

      {activeTab === 'NOUVELLE PRODUCTION' && <NewProductionTab onLaunched={onLaunched} pushToast={push} />}
      {activeTab === "FILE D'ATTENTE" && (
        <QueueTab onSelect={(r) => setSelectedRun(r)} />
      )}
      {activeTab === 'HISTORIQUE' && (
        <HistoryTab onSelect={(r) => setSelectedRun(r)} />
      )}
      {activeTab === 'COÛTS' && <CostsTab />}
      {activeTab === 'PROGRAMMATION' && (
        <ProgrammationTab
          pushToast={push}
          onSelectRun={(r) => setSelectedRun(r)}
          onDirtyChange={setProgramDirty}
        />
      )}

      {selectedRun && (
        <RunDetailModal run={selectedRun} onClose={() => setSelectedRun(null)} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 1 — New production.
// ---------------------------------------------------------------------------

type LaunchFn = (runId: number | string) => void

const NewProductionTab: React.FC<{
  onLaunched: LaunchFn
  pushToast: (tone: 'info' | 'error', message: string) => void
}> = ({ onLaunched, pushToast }) => {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
          marginBottom: 24,
        }}
      >
        <WikiCard onLaunched={onLaunched} pushToast={pushToast} />
        <BlogCard onLaunched={onLaunched} pushToast={pushToast} />
      </div>
      <ImportJsonCard onLaunched={onLaunched} pushToast={pushToast} />
    </div>
  )
}

const Card: React.FC<{
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}> = ({ title, icon, children }) => (
  <div
    style={{
      background: RM.paper,
      border: `1px solid ${RM.rule}`,
      borderRadius: 10,
      padding: 24,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 18,
      }}
    >
      {icon}
      <h2
        style={{
          fontFamily: RM.fDisplay,
          fontSize: 22,
          color: RM.teal,
          margin: 0,
          fontWeight: 400,
        }}
      >
        {title}
      </h2>
    </div>
    {children}
  </div>
)

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 11,
      letterSpacing: 1.5,
      color: RM.inkSoft,
      textTransform: 'uppercase',
      fontWeight: 600,
      marginBottom: 6,
    }}
  >
    {children}
  </div>
)

const FieldGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ marginBottom: 16 }}>{children}</div>
)

const selectStyle: React.CSSProperties = {
  ...cmsInput.base,
  appearance: 'none',
  cursor: 'pointer',
}

const spinStyle: React.CSSProperties = {
  animation: 'rm-aiworkshop-spin 0.9s linear infinite',
}

async function postProduce(body: Record<string, unknown>): Promise<{
  ok: boolean
  runId?: number | string
  status?: string
  errorMessage?: string
}> {
  try {
    const res = await fetch('/api/ai-pipeline/produce', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
    let json: any = null
    try {
      json = await res.json()
    } catch {
      // ignore non-JSON body
    }
    if (!res.ok) {
      return {
        ok: false,
        errorMessage:
          (json && (json.errorMessage || json.message || json.error)) ||
          `HTTP ${res.status}`,
      }
    }
    return {
      ok: true,
      runId: json?.runId,
      status: json?.status,
    }
  } catch (e: any) {
    return { ok: false, errorMessage: e?.message || 'Erreur réseau' }
  }
}

const WikiCard: React.FC<{
  onLaunched: LaunchFn
  pushToast: (tone: 'info' | 'error', message: string) => void
}> = ({ onLaunched, pushToast }) => {
  const [seed, setSeed] = useState('')
  const [locale, setLocale] = useState<Locale>('fr')
  const [conflictPolicy, setConflictPolicy] = useState<ConflictPolicy>('fail')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!seed.trim()) {
      pushToast('error', 'Renseigne le nom de la plante.')
      return
    }
    setSubmitting(true)
    const res = await postProduce({
      kind: 'wiki',
      seed: seed.trim(),
      mode: 'autonomous',
      conflictPolicy,
      locale,
    })
    setSubmitting(false)
    if (!res.ok || res.runId == null) {
      pushToast('error', res.errorMessage || 'Échec du lancement.')
      return
    }
    setSeed('')
    onLaunched(res.runId)
  }

  return (
    <Card title="Nouvelle fiche plante" icon={<Leaf size={20} color={RM.teal} aria-hidden />}>
      <FieldGroup>
        <FieldLabel>Nom de la plante</FieldLabel>
        <input
          aria-label="Nom de la plante"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="ex: Camomille"
          style={cmsInput.base}
        />
      </FieldGroup>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FieldGroup>
          <FieldLabel>Langue</FieldLabel>
          <select
            aria-label="Langue"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            style={selectStyle}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Si la fiche existe</FieldLabel>
          <select
            aria-label="Politique de conflit"
            value={conflictPolicy}
            onChange={(e) => setConflictPolicy(e.target.value as ConflictPolicy)}
            style={selectStyle}
            disabled
          >
            <option value="fail">Échouer si existe</option>
          </select>
        </FieldGroup>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        aria-label="Lancer la production wiki"
        style={{
          ...cmsBtn.primary,
          width: '100%',
          justifyContent: 'center',
          padding: '12px 14px',
          opacity: submitting ? 0.7 : 1,
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? (
          <Loader2 size={14} aria-hidden style={spinStyle} />
        ) : (
          <Sparkles size={14} aria-hidden />
        )}
        <span>Lancer la production</span>
      </button>
    </Card>
  )
}

const BlogCard: React.FC<{
  onLaunched: LaunchFn
  pushToast: (tone: 'info' | 'error', message: string) => void
}> = ({ onLaunched, pushToast }) => {
  const [seed, setSeed] = useState('')
  const [brief, setBrief] = useState('')
  const [locale, setLocale] = useState<Locale>('fr')
  const [conflictPolicy, setConflictPolicy] = useState<ConflictPolicy>('fail')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!seed.trim()) {
      pushToast('error', 'Renseigne un sujet.')
      return
    }
    setSubmitting(true)
    const res = await postProduce({
      kind: 'blog',
      seed: seed.trim(),
      brief: brief.trim() || undefined,
      mode: 'autonomous',
      conflictPolicy,
      locale,
    })
    setSubmitting(false)
    if (!res.ok || res.runId == null) {
      pushToast('error', res.errorMessage || 'Échec du lancement.')
      return
    }
    setSeed('')
    setBrief('')
    onLaunched(res.runId)
  }

  return (
    <Card
      title="Nouvel article"
      icon={<FileText size={20} color={RM.teal} aria-hidden />}
    >
      <FieldGroup>
        <FieldLabel>Sujet ou titre provisoire</FieldLabel>
        <input
          aria-label="Sujet de l'article"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="ex: Soulager les maux de gorge naturellement"
          style={cmsInput.base}
        />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>Brief / angle / consignes éditoriales</FieldLabel>
        <textarea
          aria-label="Brief éditorial"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={4}
          placeholder="Ton, audience, angle, points à couvrir…"
          style={{ ...cmsInput.base, fontFamily: RM.fSans, resize: 'vertical' }}
        />
      </FieldGroup>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FieldGroup>
          <FieldLabel>Langue</FieldLabel>
          <select
            aria-label="Langue"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            style={selectStyle}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Si l'article existe</FieldLabel>
          <select
            aria-label="Politique de conflit"
            value={conflictPolicy}
            onChange={(e) => setConflictPolicy(e.target.value as ConflictPolicy)}
            style={selectStyle}
            disabled
          >
            <option value="fail">Échouer si existe</option>
          </select>
        </FieldGroup>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        aria-label="Lancer la production blog"
        style={{
          ...cmsBtn.primary,
          width: '100%',
          justifyContent: 'center',
          padding: '12px 14px',
          opacity: submitting ? 0.7 : 1,
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? (
          <Loader2 size={14} aria-hidden style={spinStyle} />
        ) : (
          <Sparkles size={14} aria-hidden />
        )}
        <span>Lancer la production</span>
      </button>
    </Card>
  )
}

const ImportJsonCard: React.FC<{
  onLaunched: LaunchFn
  pushToast: (tone: 'info' | 'error', message: string) => void
}> = ({ onLaunched, pushToast }) => {
  const [kind, setKind] = useState<Kind>('wiki')
  const [raw, setRaw] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const parsed = useMemo(() => {
    if (!raw.trim()) return { ok: true, data: null as unknown }
    try {
      return { ok: true as const, data: JSON.parse(raw) }
    } catch (e: any) {
      return { ok: false as const, error: e?.message || 'JSON invalide' }
    }
  }, [raw])

  const submit = async () => {
    if (!raw.trim()) {
      pushToast('error', 'Colle un JSON à importer.')
      return
    }
    if (!parsed.ok) {
      pushToast('error', `JSON invalide : ${parsed.error}`)
      return
    }
    setSubmitting(true)
    const res = await postProduce({
      kind,
      mode: 'import-json',
      seed: '',
      conflictPolicy: 'fail',
      importedJson: parsed.data,
    })
    setSubmitting(false)
    if (!res.ok || res.runId == null) {
      pushToast('error', res.errorMessage || 'Échec de l’import.')
      return
    }
    setRaw('')
    onLaunched(res.runId)
  }

  return (
    <details
      style={{
        background: RM.paper,
        border: `1px solid ${RM.rule}`,
        borderRadius: 10,
        padding: '16px 24px',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          listStyle: 'none',
          fontFamily: RM.fMono,
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: RM.inkSoft,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Upload size={14} aria-hidden />
        <span>Import JSON</span>
      </summary>
      <div style={{ marginTop: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12 }}>
          <FieldGroup>
            <FieldLabel>Type</FieldLabel>
            <select
              aria-label="Type de contenu importé"
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
              style={selectStyle}
            >
              <option value="wiki">Fiche plante</option>
              <option value="blog">Article de blog</option>
            </select>
          </FieldGroup>
        </div>
        <FieldGroup>
          <FieldLabel>JSON</FieldLabel>
          <textarea
            aria-label="JSON à importer"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder='{ "title": "…", "slug": "…", … }'
            style={{
              ...cmsInput.base,
              fontFamily: RM.fMono,
              fontSize: 12,
              resize: 'vertical',
              borderColor: parsed.ok ? RM.ruleStrong : RM.burgundy,
            }}
          />
          {!parsed.ok && (
            <div
              style={{
                marginTop: 8,
                padding: '6px 10px',
                background: '#FBEFEC',
                color: RM.burgundy,
                border: `1px solid ${RM.burgundy}`,
                borderRadius: 6,
                fontSize: 12,
                fontFamily: RM.fMono,
              }}
            >
              JSON invalide : {parsed.error}
            </div>
          )}
        </FieldGroup>
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !parsed.ok}
          aria-label="Importer et publier"
          style={{
            ...cmsBtn.dark,
            padding: '10px 16px',
            opacity: submitting || !parsed.ok ? 0.6 : 1,
            cursor: submitting || !parsed.ok ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? (
            <Loader2 size={14} aria-hidden style={spinStyle} />
          ) : (
            <Upload size={14} aria-hidden />
          )}
          <span>Importer et publier</span>
        </button>
      </div>
    </details>
  )
}

// ---------------------------------------------------------------------------
// Tab 2 — Queue.
// ---------------------------------------------------------------------------

const QueueTab: React.FC<{ onSelect: (r: ProductionRun) => void }> = ({ onSelect }) => {
  const [rows, setRows] = useState<ProductionRun[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    let cancelled = false
    let timer: number | null = null

    const load = async () => {
      const res = await fetchRuns({
        'where[status][not_in]': 'done,failed',
        sort: '-createdAt',
        limit: '20',
        depth: '0',
      })
      if (cancelled) return
      setRows(res.docs)
      setLoading(false)
    }

    load()
    timer = window.setInterval(load, 5000)
    const tick = window.setInterval(() => setNow(Date.now()), 1000)
    return () => {
      cancelled = true
      if (timer != null) window.clearInterval(timer)
      window.clearInterval(tick)
    }
  }, [])

  return (
    <div
      style={{
        background: RM.paper,
        border: `1px solid ${RM.rule}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <SectionHeader
        title="Productions en cours"
        right={
          <span
            style={{
              fontFamily: RM.fMono,
              fontSize: 11,
              color: RM.inkSoft,
              letterSpacing: 1.2,
            }}
          >
            Rafraîchi toutes les 5s
          </span>
        }
      />
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}
        >
          <thead>
            <tr style={{ background: RM.creamSoft, color: RM.inkSoft }}>
              <Th>Type</Th>
              <Th>Sujet / plante</Th>
              <Th>Statut</Th>
              <Th>Étape</Th>
              <Th align="right">Durée</Th>
              <Th align="right">Coût en cours</Th>
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
            {!loading && rows.length === 0 && (
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
                  Aucune production en cours.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr
                  key={String(r.id)}
                  onClick={() => onSelect(r)}
                  style={{
                    borderTop: `1px solid ${RM.rule}`,
                    cursor: 'pointer',
                  }}
                >
                  <Td>
                    <KindBadge kind={r.kind} />
                  </Td>
                  <Td>
                    <span style={{ fontFamily: RM.fSerif, fontSize: 14 }}>
                      {r.seed || '—'}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                  <Td>
                    <span style={{ fontFamily: RM.fMono, fontSize: 11 }}>
                      {currentStepLabel(r)}
                    </span>
                  </Td>
                  <Td align="right">
                    <span style={{ fontFamily: RM.fMono }}>
                      {fmtDuration(elapsedMs(r, now))}
                    </span>
                  </Td>
                  <Td align="right">
                    <span style={{ fontFamily: RM.fMono, color: RM.burgundy }}>
                      {fmtEur(Number(r.totalCostEur || 0))}
                    </span>
                  </Td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 3 — History.
// ---------------------------------------------------------------------------

type HistoryFilters = {
  kind: 'all' | Kind
  status: 'all' | 'done' | 'failed'
  range: '24h' | '7j' | '30j'
}

const HistoryTab: React.FC<{ onSelect: (r: ProductionRun) => void }> = ({ onSelect }) => {
  const [filters, setFilters] = useState<HistoryFilters>({
    kind: 'all',
    status: 'all',
    range: '7j',
  })
  const [rows, setRows] = useState<ProductionRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params: Record<string, string> = {
      sort: '-createdAt',
      limit: '50',
      depth: '0',
    }
    const since =
      filters.range === '24h'
        ? new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        : filters.range === '7j'
          ? isoDaysAgo(7)
          : isoDaysAgo(30)
    params['where[createdAt][greater_than_equal]'] = since
    if (filters.kind !== 'all') {
      params['where[kind][equals]'] = filters.kind
    }
    if (filters.status !== 'all') {
      params['where[status][equals]'] = filters.status
    }
    fetchRuns(params).then((res) => {
      if (cancelled) return
      setRows(res.docs)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [filters.kind, filters.status, filters.range])

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-end',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <FieldLabel>Type</FieldLabel>
          <select
            value={filters.kind}
            onChange={(e) =>
              setFilters((f) => ({ ...f, kind: e.target.value as HistoryFilters['kind'] }))
            }
            style={{ ...selectStyle, minWidth: 160 }}
          >
            <option value="all">Tous</option>
            <option value="wiki">Fiches plantes</option>
            <option value="blog">Articles</option>
          </select>
        </div>
        <div>
          <FieldLabel>Statut</FieldLabel>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                status: e.target.value as HistoryFilters['status'],
              }))
            }
            style={{ ...selectStyle, minWidth: 160 }}
          >
            <option value="all">Tous</option>
            <option value="done">Publié</option>
            <option value="failed">Échec</option>
          </select>
        </div>
        <div>
          <FieldLabel>Période</FieldLabel>
          <select
            value={filters.range}
            onChange={(e) =>
              setFilters((f) => ({ ...f, range: e.target.value as HistoryFilters['range'] }))
            }
            style={{ ...selectStyle, minWidth: 140 }}
          >
            <option value="24h">24 heures</option>
            <option value="7j">7 jours</option>
            <option value="30j">30 jours</option>
          </select>
        </div>
      </div>

      <div
        style={{
          background: RM.paper,
          border: `1px solid ${RM.rule}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <SectionHeader title="Historique des productions" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: RM.creamSoft, color: RM.inkSoft }}>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Sujet / plante</Th>
                <Th>Statut</Th>
                <Th align="right">Durée</Th>
                <Th align="right">Coût</Th>
                <Th>Document</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: 24, textAlign: 'center', color: RM.inkSoft }}
                  >
                    Chargement…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      color: RM.inkSoft,
                      fontFamily: RM.fSerif,
                      fontStyle: 'italic',
                    }}
                  >
                    Aucune production sur la période sélectionnée.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr
                    key={String(r.id)}
                    onClick={() => onSelect(r)}
                    style={{ borderTop: `1px solid ${RM.rule}`, cursor: 'pointer' }}
                  >
                    <Td>{fmtDateTime(r.createdAt)}</Td>
                    <Td>
                      <KindBadge kind={r.kind} />
                    </Td>
                    <Td>
                      <span style={{ fontFamily: RM.fSerif, fontSize: 14 }}>
                        {r.seed || '—'}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={r.status} />
                    </Td>
                    <Td align="right">
                      <span style={{ fontFamily: RM.fMono }}>
                        {fmtDuration(r.totalDurationMs)}
                      </span>
                    </Td>
                    <Td align="right">
                      <span style={{ fontFamily: RM.fMono, color: RM.burgundy }}>
                        {fmtEur(Number(r.totalCostEur || 0))}
                      </span>
                    </Td>
                    <Td>
                      {r.docId && r.docCollection ? (
                        <a
                          href={`/admin/collections/${r.docCollection}/${r.docId}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: RM.teal,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontFamily: RM.fMono,
                            fontSize: 11,
                          }}
                        >
                          <ExternalLink size={12} />
                          <span>{r.docSlug || String(r.docId)}</span>
                        </a>
                      ) : (
                        <span style={{ color: RM.inkSoft }}>—</span>
                      )}
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

// ---------------------------------------------------------------------------
// Tab 4 — Costs.
// ---------------------------------------------------------------------------

type CostBucket = { dayIso: string; label: string; cost: number; count: number }

function buildCostBuckets(docs: ProductionRun[]): CostBucket[] {
  const buckets = new Map<string, CostBucket>()
  const today = startOfDayUTC(new Date())
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    buckets.set(key, { dayIso: key, label, cost: 0, count: 0 })
  }
  for (const doc of docs) {
    const iso = doc.createdAt
    if (!iso) continue
    const key = iso.slice(0, 10)
    const b = buckets.get(key)
    if (!b) continue
    b.cost += Number(doc.totalCostEur || 0)
    b.count += 1
  }
  return Array.from(buckets.values())
}

type CostTotals = {
  allCount: number
  m30Cost: number
  m30Count: number
  monthCount: number
  monthCost: number
  avgCost: number
  wikiCount: number
  wikiCost: number
  blogCount: number
  blogCost: number
}

const CostsTab: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState<CostTotals>({
    allCount: 0,
    m30Cost: 0,
    m30Count: 0,
    monthCount: 0,
    monthCost: 0,
    avgCost: 0,
    wikiCount: 0,
    wikiCost: 0,
    blogCount: 0,
    blogCost: 0,
  })
  const [daily, setDaily] = useState<CostBucket[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const m30Start = isoDaysAgo(30)
      const monthStart = startOfMonthUTCIso()
      const [allRes, m30Docs, monthDocs] = await Promise.all([
        fetchRuns({ limit: '0', depth: '0' }),
        fetchRuns({
          'where[createdAt][greater_than_equal]': m30Start,
          sort: '-createdAt',
          limit: '1000',
          depth: '0',
        }),
        fetchRuns({
          'where[createdAt][greater_than_equal]': monthStart,
          sort: '-createdAt',
          limit: '1000',
          depth: '0',
        }),
      ])
      if (cancelled) return

      let m30Cost = 0
      let wikiCount = 0
      let wikiCost = 0
      let blogCount = 0
      let blogCost = 0
      for (const d of m30Docs.docs) {
        const c = Number(d.totalCostEur || 0)
        m30Cost += c
        if (d.kind === 'wiki') {
          wikiCount += 1
          wikiCost += c
        } else if (d.kind === 'blog') {
          blogCount += 1
          blogCost += c
        }
      }
      let monthCost = 0
      for (const d of monthDocs.docs) {
        monthCost += Number(d.totalCostEur || 0)
      }
      const m30Count = m30Docs.totalDocs ?? m30Docs.docs.length
      const avgCost = m30Count > 0 ? m30Cost / m30Count : 0

      setTotals({
        allCount: allRes.totalDocs ?? 0,
        m30Cost,
        m30Count,
        monthCount: monthDocs.totalDocs ?? monthDocs.docs.length,
        monthCost,
        avgCost,
        wikiCount,
        wikiCost,
        blogCount,
        blogCost,
      })
      setDaily(buildCostBuckets(m30Docs.docs))
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const maxDaily = useMemo(() => {
    const m = daily.reduce((acc, d) => (d.cost > acc ? d.cost : acc), 0)
    return m > 0 ? m : 1
  }, [daily])

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <Tile label="Productions totales" value={loading ? '…' : fmtInt(totals.allCount)} />
        <Tile
          label="Coût total 30j (EUR)"
          value={loading ? '…' : fmtEur2(totals.m30Cost)}
          accent={RM.burgundy}
        />
        <Tile
          label="Productions ce mois"
          value={
            loading
              ? '…'
              : `${fmtInt(totals.monthCount)} · ${fmtEur2(totals.monthCost)} €`
          }
        />
        <Tile
          label="Coût moyen par production"
          value={loading ? '…' : `${fmtEur(totals.avgCost)} €`}
          accent={RM.burgundy}
        />
      </div>

      <div
        style={{
          background: RM.paper,
          border: `1px solid ${RM.rule}`,
          borderRadius: 10,
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
          Coût quotidien (EUR) — 30 derniers jours
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
                title={`${b.label} — ${fmtEur(b.cost)} EUR · ${b.count} productions`}
                style={{
                  flex: 1,
                  height: h,
                  background: b.cost > 0 ? RM.teal : RM.ruleStrong,
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
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <SectionHeader title="Coût par type — 30 derniers jours" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: RM.creamSoft, color: RM.inkSoft }}>
              <Th>Type</Th>
              <Th align="right">Productions</Th>
              <Th align="right">Coût total (EUR)</Th>
              <Th align="right">Coût moyen (EUR)</Th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: `1px solid ${RM.rule}` }}>
              <Td>
                <KindBadge kind="wiki" />
              </Td>
              <Td align="right">
                <span style={{ fontFamily: RM.fMono }}>{fmtInt(totals.wikiCount)}</span>
              </Td>
              <Td align="right">
                <span style={{ fontFamily: RM.fMono, color: RM.burgundy }}>
                  {fmtEur2(totals.wikiCost)}
                </span>
              </Td>
              <Td align="right">
                <span style={{ fontFamily: RM.fMono }}>
                  {totals.wikiCount > 0 ? fmtEur(totals.wikiCost / totals.wikiCount) : '—'}
                </span>
              </Td>
            </tr>
            <tr style={{ borderTop: `1px solid ${RM.rule}` }}>
              <Td>
                <KindBadge kind="blog" />
              </Td>
              <Td align="right">
                <span style={{ fontFamily: RM.fMono }}>{fmtInt(totals.blogCount)}</span>
              </Td>
              <Td align="right">
                <span style={{ fontFamily: RM.fMono, color: RM.burgundy }}>
                  {fmtEur2(totals.blogCost)}
                </span>
              </Td>
              <Td align="right">
                <span style={{ fontFamily: RM.fMono }}>
                  {totals.blogCount > 0 ? fmtEur(totals.blogCost / totals.blogCount) : '—'}
                </span>
              </Td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 5 — Programmation (autopilot).
// ---------------------------------------------------------------------------

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

const DAYS: ReadonlyArray<{ key: DayKey; label: string }> = [
  { key: 'mon', label: 'L' },
  { key: 'tue', label: 'M' },
  { key: 'wed', label: 'M' },
  { key: 'thu', label: 'J' },
  { key: 'fri', label: 'V' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'D' },
]

type AutopilotConfig = {
  enabled: boolean
  cronTickMinutes: number
  hoursWindow: { start: number; end: number }
  daysOfWeek: DayKey[]
  dailyMaxProductions: number
  contentMix: { wiki: number; blog: number }
  budgetCapDailyEur: number
  excludeKnownTopics: boolean
  locale: Locale
  lastTickAt?: string
  lastSuccessAt?: string
  lastErrorAt?: string
  lastErrorMessage?: string
  lastSuccessRunId?: string | number
}

const DEFAULT_AUTOPILOT: AutopilotConfig = {
  enabled: false,
  cronTickMinutes: 30,
  hoursWindow: { start: 8, end: 20 },
  daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
  dailyMaxProductions: 3,
  contentMix: { wiki: 0.6, blog: 0.4 },
  budgetCapDailyEur: 0.2,
  excludeKnownTopics: true,
  locale: 'fr',
}

function fmtRelative(iso?: string, now: number = Date.now()): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return '—'
  const diff = Math.max(0, now - t)
  const min = Math.round(diff / 60000)
  if (min < 1) return 'il y a moins d’une minute'
  if (min < 60) return `il y a ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.round(h / 24)
  return `il y a ${d} j`
}

// Live Europe/Paris offset (1 in winter, 2 in summer) computed from `Intl`,
// independent of the browser's local timezone.
function parisOffsetHours(): number {
  const now = new Date()
  const utcH = Number(
    now.toLocaleString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit' }),
  )
  const parisH = Number(
    now.toLocaleString('en-US', { timeZone: 'Europe/Paris', hour12: false, hour: '2-digit' }),
  )
  return (parisH - utcH + 24) % 24
}

function utcHourToParis(h: number): number {
  return (((h + parisOffsetHours()) % 24) + 24) % 24
}

function parisHourToUtc(h: number): number {
  return (((h - parisOffsetHours()) % 24) + 24) % 24
}

const ProgrammationTab: React.FC<{
  pushToast: (tone: 'info' | 'error', message: string) => void
  onSelectRun: (r: ProductionRun) => void
  onDirtyChange: (dirty: boolean) => void
}> = ({ pushToast, onSelectRun, onDirtyChange }) => {
  const [original, setOriginal] = useState<AutopilotConfig | null>(null)
  const [draft, setDraft] = useState<AutopilotConfig>(DEFAULT_AUTOPILOT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [forcing, setForcing] = useState<null | 'wiki' | 'blog'>(null)
  const [todayCount, setTodayCount] = useState<number | null>(null)
  const [history, setHistory] = useState<ProductionRun[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [now, setNow] = useState<number>(() => Date.now())

  // Load initial config + today count + history.
  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/globals/siteSettings?depth=0', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) {
        setLoading(false)
        return
      }
      const json: any = await res.json()
      const ap = (json?.autopilot ?? {}) as Partial<AutopilotConfig>
      const merged: AutopilotConfig = {
        ...DEFAULT_AUTOPILOT,
        ...ap,
        hoursWindow: {
          ...DEFAULT_AUTOPILOT.hoursWindow,
          ...(ap.hoursWindow || {}),
        },
        contentMix: {
          ...DEFAULT_AUTOPILOT.contentMix,
          ...(ap.contentMix || {}),
        },
        daysOfWeek:
          Array.isArray(ap.daysOfWeek) && ap.daysOfWeek.length
            ? (ap.daysOfWeek as DayKey[])
            : DEFAULT_AUTOPILOT.daysOfWeek,
      }
      setOriginal(merged)
      setDraft(merged)
    } catch {
      // ignore — keep defaults
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTodayCount = useCallback(async () => {
    const start = startOfDayUTC(new Date()).toISOString()
    const res = await fetchRuns({
      'where[initiatedBy][equals]': 'cron',
      'where[createdAt][greater_than_equal]': start,
      limit: '0',
      depth: '0',
    })
    setTodayCount(res.totalDocs ?? res.docs.length ?? 0)
  }, [])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    const res = await fetchRuns({
      'where[initiatedBy][equals]': 'cron',
      sort: '-createdAt',
      limit: '30',
      depth: '0',
    })
    setHistory(res.docs)
    setHistoryLoading(false)
  }, [])

  useEffect(() => {
    loadConfig()
    loadTodayCount()
    loadHistory()
  }, [loadConfig, loadTodayCount, loadHistory])

  // Polling for history + counters (30s).
  useEffect(() => {
    const t = window.setInterval(() => {
      loadTodayCount()
      loadHistory()
    }, 30000)
    const tick = window.setInterval(() => setNow(Date.now()), 30000)
    return () => {
      window.clearInterval(t)
      window.clearInterval(tick)
    }
  }, [loadTodayCount, loadHistory])

  // Track dirty.
  const isDirty = useMemo(() => {
    if (!original) return false
    return JSON.stringify(original) !== JSON.stringify(draft)
  }, [original, draft])

  useEffect(() => {
    onDirtyChange(isDirty)
  }, [isDirty, onDirtyChange])

  // Validation.
  // Validate against Paris-time values (the form is now expressed in Paris).
  const hourError =
    utcHourToParis(draft.hoursWindow.start) >= utcHourToParis(draft.hoursWindow.end)
  const budgetError = !(draft.budgetCapDailyEur > 0)

  const wikiPct = Math.round(draft.contentMix.wiki * 100)

  const setWikiPct = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)))
    setDraft((d) => ({
      ...d,
      contentMix: { wiki: clamped / 100, blog: (100 - clamped) / 100 },
    }))
  }

  const toggleDay = (key: DayKey) => {
    setDraft((d) => {
      const has = d.daysOfWeek.includes(key)
      const next = has ? d.daysOfWeek.filter((k) => k !== key) : [...d.daysOfWeek, key]
      // Keep canonical order.
      const order: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      next.sort((a, b) => order.indexOf(a) - order.indexOf(b))
      return { ...d, daysOfWeek: next }
    })
  }

  const submit = async () => {
    if (hourError || budgetError) {
      pushToast('error', 'Corrige les erreurs avant d’enregistrer.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        autopilot: {
          enabled: draft.enabled,
          cronTickMinutes: draft.cronTickMinutes,
          hoursWindow: draft.hoursWindow,
          daysOfWeek: draft.daysOfWeek,
          dailyMaxProductions: draft.dailyMaxProductions,
          contentMix: draft.contentMix,
          budgetCapDailyEur: draft.budgetCapDailyEur,
          excludeKnownTopics: draft.excludeKnownTopics,
          locale: draft.locale,
        },
      }
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const j: any = await res.json()
          msg = j?.errorMessage || j?.message || j?.error || msg
        } catch {
          // ignore
        }
        pushToast('error', `Échec de l’enregistrement : ${msg}`)
        return
      }
      pushToast('info', 'Configuration mise à jour')
      // Refresh from server to capture authoritative state.
      await loadConfig()
    } catch (e: any) {
      pushToast('error', e?.message || 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const force = async (kind: 'wiki' | 'blog') => {
    setForcing(kind)
    try {
      const res = await fetch('/api/cron/autopilot/tick', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ force: true, onlyKind: kind }),
      })
      let json: any = null
      try {
        json = await res.json()
      } catch {
        // ignore
      }
      if (!res.ok) {
        pushToast(
          'error',
          json?.errorMessage || json?.message || json?.reason || `HTTP ${res.status}`,
        )
        return
      }
      const action = json?.action || 'tick'
      const reason = json?.reason ? ` — ${json.reason}` : ''
      const runId = json?.runId ? ` · run #${json.runId}` : ''
      pushToast('info', `Autopilote : ${action}${reason}${runId}`)
      // Refresh history + count.
      loadTodayCount()
      loadHistory()
      loadConfig()
    } catch (e: any) {
      pushToast('error', e?.message || 'Erreur réseau')
    } finally {
      setForcing(null)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: 'center',
          color: RM.inkSoft,
          fontFamily: RM.fSerif,
          fontStyle: 'italic',
        }}
      >
        Chargement…
      </div>
    )
  }

  const parisStart = utcHourToParis(draft.hoursWindow.start)
  const parisEnd = utcHourToParis(draft.hoursWindow.end)

  // Helpers for last-success run linking.
  const lastSuccessRun = history.find((r) => r.status === 'done')
  const lastSuccessLink =
    original?.lastSuccessRunId != null
      ? String(original.lastSuccessRunId)
      : lastSuccessRun
        ? String(lastSuccessRun.id)
        : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Section A — État + Actions */}
      <div
        style={{
          background: RM.paper,
          border: `1px solid ${RM.rule}`,
          borderRadius: 10,
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <Power size={20} color={RM.teal} aria-hidden />
          <h2
            style={{
              fontFamily: RM.fDisplay,
              fontSize: 22,
              color: RM.teal,
              margin: 0,
              fontWeight: 400,
              flex: 1,
            }}
          >
            État de l’autopilote
          </h2>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: RM.fSans,
              background: draft.enabled ? '#E8F0EE' : '#EEE7E3',
              color: draft.enabled ? RM.teal : RM.burgundy,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {draft.enabled ? 'Activé' : 'Désactivé'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <Mini label="Dernier tick">
            <span style={{ fontFamily: RM.fMono, fontSize: 12 }}>
              {fmtDateTime(original?.lastTickAt)}{' '}
              <span style={{ color: RM.inkSoft }}>· {fmtRelative(original?.lastTickAt, now)}</span>
            </span>
          </Mini>
          <Mini label="Dernière production réussie">
            <span style={{ fontFamily: RM.fMono, fontSize: 12 }}>
              {fmtDateTime(original?.lastSuccessAt)}{' '}
              {lastSuccessLink && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    const r = history.find((x) => String(x.id) === lastSuccessLink)
                    if (r) onSelectRun(r)
                  }}
                  style={{
                    color: RM.teal,
                    textDecoration: 'none',
                    fontFamily: RM.fMono,
                    fontSize: 11,
                    marginLeft: 6,
                  }}
                >
                  · run #{lastSuccessLink}
                </a>
              )}
            </span>
          </Mini>
          <Mini label="Dernière erreur">
            {original?.lastErrorAt ? (
              <span style={{ fontFamily: RM.fMono, fontSize: 12, color: RM.burgundy }}>
                {fmtDateTime(original.lastErrorAt)}
                {original.lastErrorMessage ? ` · ${original.lastErrorMessage}` : ''}
              </span>
            ) : (
              <span style={{ color: RM.inkSoft, fontFamily: RM.fMono, fontSize: 12 }}>—</span>
            )}
          </Mini>
          <Mini label="Productions cron aujourd’hui">
            <span style={{ fontFamily: RM.fMono, fontSize: 14, color: RM.teal }}>
              {todayCount == null ? '…' : fmtInt(todayCount)}
              <span style={{ color: RM.inkSoft, fontSize: 11 }}>
                {' '}
                / {draft.dailyMaxProductions}
              </span>
            </span>
          </Mini>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => force('wiki')}
            disabled={forcing != null}
            aria-label="Forcer un wiki maintenant"
            style={{
              ...cmsBtn.dark,
              padding: '10px 14px',
              opacity: forcing != null ? 0.6 : 1,
              cursor: forcing != null ? 'not-allowed' : 'pointer',
            }}
          >
            {forcing === 'wiki' ? (
              <Loader2 size={14} aria-hidden style={spinStyle} />
            ) : (
              <Zap size={14} aria-hidden />
            )}
            <span>Forcer un wiki maintenant</span>
          </button>
          <button
            type="button"
            onClick={() => force('blog')}
            disabled={forcing != null}
            aria-label="Forcer un blog maintenant"
            style={{
              ...cmsBtn.dark,
              padding: '10px 14px',
              opacity: forcing != null ? 0.6 : 1,
              cursor: forcing != null ? 'not-allowed' : 'pointer',
            }}
          >
            {forcing === 'blog' ? (
              <Loader2 size={14} aria-hidden style={spinStyle} />
            ) : (
              <Zap size={14} aria-hidden />
            )}
            <span>Forcer un blog maintenant</span>
          </button>
        </div>
      </div>

      {/* Section B — Configuration */}
      <div
        style={{
          background: RM.paper,
          border: `1px solid ${RM.rule}`,
          borderRadius: 10,
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <Calendar size={20} color={RM.teal} aria-hidden />
          <h2
            style={{
              fontFamily: RM.fDisplay,
              fontSize: 22,
              color: RM.teal,
              margin: 0,
              fontWeight: 400,
            }}
          >
            Configuration
          </h2>
        </div>

        {/* Toggle — activer */}
        <FieldGroup>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              padding: '12px 14px',
              background: RM.creamSoft,
              border: `1px solid ${RM.rule}`,
              borderRadius: 8,
            }}
          >
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => setDraft((d) => ({ ...d, enabled: e.target.checked }))}
              style={{
                width: 20,
                height: 20,
                accentColor: RM.teal,
                cursor: 'pointer',
              }}
              aria-label="Activer l'autopilote"
            />
            <span
              style={{
                fontFamily: RM.fSans,
                fontSize: 14,
                fontWeight: 600,
                color: RM.ink,
              }}
            >
              Activer l’autopilote
            </span>
          </label>
        </FieldGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FieldGroup>
            <FieldLabel>Plage horaire active (heure de Paris)</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                min={0}
                max={23}
                value={parisStart}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    hoursWindow: {
                      ...d.hoursWindow,
                      start: parisHourToUtc(Number(e.target.value) || 0),
                    },
                  }))
                }
                aria-label="Heure de début (heure de Paris)"
                style={{ ...cmsInput.base, width: 80 }}
              />
              <span style={{ color: RM.inkSoft }}>—</span>
              <input
                type="number"
                min={0}
                max={23}
                value={parisEnd}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    hoursWindow: {
                      ...d.hoursWindow,
                      end: parisHourToUtc(Number(e.target.value) || 0),
                    },
                  }))
                }
                aria-label="Heure de fin (heure de Paris)"
                style={{ ...cmsInput.base, width: 80 }}
              />
              <span
                style={{
                  fontFamily: RM.fMono,
                  fontSize: 11,
                  color: RM.inkSoft,
                  marginLeft: 6,
                }}
              >
                Paris, soit {draft.hoursWindow.start}h–{draft.hoursWindow.end}h UTC
              </span>
            </div>
            {hourError && (
              <div
                style={{
                  marginTop: 6,
                  color: RM.burgundy,
                  fontSize: 12,
                  fontFamily: RM.fMono,
                }}
              >
                Heure de début doit être &lt; heure de fin.
              </div>
            )}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Jours actifs</FieldLabel>
            <div style={{ display: 'flex', gap: 6 }}>
              {DAYS.map((d) => {
                const active = draft.daysOfWeek.includes(d.key)
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    aria-pressed={active}
                    aria-label={`Jour ${d.key}`}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      border: `1px solid ${active ? RM.teal : RM.ruleStrong}`,
                      background: active ? RM.teal : RM.paper,
                      color: active ? '#fff' : RM.ink,
                      fontFamily: RM.fMono,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Productions max / jour</FieldLabel>
            <input
              type="number"
              min={0}
              max={50}
              value={draft.dailyMaxProductions}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  dailyMaxProductions: Math.max(0, Math.min(50, Number(e.target.value) || 0)),
                }))
              }
              aria-label="Productions max par jour"
              style={{ ...cmsInput.base, width: 120 }}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Plafond quotidien (€)</FieldLabel>
            <input
              type="number"
              min={0}
              step={0.01}
              value={draft.budgetCapDailyEur}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  budgetCapDailyEur: Number(e.target.value) || 0,
                }))
              }
              aria-label="Plafond quotidien en euros"
              style={{ ...cmsInput.base, width: 140 }}
            />
            {budgetError && (
              <div
                style={{
                  marginTop: 6,
                  color: RM.burgundy,
                  fontSize: 12,
                  fontFamily: RM.fMono,
                }}
              >
                Le plafond doit être &gt; 0.
              </div>
            )}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Intervalle minimum entre tentatives (min)</FieldLabel>
            <input
              type="number"
              min={1}
              step={1}
              value={draft.cronTickMinutes}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  cronTickMinutes: Math.max(1, Number(e.target.value) || 1),
                }))
              }
              aria-label="Intervalle minimum en minutes"
              style={{ ...cmsInput.base, width: 120 }}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Locale par défaut</FieldLabel>
            <select
              aria-label="Locale par défaut"
              value={draft.locale}
              onChange={(e) => setDraft((d) => ({ ...d, locale: e.target.value as Locale }))}
              style={{ ...selectStyle, width: 160 }}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>
              Mix wiki / blog — {wikiPct}% wiki · {100 - wikiPct}% blog
            </FieldLabel>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={wikiPct}
              onChange={(e) => setWikiPct(Number(e.target.value))}
              aria-label="Pourcentage de fiches wiki"
              style={{
                width: '100%',
                accentColor: RM.teal,
                cursor: 'pointer',
              }}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Sujets déjà couverts</FieldLabel>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={draft.excludeKnownTopics}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, excludeKnownTopics: e.target.checked }))
                }
                style={{
                  width: 16,
                  height: 16,
                  accentColor: RM.teal,
                  cursor: 'pointer',
                }}
                aria-label="Éviter les sujets déjà couverts"
              />
              <span style={{ fontSize: 13, color: RM.ink }}>
                Éviter les sujets déjà couverts
              </span>
            </label>
          </FieldGroup>
        </div>

        <div
          style={{
            marginTop: 16,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={submit}
            disabled={saving || !isDirty || hourError || budgetError}
            aria-label="Enregistrer la configuration"
            style={{
              ...cmsBtn.primary,
              padding: '10px 18px',
              opacity: saving || !isDirty || hourError || budgetError ? 0.6 : 1,
              cursor:
                saving || !isDirty || hourError || budgetError ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? (
              <Loader2 size={14} aria-hidden style={spinStyle} />
            ) : (
              <Check size={14} aria-hidden />
            )}
            <span>Enregistrer</span>
          </button>
        </div>
      </div>

      {/* Section C — Historique cron */}
      <div
        style={{
          background: RM.paper,
          border: `1px solid ${RM.rule}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <SectionHeader
          title="Historique des runs autopilote"
          right={
            <span
              style={{
                fontFamily: RM.fMono,
                fontSize: 11,
                color: RM.inkSoft,
                letterSpacing: 1.2,
              }}
            >
              Rafraîchi toutes les 30s
            </span>
          }
        />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: RM.creamSoft, color: RM.inkSoft }}>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Sujet / plante</Th>
                <Th>Statut</Th>
                <Th align="right">Durée</Th>
                <Th align="right">Coût</Th>
                <Th>Document</Th>
              </tr>
            </thead>
            <tbody>
              {historyLoading && (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: 24, textAlign: 'center', color: RM.inkSoft }}
                  >
                    Chargement…
                  </td>
                </tr>
              )}
              {!historyLoading && history.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      color: RM.inkSoft,
                      fontFamily: RM.fSerif,
                      fontStyle: 'italic',
                    }}
                  >
                    Aucun run autopilote pour l’instant.
                  </td>
                </tr>
              )}
              {!historyLoading &&
                history.map((r) => (
                  <tr
                    key={String(r.id)}
                    onClick={() => onSelectRun(r)}
                    style={{ borderTop: `1px solid ${RM.rule}`, cursor: 'pointer' }}
                  >
                    <Td>{fmtDateTime(r.createdAt)}</Td>
                    <Td>
                      <KindBadge kind={r.kind} />
                    </Td>
                    <Td>
                      <span style={{ fontFamily: RM.fSerif, fontSize: 14 }}>
                        {r.seed || '—'}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={r.status} />
                    </Td>
                    <Td align="right">
                      <span style={{ fontFamily: RM.fMono }}>
                        {fmtDuration(r.totalDurationMs)}
                      </span>
                    </Td>
                    <Td align="right">
                      <span style={{ fontFamily: RM.fMono, color: RM.burgundy }}>
                        {fmtEur(Number(r.totalCostEur || 0))}
                      </span>
                    </Td>
                    <Td>
                      {r.docId && r.docCollection ? (
                        <a
                          href={`/admin/collections/${r.docCollection}/${r.docId}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: RM.teal,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontFamily: RM.fMono,
                            fontSize: 11,
                          }}
                        >
                          <ExternalLink size={12} />
                          <span>{r.docSlug || String(r.docId)}</span>
                        </a>
                      ) : (
                        <span style={{ color: RM.inkSoft }}>—</span>
                      )}
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

// ---------------------------------------------------------------------------
// Run detail modal.
// ---------------------------------------------------------------------------

const RunDetailModal: React.FC<{
  run: ProductionRun
  onClose: () => void
}> = ({ run: initial, onClose }) => {
  const [run, setRun] = useState<ProductionRun>(initial)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // Refresh the detail periodically while the run is in flight.
  useEffect(() => {
    let cancelled = false
    let timer: number | null = null
    const refresh = async () => {
      const fresh = await fetchRun(run.id)
      if (cancelled || !fresh) return
      setRun(fresh)
    }
    if (!TERMINAL.includes(run.status)) {
      timer = window.setInterval(refresh, 5000)
    }
    return () => {
      cancelled = true
      if (timer != null) window.clearInterval(timer)
    }
  }, [run.id, run.status])

  // Minimal focus management.
  useEffect(() => {
    previouslyFocused.current = (document.activeElement as HTMLElement) || null
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'Tab') {
        const root = containerRef.current
        if (!root) return
        const focusable = root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previouslyFocused.current?.focus?.()
    }
  }, [onClose])

  const steps = run.steps || []

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Détail de la production"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30, 26, 22, 0.45)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '60px 24px',
        zIndex: 900,
        overflow: 'auto',
      }}
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(720px, 100%)',
          background: RM.cream,
          border: `1px solid ${RM.rule}`,
          borderRadius: 12,
          boxShadow: '0 18px 60px rgba(30, 26, 22, 0.25)',
          padding: 28,
          color: RM.ink,
          fontFamily: RM.fSans,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 18,
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: RM.fMono,
                fontSize: 11,
                color: RM.burgundy,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Run #{run.id} · {run.kind === 'wiki' ? 'Fiche plante' : 'Article'}
            </div>
            <h2
              style={{
                fontFamily: RM.fDisplay,
                fontSize: 26,
                color: RM.teal,
                margin: 0,
                fontWeight: 400,
              }}
            >
              {run.seed || '—'}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              ...cmsBtn.ghost,
              padding: 8,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 22,
          }}
        >
          <Mini label="Statut">
            <StatusBadge status={run.status} />
          </Mini>
          <Mini label="Durée totale">
            <span style={{ fontFamily: RM.fMono }}>{fmtDuration(run.totalDurationMs)}</span>
          </Mini>
          <Mini label="Coût total">
            <span style={{ fontFamily: RM.fMono, color: RM.burgundy }}>
              {fmtEur(Number(run.totalCostEur || 0))} €
            </span>
          </Mini>
          <Mini label="Locale">
            <span style={{ fontFamily: RM.fMono }}>{(run.locale || 'fr').toUpperCase()}</span>
          </Mini>
        </div>

        {run.brief && (
          <div
            style={{
              background: RM.paper,
              border: `1px solid ${RM.rule}`,
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 18,
              fontFamily: RM.fSerif,
              fontSize: 14,
              color: RM.ink,
              whiteSpace: 'pre-wrap',
            }}
          >
            {run.brief}
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1.4,
              color: RM.inkSoft,
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            Étapes
          </div>
          {steps.length === 0 ? (
            <div
              style={{
                color: RM.inkSoft,
                fontFamily: RM.fSerif,
                fontStyle: 'italic',
                fontSize: 13,
              }}
            >
              Aucune étape encore enregistrée.
            </div>
          ) : (
            <ol
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                borderLeft: `1px dashed ${RM.ruleStrong}`,
                paddingLeft: 16,
              }}
            >
              {steps.map((s, idx) => (
                <li
                  key={`${s.name}-${idx}`}
                  style={{
                    position: 'relative',
                    padding: '8px 0 8px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <StepDot status={s.status} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: RM.ink, fontWeight: 500 }}>
                      {s.name}
                    </div>
                    {s.errorMessage && (
                      <div
                        style={{
                          color: RM.burgundy,
                          fontSize: 12,
                          fontFamily: RM.fMono,
                          marginTop: 2,
                        }}
                      >
                        {s.errorMessage}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: RM.fMono,
                      fontSize: 11,
                      color: RM.inkSoft,
                    }}
                  >
                    {fmtDuration(s.durationMs)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {(run.warnings?.length ?? 0) > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 1.4,
                color: RM.ochre,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Avertissements
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: RM.inkSoft }}>
              {run.warnings!.map((w, idx) => (
                <li key={idx} style={{ fontSize: 13, marginBottom: 4 }}>
                  {w.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {run.errorMessage && (
          <div
            style={{
              background: '#FBEFEC',
              border: `1px solid ${RM.burgundy}`,
              color: RM.burgundy,
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 12,
              fontFamily: RM.fMono,
              marginBottom: 18,
            }}
          >
            {run.errorCode ? <strong>{run.errorCode} · </strong> : null}
            {run.errorMessage}
          </div>
        )}

        {run.docId && run.docCollection && (
          <a
            href={`/admin/collections/${run.docCollection}/${run.docId}`}
            style={{
              ...cmsBtn.dark,
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={14} />
            <span>Ouvrir le document</span>
          </a>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small atoms.
// ---------------------------------------------------------------------------

const KindBadge: React.FC<{ kind: Kind }> = ({ kind }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 11,
      fontFamily: RM.fMono,
      color: RM.teal,
      textTransform: 'uppercase',
      letterSpacing: 1,
    }}
  >
    {kind === 'wiki' ? <Leaf size={13} aria-hidden /> : <FileText size={13} aria-hidden />}
    <span>{kind === 'wiki' ? 'wiki' : 'blog'}</span>
  </span>
)

const StatusBadge: React.FC<{ status: RunStatus | string | undefined }> = ({ status }) => {
  const { bg, fg } = statusColor(status)
  const label = STATUS_LABELS[status as RunStatus] || String(status || '—')
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 9px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: bg,
        color: fg,
        fontFamily: RM.fSans,
      }}
    >
      {label}
    </span>
  )
}

const StepDot: React.FC<{ status: StepStatus }> = ({ status }) => {
  const color =
    status === 'ok' ? RM.teal : status === 'failed' ? RM.burgundy : RM.ochre
  return (
    <span
      aria-hidden
      style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        background: color,
        flex: '0 0 auto',
        boxShadow: `0 0 0 3px ${RM.paper}`,
        marginLeft: -22,
      }}
    />
  )
}

const SectionHeader: React.FC<{ title: string; right?: React.ReactNode }> = ({
  title,
  right,
}) => (
  <div
    style={{
      padding: '14px 20px',
      borderBottom: `1px solid ${RM.rule}`,
      background: RM.creamSoft,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
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
      {title}
    </div>
    {right}
  </div>
)

const Tile: React.FC<{ label: string; value: string; accent?: string }> = ({
  label,
  value,
  accent,
}) => (
  <div
    style={{
      background: RM.paper,
      border: `1px solid ${RM.rule}`,
      borderRadius: 10,
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
        fontSize: 30,
        color: accent || RM.teal,
        lineHeight: 1.1,
        fontWeight: 400,
      }}
    >
      {value}
    </div>
  </div>
)

const Mini: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div
    style={{
      background: RM.paper,
      border: `1px solid ${RM.rule}`,
      borderRadius: 8,
      padding: '10px 12px',
    }}
  >
    <div
      style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        color: RM.inkSoft,
        fontWeight: 600,
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 14 }}>{children}</div>
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

export default AIWorkshopClient
