'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNav, useAuth } from '@payloadcms/ui'
import {
  Sprout,
  Heart,
  FileText,
  Package,
  File as FileIcon,
  Image as ImageIcon,
  Users,
  User,
  BookOpen,
  LayoutDashboard,
  Settings,
  PanelLeftOpen,
  FileStack,
  Menu,
  PanelBottom,
} from 'lucide-react'
import { RM } from '@/components/admin/primitives/tokens'

type NavItem = {
  id: string
  label: string
  icon: React.ComponentType<{ width?: number | string; height?: number | string; style?: React.CSSProperties }>
  href: string
  collection?: string
  count?: number
}

type NavGroup = {
  id: string
  title: string
  items: NavItem[]
}

const navigationGroups: NavGroup[] = [
  {
    id: 'edition',
    title: 'Édition',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, href: '/admin' },
      { id: 'plantes', label: 'Plantes', icon: Sprout, href: '/admin/collections/wikiEntries', collection: 'wikiEntries' },
      { id: 'articles', label: 'Articles', icon: FileText, href: '/admin/collections/blogPosts', collection: 'blogPosts' },
      { id: 'bienfaits', label: 'Bienfaits', icon: Heart, href: '/admin/collections/benefits', collection: 'benefits' },
      { id: 'produits', label: 'Produits', icon: Package, href: '/admin/collections/products', collection: 'products' },
      { id: 'pages', label: 'Landing pages', icon: FileIcon, href: '/admin/collections/pages', collection: 'pages' },
      { id: 'site-pages', label: 'Pages du site', icon: FileStack, href: '/admin/collections/sitePages', collection: 'sitePages' },
      { id: 'navigation', label: 'Navigation', icon: Menu, href: '/admin/globals/navigation' },
      { id: 'footer', label: 'Pied de page', icon: PanelBottom, href: '/admin/globals/footer' },
      { id: 'medias', label: 'Médias', icon: ImageIcon, href: '/admin/collections/media', collection: 'media' },
    ],
  },
  {
    id: 'maison',
    title: 'Maison',
    items: [
      { id: 'utilisateurs', label: 'Utilisateurs', icon: Users, href: '/admin/collections/users', collection: 'users' },
      { id: 'auteurs', label: 'Auteurs', icon: User, href: '/admin/collections/authors', collection: 'authors' },
      { id: 'parametres', label: 'Paramètres', icon: Settings, href: '/admin/settings' },
      { id: 'journal', label: "Journal d'audit", icon: BookOpen, href: '/admin/collections/auditLog', collection: 'auditLog' },
    ],
  },
]

const STORAGE_KEY = 'rdm-admin-nav-open'

const NavLinkRow: React.FC<{ item: NavItem; isActive: boolean }> = ({ item, isActive }) => {
  const Icon = item.icon
  const [hover, setHover] = useState(false)
  const bg = isActive ? RM.burgundy : hover ? 'rgba(255,255,255,0.06)' : 'transparent'
  const color = isActive ? '#fff' : RM.creamSoft

  return (
    <Link
      href={item.href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        fontSize: 13,
        fontFamily: RM.fSans,
        fontWeight: isActive ? 600 : 400,
        background: bg,
        color,
        borderRadius: 6,
        marginBottom: 2,
        textDecoration: 'none',
        transition: 'background-color 0.15s ease, color 0.15s ease',
      }}
    >
      <Icon width={15} height={15} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.count !== undefined && item.count > 0 && (
        <span style={{ fontFamily: RM.fMono, fontSize: 10, opacity: 0.7 }}>{item.count}</span>
      )}
    </Link>
  )
}

const Nav: React.FC = () => {
  const pathname = usePathname() || ''
  const { navOpen, setNavOpen, navRef } = useNav()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [openerHover, setOpenerHover] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw !== null) {
        const parsed = JSON.parse(raw)
        if (typeof parsed === 'boolean') setNavOpen(parsed)
      }
    } catch {}
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/nav-counts', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (!cancelled) setCounts(data || {})
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(navOpen))
    } catch {}
  }, [navOpen, mounted])

  const userName =
    (user as any)?.firstName && (user as any)?.lastName
      ? `${(user as any).firstName} ${(user as any).lastName}`
      : (user as any)?.email?.split('@')[0] || 'Admin'
  const userRole =
    (user as any)?.role === 'admin'
      ? 'Admin'
      : (user as any)?.role === 'editor'
        ? 'Éditrice'
        : 'Contributrice'
  const initials = userName
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const isItemActive = (href: string) => {
    if (href === '#') return false
    if (href === '/admin') return pathname === '/admin' || pathname === '/admin/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {!navOpen && (
        <button
          suppressHydrationWarning
          type="button"
          aria-label="Ouvrir le menu"
          onClick={() => setNavOpen(true)}
          onMouseEnter={() => setOpenerHover(true)}
          onMouseLeave={() => setOpenerHover(false)}
          style={{
            position: 'fixed',
            top: 14,
            left: 14,
            zIndex: 50,
            width: 40,
            height: 40,
            borderRadius: 10,
            border: 'none',
            background: openerHover ? RM.burgundyDark : RM.burgundy,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.18)',
            transition: 'background-color 0.15s ease, transform 0.15s ease',
            transform: openerHover ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <PanelLeftOpen size={18} />
        </button>
      )}
      <aside
        ref={navRef as React.RefObject<HTMLElement>}
        {...(!navOpen ? { 'aria-hidden': 'true' as const } : {})}
        style={{
          // Spacer in Payload's flex layout — reserves the column width so the
          // main content area doesn't creep left when the inner nav goes
          // position: fixed.
          width: navOpen ? 248 : 0,
          minWidth: navOpen ? 248 : 0,
          flexShrink: 0,
          transition: 'width 0.25s ease, min-width 0.25s ease',
          zIndex: 40,
        }}
      >
      <div
        style={{
          // The actual floating sidebar — fixed to the viewport so it never
          // scrolls with page content.
          position: 'fixed',
          top: 0,
          left: 0,
          width: navOpen ? 248 : 0,
          height: '100vh',
          background: RM.teal,
          color: RM.cream,
          padding: navOpen ? '24px 16px' : 0,
          fontFamily: RM.fSans,
          zIndex: 40,
          overflow: 'hidden',
          boxSizing: 'border-box',
          transition: 'width 0.25s ease, padding 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '4px 8px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <img
            src="/assets/brand/rm-logo.png"
            alt="Les Remèdes de Mamie"
            width={64}
            height={46}
            style={{ width: 64, height: 46, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
          />
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: RM.creamSoft,
              opacity: 0.7,
              textTransform: 'uppercase',
            }}
          >
            CMS · v2.4
          </div>
        </div>

        {/* Groups */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {navigationGroups.map((group, gIdx) => (
            <div key={group.id}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: 2.5,
                  color: RM.creamSoft,
                  opacity: 0.5,
                  textTransform: 'uppercase',
                  padding: gIdx === 0 ? '14px 12px 8px' : '22px 12px 8px',
                }}
              >
                {group.title}
              </div>
              {group.items.map((item) => {
                const liveCount = item.collection ? (counts[item.collection] ?? 0) : 0
                return (
                  <NavLinkRow
                    key={item.id}
                    item={{ ...item, count: liveCount }}
                    isActive={isItemActive(item.href)}
                  />
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer user card */}
        {navOpen && (
          <div
            style={{
              marginTop: 12,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                background: RM.ochre,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ fontSize: 12, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  color: RM.cream,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {userName}
              </div>
              <div style={{ color: RM.creamSoft, opacity: 0.6, fontSize: 11 }}>{userRole}</div>
            </div>
          </div>
        )}
      </div>
      </aside>
    </>
  )
}

export default Nav
