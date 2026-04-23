'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronRight, ChevronLeft, Search, X, Plus } from 'lucide-react'
import { RM, cmsBtn, cmsInput, StatusPill, PageHeader } from '../primitives'

export type ArticleRow = {
  id: string
  refLabel: string
  title: string
  category: string
  authorName: string
  statusLabel: string
  dateLabel: string
  readingLabel: string
  href: string
}

type StatusKey = 'all' | 'published' | 'draft' | 'pending'

type StatCardProps = {
  label: string
  value: string | number
  delta?: string
  deltaColor?: string
  dotColor?: string
  href?: string
}

const StatCard: React.FC<StatCardProps> = ({ label, value, delta, deltaColor, dotColor, href }) => {
  const body = (
    <div
      style={{
        background: RM.paper,
        border: `1px solid ${RM.rule}`,
        borderRadius: 8,
        padding: '18px 20px',
        position: 'relative',
        cursor: href ? 'pointer' : 'default',
        transition: 'border-color 120ms ease',
        height: '100%',
      }}
      onMouseEnter={(e) => {
        if (href) (e.currentTarget as HTMLDivElement).style.borderColor = RM.ruleStrong
      }}
      onMouseLeave={(e) => {
        if (href) (e.currentTarget as HTMLDivElement).style.borderColor = RM.rule
      }}
    >
      {dotColor && (
        <span
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 6,
            height: 6,
            borderRadius: 999,
            background: dotColor,
            display: 'inline-block',
          }}
        />
      )}
      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          color: RM.inkSoft,
          fontWeight: 600,
          fontFamily: RM.fSans,
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: RM.fDisplay,
          fontSize: 38,
          color: RM.teal,
          lineHeight: 1,
          fontWeight: 400,
        }}
      >
        {value}
      </div>
      {delta && (
        <div
          style={{
            fontSize: 11,
            color: deltaColor ?? RM.inkSoft,
            marginTop: 8,
            fontFamily: RM.fSans,
            fontWeight: 600,
          }}
        >
          {delta}
        </div>
      )}
    </div>
  )
  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {body}
      </Link>
    )
  }
  return body
}

type Props = {
  rows: ArticleRow[]
  totalDocs: number
  grandTotal: number
  totalPages: number
  page: number
  limit: number
  draftCount: number
  publishedCount: number
  contributorsCount: number
  initialSearch: string
  initialStatus: StatusKey
}

const FILTERS: Array<{ key: StatusKey; label: string }> = [
  { key: 'all', label: 'Tous' },
  { key: 'published', label: 'Publiés' },
  { key: 'pending', label: 'Révision' },
  { key: 'draft', label: 'Brouillons' },
]

const GRID_COLS = '80px 2.4fr 1fr 110px 100px 100px 80px 40px'

const ArticlesListClient: React.FC<Props> = ({
  rows,
  totalDocs,
  grandTotal,
  totalPages,
  page,
  limit,
  draftCount,
  publishedCount,
  contributorsCount,
  initialSearch,
  initialStatus,
}) => {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()

  const [searchValue, setSearchValue] = useState(initialSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPushedRef = useRef(initialSearch)

  useEffect(() => {
    if (initialSearch !== lastPushedRef.current) {
      setSearchValue(initialSearch)
      lastPushedRef.current = initialSearch
    }
  }, [initialSearch])

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

  const sub = `${grandTotal} publié${grandTotal === 1 ? '' : 's'} · ${draftCount} en cours`

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
        eyebrow="Journal"
        title="Articles"
        sub={sub}
        right={
          <Link
            href="/admin/collections/blogPosts/create"
            style={{ ...cmsBtn.primary, textDecoration: 'none' }}
          >
            <Plus size={14} /> Nouvel article
          </Link>
        }
      />

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <StatCard
          label="Articles publiés"
          value={publishedCount}
          delta="voir la liste"
          deltaColor={RM.teal}
          dotColor={RM.teal}
          href="/admin/collections/blogPosts?status=published"
        />
        {/* TODO: wire real analytics */}
        <StatCard
          label="Lectures · 30j"
          value="—"
          delta="Analytics à venir"
          deltaColor={RM.inkSoft}
          dotColor={RM.ochre}
        />
        <StatCard
          label="Brouillons"
          value={draftCount}
          delta={draftCount > 0 ? 'à traiter' : 'aucun'}
          deltaColor={RM.burgundy}
          dotColor={RM.burgundy}
          href="/admin/collections/blogPosts?status=draft"
        />
        <StatCard
          label="Contributions"
          value={contributorsCount}
          delta="auteurs"
          deltaColor={RM.inkSoft}
          dotColor={RM.stone}
        />
      </div>

      {/* Toolbar: filter chips + search + row counter */}
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
            placeholder="Rechercher par titre ou extrait…"
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

      {/* Table */}
      <div
        style={{
          background: RM.paper,
          border: `1px solid ${RM.rule}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Header row */}
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
            gap: 12,
          }}
        >
          <span>Réf</span>
          <span>Titre · Plantes citées</span>
          <span>Catégorie</span>
          <span>Auteur</span>
          <span>Statut</span>
          <span>Date</span>
          <span style={{ textAlign: 'right' }}>Lecture</span>
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
                  Aucun article ne correspond.
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
                  Aucun article.
                </div>
                <Link
                  href="/admin/collections/blogPosts/create"
                  style={{ ...cmsBtn.primary, textDecoration: 'none' }}
                >
                  <Plus size={14} /> Créer le premier
                </Link>
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
                  gap: 12,
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
                  {row.refLabel}
                </span>

                <span
                  style={{
                    fontFamily: RM.fDisplay,
                    fontSize: 17,
                    color: RM.teal,
                    fontWeight: 400,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.title}
                </span>

                <span style={{ color: RM.inkSoft, fontSize: 12 }}>{row.category}</span>

                <span style={{ fontSize: 12, color: RM.ink }}>{row.authorName}</span>

                <span>
                  <StatusPill label={row.statusLabel} />
                </span>

                <span style={{ fontSize: 12, color: RM.inkSoft }}>{row.dateLabel}</span>

                <span
                  style={{
                    fontFamily: RM.fMono,
                    fontSize: 12,
                    color: RM.inkSoft,
                    textAlign: 'right',
                  }}
                >
                  {row.readingLabel}
                </span>

                <span
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

        {/* Pagination footer */}
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

export default ArticlesListClient
