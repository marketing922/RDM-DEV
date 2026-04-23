'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Circle,
  CircleDashed,
  Lock,
} from 'lucide-react'
import { RM, cmsBtn, cmsInput, StatusPill, PageHeader } from '../primitives'

export type SitePageRow = {
  id: string
  ref: string
  title: string
  slug: string
  slugLabel: string
  statusLabel: string
  updatedLabel: string
  href: string
}

type StatusKey = 'all' | 'published' | 'draft'

// Source of truth for the 9 mandatory slugs — duplicated from the collection
// to keep this file self-contained and ensure the order shown in the
// checklist is stable & matches the site routes.
const ALL_SLUGS: ReadonlyArray<{ slug: string; label: string }> = [
  { slug: 'a-propos', label: 'À propos' },
  { slug: 'contact', label: 'Contact' },
  { slug: 'faq', label: 'FAQ' },
  { slug: 'cgv', label: 'CGV' },
  { slug: 'mentions-legales', label: 'Mentions légales' },
  { slug: 'politique-confidentialite', label: 'Confidentialité' },
  { slug: 'politique-cookies', label: 'Cookies' },
  { slug: 'avertissement-sante', label: 'Avertissement santé' },
  { slug: 'accessibilite', label: 'Accessibilité' },
]

type Props = {
  rows: SitePageRow[]
  allConfigured: Array<{ slug: string; statusLabel: string; href: string }>
  totalDocs: number
  totalPages: number
  page: number
  limit: number
  publishedCount: number
  draftsCount: number
  totalAll: number
  totalSlots: number
  initialSearch: string
  initialStatus: StatusKey
}

const FILTERS: Array<{ key: StatusKey; label: string }> = [
  { key: 'all', label: 'Toutes' },
  { key: 'published', label: 'Publiées' },
  { key: 'draft', label: 'Brouillons' },
]

const GRID_COLS = '80px 2.4fr 1.3fr 110px 120px 140px 40px'

const SitePagesListClient: React.FC<Props> = ({
  rows,
  allConfigured,
  totalDocs,
  totalPages,
  page,
  limit,
  publishedCount,
  draftsCount,
  totalAll,
  totalSlots,
  initialSearch,
  initialStatus,
}) => {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()

  const [searchValue, setSearchValue] = useState(initialSearch)
  const [createOpen, setCreateOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPushedRef = useRef(initialSearch)
  const createRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (initialSearch !== lastPushedRef.current) {
      setSearchValue(initialSearch)
      lastPushedRef.current = initialSearch
    }
  }, [initialSearch])

  // Close the "Créer une page" popover when clicking outside.
  useEffect(() => {
    if (!createOpen) return
    const onDown = (e: MouseEvent) => {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [createOpen])

  const buildUrl = (updates: Record<string, string | null>): string => {
    const params = new URLSearchParams(sp?.toString() ?? '')
    let resetsPage = false
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      if (key !== 'page') resetsPage = true
    }
    if (resetsPage) params.delete('page')
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const setParam = (key: string, value: string | null) => {
    router.replace(buildUrl({ [key]: value }))
  }

  const onSearchChange = (value: string) => {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (value === lastPushedRef.current) return
      lastPushedRef.current = value
      router.replace(buildUrl({ search: value.trim() ? value.trim() : null }))
    }, 300)
  }

  const clearSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchValue('')
    lastPushedRef.current = ''
    router.replace(buildUrl({ search: null }))
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const start = totalDocs === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, totalDocs)
  const canPrev = page > 1
  const canNext = page < totalPages

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages) return
    setParam('page', next === 1 ? null : String(next))
  }

  const isFiltered = initialSearch !== '' || initialStatus !== 'all'

  const clearAllFilters = () => {
    router.replace(pathname)
  }

  // Global checklist state — based on the unfiltered `allConfigured` list so
  // that missing/draft/published states reflect reality, not the current view.
  const configuredSlugSet = new Set(allConfigured.map((c) => c.slug))
  const configuredCount = ALL_SLUGS.reduce(
    (n, s) => n + (configuredSlugSet.has(s.slug) ? 1 : 0),
    0,
  )
  const missingSlugs = ALL_SLUGS.filter((s) => !configuredSlugSet.has(s.slug))
  const progressPct = Math.min(100, Math.round((configuredCount / totalSlots) * 100))
  const createDisabled = missingSlugs.length === 0

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
        eyebrow="OBLIGATOIRES"
        title="Pages du site"
        sub={`Pages institutionnelles et légales — ${configuredCount}/${totalSlots} configurées`}
        right={
          <div ref={createRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => !createDisabled && setCreateOpen((v) => !v)}
              disabled={createDisabled}
              title={
                createDisabled
                  ? 'Toutes les pages obligatoires sont configurées'
                  : undefined
              }
              style={{
                ...cmsBtn.primary,
                opacity: createDisabled ? 0.5 : 1,
                cursor: createDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <Plus size={14} /> Créer une page
            </button>
            {createOpen && !createDisabled && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  background: 'white',
                  border: `1px solid ${RM.rule}`,
                  borderRadius: 6,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  minWidth: 260,
                  zIndex: 10,
                  padding: 4,
                }}
              >
                <div
                  style={{
                    padding: '8px 12px 4px',
                    fontSize: 10,
                    color: RM.inkSoft,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Slugs manquants
                </div>
                {missingSlugs.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/admin/collections/sitePages/create?slug=${s.slug}`}
                    onClick={() => setCreateOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      fontSize: 13,
                      color: RM.ink,
                      textDecoration: 'none',
                      borderRadius: 4,
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.background =
                        RM.creamSoft
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.background =
                        'transparent'
                    }}
                  >
                    <span>{s.label}</span>
                    <span
                      style={{
                        color: RM.inkSoft,
                        fontSize: 11,
                        fontFamily: RM.fMono,
                        marginLeft: 12,
                      }}
                    >
                      /{s.slug}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        }
      />

      {/* Info banner — clarifies this section vs Landing pages */}
      <div
        style={{
          background: RM.creamSoft,
          border: `1px solid ${RM.rule}`,
          borderRadius: 8,
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <ShieldCheck size={20} style={{ color: RM.teal, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: RM.inkSoft, fontFamily: RM.fSans }}>
          <strong style={{ color: RM.teal }}>
            Pages institutionnelles obligatoires.
          </strong>{' '}
          Slugs verrouillés (correspondent aux routes du site). Pour les pages
          marketing/promotionnelles, utilisez{' '}
          <Link
            href="/admin/collections/pages"
            style={{ color: RM.burgundy, textDecoration: 'underline' }}
          >
            Landing pages
          </Link>
          .
        </div>
      </div>

      {/* Completion gauge */}
      <div
        style={{
          background: RM.paper,
          border: `1px solid ${RM.rule}`,
          borderRadius: 10,
          padding: '20px 24px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontFamily: RM.fSans,
              fontSize: 12,
              color: RM.inkSoft,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Progression
          </div>
          <div
            style={{
              fontFamily: RM.fDisplay,
              fontSize: 26,
              color: RM.teal,
            }}
          >
            {configuredCount}
            <span style={{ color: RM.inkSoft, fontSize: 18 }}>/{totalSlots}</span>
          </div>
        </div>
        <div
          style={{
            height: 6,
            background: RM.creamSoft,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: RM.teal,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        {publishedCount < totalSlots && (
          <div
            style={{
              fontSize: 11,
              color: RM.inkSoft,
              marginTop: 8,
              fontFamily: RM.fSans,
            }}
          >
            {totalSlots - publishedCount} page
            {totalSlots - publishedCount > 1 ? 's' : ''} à{' '}
            {publishedCount > configuredCount || configuredCount >= totalSlots
              ? 'publier'
              : 'créer'}
            .
          </div>
        )}
      </div>

      {/* Checklist of the 9 mandatory pages */}
      <div
        style={{
          background: RM.paper,
          border: `1px solid ${RM.rule}`,
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontFamily: RM.fSans,
            fontSize: 11,
            color: RM.inkSoft,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Les {totalSlots} pages obligatoires
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {ALL_SLUGS.map(({ slug, label }) => {
            const configured = allConfigured.find((c) => c.slug === slug)
            const state: 'published' | 'draft' | 'missing' = !configured
              ? 'missing'
              : configured.statusLabel === 'Publié'
                ? 'published'
                : 'draft'
            const href = configured
              ? configured.href
              : `/admin/collections/sitePages/create?slug=${slug}`
            return (
              <Link
                key={slug}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  border: `1px solid ${state === 'published' ? RM.teal + '44' : RM.rule}`,
                  borderRadius: 6,
                  background: state === 'missing' ? RM.creamSoft + '80' : 'white',
                  textDecoration: 'none',
                  fontFamily: RM.fSans,
                  fontSize: 13,
                  opacity: state === 'missing' ? 0.75 : 1,
                  transition: 'border-color 120ms ease, background 120ms ease',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
                    RM.ruleStrong
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
                    state === 'published' ? RM.teal + '44' : RM.rule
                }}
              >
                {state === 'published' ? (
                  <CheckCircle2 size={14} style={{ color: RM.teal, flexShrink: 0 }} />
                ) : state === 'draft' ? (
                  <Circle size={14} style={{ color: RM.ochre, flexShrink: 0 }} />
                ) : (
                  <CircleDashed
                    size={14}
                    style={{ color: RM.inkSoft, flexShrink: 0 }}
                  />
                )}
                <span
                  style={{
                    color: state === 'missing' ? RM.inkSoft : RM.teal,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
                {state === 'missing' && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 10,
                      color: RM.burgundy,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}
                  >
                    À CRÉER
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {FILTERS.map((f) => {
            const isActive = f.key === initialStatus
            const style: React.CSSProperties = isActive
              ? { ...cmsBtn.dark }
              : { ...cmsBtn.ghost }
            return (
              <button
                key={f.key}
                type="button"
                style={style}
                onClick={() => setParam('status', f.key === 'all' ? null : f.key)}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <div
          style={{
            position: 'relative',
            flex: '1 1 240px',
            minWidth: 200,
            maxWidth: 420,
          }}
        >
          <Search
            size={14}
            style={{
              position: 'absolute',
              top: '50%',
              left: 12,
              transform: 'translateY(-50%)',
              color: RM.inkSoft,
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par titre…"
            style={{
              ...cmsInput.base,
              paddingLeft: 34,
              paddingRight: searchValue ? 34 : 12,
            }}
          />
          {searchValue && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Effacer la recherche"
              style={{
                position: 'absolute',
                top: '50%',
                right: 8,
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: RM.inkSoft,
                padding: 4,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            color: RM.inkSoft,
            fontFamily: RM.fSans,
            whiteSpace: 'nowrap',
          }}
        >
          {totalDocs === 0
            ? 'Aucun résultat'
            : `Affichage ${start}–${end} sur ${totalDocs}`}
        </div>
      </div>

      {/* Simple stats — single line, only published + drafts clickable */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'center',
          marginBottom: 20,
          padding: '14px 20px',
          background: RM.paper,
          border: `1px solid ${RM.rule}`,
          borderRadius: 8,
        }}
      >
        <Link
          href="/admin/collections/sitePages?status=published"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: RM.teal,
            fontFamily: RM.fSans,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: RM.teal,
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 13, color: RM.inkSoft, fontWeight: 600 }}>
            Publiées
          </span>
          <span
            style={{
              fontFamily: RM.fDisplay,
              fontSize: 22,
              color: RM.teal,
              lineHeight: 1,
            }}
          >
            {publishedCount}
          </span>
        </Link>
        <span style={{ width: 1, height: 24, background: RM.rule }} />
        <Link
          href="/admin/collections/sitePages?status=draft"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: RM.burgundy,
            fontFamily: RM.fSans,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: RM.burgundy,
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 13, color: RM.inkSoft, fontWeight: 600 }}>
            Brouillons
          </span>
          <span
            style={{
              fontFamily: RM.fDisplay,
              fontSize: 22,
              color: RM.burgundy,
              lineHeight: 1,
            }}
          >
            {draftsCount}
          </span>
        </Link>
        {totalAll > 0 && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: RM.inkSoft,
              fontFamily: RM.fSans,
              letterSpacing: 0.5,
            }}
          >
            Voir la jauge pour la progression globale
          </span>
        )}
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
            fontFamily: RM.fSans,
          }}
        >
          <span>Réf</span>
          <span>Titre</span>
          <span>URL</span>
          <span>Statut</span>
          <span>Mise à jour</span>
          <span>Slug</span>
          <span />
        </div>

        {rows.length === 0 && (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: RM.inkSoft,
              fontSize: 13,
              fontFamily: RM.fSerif,
            }}
          >
            {isFiltered ? (
              <>
                <div style={{ fontStyle: 'italic', marginBottom: 10 }}>
                  Aucune page ne correspond.
                </div>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  style={{ ...cmsBtn.ghost, cursor: 'pointer' }}
                >
                  Effacer les filtres
                </button>
              </>
            ) : (
              <>
                <div style={{ fontStyle: 'italic', marginBottom: 10 }}>
                  Aucune page du site configurée.
                </div>
                {missingSlugs.length > 0 && (
                  <Link
                    href={`/admin/collections/sitePages/create?slug=${missingSlugs[0]!.slug}`}
                    style={{ ...cmsBtn.primary, textDecoration: 'none' }}
                  >
                    <Plus size={14} /> Créer la première
                  </Link>
                )}
              </>
            )}
          </div>
        )}

        {rows.map((row, idx) => {
          const isLast = idx === rows.length - 1
          return (
            <Link
              key={row.id}
              href={row.href}
              title="Éditer le contenu (slug non modifiable)"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID_COLS,
                  padding: '16px 20px',
                  borderBottom: isLast ? 'none' : `1px solid ${RM.rule}`,
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.background = RM.creamSoft
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                }}
              >
                <span
                  style={{
                    fontFamily: RM.fMono,
                    fontSize: 11,
                    color: RM.inkSoft,
                  }}
                >
                  {row.ref}
                </span>

                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span
                    style={{
                      fontFamily: RM.fDisplay,
                      fontSize: 17,
                      color: RM.teal,
                      fontWeight: 400,
                      lineHeight: 1.2,
                    }}
                  >
                    {row.title}
                  </span>
                  {row.slugLabel && (
                    <span
                      style={{
                        fontFamily: RM.fSerif,
                        fontSize: 12,
                        fontStyle: 'italic',
                        color: RM.inkSoft,
                      }}
                    >
                      {row.slugLabel}
                    </span>
                  )}
                </span>

                <span
                  style={{
                    fontFamily: RM.fMono,
                    fontSize: 12,
                    color: RM.inkSoft,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.slug ? `/${row.slug}` : '—'}
                </span>

                <span>
                  <StatusPill label={row.statusLabel} />
                </span>

                <span style={{ fontSize: 12, color: RM.inkSoft }}>{row.updatedLabel}</span>

                <span
                  title="Slug verrouillé (correspond à la route du site)"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    color: RM.inkSoft,
                    background: RM.creamSoft,
                    border: `1px solid ${RM.rule}`,
                    borderRadius: 4,
                    padding: '3px 6px',
                    fontFamily: RM.fSans,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    justifySelf: 'start',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Lock size={10} /> Verrouillé
                </span>

                <span
                  title="Éditer le contenu (slug non modifiable)"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    color: RM.inkSoft,
                  }}
                >
                  <ChevronRight size={16} />
                </span>
              </div>
            </Link>
          )
        })}

        {totalDocs > 0 && totalPages > 1 && (
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
              onClick={() => goToPage(page - 1)}
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
            <span
              style={{
                fontSize: 12,
                color: RM.inkSoft,
                fontFamily: RM.fSans,
              }}
            >
              Page {page} sur {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
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

export default SitePagesListClient
