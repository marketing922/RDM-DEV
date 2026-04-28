'use client'
import React, { useMemo } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { RM } from './tokens'

export type Crumb = { label: string; href?: string }

type PageHeaderProps = {
  eyebrow?: string
  title: string
  sub?: string
  right?: React.ReactNode
  /** Breadcrumb chain — if omitted, derived automatically from URL. */
  crumbs?: Crumb[]
  /** Override the back-arrow target. If omitted, falls back to router.back() then /admin. */
  backHref?: string
  /** Hide the breadcrumb / back row entirely. */
  hideBack?: boolean
}

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  collections: 'Collections',
  globals: 'Globaux',
  'ai-workshop': 'Atelier IA',
  'ai-usage': 'IA — Consommation',
  errors: 'Erreurs système',
  notifications: 'Notifications',
  settings: 'Paramètres',
  wikiEntries: 'Plantes',
  blogPosts: 'Articles',
  benefits: 'Bienfaits',
  products: 'Produits',
  pages: 'Pages',
  sitePages: 'Pages du site',
  authors: 'Auteurs',
  categories: 'Catégories',
  tags: 'Tags',
  media: 'Médias',
  users: 'Utilisateurs',
  auditLog: "Journal d'audit",
  errorLog: 'Erreurs système',
  productionRun: 'Productions IA',
  navigation: 'Navigation',
  footer: 'Pied de page',
  siteSettings: 'Paramètres',
}

function humanizeSegment(seg: string): string {
  if (SEGMENT_LABELS[seg]) return SEGMENT_LABELS[seg]
  // numeric id → "Document #X"
  if (/^\d+$/.test(seg)) return `#${seg}`
  // slug-with-dashes → Title Case
  return seg
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function deriveCrumbs(pathname: string | null): Crumb[] {
  if (!pathname) return [{ label: 'Admin', href: '/admin' }]
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0 || parts[0] !== 'admin') return [{ label: 'Admin', href: '/admin' }]
  const out: Crumb[] = [{ label: 'Admin', href: '/admin' }]
  let acc = '/admin'
  for (let i = 1; i < parts.length; i++) {
    acc += '/' + parts[i]
    const isLast = i === parts.length - 1
    out.push({ label: humanizeSegment(parts[i]), href: isLast ? undefined : acc })
  }
  return out
}

export function PageHeader({
  eyebrow,
  title,
  sub,
  right,
  crumbs,
  backHref,
  hideBack,
}: PageHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const resolvedCrumbs = useMemo(() => crumbs ?? deriveCrumbs(pathname), [crumbs, pathname])

  const onBack = () => {
    if (backHref) {
      router.push(backHref)
      return
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push('/admin')
  }

  const showBackRow = !hideBack && resolvedCrumbs.length > 0

  return (
    <div style={{ marginBottom: 28 }}>
      {showBackRow && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 18,
            fontFamily: RM.fSans,
            fontSize: 12,
            color: RM.inkSoft,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={onBack}
            aria-label="Retour"
            title="Retour"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: 8,
              border: `1px solid ${RM.rule}`,
              background: '#fff',
              color: RM.teal,
              cursor: 'pointer',
              transition: 'border-color 120ms ease, background 120ms ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = RM.burgundy
              e.currentTarget.style.background = '#FAF6EE'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = RM.rule
              e.currentTarget.style.background = '#fff'
            }}
          >
            <ChevronLeft size={16} aria-hidden />
          </button>

          <nav
            aria-label="Fil d'Ariane"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
              minWidth: 0,
            }}
          >
            {resolvedCrumbs.map((c, i) => {
              const isLast = i === resolvedCrumbs.length - 1
              const isFirst = i === 0
              return (
                <React.Fragment key={`${c.label}-${i}`}>
                  {!isFirst && (
                    <ChevronRight size={12} style={{ color: RM.rule, flexShrink: 0 }} aria-hidden />
                  )}
                  {c.href && !isLast ? (
                    <Link
                      href={c.href}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        color: RM.inkSoft,
                        textDecoration: 'none',
                        transition: 'color 120ms ease',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = RM.burgundy
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = RM.inkSoft
                      }}
                    >
                      {isFirst && <Home size={12} aria-hidden />}
                      {c.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={isLast ? 'page' : undefined}
                      style={{
                        color: isLast ? RM.teal : RM.inkSoft,
                        fontWeight: isLast ? 600 : 400,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isFirst && (
                        <Home
                          size={12}
                          style={{ display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }}
                          aria-hidden
                        />
                      )}
                      {c.label}
                    </span>
                  )}
                </React.Fragment>
              )
            })}
          </nav>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 24,
        }}
      >
        <div>
          {eyebrow && (
            <div
              style={{
                fontSize: 11,
                letterSpacing: 2.5,
                color: RM.burgundy,
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              {eyebrow}
            </div>
          )}
          <h1
            style={{
              fontFamily: RM.fDisplay,
              fontSize: 40,
              color: RM.teal,
              margin: 0,
              fontWeight: 400,
              letterSpacing: -0.5,
            }}
          >
            {title}{' '}
            {sub && (
              <span style={{ color: RM.inkSoft, fontSize: 22, fontStyle: 'italic' }}>{sub}</span>
            )}
          </h1>
        </div>
        {right}
      </div>
    </div>
  )
}
