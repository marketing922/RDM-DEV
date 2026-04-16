'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'

type SearchResult = { title: string; slug: string; type: string; excerpt?: string }
type SearchResults = { plants: SearchResult[]; articles: SearchResult[]; benefits: SearchResult[] }

type NavbarProps = { dict: any; locale: string }

export function Navbar({ dict, locale }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // --- Desktop search state ---
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({ plants: [], articles: [], benefits: [] })
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Mobile search state ---
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileQuery, setMobileQuery] = useState('')
  const [mobileResults, setMobileResults] = useState<SearchResults>({ plants: [], articles: [], benefits: [] })
  const [mobileLoading, setMobileLoading] = useState(false)
  const mobileDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  const fetchResults = useCallback(async (q: string, setRes: (r: SearchResults) => void, setLoad: (l: boolean) => void) => {
    if (q.length < 2) {
      setRes({ plants: [], articles: [], benefits: [] })
      setLoad(false)
      return
    }
    setLoad(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=${locale}`)
      const data = await res.json()
      setRes(data)
    } catch {
      setRes({ plants: [], articles: [], benefits: [] })
    } finally {
      setLoad(false)
    }
  }, [locale])

  // Desktop debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (searchQuery.length < 2) {
      setResults({ plants: [], articles: [], benefits: [] })
      setIsOpen(false)
      return
    }
    setIsOpen(true)
    debounceRef.current = setTimeout(() => {
      fetchResults(searchQuery, setResults, setIsLoading)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery, fetchResults])

  // Mobile debounce
  useEffect(() => {
    if (mobileDebounceRef.current) clearTimeout(mobileDebounceRef.current)
    if (mobileQuery.length < 2) {
      setMobileResults({ plants: [], articles: [], benefits: [] })
      return
    }
    mobileDebounceRef.current = setTimeout(() => {
      fetchResults(mobileQuery, setMobileResults, setMobileLoading)
    }, 300)
    return () => { if (mobileDebounceRef.current) clearTimeout(mobileDebounceRef.current) }
  }, [mobileQuery, fetchResults])

  // Focus mobile input when overlay opens
  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus()
    }
  }, [mobileSearchOpen])

  // Close desktop dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setMobileSearchOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Listen for mobile search open event from MobileNav
  useEffect(() => {
    function handleOpenMobileSearch() {
      setMobileSearchOpen(true)
    }
    window.addEventListener('open-mobile-search', handleOpenMobileSearch)
    return () => window.removeEventListener('open-mobile-search', handleOpenMobileSearch)
  }, [])

  const navLinks = [
    { label: dict.nav.wiki, href: `/${locale}/plantes` },
    { label: dict.nav.blog, href: `/${locale}/blog` },
    { label: dict.nav.benefits || 'Bienfaits', href: `/${locale}/bienfaits` },
    { label: dict.nav.about, href: `/${locale}/a-propos` },
  ]

  const hasResults = (r: SearchResults) =>
    r.plants.length > 0 || r.articles.length > 0 || r.benefits.length > 0

  function ResultsList({ data, onNavigate }: { data: SearchResults; onNavigate?: () => void }) {
    return (
      <>
        {data.plants.length > 0 && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs font-semibold text-[#054A57] uppercase tracking-wide mb-1">Plantes</p>
            {data.plants.map((item) => (
              <Link
                key={item.slug}
                href={`/${locale}/plantes/${item.slug}`}
                onClick={onNavigate}
                className="block px-2 py-1.5 text-sm text-[#712E2F] hover:bg-[#FEF9E9] rounded-lg transition-colors"
              >
                <span className="font-medium">{item.title}</span>
                {item.excerpt && <span className="ml-1 text-xs text-[#712E2F]/60 italic">{item.excerpt}</span>}
              </Link>
            ))}
          </div>
        )}
        {data.articles.length > 0 && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs font-semibold text-[#054A57] uppercase tracking-wide mb-1">Articles</p>
            {data.articles.map((item) => (
              <Link
                key={item.slug}
                href={`/${locale}/blog/${item.slug}`}
                onClick={onNavigate}
                className="block px-2 py-1.5 text-sm text-[#712E2F] hover:bg-[#FEF9E9] rounded-lg transition-colors"
              >
                <span className="font-medium">{item.title}</span>
                {item.excerpt && <p className="text-xs text-[#712E2F]/60 truncate">{item.excerpt}</p>}
              </Link>
            ))}
          </div>
        )}
        {data.benefits.length > 0 && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs font-semibold text-[#054A57] uppercase tracking-wide mb-1">Bienfaits</p>
            {data.benefits.map((item) => (
              <Link
                key={item.slug}
                href={`/${locale}/bienfaits/${item.slug}`}
                onClick={onNavigate}
                className="block px-2 py-1.5 text-sm text-[#712E2F] hover:bg-[#FEF9E9] rounded-lg transition-colors"
              >
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {/* ── Desktop Navbar ── */}
      <header className="sticky top-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] z-40 hidden lg:block">
        <nav className="max-w-7xl mx-auto px-6 h-16 grid grid-cols-[1fr_auto_1fr] items-center">
          {/* Logo — left */}
          <Link href={`/${locale}`} className="text-base font-bold text-[#A2211E] font-heading justify-self-start">
            {dict.meta.siteName}
          </Link>

          {/* Center Links */}
          <div className="flex gap-8 justify-self-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#054A57] hover:text-[#A2211E] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search bar — right */}
          <div className="justify-self-end" ref={searchRef}>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher une plante..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchQuery.length >= 2) setIsOpen(true) }}
                className="h-9 w-52 pl-9 pr-3 rounded-full border border-[#DCD8C7] bg-[#FEF9E9] text-sm text-[#054A57] placeholder:text-[#DCD8C7] focus:outline-none focus:border-[#A2211E] focus:ring-2 focus:ring-[#A2211E]/20 transition-colors"
              />

              {/* Dropdown */}
              {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white shadow-lg rounded-xl border border-[#DCD8C7] overflow-hidden transition-all z-50">
                  {isLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-[#712E2F]/60">
                      Recherche...
                    </div>
                  ) : hasResults(results) ? (
                    <div className="max-h-80 overflow-y-auto py-1">
                      <ResultsList data={results} onNavigate={() => { setIsOpen(false); setSearchQuery('') }} />
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="px-4 py-6 text-center text-sm text-[#712E2F]/60">
                      Aucun résultat
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* ── Mobile Navbar ── */}
      <header className="sticky top-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] z-40 lg:hidden">
        <nav className="px-4 h-14 flex items-center justify-between">
          {/* Hamburger */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? dict.common.close : 'Menu'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#054A57]">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#054A57]">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          {/* Logo center */}
          <Link href={`/${locale}`} className="text-sm font-bold text-[#A2211E] font-heading">
            {dict.meta.siteName}
          </Link>

          {/* Search toggle */}
          <button
            type="button"
            aria-label={dict.nav.search}
            onClick={() => setMobileSearchOpen(true)}
            className="p-2 hover:bg-[#FEF2F2] rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#054A57]">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </nav>
      </header>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white lg:hidden">
          <div className="flex items-center gap-2 px-4 h-14 border-b border-[#DCD8C7]">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9CA3AF] shrink-0">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={mobileInputRef}
              type="text"
              placeholder="Rechercher..."
              value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              className="flex-1 h-10 text-sm text-[#054A57] placeholder:text-[#DCD8C7] bg-transparent focus:outline-none"
            />
            <button
              type="button"
              aria-label={dict.common?.close || 'Fermer'}
              onClick={() => { setMobileSearchOpen(false); setMobileQuery(''); setMobileResults({ plants: [], articles: [], benefits: [] }) }}
              className="p-2 hover:bg-[#FEF2F2] rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#054A57]">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-56px)]">
            {mobileLoading ? (
              <div className="px-4 py-8 text-center text-sm text-[#712E2F]/60">
                Recherche...
              </div>
            ) : hasResults(mobileResults) ? (
              <ResultsList
                data={mobileResults}
                onNavigate={() => { setMobileSearchOpen(false); setMobileQuery(''); setMobileResults({ plants: [], articles: [], benefits: [] }) }}
              />
            ) : mobileQuery.length >= 2 ? (
              <div className="px-4 py-8 text-center text-sm text-[#712E2F]/60">
                Aucun résultat
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-[#712E2F]/40">
                Tapez au moins 2 caractères
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[56px] z-40 bg-white lg:hidden">
          <nav className="flex flex-col p-6 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-[#054A57] hover:text-[#A2211E] py-3 px-4 rounded-lg hover:bg-[#FEF2F2] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-3 border-[#DCD8C7]" />
            <Link
              href={`/${locale}/contact`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[#054A57] hover:text-[#A2211E] py-3 px-4 rounded-lg hover:bg-[#FEF2F2] transition-colors"
            >
              {dict.nav.contact || 'Contact'}
            </Link>
            <Link
              href={`/${locale}/faq`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[#054A57] hover:text-[#A2211E] py-3 px-4 rounded-lg hover:bg-[#FEF2F2] transition-colors"
            >
              FAQ
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
