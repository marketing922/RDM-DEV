'use client'

import { useMemo, useState } from 'react'
import { ProductCard } from '@/components/shared/ProductCard'

type Product = {
  id: string | number
  name: string
  slug?: string
  sku?: string
  price: number
  compareAtPrice?: number
  shortDescription?: string
  images?: any[]
  externalImageUrl?: string
  format?: string
  weight?: string
  inStock?: boolean
  amazonUrl?: string
  temuUrl?: string
  tags?: any[]
  benefits?: any[]
  createdAt?: string
}

type FilterKey = 'all' | 'tisane' | 'poudre' | 'gelule' | 'promo'
type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'name'

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Tous' },
  { key: 'tisane', label: 'Tisanes' },
  { key: 'poudre', label: 'Poudres' },
  { key: 'gelule', label: 'G\u00e9lules' },
  { key: 'promo', label: 'Promotions' },
]

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'popular', label: 'Populaire' },
  { key: 'price-asc', label: 'Prix croissant' },
  { key: 'price-desc', label: 'Prix d\u00e9croissant' },
  { key: 'name', label: 'Nom (A-Z)' },
]

const PAGE_SIZE = 12

function matchesFilter(p: Product, key: FilterKey): boolean {
  if (key === 'all') return true
  if (key === 'promo') return !!p.compareAtPrice && p.compareAtPrice > p.price
  return p.format === key
}

function sortProducts(products: Product[], key: SortKey): Product[] {
  const copy = [...products]
  switch (key) {
    case 'price-asc':
      return copy.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return copy.sort((a, b) => b.price - a.price)
    case 'name':
      return copy.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fr'))
    case 'popular':
    default:
      return copy
  }
}

export function ProductsCatalog({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('popular')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const fs = products.filter((p) => matchesFilter(p, filter))
    return sortProducts(fs, sort)
  }, [products, filter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {FILTERS.map((f) => {
            const isActive = filter === f.key
            return (
              <button
                key={f.key}
                suppressHydrationWarning
                type="button"
                onClick={() => {
                  setFilter(f.key)
                  setPage(1)
                }}
                className={`inline-flex items-center h-9 px-5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#A2211E] text-white shadow-sm'
                    : 'bg-white text-[#712E2F] border border-[#DCD8C7] hover:bg-[#FFF5D5] hover:text-[#A2211E] hover:border-[#A2211E]'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="sort-select" className="font-medium text-[#712E2F]/70">
            Trier&nbsp;:
          </label>
          <div className="relative">
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortKey)
                setPage(1)
              }}
              className="h-9 appearance-none rounded-lg border border-[#DCD8C7] bg-white pl-4 pr-9 text-sm font-medium text-[#712E2F] focus:border-[#A2211E] focus:outline-none focus:ring-2 focus:ring-[#A2211E]/30"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#712E2F]"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-12 flex items-center justify-center gap-2"
            >
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Page pr\u00e9c\u00e9dente"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm bg-white border border-[#DCD8C7] text-[#712E2F] hover:bg-[#FFF5D5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1
                const isActive = n === currentPage
                return (
                  <button
                    key={n}
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setPage(n)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium ${
                      isActive
                        ? 'bg-[#A2211E] text-white'
                        : 'bg-white border border-[#DCD8C7] text-[#712E2F] hover:bg-[#FFF5D5]'
                    }`}
                  >
                    {n}
                  </button>
                )
              })}

              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Page suivante"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm bg-white border border-[#DCD8C7] text-[#712E2F] hover:bg-[#FFF5D5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="mx-auto max-w-md rounded-2xl bg-white p-12 text-center border border-[#DCD8C7]">
          <p className="text-lg font-medium text-[#712E2F]">Aucun produit dans cette cat\u00e9gorie</p>
          <p className="mt-2 text-sm text-[#712E2F]/70">
            Essayez un autre filtre pour d\u00e9couvrir notre s\u00e9lection.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter('all')
              setPage(1)
            }}
            className="mt-4 inline-flex items-center h-9 px-5 rounded-full bg-[#A2211E] text-sm font-medium text-white hover:bg-[#8a1c1a] shadow-sm"
          >
            Voir tous les produits
          </button>
        </div>
      )}
    </>
  )
}
