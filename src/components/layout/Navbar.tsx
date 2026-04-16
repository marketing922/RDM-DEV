'use client'

import Link from 'next/link'
import { useState } from 'react'

type NavbarProps = { dict: any; locale: string }

export function Navbar({ dict, locale }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: dict.nav.shop, href: `/${locale}/boutique` },
    { label: dict.nav.wiki, href: `/${locale}/wiki` },
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
            <button
              aria-label={dict.nav.search}
              className="w-[44px] h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors duration-fast"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Favorites */}
            <button
              aria-label={dict.nav.favorites}
              className="w-[44px] h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors duration-fast"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            {/* Cart with badge */}
            <Link
              href={`/${locale}/panier`}
              aria-label={dict.nav.cart}
              className="relative w-[44px] h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors duration-fast"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 bg-brand text-white text-[10px] font-ui font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Account */}
            <Link
              href={`/${locale}/compte`}
              aria-label={dict.nav.account}
              className="w-[44px] h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors duration-fast"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
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

          {/* Search + Cart */}
          <div className="flex items-center gap-2xs">
            <button
              aria-label={dict.nav.search}
              className="w-[44px] h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors duration-fast"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            <Link
              href={`/${locale}/panier`}
              aria-label={dict.nav.cart}
              className="relative w-[44px] h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors duration-fast"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 bg-brand text-white text-[10px] font-ui font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                0
              </span>
            </Link>
          </div>
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
              href={`/${locale}/compte`}
              onClick={() => setMobileMenuOpen(false)}
              className="font-ui text-body-lg text-neutral-500 hover:text-brand py-sm px-md rounded-lg hover:bg-neutral-50 transition-colors duration-fast"
            >
              {dict.nav.account}
            </Link>
            <Link
              href={`/${locale}/favoris`}
              onClick={() => setMobileMenuOpen(false)}
              className="font-ui text-body-lg text-neutral-500 hover:text-brand py-sm px-md rounded-lg hover:bg-neutral-50 transition-colors duration-fast"
            >
              {dict.nav.favorites}
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
