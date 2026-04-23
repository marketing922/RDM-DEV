'use client'
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronRight, ChevronLeft, Search, X, Plus } from 'lucide-react'
import { RM, cmsBtn, cmsInput, Sprig, PageHeader } from '../primitives'

export type KindKey = 'all' | 'photo' | 'doc' | 'video' | 'archive'

export type MediaRow = {
  id: string
  filename: string
  alt: string
  mimeType: string
  url: string
  isImage: boolean
  badge: string
  dims: string
  sizeLabel: string
  href: string
  usageCount: number
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: `1px dashed ${RM.rule}`,
        padding: '6px 0',
      }}
    >
      <dt
        style={{
          color: RM.inkSoft,
          textTransform: 'uppercase',
          fontSize: 10,
          letterSpacing: 1,
          fontWeight: 600,
        }}
      >
        {label}
      </dt>
      <dd style={{ margin: 0, fontFamily: RM.fMono, fontSize: 11 }}>{children}</dd>
    </div>
  )
}

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
  rows: MediaRow[]
  totalDocs: number
  unfilteredTotal: number
  totalPages: number
  page: number
  limit: number
  photoCount: number
  docCount: number
  totalSizeLabel: string
  initialSearch: string
  initialKind: KindKey
}

const FILTERS: Array<{ key: KindKey; label: string }> = [
  { key: 'all', label: 'Tous' },
  { key: 'photo', label: 'Photos' },
  { key: 'doc', label: 'Documents' },
  { key: 'video', label: 'Vidéos' },
  { key: 'archive', label: 'Archives' },
]

const MediaListClient: React.FC<Props> = ({
  rows,
  totalDocs,
  unfilteredTotal,
  totalPages,
  page,
  limit,
  photoCount,
  docCount,
  totalSizeLabel,
  initialSearch,
  initialKind,
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

  const selectedId = sp?.get('selected') || null
  const selectedRow = selectedId ? rows.find((r) => r.id === selectedId) ?? null : null

  const selectMedia = (id: string | null) => {
    const params = new URLSearchParams(sp?.toString() ?? '')
    if (id) params.set('selected', id)
    else params.delete('selected')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  const isFiltered = initialSearch !== '' || initialKind !== 'all'
  const dbEmpty = unfilteredTotal === 0

  const clearAllFilters = () => {
    router.replace(pathname)
  }

  const uploadHref = '/admin/collections/media/create'

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
        eyebrow="Bibliothèque"
        title="Médias"
        sub={`${unfilteredTotal} fichier${unfilteredTotal === 1 ? '' : 's'} · ${totalSizeLabel} total`}
        right={
          <Link href={uploadHref} style={{ ...cmsBtn.primary, textDecoration: 'none' }}>
            <Plus size={14} /> Téléverser
          </Link>
        }
      />

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Fichiers totaux"
          value={unfilteredTotal}
          delta="bibliothèque"
          deltaColor={RM.inkSoft}
          dotColor={RM.stone}
          href="/admin/collections/media"
        />
        <StatCard
          label="Photos"
          value={photoCount}
          delta="images"
          deltaColor={RM.teal}
          dotColor={RM.teal}
          href="/admin/collections/media?kind=photo"
        />
        <StatCard
          label="Documents"
          value={docCount}
          delta="PDF"
          deltaColor={RM.burgundy}
          dotColor={RM.burgundy}
          href="/admin/collections/media?kind=doc"
        />
        <StatCard
          label="Espace utilisé"
          value={totalSizeLabel}
          delta="sur le disque"
          deltaColor={RM.ochre}
          dotColor={RM.ochre}
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
            const isActive = f.key === initialKind
            const style: React.CSSProperties = isActive
              ? { ...cmsBtn.dark }
              : { ...cmsBtn.ghost }
            return (
              <button
                key={f.key}
                type="button"
                style={style}
                onClick={() => setParam('kind', f.key === 'all' ? null : f.key)}
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
            placeholder="Rechercher par nom de fichier ou alt…"
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

      {/* Grid + sticky detail panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 14,
            }}
          >
            {rows.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  padding: '48px 20px',
                  textAlign: 'center',
                  color: RM.inkSoft,
                  fontSize: 13,
                  fontFamily: RM.fSerif,
                  background: RM.paper,
                  border: `1px solid ${RM.rule}`,
                  borderRadius: 8,
                }}
              >
                {dbEmpty ? (
                  <>
                    <div style={{ fontStyle: 'italic', marginBottom: 10 }}>
                      Médiathèque vide.
                    </div>
                    <Link
                      href={uploadHref}
                      style={{ ...cmsBtn.primary, textDecoration: 'none' }}
                    >
                      <Plus size={14} /> Téléverser
                    </Link>
                  </>
                ) : isFiltered ? (
                  <>
                    <div style={{ fontStyle: 'italic', marginBottom: 10 }}>
                      Aucun média ne correspond.
                    </div>
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      style={{ ...cmsBtn.ghost, cursor: 'pointer' }}
                    >
                      Effacer les filtres →
                    </button>
                  </>
                ) : (
                  <div style={{ fontStyle: 'italic' }}>Aucun média pour l’instant.</div>
                )}
              </div>
            ) : (
              rows.map((row) => {
                const isSelected = row.id === selectedId
                return (
                <div
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectMedia(row.id)}
                  onDoubleClick={() => router.push(row.href)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      selectMedia(row.id)
                    }
                  }}
                  style={{
                    display: 'block',
                    background: RM.paper,
                    border: `1px solid ${isSelected ? RM.burgundy : RM.rule}`,
                    borderRadius: 8,
                    overflow: 'hidden',
                    textDecoration: 'none',
                    color: RM.ink,
                    transition: 'border-color 120ms ease, box-shadow 120ms ease',
                    cursor: 'pointer',
                    boxShadow: isSelected ? `0 0 0 2px ${RM.burgundy}22` : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLDivElement).style.borderColor = RM.ruleStrong
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLDivElement).style.borderColor = RM.rule
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '1 / 1',
                      background: RM.creamSoft,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {row.isImage && row.url ? (
                      <Image
                        src={row.url}
                        alt={row.alt}
                        fill
                        sizes="(max-width: 1200px) 25vw, 240px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Sprig size={60} color={RM.teal} style={{ opacity: 0.35 }} />
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        fontSize: 9,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        color: RM.inkSoft,
                        background: 'rgba(255,255,255,0.75)',
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontWeight: 600,
                        fontFamily: RM.fSans,
                      }}
                    >
                      {row.badge}
                    </span>
                    {row.usageCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontSize: 9,
                          letterSpacing: 0.5,
                          color: RM.paper,
                          background: RM.teal,
                          padding: '2px 6px',
                          borderRadius: 3,
                          fontWeight: 600,
                          fontFamily: RM.fMono,
                        }}
                      >
                        {row.usageCount}×
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <div
                      style={{
                        fontFamily: RM.fMono,
                        fontSize: 11,
                        color: RM.ink,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {row.filename}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 10,
                        color: RM.inkSoft,
                        fontFamily: RM.fSans,
                        marginTop: 4,
                      }}
                    >
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '60%',
                        }}
                      >
                        {row.dims}
                      </span>
                      <span>{row.sizeLabel}</span>
                    </div>
                  </div>
                </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {totalDocs > 0 && totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 20,
                padding: '14px 20px',
                background: RM.paper,
                border: `1px solid ${RM.rule}`,
                borderRadius: 8,
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

        {/* Right column — detail panel (selection-aware) */}
        <aside
          style={{
            background: RM.paper,
            border: `1px solid ${RM.rule}`,
            borderRadius: 10,
            overflow: 'hidden',
            position: 'sticky',
            top: 96,
          }}
        >
          {selectedRow ? (
            <>
              <div
                style={{
                  aspectRatio: '1 / 1',
                  background: RM.creamSoft,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedRow.isImage && selectedRow.url ? (
                  <Image
                    src={selectedRow.url}
                    alt={selectedRow.alt}
                    fill
                    sizes="340px"
                    style={{ objectFit: 'contain' }}
                  />
                ) : (
                  <Sprig size={140} color={RM.teal} style={{ opacity: 0.5 }} />
                )}
              </div>
              <div style={{ padding: '18px 20px 22px' }}>
                <div
                  style={{
                    fontFamily: RM.fMono,
                    fontSize: 11,
                    color: RM.inkSoft,
                    marginBottom: 4,
                    wordBreak: 'break-all',
                  }}
                >
                  {selectedRow.filename}
                </div>
                <h2
                  style={{
                    fontFamily: RM.fDisplay,
                    fontSize: 20,
                    color: RM.teal,
                    margin: 0,
                    fontWeight: 400,
                    letterSpacing: -0.3,
                  }}
                >
                  {selectedRow.alt}
                </h2>
                <dl
                  style={{
                    marginTop: 16,
                    fontSize: 12,
                    fontFamily: RM.fSans,
                    color: RM.ink,
                    lineHeight: 1.6,
                  }}
                >
                  <Row label="Type">{selectedRow.badge}</Row>
                  <Row label="Dimensions">{selectedRow.dims}</Row>
                  <Row label="Taille">{selectedRow.sizeLabel}</Row>
                  <Row label="Mime">{selectedRow.mimeType}</Row>
                  {selectedRow.usageCount > 0 && (
                    <Row label="Utilisé">{selectedRow.usageCount}×</Row>
                  )}
                </dl>
                <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                  <Link
                    href={selectedRow.href}
                    style={{
                      ...cmsBtn.primary,
                      textDecoration: 'none',
                      flex: 1,
                      justifyContent: 'center',
                    }}
                  >
                    Ouvrir la fiche →
                  </Link>
                  <button
                    type="button"
                    onClick={() => selectMedia(null)}
                    style={{ ...cmsBtn.ghost, cursor: 'pointer' }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  aspectRatio: '1 / 1',
                  background: RM.creamSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sprig size={160} color={RM.teal} style={{ opacity: 0.35 }} />
              </div>
              <div style={{ padding: '18px 20px 22px' }}>
                <h2
                  style={{
                    fontFamily: RM.fDisplay,
                    fontSize: 22,
                    color: RM.teal,
                    margin: 0,
                    fontWeight: 400,
                    letterSpacing: -0.3,
                  }}
                >
                  Aucun média sélectionné
                </h2>
                <p
                  style={{
                    marginTop: 8,
                    fontFamily: RM.fSans,
                    fontSize: 13,
                    color: RM.inkSoft,
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  Sélectionnez un fichier à gauche pour voir ses détails.
                </p>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

export default MediaListClient
