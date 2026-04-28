import React from 'react'
import Link from 'next/link'
import Reveal from '@/components/ui/Reveal'

// ── InstitBreadcrumb ──────────────────────────────────────
export function InstitBreadcrumb({
  crumbs,
  locale,
}: {
  crumbs: Array<{ label: string; href?: string }>
  locale: string
}) {
  return (
    <nav
      aria-label="fil d'ariane"
      className="max-w-[1040px] mx-auto px-4 sm:px-6 md:px-10 pt-4 sm:pt-5 font-sans text-[11px] sm:text-[12px] text-rm-inkSoft"
    >
      {crumbs.map((c, i) => (
        <React.Fragment key={`${c.label}-${i}`}>
          {i > 0 && <span className="mx-2 text-rm-ruleStrong">›</span>}
          {c.href && i < crumbs.length - 1 ? (
            <Link
              href={c.href.startsWith('/') ? c.href : `/${locale}/${c.href}`}
              className="text-rm-inkSoft hover:text-rm-burgundy transition-colors"
            >
              {c.label}
            </Link>
          ) : (
            <span
              className={
                i === crumbs.length - 1
                  ? 'text-rm-teal font-semibold'
                  : 'text-rm-inkSoft'
              }
            >
              {c.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

// ── InstitHeader ──────────────────────────────────────────
export function InstitHeader({
  chapter,
  title,
  sub,
  intro,
}: {
  chapter: string
  title: string | React.ReactNode
  sub?: string | React.ReactNode
  intro?: string | React.ReactNode
}) {
  return (
    <Reveal>
      <header className="bg-rm-cream border-b border-rm-rule pt-10 sm:pt-14 md:pt-[72px] pb-9 sm:pb-12 md:pb-14">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 md:px-10">
          <div className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase mb-2.5 sm:mb-3">
            {chapter}
          </div>
          <h1 className="font-display font-normal text-rm-teal m-0 leading-[0.95] sm:leading-[0.9] tracking-[-0.02em] sm:tracking-[-0.025em] text-[40px] sm:text-[56px] md:text-[68px] lg:text-[84px] break-words">
            {title}
            {sub && (
              <em className="block italic text-rm-burgundy mt-1.5 sm:mt-2 text-[28px] sm:text-[40px] md:text-[46px] lg:text-[52px] leading-[1] sm:leading-[0.95]">
                {sub}
              </em>
            )}
          </h1>
          {intro && (
            <p className="font-serif text-[15px] sm:text-[17px] md:text-[20px] leading-[1.55] text-rm-inkSoft mt-5 sm:mt-6 md:mt-7 max-w-[720px]">
              {intro}
            </p>
          )}
        </div>
      </header>
    </Reveal>
  )
}

// ── InstitPage (shell générique) ──────────────────────────
export function InstitPage({
  chapter,
  title,
  sub,
  intro,
  crumbs,
  locale,
  children,
  maxWidth = '1040px',
}: {
  chapter: string
  title: string | React.ReactNode
  sub?: string | React.ReactNode
  intro?: string | React.ReactNode
  crumbs: Array<{ label: string; href?: string }>
  locale: string
  children: React.ReactNode
  maxWidth?: string
}) {
  return (
    <main className="min-h-screen bg-rm-cream text-rm-ink font-sans">
      <InstitBreadcrumb crumbs={crumbs} locale={locale} />
      <InstitHeader chapter={chapter} title={title} sub={sub} intro={intro} />
      <div
        className="mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14 md:py-20 pb-16 sm:pb-20 md:pb-24"
        style={{ maxWidth }}
      >
        {children}
      </div>
    </main>
  )
}
