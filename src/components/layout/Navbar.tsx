'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { DEFAULT_NAVIGATION, type NavigationData } from '@/lib/layoutGlobals'

type SearchResult = { title: string; slug: string; type: string; excerpt?: string }
type SearchResults = { plants: SearchResult[]; articles: SearchResult[]; benefits: SearchResult[] }

type NavbarProps = { dict: any; locale: string; navigation?: NavigationData }

// Prefix a CMS-provided href with the current locale when it's a relative path.
function localizeHref(href: string, locale: string): string {
  if (!href) return `/${locale}`
  if (/^(https?:)?\/\//i.test(href)) return href
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return href
  const normalized = href.startsWith('/') ? href : `/${href}`
  // Avoid double-prefixing if editor already included the locale.
  if (normalized === `/${locale}` || normalized.startsWith(`/${locale}/`)) return normalized
  return `/${locale}${normalized}`
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function MenuIcon({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="13" x2="21" y2="13" />
      <line x1="3" y1="19" x2="21" y2="19" />
    </svg>
  )
}

export function Navbar({ dict, locale, navigation }: NavbarProps) {
  const nav = navigation ?? DEFAULT_NAVIGATION
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({ plants: [], articles: [], benefits: [] })
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (searchQuery.length < 2) {
      setResults({ plants: [], articles: [], benefits: [] })
      setIsOpen(false)
      return
    }
    setIsOpen(true)
    debounceRef.current = setTimeout(() => fetchResults(searchQuery, setResults, setIsLoading), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery, fetchResults])

  useEffect(() => {
    if (mobileDebounceRef.current) clearTimeout(mobileDebounceRef.current)
    if (mobileQuery.length < 2) {
      setMobileResults({ plants: [], articles: [], benefits: [] })
      return
    }
    mobileDebounceRef.current = setTimeout(() => fetchResults(mobileQuery, setMobileResults, setMobileLoading), 300)
    return () => { if (mobileDebounceRef.current) clearTimeout(mobileDebounceRef.current) }
  }, [mobileQuery, fetchResults])

  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) mobileInputRef.current.focus()
  }, [mobileSearchOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setMobileSearchOpen(false)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    function handleOpenMobileSearch() { setMobileSearchOpen(true) }
    window.addEventListener('open-mobile-search', handleOpenMobileSearch)
    return () => window.removeEventListener('open-mobile-search', handleOpenMobileSearch)
  }, [])

  const navLinks = nav.links.map((link) => ({
    label: link.label,
    href: localizeHref(link.href, locale),
    openInNewTab: Boolean(link.openInNewTab),
  }))

  const ctaEnabled = Boolean(nav.ctaButton?.enabled)
  const ctaLabel = nav.ctaButton?.label || 'Boutique'
  const ctaHref = localizeHref(nav.ctaButton?.href || '/produits', locale)
  const ctaStyle = nav.ctaButton?.style || 'primary'
  const ctaClasses =
    ctaStyle === 'ghost'
      ? 'inline-flex items-center justify-center px-4 py-2 rounded-full border border-rm-ruleStrong bg-transparent text-rm-teal hover:border-rm-burgundy hover:text-rm-burgundy transition-colors font-sans text-[13px] font-medium tracking-[0.01em]'
      : 'inline-flex items-center justify-center px-4 py-2 rounded-full bg-rm-burgundy text-white hover:bg-rm-burgundy/90 transition-colors font-sans text-[13px] font-medium tracking-[0.01em]'

  const hasResults = (r: SearchResults) => r.plants.length > 0 || r.articles.length > 0 || r.benefits.length > 0

  function ResultsList({ data, onNavigate }: { data: SearchResults; onNavigate?: () => void }) {
    return (
      <>
        {data.plants.length > 0 && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold text-rm-teal uppercase tracking-[0.18em] mb-1 font-sans">Plantes</p>
            {data.plants.map((item) => (
              <Link key={item.slug} href={`/${locale}/plantes/${item.slug}`} onClick={onNavigate}
                className="block px-2 py-1.5 text-sm text-rm-inkSoft hover:bg-rm-creamSoft rounded transition-colors">
                <span className="font-medium font-sans">{item.title}</span>
                {item.excerpt && <span className="ml-1 text-xs text-rm-ochre font-serif italic">{item.excerpt}</span>}
              </Link>
            ))}
          </div>
        )}
        {data.articles.length > 0 && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold text-rm-teal uppercase tracking-[0.18em] mb-1 font-sans">Journal</p>
            {data.articles.map((item) => (
              <Link key={item.slug} href={`/${locale}/blog/${item.slug}`} onClick={onNavigate}
                className="block px-2 py-1.5 text-sm text-rm-inkSoft hover:bg-rm-creamSoft rounded transition-colors">
                <span className="font-medium font-sans">{item.title}</span>
                {item.excerpt && <p className="text-xs text-rm-inkSoft/70 truncate font-serif">{item.excerpt}</p>}
              </Link>
            ))}
          </div>
        )}
        {data.benefits.length > 0 && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold text-rm-teal uppercase tracking-[0.18em] mb-1 font-sans">Bienfaits</p>
            {data.benefits.map((item) => (
              <Link key={item.slug} href={`/${locale}/bienfaits/${item.slug}`} onClick={onNavigate}
                className="block px-2 py-1.5 text-sm text-rm-inkSoft hover:bg-rm-creamSoft rounded transition-colors">
                <span className="font-medium font-sans">{item.title}</span>
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
      <header className="sticky top-0 z-40 hidden lg:block border-b border-rm-rule bg-[rgba(254,249,233,0.92)] backdrop-blur-md backdrop-saturate-150">
        <nav className="max-w-[1280px] mx-auto px-10 py-3.5 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="flex items-center gap-3">
            <Link href={`/${locale}`} aria-label={dict.meta.siteName} className="flex items-center gap-2.5 shrink-0">
              <img
                src="/assets/brand/rm-hero-illustration.png"
                alt=""
                aria-hidden="true"
                width={46}
                height={46}
                className="h-[44px] w-auto object-contain"
              />
              <img
                src="/assets/brand/rm-logo.png"
                alt={dict.meta.siteName}
                width={64}
                height={46}
                className="h-[38px] w-auto object-contain"
              />
            </Link>
          </div>

          {/* Center Nav */}
          <div className="flex gap-[30px]">
            {navLinks.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                target={link.openInNewTab ? '_blank' : undefined}
                rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                className="font-sans text-sm font-medium text-rm-teal hover:text-rm-burgundy transition-colors tracking-[0.01em]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search pill + CTA */}
          <div className="justify-self-end flex items-center gap-3" ref={searchRef}>
            {ctaEnabled && (
              <Link href={ctaHref} className={ctaClasses}>
                {ctaLabel}
              </Link>
            )}
            <div className="relative">
              <div className="flex items-center gap-2 px-3 py-2 border border-rm-ruleStrong rounded-full bg-rm-paper min-w-[230px] focus-within:border-rm-burgundy focus-within:ring-2 focus-within:ring-rm-burgundy/15 transition-colors">
                <SearchIcon className="text-rm-inkSoft shrink-0" />
                <input
                  ref={searchInputRef}
                  suppressHydrationWarning
                  type="text"
                  placeholder="Rechercher une plante…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchQuery.length >= 2) setIsOpen(true) }}
                  className="flex-1 bg-transparent font-sans text-[13px] text-rm-teal placeholder:text-rm-inkSoft focus:outline-none"
                />
                <span className="font-mono text-[11px] text-rm-inkSoft border border-rm-ruleStrong px-1.5 py-[1px] rounded leading-none">⌘K</span>
              </div>

              {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-rm-cream shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-lg border border-rm-ruleStrong overflow-hidden z-50">
                  {isLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-rm-inkSoft/70 font-serif italic">Recherche…</div>
                  ) : hasResults(results) ? (
                    <div className="max-h-80 overflow-y-auto py-1">
                      <ResultsList data={results} onNavigate={() => { setIsOpen(false); setSearchQuery('') }} />
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="px-4 py-6 text-center text-sm text-rm-inkSoft/70 font-serif italic">Aucun résultat</div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* ── Mobile Navbar ── */}
      <header className="sticky top-0 z-40 lg:hidden border-b border-rm-rule bg-[rgba(254,249,233,0.92)] backdrop-blur-md">
        <nav className="px-4 h-14 flex items-center justify-between">
          <button type="button" aria-label={mobileMenuOpen ? dict.common.close : 'Menu'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-md text-rm-teal">
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          <Link href={`/${locale}`} aria-label={dict.meta.siteName} className="flex items-center gap-1.5">
            <img
              src="/assets/brand/rm-hero-illustration.png"
              alt=""
              aria-hidden="true"
              width={36}
              height={36}
              className="h-[34px] w-auto object-contain"
            />
            <img
              src="/assets/brand/rm-logo.png"
              alt={dict.meta.siteName}
              width={48}
              height={34}
              className="h-[30px] w-auto object-contain"
            />
          </Link>

          <button type="button" aria-label={dict.nav.search}
            onClick={() => setMobileSearchOpen(true)} className="p-2 hover:bg-rm-creamSoft rounded-full transition-colors text-rm-teal">
            <SearchIcon />
          </button>
        </nav>
      </header>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-rm-cream lg:hidden">
          <div className="flex items-center gap-2 px-4 h-14 border-b border-rm-ruleStrong">
            <SearchIcon className="text-rm-inkSoft shrink-0" />
            <input ref={mobileInputRef} type="text" placeholder="Rechercher…" value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              className="flex-1 h-10 font-sans text-sm text-rm-teal placeholder:text-rm-inkSoft bg-transparent focus:outline-none" />
            <button type="button" aria-label={dict.common?.close || 'Fermer'}
              onClick={() => { setMobileSearchOpen(false); setMobileQuery(''); setMobileResults({ plants: [], articles: [], benefits: [] }) }}
              className="p-2 hover:bg-rm-creamSoft rounded-full transition-colors text-rm-teal">
              <CloseIcon />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-56px)]">
            {mobileLoading ? (
              <div className="px-4 py-8 text-center text-sm text-rm-inkSoft/70 font-serif italic">Recherche…</div>
            ) : hasResults(mobileResults) ? (
              <ResultsList data={mobileResults} onNavigate={() => { setMobileSearchOpen(false); setMobileQuery(''); setMobileResults({ plants: [], articles: [], benefits: [] }) }} />
            ) : mobileQuery.length >= 2 ? (
              <div className="px-4 py-8 text-center text-sm text-rm-inkSoft/70 font-serif italic">Aucun résultat</div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-rm-inkSoft/50 font-serif italic">Tapez au moins 2 caractères</div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[56px] z-40 bg-rm-cream lg:hidden">
          <nav className="flex flex-col p-6 gap-1">
            {navLinks.map((link) => (
              <Link
                key={`m-${link.label}-${link.href}`}
                href={link.href}
                target={link.openInNewTab ? '_blank' : undefined}
                rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className="font-sans text-base font-medium text-rm-teal hover:text-rm-burgundy py-3 px-4 rounded hover:bg-rm-creamSoft transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {ctaEnabled && (
              <Link
                href={ctaHref}
                onClick={() => setMobileMenuOpen(false)}
                className="mt-3 inline-flex items-center justify-center px-4 py-3 rounded-full bg-rm-burgundy text-white hover:bg-rm-burgundy/90 transition-colors font-sans text-sm font-medium"
              >
                {ctaLabel}
              </Link>
            )}
            <hr className="my-3 border-rm-ruleStrong" />
            <Link href={`/${locale}/contact`} onClick={() => setMobileMenuOpen(false)}
              className="font-sans text-base font-medium text-rm-teal hover:text-rm-burgundy py-3 px-4 rounded hover:bg-rm-creamSoft transition-colors">
              {dict.nav.contact || 'Contact'}
            </Link>
            <Link href={`/${locale}/faq`} onClick={() => setMobileMenuOpen(false)}
              className="font-sans text-base font-medium text-rm-teal hover:text-rm-burgundy py-3 px-4 rounded hover:bg-rm-creamSoft transition-colors">
              FAQ
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
