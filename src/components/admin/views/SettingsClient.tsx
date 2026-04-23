'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  RM,
  cmsBtn,
  cmsInput,
  Field,
  PageHeader,
  Wordmark,
} from '@/components/admin/primitives'

// -----------------------------------------------------------------------------
// Types & defaults
// -----------------------------------------------------------------------------

type SiteSettings = {
  general: {
    siteName: string
    baseline: string
    primaryLanguage: 'fr-FR' | 'en-US'
    timezone: string
    shortDescription: string
  }
  brand: {
    logo?: { url?: string; filename?: string; filesize?: number } | null
  }
  seo: {
    defaultTitle: string
    defaultDescription: string
    canonicalHostname: string
  }
  newsletter: {
    provider: 'none' | 'brevo'
    listId?: string
  }
  boutique: {
    defaultCurrency: 'EUR' | 'USD' | 'GBP'
    stripeEnabled: boolean
  }
  integrations: {
    stripeConnected: boolean
    brevoConnected: boolean
    algoliaConnected: boolean
    googleAnalyticsId?: string
    instagramHandle?: string
  }
  developers: {
    webhookUrl?: string
  }
  backups: {
    retentionDays: number
  }
}

const DEFAULTS: SiteSettings = {
  general: {
    siteName: 'Les Remèdes de Mamie',
    baseline: 'L’almanach des plantes qui soignent',
    primaryLanguage: 'fr-FR',
    timezone: 'Europe/Paris',
    shortDescription:
      'Une encyclopédie botanique réunissant les savoirs de la pharmacopée française et de la médecine traditionnelle chinoise — rigoureusement sourcée, illustrée, et lisible par tous.',
  },
  brand: { logo: null },
  seo: {
    defaultTitle: 'Les Remèdes de Mamie — L’almanach des plantes qui soignent',
    defaultDescription:
      'Encyclopédie botanique : pharmacopée française & médecine traditionnelle chinoise.',
    canonicalHostname: 'lesremedesdemamie.com',
  },
  newsletter: { provider: 'none', listId: '' },
  boutique: { defaultCurrency: 'EUR', stripeEnabled: false },
  integrations: {
    stripeConnected: false,
    brevoConnected: false,
    algoliaConnected: false,
    googleAnalyticsId: '',
    instagramHandle: '',
  },
  developers: { webhookUrl: '' },
  backups: { retentionDays: 30 },
}

/** Deep-merge an arbitrary payload with our strict-shape defaults. */
function mergeInitial(raw: any): SiteSettings {
  const d = DEFAULTS
  if (!raw || typeof raw !== 'object') return JSON.parse(JSON.stringify(d))
  return {
    general: { ...d.general, ...(raw.general || {}) },
    brand: { ...d.brand, ...(raw.brand || {}) },
    seo: { ...d.seo, ...(raw.seo || {}) },
    newsletter: { ...d.newsletter, ...(raw.newsletter || {}) },
    boutique: { ...d.boutique, ...(raw.boutique || {}) },
    integrations: { ...d.integrations, ...(raw.integrations || {}) },
    developers: { ...d.developers, ...(raw.developers || {}) },
    backups: { ...d.backups, ...(raw.backups || {}) },
  }
}

// -----------------------------------------------------------------------------
// Section definitions
// -----------------------------------------------------------------------------

type SectionDef = { id: string; label: string; sub: string }

const SECTIONS: SectionDef[] = [
  { id: 'general', label: 'Général', sub: 'Informations publiques de la maison d’édition.' },
  { id: 'brand', label: 'Identité de marque', sub: 'Logo, favicon, palette.' },
  { id: 'typography', label: 'Typographie & couleurs', sub: 'Verrouillées au niveau design system.' },
  { id: 'seo', label: 'SEO & métadonnées', sub: 'Balises & données exposées aux moteurs.' },
  { id: 'newsletter', label: 'Newsletter', sub: 'Fournisseur et liste de diffusion.' },
  { id: 'boutique', label: 'Boutique', sub: 'Devise et paiements.' },
  { id: 'integrations', label: 'Intégrations', sub: 'Services tiers connectés.' },
  { id: 'developers', label: 'API & développeurs', sub: 'Webhook & secrets environnement.' },
  { id: 'backups', label: 'Sauvegardes', sub: 'Rétention des snapshots.' },
]

const PALETTE: { name: string; hex: string }[] = [
  { name: 'Bordeaux', hex: '#A2211E' },
  { name: 'Sarcelle', hex: '#054A57' },
  { name: 'Crème', hex: '#FEF9E9' },
  { name: 'Ocre', hex: '#D0802C' },
]

const FONTS: { name: string; family: string; sample: string; style?: React.CSSProperties }[] = [
  {
    name: 'DM Serif Display',
    family: RM.fDisplay,
    sample: 'L’almanach des plantes',
    style: { fontSize: 28, color: RM.teal, letterSpacing: -0.3 },
  },
  {
    name: 'Source Serif 4',
    family: RM.fSerif,
    sample: 'Une encyclopédie botanique.',
    style: { fontSize: 18, color: RM.ink, fontStyle: 'italic' },
  },
  {
    name: 'Inter Tight',
    family: RM.fSans,
    sample: 'Interface, navigation, boutons.',
    style: { fontSize: 14, color: RM.ink, fontWeight: 500 },
  },
  {
    name: 'JetBrains Mono',
    family: RM.fMono,
    sample: '{ payload: "mono" }',
    style: { fontSize: 13, color: RM.inkSoft },
  },
]

// -----------------------------------------------------------------------------
// Reusable inline styles
// -----------------------------------------------------------------------------

const cardStyle: React.CSSProperties = {
  background: RM.paper,
  border: `1px solid ${RM.rule}`,
  borderRadius: 10,
  padding: '26px 28px',
  scrollMarginTop: 24,
}

const cardTitleStyle: React.CSSProperties = {
  fontFamily: RM.fDisplay,
  fontSize: 26,
  color: RM.teal,
  margin: 0,
  fontWeight: 400,
  letterSpacing: -0.3,
  lineHeight: 1.1,
}

const cardSubStyle: React.CSSProperties = {
  fontFamily: RM.fSerif,
  fontStyle: 'italic',
  fontSize: 13,
  color: RM.inkSoft,
  marginTop: 6,
  marginBottom: 22,
  lineHeight: 1.4,
}

const labelTinyStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 1.5,
  color: RM.inkSoft,
  textTransform: 'uppercase',
  fontWeight: 600,
  marginBottom: 10,
  fontFamily: RM.fSans,
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatKB(bytes?: number) {
  if (!bytes || !Number.isFinite(bytes)) return null
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const s = Math.round(diffMs / 1000)
  if (s < 5) return 'à l’instant'
  if (s < 60) return `il y a ${s} s`
  const m = Math.round(s / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `il y a ${h} h`
  return date.toLocaleString('fr-FR')
}

// -----------------------------------------------------------------------------
// Toggle (inline custom checkbox for booleans)
// -----------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label={label}
      style={{
        position: 'relative',
        width: 38,
        height: 22,
        borderRadius: 11,
        background: checked ? RM.teal : RM.stone,
        border: `1px solid ${checked ? RM.teal : RM.ruleStrong}`,
        cursor: 'pointer',
        padding: 0,
        transition: 'background 0.15s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          transition: 'left 0.15s ease',
        }}
      />
    </button>
  )
}

// -----------------------------------------------------------------------------
// Main client component
// -----------------------------------------------------------------------------

export default function SettingsClient({ initial }: { initial: any }) {
  const initialParsed = useMemo(() => mergeInitial(initial), [initial])
  const isUninitialised = initial === null || initial === undefined

  const [baseline, setBaseline] = useState<SiteSettings>(initialParsed)
  const [state, setState] = useState<SiteSettings>(initialParsed)
  const [active, setActive] = useState<string>('general')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [, forceTick] = useState(0)

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const clickScrollLock = useRef<number>(0)

  const dirty = useMemo(
    () => JSON.stringify(state) !== JSON.stringify(baseline),
    [state, baseline],
  )

  // ---------------------------------------------------------------------------
  // ScrollSpy via IntersectionObserver
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const refs = sectionRefs.current
    const ids = SECTIONS.map((s) => s.id)
    const observer = new IntersectionObserver(
      (entries) => {
        // Ignore while we're programmatically scrolling from a click.
        if (Date.now() < clickScrollLock.current) return
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top))
        if (visible.length > 0) {
          const id = (visible[0].target as HTMLElement).dataset.sectionId
          if (id && ids.includes(id)) setActive(id)
        }
      },
      {
        rootMargin: '-80px 0px -55% 0px',
        threshold: [0, 0.25, 0.5],
      },
    )
    ids.forEach((id) => {
      const el = refs[id]
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  // Tick every 30s so "il y a X min" updates.
  useEffect(() => {
    if (!savedAt) return
    const t = setInterval(() => forceTick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [savedAt])

  // ---------------------------------------------------------------------------
  // Navigation click
  // ---------------------------------------------------------------------------
  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id]
    if (!el) return
    clickScrollLock.current = Date.now() + 700
    setActive(id)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // ---------------------------------------------------------------------------
  // Save / cancel
  // ---------------------------------------------------------------------------
  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `HTTP ${res.status}`)
      }
      const payload = await res.json().catch(() => ({}))
      const updated = mergeInitial(payload?.result ?? payload)
      setBaseline(updated)
      setState(updated)
      setSavedAt(new Date())
    } catch (e: any) {
      setError(e?.message || 'Erreur de sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [state])

  const cancel = useCallback(() => {
    setState(baseline)
    setError(null)
  }, [baseline])

  // ---------------------------------------------------------------------------
  // Setters (type-safe shallow update per group)
  // ---------------------------------------------------------------------------
  function set<K extends keyof SiteSettings>(group: K, patch: Partial<SiteSettings[K]>) {
    setState((s) => ({ ...s, [group]: { ...(s[group] as any), ...patch } }))
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div style={{ padding: '32px 32px 140px', minHeight: '100vh', position: 'relative' }}>
      <PageHeader eyebrow="Maison" title="Paramètres" sub="configuration & préférences" />

      {isUninitialised && (
        <div
          style={{
            background: '#FFF8DB',
            border: `1px solid ${RM.ochre}`,
            borderLeft: `4px solid ${RM.ochre}`,
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            fontFamily: RM.fSans,
            fontSize: 13,
            color: RM.ink,
          }}
        >
          Les paramètres n’ont pas encore été initialisés. La première sauvegarde
          créera la configuration.
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: 32,
          alignItems: 'start',
        }}
      >
        {/* -------------------------------- NAV -------------------------------- */}
        <nav style={{ position: 'sticky', top: 32 }}>
          {SECTIONS.map((s) => {
            const isActive = active === s.id
            return (
              <a
                key={s.id}
                href={`#settings-${s.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(s.id)
                }}
                style={{
                  display: 'block',
                  padding: '10px 14px',
                  fontSize: 13,
                  fontFamily: RM.fSans,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? RM.teal : RM.inkSoft,
                  background: isActive ? RM.creamSoft : 'transparent',
                  borderLeft: isActive
                    ? `3px solid ${RM.burgundy}`
                    : '3px solid transparent',
                  textDecoration: 'none',
                  marginBottom: 1,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                {s.label}
              </a>
            )
          })}
        </nav>

        {/* ------------------------------ CONTENT ------------------------------ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* --- Général --- */}
          <section
            id="settings-general"
            data-section-id="general"
            ref={(r) => {
              sectionRefs.current.general = r
            }}
            style={cardStyle}
          >
            <h2 style={cardTitleStyle}>Général</h2>
            <div style={cardSubStyle}>Informations publiques de la maison d’édition.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 20 }}>
              <Field label="Nom du site" required>
                <input
                  type="text"
                  value={state.general.siteName}
                  onChange={(e) => set('general', { siteName: e.target.value })}
                  style={cmsInput.base}
                />
              </Field>
              <Field label="Baseline">
                <input
                  type="text"
                  value={state.general.baseline}
                  onChange={(e) => set('general', { baseline: e.target.value })}
                  style={cmsInput.base}
                />
              </Field>
              <Field label="Langue principale">
                <select
                  value={state.general.primaryLanguage}
                  onChange={(e) =>
                    set('general', {
                      primaryLanguage: e.target.value as SiteSettings['general']['primaryLanguage'],
                    })
                  }
                  style={cmsInput.base}
                >
                  <option value="fr-FR">Français (France)</option>
                  <option value="en-US">English (United States)</option>
                </select>
              </Field>
              <Field label="Fuseau horaire">
                <input
                  type="text"
                  value={state.general.timezone}
                  onChange={(e) => set('general', { timezone: e.target.value })}
                  style={cmsInput.base}
                  placeholder="Europe/Paris"
                />
              </Field>
            </div>

            <Field
              label="Description courte"
              hint="Affichée sur la page d’accueil et dans les moteurs de recherche."
            >
              <textarea
                value={state.general.shortDescription}
                onChange={(e) => set('general', { shortDescription: e.target.value })}
                rows={3}
                style={{
                  ...cmsInput.base,
                  resize: 'vertical',
                  fontFamily: RM.fSans,
                  lineHeight: 1.5,
                }}
              />
            </Field>
          </section>

          {/* --- Identité de marque --- */}
          <section
            id="settings-brand"
            data-section-id="brand"
            ref={(r) => {
              sectionRefs.current.brand = r
            }}
            style={cardStyle}
          >
            <h2 style={cardTitleStyle}>Identité de marque</h2>
            <div style={cardSubStyle}>Logo et palette — la palette est verrouillée.</div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                columnGap: 24,
                alignItems: 'start',
              }}
            >
              {/* Logo */}
              <div>
                <div style={labelTinyStyle}>Logo principal</div>
                <div
                  style={{
                    border: `1px dashed ${RM.ruleStrong}`,
                    borderRadius: 8,
                    padding: '22px 20px',
                    background: RM.cream,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  {state.brand?.logo?.url ? (
                    <img
                      src={state.brand.logo.url}
                      alt={state.brand.logo.filename || 'Logo'}
                      style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <Wordmark size={36} />
                  )}
                  <div
                    style={{
                      fontFamily: RM.fMono,
                      fontSize: 11,
                      color: RM.inkSoft,
                    }}
                  >
                    {state.brand?.logo?.filename || 'rm-logo.png'}
                    {formatKB(state.brand?.logo?.filesize) ? ` · ${formatKB(state.brand?.logo?.filesize)}` : ''}
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <a
                    href="/admin/globals/siteSettings"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      ...cmsBtn.ghost,
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    Remplacer le logo
                  </a>
                  <div
                    style={{
                      fontSize: 11,
                      color: RM.inkSoft,
                      marginTop: 8,
                      fontStyle: 'italic',
                      fontFamily: RM.fSerif,
                    }}
                  >
                    Téléversement inline prévu en phase 2.
                  </div>
                </div>
              </div>

              {/* Palette (read-only) */}
              <div>
                <div style={labelTinyStyle}>Palette (lecture seule)</div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 12,
                  }}
                >
                  {PALETTE.map((c) => (
                    <div key={c.hex}>
                      <div
                        style={{
                          height: 50,
                          borderRadius: 6,
                          background: c.hex,
                          border: `1px solid ${RM.rule}`,
                        }}
                      />
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          fontFamily: RM.fSans,
                          fontWeight: 600,
                          color: RM.ink,
                        }}
                      >
                        {c.name}
                      </div>
                      <div
                        style={{
                          fontFamily: RM.fMono,
                          fontSize: 11,
                          color: RM.inkSoft,
                        }}
                      >
                        {c.hex}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 12,
                    color: RM.inkSoft,
                    fontFamily: RM.fSerif,
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  La palette est verrouillée au niveau design system
                  (<code style={{ fontFamily: RM.fMono, fontSize: 11 }}>design-system/tokens</code>).
                </div>
              </div>
            </div>
          </section>

          {/* --- Typographie & couleurs (read-only) --- */}
          <section
            id="settings-typography"
            data-section-id="typography"
            ref={(r) => {
              sectionRefs.current.typography = r
            }}
            style={cardStyle}
          >
            <h2 style={cardTitleStyle}>Typographie &amp; couleurs</h2>
            <div style={cardSubStyle}>
              Typographie définie dans <code style={{ fontFamily: RM.fMono, fontSize: 12 }}>src/lib/fonts.ts</code> —
              lecture seule.
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 14,
              }}
            >
              {FONTS.map((f) => (
                <div
                  key={f.name}
                  style={{
                    border: `1px solid ${RM.rule}`,
                    borderRadius: 8,
                    padding: '16px 18px',
                    background: RM.cream,
                  }}
                >
                  <div
                    style={{
                      fontFamily: RM.fSans,
                      fontSize: 11,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      color: RM.inkSoft,
                      fontWeight: 600,
                      marginBottom: 10,
                    }}
                  >
                    {f.name}
                  </div>
                  <div style={{ fontFamily: f.family, lineHeight: 1.25, ...(f.style || {}) }}>
                    {f.sample}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* --- SEO --- */}
          <section
            id="settings-seo"
            data-section-id="seo"
            ref={(r) => {
              sectionRefs.current.seo = r
            }}
            style={cardStyle}
          >
            <h2 style={cardTitleStyle}>SEO &amp; métadonnées</h2>
            <div style={cardSubStyle}>Données exposées aux moteurs et aux réseaux sociaux.</div>

            <Field label="Titre par défaut">
              <input
                type="text"
                value={state.seo.defaultTitle}
                onChange={(e) => set('seo', { defaultTitle: e.target.value })}
                style={cmsInput.base}
              />
            </Field>
            <Field label="Description par défaut" hint="Environ 150 à 160 caractères.">
              <textarea
                value={state.seo.defaultDescription}
                onChange={(e) => set('seo', { defaultDescription: e.target.value })}
                rows={3}
                style={{
                  ...cmsInput.base,
                  resize: 'vertical',
                  fontFamily: RM.fSans,
                  lineHeight: 1.5,
                }}
              />
            </Field>
            <Field label="Nom d’hôte canonique" hint="Sans protocole ni barre oblique finale.">
              <input
                type="text"
                value={state.seo.canonicalHostname}
                onChange={(e) => set('seo', { canonicalHostname: e.target.value })}
                style={cmsInput.base}
                placeholder="lesremedesdemamie.com"
              />
            </Field>
          </section>

          {/* --- Newsletter --- */}
          <section
            id="settings-newsletter"
            data-section-id="newsletter"
            ref={(r) => {
              sectionRefs.current.newsletter = r
            }}
            style={cardStyle}
          >
            <h2 style={cardTitleStyle}>Newsletter</h2>
            <div style={cardSubStyle}>Fournisseur et liste de diffusion.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 20 }}>
              <Field label="Fournisseur">
                <select
                  value={state.newsletter.provider}
                  onChange={(e) =>
                    set('newsletter', {
                      provider: e.target.value as SiteSettings['newsletter']['provider'],
                    })
                  }
                  style={cmsInput.base}
                >
                  <option value="none">Aucun</option>
                  <option value="brevo">Brevo</option>
                </select>
              </Field>
              <Field label="ID de liste" hint="Identifiant Brevo de la liste principale.">
                <input
                  type="text"
                  value={state.newsletter.listId || ''}
                  onChange={(e) => set('newsletter', { listId: e.target.value })}
                  style={cmsInput.base}
                  disabled={state.newsletter.provider === 'none'}
                  placeholder={state.newsletter.provider === 'none' ? '—' : 'ex. 10234567'}
                />
              </Field>
            </div>
          </section>

          {/* --- Boutique --- */}
          <section
            id="settings-boutique"
            data-section-id="boutique"
            ref={(r) => {
              sectionRefs.current.boutique = r
            }}
            style={cardStyle}
          >
            <h2 style={cardTitleStyle}>Boutique</h2>
            <div style={cardSubStyle}>Devise et paiements en ligne.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 20, alignItems: 'start' }}>
              <Field label="Devise par défaut">
                <select
                  value={state.boutique.defaultCurrency}
                  onChange={(e) =>
                    set('boutique', {
                      defaultCurrency: e.target.value as SiteSettings['boutique']['defaultCurrency'],
                    })
                  }
                  style={cmsInput.base}
                >
                  <option value="EUR">EUR — Euro</option>
                  <option value="USD">USD — Dollar US</option>
                  <option value="GBP">GBP — Livre sterling</option>
                </select>
              </Field>
              <div>
                <div style={labelTinyStyle}>Paiements Stripe</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 0',
                  }}
                >
                  <Toggle
                    checked={state.boutique.stripeEnabled}
                    onChange={(v) => set('boutique', { stripeEnabled: v })}
                    label="Activer Stripe"
                  />
                  <span
                    style={{
                      fontFamily: RM.fSans,
                      fontSize: 13,
                      color: RM.ink,
                    }}
                  >
                    {state.boutique.stripeEnabled ? 'Activé' : 'Désactivé'}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: RM.inkSoft,
                    fontStyle: 'italic',
                    marginTop: 4,
                    fontFamily: RM.fSerif,
                  }}
                >
                  Désactive temporairement le paiement en checkout sans supprimer la configuration.
                </div>
              </div>
            </div>
          </section>

          {/* --- Intégrations --- */}
          <section
            id="settings-integrations"
            data-section-id="integrations"
            ref={(r) => {
              sectionRefs.current.integrations = r
            }}
            style={cardStyle}
          >
            <h2 style={cardTitleStyle}>Intégrations</h2>
            <div style={cardSubStyle}>Services tiers connectés à la maison.</div>

            {/* Stripe */}
            <IntegrationRow
              swatch="#635BFF"
              name="Stripe"
              description="Paiements de la boutique"
              right={
                <Toggle
                  checked={state.integrations.stripeConnected}
                  onChange={(v) => set('integrations', { stripeConnected: v })}
                  label="Stripe connecté"
                />
              }
            />
            {/* Brevo */}
            <IntegrationRow
              swatch={RM.ochre}
              name="Brevo"
              description="Newsletter & emails transactionnels"
              right={
                <Toggle
                  checked={state.integrations.brevoConnected}
                  onChange={(v) => set('integrations', { brevoConnected: v })}
                  label="Brevo connecté"
                />
              }
            />
            {/* Algolia */}
            <IntegrationRow
              swatch={RM.teal}
              name="Algolia"
              description="Recherche plein texte"
              right={
                <Toggle
                  checked={state.integrations.algoliaConnected}
                  onChange={(v) => set('integrations', { algoliaConnected: v })}
                  label="Algolia connecté"
                />
              }
            />
            {/* GA */}
            <IntegrationRow
              swatch="#F9AB00"
              name="Google Analytics"
              description="Mesure d’audience (GA4)"
              right={
                <input
                  type="text"
                  value={state.integrations.googleAnalyticsId || ''}
                  onChange={(e) => set('integrations', { googleAnalyticsId: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                  style={{ ...cmsInput.base, width: 180 }}
                />
              }
            />
            {/* Instagram */}
            <IntegrationRow
              swatch={RM.burgundy}
              name="Instagram"
              description="Compte public affiché en pied de page"
              right={
                <input
                  type="text"
                  value={state.integrations.instagramHandle || ''}
                  onChange={(e) => set('integrations', { instagramHandle: e.target.value })}
                  placeholder="@remedes.de.mamie"
                  style={{ ...cmsInput.base, width: 200 }}
                />
              }
              isLast
            />
          </section>

          {/* --- Developers --- */}
          <section
            id="settings-developers"
            data-section-id="developers"
            ref={(r) => {
              sectionRefs.current.developers = r
            }}
            style={cardStyle}
          >
            <h2 style={cardTitleStyle}>API &amp; développeurs</h2>
            <div style={cardSubStyle}>Webhook sortant et informations environnement.</div>

            <Field label="URL du webhook" hint="Notification HTTP POST à la publication d’une fiche.">
              <input
                type="url"
                value={state.developers.webhookUrl || ''}
                onChange={(e) => set('developers', { webhookUrl: e.target.value })}
                style={cmsInput.base}
                placeholder="https://example.com/hooks/rdm"
              />
            </Field>
            <div
              style={{
                background: RM.cream,
                border: `1px solid ${RM.rule}`,
                borderRadius: 8,
                padding: '12px 16px',
                fontFamily: RM.fSans,
                fontSize: 12,
                color: RM.inkSoft,
                lineHeight: 1.5,
              }}
            >
              Les clés API (Stripe, Brevo, Algolia, &hellip;) sont stockées dans les variables
              d’environnement <code style={{ fontFamily: RM.fMono, fontSize: 11 }}>.env</code> et ne sont pas
              modifiables depuis cette interface.
            </div>
          </section>

          {/* --- Backups --- */}
          <section
            id="settings-backups"
            data-section-id="backups"
            ref={(r) => {
              sectionRefs.current.backups = r
            }}
            style={cardStyle}
          >
            <h2 style={cardTitleStyle}>Sauvegardes</h2>
            <div style={cardSubStyle}>Rétention des snapshots de la base.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 20 }}>
              <Field label="Jours de rétention" hint="Entre 1 et 365 jours.">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={state.backups.retentionDays}
                  onChange={(e) =>
                    set('backups', {
                      retentionDays: Math.max(1, Math.min(365, Number(e.target.value) || 1)),
                    })
                  }
                  style={cmsInput.base}
                />
              </Field>
              <div
                style={{
                  background: RM.cream,
                  border: `1px solid ${RM.rule}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  fontFamily: RM.fSans,
                  fontSize: 12,
                  color: RM.inkSoft,
                  lineHeight: 1.5,
                  alignSelf: 'start',
                }}
              >
                Les sauvegardes automatiques sont gérées par <strong>Vercel</strong> et <strong>Neon</strong>.
                Cette valeur pilote la rétention des exports applicatifs additionnels.
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* -------------------------- STICKY ACTION BAR -------------------------- */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          marginTop: 32,
          background: RM.paper,
          borderTop: `1px solid ${RM.ruleStrong}`,
          borderRadius: '10px 10px 0 0',
          boxShadow: '0 -4px 16px rgba(30, 26, 22, 0.06)',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {saving && (
            <span
              style={{
                fontFamily: RM.fSans,
                fontSize: 12,
                color: RM.teal,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Spinner />
              Enregistrement&hellip;
            </span>
          )}
          {!saving && dirty && (
            <span
              style={{
                fontFamily: RM.fSans,
                fontSize: 12,
                color: RM.burgundy,
                fontWeight: 600,
              }}
            >
              • Non enregistré
            </span>
          )}
          {!saving && !dirty && savedAt && (
            <span
              style={{
                fontFamily: RM.fSans,
                fontSize: 12,
                color: RM.teal,
                background: '#E6F0E9',
                border: `1px solid #B9D3BE`,
                padding: '4px 10px',
                borderRadius: 999,
              }}
            >
              Enregistré {relativeTime(savedAt)}
            </span>
          )}
          {!saving && !dirty && !savedAt && !isUninitialised && (
            <span
              style={{
                fontFamily: RM.fSans,
                fontSize: 12,
                color: RM.inkSoft,
              }}
            >
              Aucune modification.
            </span>
          )}
          {error && (
            <span
              onClick={() => setError(null)}
              style={{
                fontFamily: RM.fSans,
                fontSize: 12,
                color: '#7C1515',
                background: '#FBE2E2',
                border: '1px solid #E8A7A7',
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                maxWidth: 520,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={error}
            >
              {error} — cliquer pour fermer
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={cancel}
            disabled={!dirty || saving}
            style={{
              ...cmsBtn.ghost,
              opacity: !dirty || saving ? 0.5 : 1,
              cursor: !dirty || saving ? 'not-allowed' : 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            style={{
              ...cmsBtn.primary,
              opacity: !dirty || saving ? 0.5 : 1,
              cursor: !dirty || saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function IntegrationRow({
  swatch,
  name,
  description,
  right,
  isLast,
}: {
  swatch: string
  name: string
  description: string
  right: React.ReactNode
  isLast?: boolean
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr auto',
        alignItems: 'center',
        gap: 16,
        padding: '14px 0',
        borderBottom: isLast ? 'none' : `1px solid ${RM.rule}`,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: swatch,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: RM.fDisplay,
            fontSize: 17,
            color: RM.teal,
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: RM.inkSoft,
            fontFamily: RM.fSans,
            marginTop: 2,
          }}
        >
          {description}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  )
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 12,
        height: 12,
        border: `2px solid ${RM.ruleStrong}`,
        borderTopColor: RM.teal,
        borderRadius: '50%',
        animation: 'rdm-spin 0.8s linear infinite',
      }}
    >
      <style>{`@keyframes rdm-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  )
}
