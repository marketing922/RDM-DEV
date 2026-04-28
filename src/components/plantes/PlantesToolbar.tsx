'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

type Filter = { key: string; label: string }

type Props = {
  initialSearch: string
  initialFilter: string
  filters: Filter[]
  searchPlaceholder: string
}

export default function PlantesToolbar({
  initialSearch,
  initialFilter,
  filters,
  searchPlaceholder,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const [searchValue, setSearchValue] = useState(initialSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPushedRef = useRef(initialSearch)

  useEffect(() => {
    if (initialSearch !== lastPushedRef.current) {
      setSearchValue(initialSearch)
      lastPushedRef.current = initialSearch
    }
  }, [initialSearch])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const buildUrl = (updates: Record<string, string | null>) => {
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

  const onSearchChange = (value: string) => {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (value === lastPushedRef.current) return
      lastPushedRef.current = value
      router.replace(buildUrl({ q: value.trim() ? value.trim() : null }))
    }, 300)
  }

  const clearSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchValue('')
    lastPushedRef.current = ''
    router.replace(buildUrl({ q: null }))
  }

  const setFilter = (key: string) => {
    router.replace(buildUrl({ filter: key === 'all' ? null : key }))
  }

  return (
    <>
      {/* Search bar */}
      <div className="mb-8 flex justify-center">
        <div className="relative w-full max-w-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-rm-inkSoft/60 pointer-events-none"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            suppressHydrationWarning
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-12 pl-12 pr-12 bg-rm-paper border border-rm-ruleStrong text-rm-teal placeholder:text-rm-inkSoft/50 font-serif focus:outline-none focus:border-rm-burgundy transition-colors"
          />
          {searchValue && (
            <button
              suppressHydrationWarning
              type="button"
              onClick={clearSearch}
              aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-rm-inkSoft/60 hover:text-rm-burgundy transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-8 sm:mb-10 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-hide">
        <div className="flex sm:flex-wrap sm:justify-center gap-2 min-w-max sm:min-w-0">
          {filters.map((f) => {
            const isActive = f.key === initialFilter
            return (
              <button
                key={f.key}
                suppressHydrationWarning
                type="button"
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center h-10 sm:h-9 px-4 sm:px-5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
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
      </div>
    </>
  )
}
