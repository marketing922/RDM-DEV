'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useNav } from '@payloadcms/ui'
import {
  Leaf,
  Sprout,
  Heart,
  FileText,
  Package,
  File as FileIcon,
  Image as ImageIcon,
  FolderTree,
  Tag,
  Users,
  User,
  BookOpen,
  ExternalLink,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  PanelLeftOpen,
} from 'lucide-react'

type NavItem = {
  id: string
  name: string
  icon: React.ComponentType<{ size?: number | string; color?: string }>
  href: string
}

type NavGroup = {
  id: string
  title: string
  items: NavItem[]
}

const navigationGroups: NavGroup[] = [
  {
    id: 'content',
    title: 'Contenu',
    items: [
      { id: 'plantes', name: 'Plantes', icon: Sprout, href: '/admin/collections/wikiEntries' },
      { id: 'bienfaits', name: 'Bienfaits', icon: Heart, href: '/admin/collections/benefits' },
      { id: 'articles', name: 'Articles', icon: FileText, href: '/admin/collections/blogPosts' },
      { id: 'produits', name: 'Produits', icon: Package, href: '/admin/collections/products' },
      { id: 'pages', name: 'Pages', icon: FileIcon, href: '/admin/collections/pages' },
    ],
  },
  {
    id: 'media',
    title: 'Médias',
    items: [
      { id: 'medias', name: 'Médias', icon: ImageIcon, href: '/admin/collections/media' },
    ],
  },
  {
    id: 'taxonomy',
    title: 'Taxonomie',
    items: [
      { id: 'categories', name: 'Catégories', icon: FolderTree, href: '/admin/collections/categories' },
      { id: 'tags', name: 'Tags', icon: Tag, href: '/admin/collections/tags' },
    ],
  },
  {
    id: 'users',
    title: 'Utilisateurs',
    items: [
      { id: 'auteurs', name: 'Auteurs', icon: Users, href: '/admin/collections/authors' },
      { id: 'utilisateurs', name: 'Utilisateurs', icon: User, href: '/admin/collections/users' },
      { id: 'journal', name: 'Journal', icon: BookOpen, href: '/admin/collections/auditLog' },
    ],
  },
]

// Strict design-system tokens — thème clair
const SIDEBAR_BG = '#FEF9E9' // backgrounds.page (cream)
const SIDEBAR_BG_DEEP = '#FFF5D5' // cream-soft pour header/footer
const SIDEBAR_HOVER = '#FFF5D5' // hover subtil
const BORDER = '#DCD8C7' // backgrounds.card
const ACCENT = '#A2211E' // brand.primary (actif)
const ACCENT_HOVER = '#712E2F' // brand.primaryHover
const TEAL = '#054A57' // info.DEFAULT (headings + group labels)
const ORANGE = '#D0802C' // warning.icon (accents warm)
const TEXT = '#374151' // neutral.700
const TEXT_MUTED = '#6B7280' // neutral.500

const STORAGE_KEY = 'rdm-admin-nav-open'

const NavLink: React.FC<{ item: NavItem; isActive: boolean }> = ({ item, isActive }) => {
  const Icon = item.icon
  const [hover, setHover] = useState(false)

  const bg = isActive ? ACCENT : hover ? SIDEBAR_HOVER : 'transparent'
  const iconColor = isActive ? '#FFFFFF' : ACCENT
  const textColor = isActive ? '#FFFFFF' : TEXT

  return (
    <a
      href={item.href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 8,
        textDecoration: 'none',
        backgroundColor: bg,
        color: textColor,
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 500,
        boxShadow: isActive ? '0 4px 12px rgba(162, 33, 30, 0.25)' : 'none',
        transition: 'background-color 0.15s ease, color 0.15s ease, box-shadow 0.2s ease',
      }}
    >
      <Icon size={17} color={iconColor} />
      <span style={{ flex: 1 }}>{item.name}</span>
    </a>
  )
}

const CollapsibleGroup: React.FC<{
  group: NavGroup
  pathname: string
  open: boolean
  onToggle: () => void
}> = ({ group, pathname, open, onToggle }) => {
  const hasActive = group.items.some(
    (i) => pathname === i.href || pathname.startsWith(i.href + '/'),
  )
  const [headerHover, setHeaderHover] = useState(false)

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setHeaderHover(true)}
        onMouseLeave={() => setHeaderHover(false)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: headerHover ? SIDEBAR_HOVER : 'transparent',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          color: TEAL,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          transition: 'background-color 0.15s ease',
        }}
      >
        <span>{group.title}</span>
        <span
          style={{
            display: 'inline-flex',
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          <ChevronDown size={14} />
        </span>
      </button>
      <div
        style={{
          overflow: 'hidden',
          maxHeight: open ? `${group.items.length * 44 + 8}px` : '0px',
          opacity: open ? 1 : 0,
          transition: 'max-height 0.25s ease, opacity 0.2s ease',
        }}
        {...(!open ? { 'aria-hidden': 'true' as const } : {})}
      >
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: '4px 8px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {group.items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.id}>
                <NavLink item={item} isActive={isActive} />
              </li>
            )
          })}
        </ul>
      </div>
      {!open && hasActive && (
        <div
          style={{
            height: 2,
            width: 22,
            margin: '4px 14px 0',
            backgroundColor: ACCENT,
            borderRadius: 2,
          }}
        />
      )}
    </div>
  )
}

const Nav: React.FC = () => {
  const pathname = usePathname() || ''
  const { navOpen, setNavOpen, navRef } = useNav()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navigationGroups.map((g) => [g.id, true])),
  )
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setOpenGroups((prev) => ({ ...prev, ...JSON.parse(raw) }))
    } catch {}
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(openGroups))
    } catch {}
  }, [openGroups, mounted])

  const isDashboardActive = useMemo(
    () => pathname === '/admin' || pathname === '/admin/',
    [pathname],
  )

  const toggle = (id: string) => setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))

  const [logoutHover, setLogoutHover] = useState(false)
  const [siteHover, setSiteHover] = useState(false)
  const [collapseHover, setCollapseHover] = useState(false)
  const [openerHover, setOpenerHover] = useState(false)

  return (
    <>
    {!navOpen && (
      <button
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
          background: openerHover ? ACCENT_HOVER : ACCENT,
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
        width: navOpen ? 280 : 0,
        minWidth: navOpen ? 280 : 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: SIDEBAR_BG,
        borderRight: navOpen ? `1px solid ${BORDER}` : 'none',
        boxShadow: navOpen ? '4px 0 20px rgba(0, 0, 0, 0.18)' : 'none',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        zIndex: 40,
        overflow: 'hidden',
        transition: 'width 0.25s ease, min-width 0.25s ease',
      }}
    >
      <div
        style={{
          padding: '20px 22px',
          borderBottom: `1px solid ${BORDER}`,
          background: SIDEBAR_BG_DEEP,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: ORANGE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(208, 128, 44, 0.35)',
          }}
        >
          <Leaf size={22} color="#FFFFFF" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontWeight: 700,
              color: ACCENT,
              fontSize: 15,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Remèdes de Mamie
          </span>
          <span style={{ fontSize: 11, color: TEXT_MUTED, letterSpacing: '0.04em' }}>
            Admin CMS
          </span>
        </div>
        <button
          type="button"
          aria-label="Réduire le menu"
          onClick={() => setNavOpen(false)}
          onMouseEnter={() => setCollapseHover(true)}
          onMouseLeave={() => setCollapseHover(false)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: collapseHover ? SIDEBAR_HOVER : 'transparent',
            color: TEAL,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background-color 0.15s ease',
          }}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div style={{ padding: '14px 12px 4px' }}>
        <NavLink
          item={{
            id: 'dashboard',
            name: 'Tableau de bord',
            href: '/admin',
            icon: LayoutDashboard,
          }}
          isActive={isDashboardActive}
        />
      </div>

      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px 16px',
        }}
      >
        {navigationGroups.map((group) => (
          <CollapsibleGroup
            key={group.id}
            group={group}
            pathname={pathname}
            open={openGroups[group.id] !== false}
            onToggle={() => toggle(group.id)}
          />
        ))}
      </nav>

      <div
        style={{
          marginTop: 'auto',
          borderTop: `1px solid ${BORDER}`,
          background: SIDEBAR_BG_DEEP,
          padding: '14px 14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setSiteHover(true)}
          onMouseLeave={() => setSiteHover(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 8,
            textDecoration: 'none',
            background: siteHover ? ACCENT_HOVER : ACCENT,
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 10px rgba(162, 33, 30, 0.25)',
            transition: 'background-color 0.15s ease',
          }}
        >
          <ExternalLink size={15} />
          <span>Voir le site</span>
        </a>
        <a
          href="/admin/logout"
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 8,
            textDecoration: 'none',
            background: logoutHover ? SIDEBAR_HOVER : 'transparent',
            color: logoutHover ? ACCENT : TEXT_MUTED,
            fontSize: 13,
            fontWeight: 500,
            transition: 'background-color 0.15s ease, color 0.15s ease',
          }}
        >
          <LogOut size={15} color={logoutHover ? ACCENT : TEXT_MUTED} />
          <span>Déconnexion</span>
        </a>
      </div>
    </aside>
    </>
  )
}

export default Nav
