'use client'

import Link from 'next/link'
import { useState } from 'react'

type NavbarProps = { dict: any; locale: string }

export function Navbar({ dict, locale }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: dict.nav.wiki, href: `/${locale}/plantes` },
    { label: dict.nav.blog, href: `/${locale}/blog` },
    { label: dict.nav.benefits || 'Bienfaits', href: `/${locale}/bienfaits` },
    { label: dict.nav.about, href: `/${locale}/a-propos` },
  ]

  return (
    <>
      {/* ── Desktop Navbar ── */}
      <header className="sticky top-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] z-40 hidden lg:block">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="text-base font-bold text-[#A2211E] font-heading">
            {dict.meta.siteName}
          </Link>

          {/* Center Links */}
          <div className="flex gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#1F2937] hover:text-[#A2211E] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: Search + Contact */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <Link
              href={`/${locale}/recherche`}
              aria-label={dict.nav.search}
              className="p-2 hover:bg-[#FEF2F2] rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1F2937]">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Link>

            {/* Contact */}
            <Link
              href={`/${locale}/contact`}
              aria-label={dict.nav.contact || 'Contact'}
              className="p-2 hover:bg-[#FEF2F2] rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1F2937]">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </Link>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1F2937]">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1F2937]">
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

          {/* Search */}
          <Link
            href={`/${locale}/recherche`}
            aria-label={dict.nav.search}
            className="p-2 hover:bg-[#FEF2F2] rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1F2937]">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[56px] z-40 bg-white lg:hidden">
          <nav className="flex flex-col p-6 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-[#1F2937] hover:text-[#A2211E] py-3 px-4 rounded-lg hover:bg-[#FEF2F2] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-3 border-[#E5E7EB]" />
            <Link
              href={`/${locale}/contact`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[#1F2937] hover:text-[#A2211E] py-3 px-4 rounded-lg hover:bg-[#FEF2F2] transition-colors"
            >
              {dict.nav.contact || 'Contact'}
            </Link>
            <Link
              href={`/${locale}/faq`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[#1F2937] hover:text-[#A2211E] py-3 px-4 rounded-lg hover:bg-[#FEF2F2] transition-colors"
            >
              FAQ
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
