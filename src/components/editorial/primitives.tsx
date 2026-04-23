'use client'
import React, { useState } from 'react'

// ── Section with § numbering ─────────────────────────────
export function EditorialSection({
  id,
  num,
  title,
  children,
}: {
  id: string
  num: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-20">
      <div className="flex items-baseline gap-3.5 mb-[18px] pb-2.5 border-b border-rm-rule">
        <div className="font-mono text-[14px] text-rm-burgundy tracking-[0.12em]">
          § {num}
        </div>
        <h2 className="font-display text-[28px] md:text-[36px] text-rm-teal m-0 font-normal tracking-[-0.015em]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

// ── Figure with ochre-accent caption ────────────────────
export function EditorialFigure({
  children,
  caption,
}: {
  children?: React.ReactNode
  caption: string
}) {
  return (
    <figure className="my-6 font-serif">
      <div className="bg-rm-creamSoft border border-rm-rule aspect-video relative flex items-center justify-center overflow-hidden">
        {children || (
          <svg
            width="140"
            height="140"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-rm-teal opacity-40"
            aria-hidden="true"
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s2.5 3.5.5 9.2A7 7 0 0 1 11 20Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6" />
          </svg>
        )}
      </div>
      <figcaption className="font-sans text-[12px] text-rm-inkSoft italic mt-2.5 pl-3 border-l-2 border-rm-ochre">
        {caption}
      </figcaption>
    </figure>
  )
}

// ── Aside callout (À ne pas confondre, Le saviez-vous ?) ─
export function EditorialAside({
  kind,
  children,
  tone = 'burgundy',
}: {
  kind: string
  children: React.ReactNode
  tone?: 'burgundy' | 'ochre'
}) {
  const bar = tone === 'ochre' ? 'border-rm-ochre' : 'border-rm-burgundy'
  const label = tone === 'ochre' ? 'text-rm-ochre' : 'text-rm-burgundy'
  return (
    <aside
      className={`my-6 bg-rm-creamSoft border-l-[3px] ${bar} px-[22px] py-4 rounded-r-lg font-serif`}
    >
      <div
        className={`font-sans text-[10px] tracking-[0.25em] uppercase font-bold mb-2 ${label}`}
      >
        {kind}
      </div>
      <div className="text-[15px] text-rm-ink leading-[1.6]">{children}</div>
    </aside>
  )
}

// ── CrossCard (right sidebar) ────────────────────────────
export function CrossCard({
  title,
  badge,
  accent,
  children,
}: {
  title: string
  badge?: string | number
  accent?: boolean
  children: React.ReactNode
}) {
  const border = accent ? 'border-rm-burgundy/40' : 'border-rm-rule'
  const shadow = accent ? 'shadow-[0_0_0_3px_rgba(162,33,30,0.07)]' : ''
  return (
    <div
      className={`bg-rm-paper border ${border} rounded-[10px] px-[18px] py-[18px] ${shadow}`}
    >
      <div className="flex justify-between items-baseline mb-3 pb-2.5 border-b border-rm-rule">
        <div className="font-display text-[18px] text-rm-teal">{title}</div>
        {badge !== undefined && (
          <span className="font-mono text-[11px] text-rm-burgundy">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

// ── FAQ accordion (interactive) ──────────────────────────
export function FAQList({
  items,
}: {
  items: Array<{ q: string; a: React.ReactNode }>
}) {
  const [open, setOpen] = useState<number>(0)
  return (
    <div className="border border-rm-rule rounded-[10px] overflow-hidden bg-rm-paper">
      {items.map((it, i) => {
        const isOpen = open === i
        return (
          <div
            key={i}
            className={i > 0 ? 'border-t border-rm-rule' : ''}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              className={`w-full bg-transparent border-none py-[18px] px-[22px] text-left cursor-pointer flex justify-between items-center gap-4 font-display text-[18px] md:text-[19px] font-normal transition-colors ${
                isOpen ? 'text-rm-burgundy' : 'text-rm-teal'
              }`}
            >
              <span className="flex-1">{it.q}</span>
              <span className="font-mono text-[20px] text-rm-ochre font-normal flex-shrink-0">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen && (
              <div className="px-[22px] pb-[22px] font-serif text-[15px] leading-[1.65] text-rm-inkSoft">
                {it.a}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Chapô (intro paragraph with ochre bar) ──────────────
export function EditorialChapo({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-serif text-[20px] md:text-[22px] leading-[1.55] text-rm-inkSoft italic m-0 mb-10 border-l-[3px] border-rm-ochre pl-5">
      {children}
    </p>
  )
}

// ── Data table (2-col or multi-col) ──────────────────────
export function EditorialTable({
  headers,
  rows,
  headerBg = 'teal',
}: {
  headers: string[]
  rows: Array<Array<React.ReactNode>>
  headerBg?: 'teal' | 'creamSoft'
}) {
  const headerClass =
    headerBg === 'teal'
      ? 'bg-rm-teal text-white'
      : 'bg-rm-creamSoft text-rm-inkSoft'
  const cols = `grid-cols-${headers.length}`
  const gridTemplate = headers.map(() => '1fr').join('_')
  return (
    <div className="border border-rm-rule rounded-[10px] overflow-hidden font-sans text-[13px] my-5">
      <div
        className={`grid px-4 py-[11px] ${headerClass} text-[10px] tracking-[0.12em] uppercase font-semibold`}
        style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)` }}
      >
        {headers.map((h, i) => (
          <div key={i}>{h}</div>
        ))}
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          className={`grid px-4 py-3 border-t border-rm-rule text-[13px] ${
            i % 2 === 1 ? 'bg-rm-creamSoft' : 'bg-rm-paper'
          }`}
          style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)` }}
        >
          {row.map((cell, j) => (
            <div
              key={j}
              className={j === 0 ? 'text-rm-burgundy font-semibold' : 'font-serif text-rm-ink'}
            >
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
