'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

type Props = {
  initialSearch: string
  placeholder?: string
}

export default function BlogSearch({
  initialSearch,
  placeholder = 'Rechercher un article…',
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

  const pushSearch = (value: string) => {
    const params = new URLSearchParams(sp?.toString() ?? '')
    if (value.trim()) params.set('q', value.trim())
    else params.delete('q')
    params.delete('page') // reset pagination on new search
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  const onSearchChange = (value: string) => {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (value === lastPushedRef.current) return
      lastPushedRef.current = value
      pushSearch(value)
    }, 300)
  }

  const clearSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchValue('')
    lastPushedRef.current = ''
    pushSearch('')
  }

  return (
    <div className="relative max-w-xl mx-auto mb-8">
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
        placeholder={placeholder}
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
  )
}
