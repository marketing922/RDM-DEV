'use client'
import React from 'react'

// ── LegalTOC (sticky sidebar on desktop, collapsible on mobile) ───
export function LegalTOC({
  items,
  activeId,
}: {
  items: Array<{ id: string; label: string }>
  activeId?: string
}) {
  return (
    <nav
      aria-label="Sommaire de la page"
      className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
    >
      {/* Mobile/tablet : collapsible details */}
      <details className="lg:hidden border border-rm-rule bg-rm-paper mb-2 group">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between px-4 py-3 font-mono text-[11px] tracking-[0.18em] text-rm-burgundy uppercase">
          <span>Sommaire · {items.length} entrées</span>
          <svg
            className="text-rm-burgundy flex-shrink-0 transition-transform group-open:rotate-180"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </summary>
        <ol className="list-none m-0 p-0 px-3 pb-3 pt-1 border-t border-rm-rule">
          {items.map((it, i) => {
            const isActive = activeId === it.id
            return (
              <li
                key={it.id}
                className={`py-1.5 pl-3 font-serif text-[13px] leading-[1.4] border-l-2 transition-colors ${
                  isActive
                    ? 'text-rm-teal font-semibold border-rm-burgundy'
                    : 'text-rm-inkSoft font-normal border-transparent'
                }`}
              >
                <a
                  href={`#${it.id}`}
                  className="hover:text-rm-burgundy transition-colors inline-flex items-baseline gap-1.5"
                >
                  <span className="font-mono text-[10px] text-rm-burgundy">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{it.label}</span>
                </a>
              </li>
            )
          })}
        </ol>
      </details>

      {/* Desktop : full sidebar */}
      <div className="hidden lg:block">
        <div className="font-mono text-[10px] tracking-[0.2em] text-rm-burgundy mb-3.5 uppercase">
          Sommaire
        </div>
        <ol className="list-none m-0 p-0">
          {items.map((it, i) => {
            const isActive = activeId === it.id || (!activeId && i === 0)
            return (
              <li
                key={it.id}
                className={`py-[7px] pl-3 font-serif text-[12px] leading-[1.4] border-l-2 transition-colors ${
                  isActive
                    ? 'text-rm-teal font-semibold border-rm-burgundy'
                    : 'text-rm-inkSoft font-normal border-transparent'
                }`}
              >
                <a
                  href={`#${it.id}`}
                  className="hover:text-rm-burgundy transition-colors inline-flex items-baseline gap-1.5"
                >
                  <span className="font-mono text-[10px] text-rm-burgundy">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{it.label}</span>
                </a>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}

// ── LegalMeta (version / updated) ────────────────────────
export function LegalMeta({
  version,
  updated,
}: {
  version: string
  updated: string
}) {
  return (
    <div className="font-mono text-[11px] text-rm-inkSoft pb-4 sm:pb-5 mb-8 sm:mb-10 border-b border-dashed border-rm-ruleStrong flex flex-wrap gap-x-7 gap-y-1.5">
      <span>
        <strong className="text-rm-burgundy">Version</strong> {version}
      </span>
      <span>
        <strong className="text-rm-burgundy">Mise à jour</strong> {updated}
      </span>
    </div>
  )
}

// ── LegalSection ─────────────────────────────────────────
export function LegalSection({
  id,
  num,
  title,
  children,
}: {
  id: string
  num: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="mb-10 sm:mb-14 scroll-mt-20 sm:scroll-mt-24"
    >
      <h2 className="font-display text-[22px] sm:text-[26px] md:text-[32px] text-rm-teal m-0 mb-3.5 sm:mb-[18px] font-normal tracking-[-0.01em] border-l-[3px] border-rm-burgundy pl-3 sm:pl-3.5 leading-[1.2] sm:leading-[1.15]">
        <span className="font-mono text-[11px] sm:text-[13px] text-rm-burgundy mr-2 sm:mr-2.5">
          § {String(num).padStart(2, '0')}
        </span>
        {title}
      </h2>
      <div className="font-serif text-[15px] md:text-[16px] leading-[1.7] sm:leading-[1.75] text-rm-ink">
        {children}
      </div>
    </section>
  )
}

// ── LegalBox (info / warn callout) ────────────────────────
export function LegalBox({
  children,
  tone = 'info',
}: {
  children: React.ReactNode
  tone?: 'info' | 'warn'
}) {
  const styles =
    tone === 'warn'
      ? 'bg-[#F6E7E1] border-rm-burgundy text-[#5a1816]'
      : 'bg-rm-creamSoft border-rm-ochre text-[#6b3f14]'
  return (
    <div
      className={`my-4 px-4 sm:px-[18px] py-3 sm:py-3.5 border-l-[3px] font-serif italic text-[13px] sm:text-[14px] leading-[1.55] sm:leading-[1.6] ${styles}`}
    >
      {children}
    </div>
  )
}

// ── LegalBody (prose wrapper) ────────────────────────────
export function LegalBody({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`font-serif text-[15px] md:text-[16px] leading-[1.75] text-rm-ink max-w-[720px] ${className}`}
    >
      {children}
    </div>
  )
}
