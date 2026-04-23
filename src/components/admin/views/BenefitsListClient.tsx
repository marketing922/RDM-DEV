'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronRight, Search, X, Plus } from 'lucide-react'
import { RM, cmsBtn, cmsInput, PageHeader } from '@/components/admin/primitives'

export type BenefitRow = {
  id: string
  name: string
  plantCount: number | null
  articleCount: number | null
}

export type BenefitBucket = {
  key: string
  label: string
  color: string
  rows: BenefitRow[]
}

type StatusKey = 'all' | 'published' | 'draft'

type Props = {
  buckets: BenefitBucket[]
  totalDocs: number
  filteredCount: number
  initialSearch: string
  initialStatus: StatusKey
}

const FILTERS: Array<{ key: StatusKey; label: string }> = [
  { key: 'all', label: 'Tous' },
  { key: 'published', label: 'Publiés' },
  { key: 'draft', label: 'Brouillons' },
]

const BenefitsListClient: React.FC<Props> = ({
  buckets,
  totalDocs,
  filteredCount,
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
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
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

  const isFiltered = initialSearch !== '' || initialStatus !== 'all'

  const clearAllFilters = () => {
    router.replace(pathname)
  }

  // When filtered, hide empty buckets; when not filtered, keep the 4-family layout.
  const visibleBuckets = isFiltered
    ? buckets.filter((b) => b.rows.length > 0)
    : buckets

  const familyCount = buckets.filter((b) => b.rows.length > 0).length

  const rangeStart = filteredCount === 0 ? 0 : 1
  const rangeEnd = filteredCount

  return (
    <div
      style={{
        padding: '32px 40px 60px',
        fontFamily: RM.fSans,
        color: RM.ink,
        background: RM.cream,
        minHeight: '100%',
      }}
    >
      <PageHeader
        eyebrow="Taxonomie"
        title="Bienfaits"
        sub={`${totalDocs} entrées · ${familyCount} familles`}
        right={
          <Link
            href="/admin/collections/benefits/create"
            style={{ ...cmsBtn.primary, textDecoration: 'none' }}
          >
            <Plus size={14} /> Nouveau bienfait
          </Link>
        }
      />

      {/* Toolbar: filter chips + search + row counter */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
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

        {/* Search */}
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
            placeholder="Rechercher un bienfait…"
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

        {/* Row counter */}
        <div
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            color: RM.inkSoft,
            fontFamily: RM.fSans,
            whiteSpace: 'nowrap',
          }}
        >
          {filteredCount === 0
            ? 'Aucun résultat'
            : `Affichage ${rangeStart}–${rangeEnd} sur ${filteredCount}`}
        </div>
      </div>

      {/* Empty states */}
      {filteredCount === 0 && (
        <div
          style={{
            background: RM.paper,
            border: `1px solid ${RM.rule}`,
            borderRadius: 10,
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
                Aucun bienfait ne correspond.
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
                Aucun bienfait enregistré.
              </div>
              <Link
                href="/admin/collections/benefits/create"
                style={{ ...cmsBtn.primary, textDecoration: 'none' }}
              >
                <Plus size={14} /> Créer le premier
              </Link>
            </>
          )}
        </div>
      )}

      {/* Family grid */}
      {filteredCount > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 20,
          }}
        >
          {visibleBuckets.map((bucket) => (
            <div
              key={bucket.key}
              style={{
                background: RM.paper,
                border: `1px solid ${RM.rule}`,
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${RM.rule}`,
                  background: RM.creamSoft,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: bucket.color,
                    flexShrink: 0,
                  }}
                />
                <h2
                  style={{
                    fontFamily: RM.fDisplay,
                    fontSize: 20,
                    color: RM.teal,
                    margin: 0,
                    fontWeight: 400,
                    flex: 1,
                  }}
                >
                  {bucket.label}
                </h2>
                <span
                  style={{
                    fontFamily: RM.fMono,
                    fontSize: 12,
                    color: RM.inkSoft,
                    textAlign: 'right',
                  }}
                >
                  {bucket.rows.length} entrées
                </span>
              </div>

              {bucket.rows.length === 0 ? (
                <div
                  style={{
                    padding: '20px',
                    fontSize: 13,
                    color: RM.inkSoft,
                    fontStyle: 'italic',
                  }}
                >
                  Aucune entrée
                </div>
              ) : (
                bucket.rows.map((row, idx) => (
                  <Link
                    key={row.id}
                    href={`/admin/collections/benefits/${row.id}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 80px 80px 30px',
                      alignItems: 'center',
                      padding: '13px 20px',
                      borderBottom:
                        idx === bucket.rows.length - 1 ? 'none' : `1px solid ${RM.rule}`,
                      fontSize: 13,
                      textDecoration: 'none',
                      color: 'inherit',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: RM.fDisplay,
                        fontSize: 16,
                        color: RM.teal,
                        fontWeight: 400,
                      }}
                    >
                      {row.name}
                    </span>
                    <span
                      style={{
                        fontFamily: RM.fMono,
                        fontSize: 12,
                        color: RM.inkSoft,
                        textAlign: 'right',
                      }}
                    >
                      {row.plantCount == null ? '— pl.' : `${row.plantCount} pl.`}
                    </span>
                    <span
                      style={{
                        fontFamily: RM.fMono,
                        fontSize: 12,
                        color: RM.inkSoft,
                        textAlign: 'right',
                      }}
                    >
                      {row.articleCount == null ? '— art.' : `${row.articleCount} art.`}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        color: RM.inkSoft,
                      }}
                    >
                      <ChevronRight size={16} />
                    </span>
                  </Link>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BenefitsListClient
