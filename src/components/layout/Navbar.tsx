'use client'

import Link from 'next/link'
import { useState } from 'react'

type NavbarProps = { dict: any; locale: string }

export function Navbar({ dict, locale }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: dict.nav.wiki, href: `/${locale}/plantes` },
    { label: dict.nav.blog, href: `/${locale}/blog` },
    { label: dict.nav.about, href: `/${locale}/a-propos` },
  ]

  return (
    <>
      <header className="sticky top-0 z-sticky bg-white/95 backdrop-blur-md shadow-nav">
        {/* Desktop Navbar */}
        <nav className="hidden lg:flex items-center justify-between h-[64px] max-w-7xl mx-auto px-lg">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="font-heading text-h5 text-brand whitespace-nowrap"
          >
            {dict.meta.siteName}
          </Link>

          {/* Center Links */}
          <ul className="flex items-center gap-xl">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-ui text-body-sm text-neutral-500 hover:text-brand transition-colors duration-fast"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Icons */}
          <div className="flex items-center gap-md">
            {/* Search */}
            <Link
              href={`/${locale}/recherche`}
              aria-label={dict.nav.search}
              className="w-[44px] h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors duration-fast"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Link>

            {/* Contact */}
            <Link
              href={`/${locale}/contact`}
              aria-label={dict.nav.contact || 'Contact'}
              className="w-[44px] h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors duration-fast"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </Link>
          </div>
        </nav>

        {/* Mobile Navbar */}
        <nav className="flex lg:hidden items-center justify-between h-[56px] px-md">
          {/* Hamburger */}
          <button
            aria-label={mobileMenuOpen ? dict.common.close : 'Menu'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-[44px] h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors duration-fast"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          {/* Logo center */}
          <Link
            href={`/${locale}`}
            className="font-heading text-h6 text-brand"
          >
            {dict.meta.siteName}
          </Link>

          {/* Search */}
          <Link
            href={`/${locale}/recherche`}
            aria-label={dict.nav.search}
            className="w-[44px] h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors duration-fast"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[56px] z-overlay bg-white/95 backdrop-blur-md lg:hidden">
          <nav className="flex flex-col p-lg gap-xs">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-ui text-body-lg text-neutral-500 hover:text-brand py-sm px-md rounded-lg hover:bg-neutral-50 transition-colors duration-fast"
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-md border-neutral-100" />
            <Link
              href={`/${locale}/contact`}
              onClick={() => setMobileMenuOpen(false)}
              className="font-ui text-body-lg text-neutral-500 hover:text-brand py-sm px-md rounded-lg hover:bg-neutral-50 transition-colors duration-fast"
            >
              {dict.nav.contact || 'Contact'}
            </Link>
            <Link
              href={`/${locale}/faq`}
              onClick={() => setMobileMenuOpen(false)}
              className="font-ui text-body-lg text-neutral-500 hover:text-brand py-sm px-md rounded-lg hover:bg-neutral-50 transition-colors duration-fast"
            >
              {dict.nav.faq || 'FAQ'}
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
