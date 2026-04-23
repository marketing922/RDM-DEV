import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { richTextToPlain } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import Reveal from '@/components/ui/Reveal'

import CustomCodeBlock from './CustomCodeBlock'

type BlockDoc = {
  id?: string
  blockType: string
  [key: string]: any
}

export function BlockRenderer({ blocks, locale }: { blocks?: BlockDoc[]; locale: string }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null
  return (
    <>
      {blocks.map((block, i) => {
        const key = block.id || `${block.blockType}-${i}`
        switch (block.blockType) {
          case 'hero':
            return <HeroBlock key={key} block={block} />
          case 'content':
            return <ContentBlock key={key} block={block} index={i} />
          case 'cta':
            return <CtaBlock key={key} block={block} />
          case 'faq':
            return <FaqBlock key={key} block={block} />
          case 'image':
            return <ImageBlock key={key} block={block} />
          case 'customCode':
            return (
              <CustomCodeBlock
                key={key}
                id={block.id || `i${i}`}
                label={block.label}
                html={block.html}
                css={block.css}
                js={block.js}
              />
            )
          case 'contactInfo':
            return <ContactInfoBlock key={key} block={block} locale={locale} />
          default:
            return null
        }
      })}
    </>
  )
}

/* ─── Hero ──────────────────────────────────────────────────────── */

function HeroBlock({ block }: { block: BlockDoc }) {
  const img = resolveMediaUrl(block.image, 'original')
  return (
    <Reveal>
      <section className="relative overflow-hidden bg-rm-paper border border-rm-rule px-6 py-16 md:px-12 md:py-20">
        {img && (
          <Image
            src={img}
            alt={block.heading || ''}
            fill
            className="absolute inset-0 object-cover opacity-20"
            sizes="100vw"
          />
        )}
        {/* Decorative sprig */}
        <svg
          aria-hidden="true"
          width="120"
          height="120"
          viewBox="0 0 140 140"
          fill="none"
          className="absolute -bottom-4 -right-4 opacity-20 text-rm-ochre pointer-events-none"
        >
          <path d="M70 15 C 80 40, 85 70, 80 110" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d="M72 35 C 82 32, 92 28, 98 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M75 55 C 65 52, 55 48, 48 42" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <ellipse cx="100" cy="22" rx="7" ry="3.5" transform="rotate(-20 100 22)" fill="currentColor" fillOpacity="0.5" />
          <ellipse cx="46" cy="42" rx="7" ry="3.5" transform="rotate(20 46 42)" fill="currentColor" fillOpacity="0.5" />
        </svg>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {block.heading && (
            <h2 className="font-display text-[30px] md:text-[40px] leading-[1.1] text-rm-teal tracking-[-0.01em]">
              {block.heading}
            </h2>
          )}
          {block.subheading && (
            <p className="font-serif italic text-[17px] md:text-[19px] leading-[1.55] text-rm-inkSoft mt-4">
              {block.subheading}
            </p>
          )}
          {block.ctaLabel && block.ctaLink && (
            <Link
              href={block.ctaLink}
              className="mt-7 inline-flex items-center gap-2 bg-rm-burgundy text-white font-sans text-sm font-semibold px-[22px] py-[14px] rounded-[10px] shadow-[0_6px_16px_rgba(162,33,30,0.18)] hover:bg-rm-burgundy/90 transition-colors"
            >
              {block.ctaLabel}
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </section>
    </Reveal>
  )
}

/* ─── Content (rich text → paragraphes stylés) ────────────────── */

function ContentBlock({ block, index }: { block: BlockDoc; index: number }) {
  const text = richTextToPlain(block.richText)
  if (!text) return null
  // Heuristique : première ligne non vide avant double saut devient titre si courte
  const paragraphs = text
    .split('\n\n')
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <Reveal>
      <article className="mx-auto max-w-3xl">
        <div className="space-y-5 font-serif text-[17px] md:text-[18px] leading-[1.75] text-rm-ink">
          {paragraphs.map((para, i) => {
            // H2 heuristic: lines starting with "### " or "## "
            if (/^###\s+/.test(para)) {
              return (
                <h3
                  key={i}
                  className="font-display text-[22px] md:text-[26px] text-rm-teal leading-tight tracking-[-0.01em] mt-8 mb-2"
                >
                  {para.replace(/^###\s+/, '')}
                </h3>
              )
            }
            if (/^##\s+/.test(para)) {
              return (
                <h2
                  key={i}
                  className="font-display text-[26px] md:text-[32px] text-rm-teal leading-tight tracking-[-0.01em] mt-10 mb-3"
                >
                  {para.replace(/^##\s+/, '')}
                </h2>
              )
            }
            // Bullet list block (lines starting with - or •)
            if (/^(-|•)\s/.test(para)) {
              const items = para
                .split('\n')
                .map((l) => l.replace(/^(-|•)\s+/, '').trim())
                .filter(Boolean)
              return (
                <ul
                  key={i}
                  className="list-none space-y-2 my-4 border-l-2 border-rm-ochre pl-5"
                >
                  {items.map((it, j) => (
                    <li key={j} className="font-serif leading-[1.65]">
                      {it}
                    </li>
                  ))}
                </ul>
              )
            }
            // First paragraph of first block: drop-cap + intro italic
            if (index === 0 && i === 0) {
              return (
                <p
                  key={i}
                  className="font-serif italic text-[19px] md:text-[20px] leading-[1.65] text-rm-burgundy/90 first-letter:font-display first-letter:text-[52px] first-letter:text-rm-burgundy first-letter:float-left first-letter:mr-2 first-letter:leading-[0.9] first-letter:mt-1"
                >
                  {para}
                </p>
              )
            }
            return <p key={i}>{para}</p>
          })}
        </div>
      </article>
    </Reveal>
  )
}

/* ─── CTA (burgundy block) ───────────────────────────────────── */

function CtaBlock({ block }: { block: BlockDoc }) {
  return (
    <Reveal>
      <section className="mx-auto max-w-4xl bg-rm-burgundy text-white px-8 py-12 md:px-12 md:py-14 border border-rm-burgundy text-center relative overflow-hidden">
        {/* Subtle decorative sprig */}
        <svg
          aria-hidden="true"
          width="100"
          height="100"
          viewBox="0 0 140 140"
          fill="none"
          className="absolute -top-6 -right-6 opacity-10 text-white pointer-events-none"
        >
          <path d="M70 15 C 80 40, 85 70, 80 110" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <ellipse cx="100" cy="22" rx="7" ry="3.5" transform="rotate(-20 100 22)" fill="currentColor" fillOpacity="0.6" />
          <ellipse cx="46" cy="42" rx="7" ry="3.5" transform="rotate(20 46 42)" fill="currentColor" fillOpacity="0.6" />
        </svg>

        <div className="relative">
          {block.heading && (
            <h2 className="font-display text-[26px] md:text-[36px] leading-[1.1] tracking-[-0.01em]">
              {block.heading}
            </h2>
          )}
          {block.description && (
            <p className="font-serif italic text-[16px] md:text-[17px] leading-[1.55] text-white/90 mt-3 max-w-xl mx-auto">
              {block.description}
            </p>
          )}
          {block.buttonLabel && block.buttonLink && (
            <Link
              href={block.buttonLink}
              className="mt-7 inline-flex items-center gap-2 bg-rm-cream text-rm-burgundy font-sans text-sm font-semibold px-6 py-3 hover:bg-white transition-colors"
            >
              {block.buttonLabel}
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </section>
    </Reveal>
  )
}

/* ─── FAQ (style home) ───────────────────────────────────────── */

function FaqBlock({ block }: { block: BlockDoc }) {
  const items = Array.isArray(block.items) ? block.items : []
  if (items.length === 0) return null
  return (
    <Reveal>
      <section className="mx-auto max-w-3xl">
        {block.heading && (
          <div className="text-center mb-8 md:mb-10">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <span className="block w-6 h-px bg-rm-burgundy" />
              <span className="font-sans text-[10px] tracking-[0.25em] text-rm-burgundy uppercase">
                Questions
              </span>
              <span className="block w-6 h-px bg-rm-burgundy" />
            </div>
            <h2 className="font-display text-[28px] md:text-[36px] leading-tight text-rm-teal tracking-[-0.01em]">
              {block.heading}
            </h2>
          </div>
        )}
        <div className="divide-y divide-dashed divide-rm-rule border-t border-b border-dashed border-rm-rule">
          {items.map((item: any, i: number) => (
            <details key={i} className="group">
              <summary className="flex w-full items-center justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-baseline gap-4 flex-1 min-w-0">
                  <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-rm-inkSoft/60 shrink-0">
                    N° {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-[17px] md:text-[19px] leading-[1.25] text-rm-teal text-left">
                    {item.question}
                  </span>
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-rm-burgundy flex-shrink-0 transition-transform duration-300 group-open:rotate-180"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <div className="pb-5 pl-[72px] pr-8 font-serif italic text-[15px] leading-[1.65] text-rm-inkSoft">
                {richTextToPlain(item.answer)}
              </div>
            </details>
          ))}
        </div>
      </section>
    </Reveal>
  )
}

/* ─── Contact info card ──────────────────────────────────────── */

function ContactInfoBlock({ block, locale }: { block: BlockDoc; locale: string }) {
  const hasHours = Array.isArray(block.openingHours) && block.openingHours.length > 0
  return (
    <Reveal>
      <section className="mx-auto max-w-3xl bg-rm-paper border border-rm-rule">
        {block.heading && (
          <div className="border-b border-dashed border-rm-rule px-6 md:px-8 py-4">
            <h2 className="font-display text-[22px] md:text-[26px] text-rm-teal leading-tight">
              {block.heading}
            </h2>
          </div>
        )}
        <dl className="divide-y divide-dashed divide-rm-rule">
          {block.address && (
            <div className="grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] px-6 md:px-8 py-4 gap-4">
              <dt className="font-sans text-[11px] tracking-[0.2em] uppercase text-rm-inkSoft/70 self-start pt-1">
                Adresse
              </dt>
              <dd className="font-serif text-[15px] leading-[1.6] text-rm-ink whitespace-pre-line">
                {block.address}
              </dd>
            </div>
          )}
          {block.email && (
            <div className="grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] px-6 md:px-8 py-4 gap-4">
              <dt className="font-sans text-[11px] tracking-[0.2em] uppercase text-rm-inkSoft/70 self-start pt-1">
                Email
              </dt>
              <dd>
                <a
                  href={`mailto:${block.email}`}
                  className="font-serif text-[15px] text-rm-burgundy underline underline-offset-2 decoration-rm-burgundy/40 hover:decoration-rm-burgundy transition-colors"
                >
                  {block.email}
                </a>
              </dd>
            </div>
          )}
          {block.phone && (
            <div className="grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] px-6 md:px-8 py-4 gap-4">
              <dt className="font-sans text-[11px] tracking-[0.2em] uppercase text-rm-inkSoft/70 self-start pt-1">
                Téléphone
              </dt>
              <dd>
                <a
                  href={`tel:${block.phone}`}
                  className="font-serif text-[15px] text-rm-burgundy hover:underline"
                >
                  {block.phone}
                </a>
              </dd>
            </div>
          )}
          {hasHours && (
            <div className="grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] px-6 md:px-8 py-4 gap-4">
              <dt className="font-sans text-[11px] tracking-[0.2em] uppercase text-rm-inkSoft/70 self-start pt-1">
                Horaires
              </dt>
              <dd className="font-serif text-[15px] leading-[1.7] text-rm-ink">
                <ul className="space-y-0.5">
                  {block.openingHours.map((oh: any, i: number) => (
                    <li key={i} className="flex justify-between gap-4 max-w-xs">
                      <span className="text-rm-teal font-semibold">{oh.day}</span>
                      <span className="text-rm-inkSoft">{oh.hours}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </section>
    </Reveal>
  )
}

/* ─── Image figure ───────────────────────────────────────────── */

function ImageBlock({ block }: { block: BlockDoc }) {
  const src = resolveMediaUrl(block.image, 'card')
  if (!src) return null
  return (
    <Reveal>
      <figure className="mx-auto max-w-4xl">
        <div className="relative aspect-video overflow-hidden border border-rm-rule bg-rm-creamSoft">
          <Image
            src={src}
            alt={block.caption || ''}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 900px"
          />
        </div>
        {block.caption && (
          <figcaption className="mt-3 text-center font-serif italic text-[13px] text-rm-inkSoft">
            {block.caption}
          </figcaption>
        )}
      </figure>
    </Reveal>
  )
}
