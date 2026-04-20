import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { richTextToPlain } from '@/lib/utils'

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
            return <ContentBlock key={key} block={block} />
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
          default:
            return null
        }
      })}
    </>
  )
}

function HeroBlock({ block }: { block: BlockDoc }) {
  const img = block.image?.url
  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#FEF9E9] px-6 py-16 md:px-10 md:py-20">
      {img && (
        <Image
          src={img}
          alt={block.heading || ''}
          fill
          className="absolute inset-0 object-cover opacity-25"
          sizes="100vw"
        />
      )}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {block.heading && (
          <h1 className="text-3xl md:text-5xl font-bold text-[#054A57]">{block.heading}</h1>
        )}
        {block.subheading && (
          <p className="mt-4 text-lg text-[#712E2F]/80">{block.subheading}</p>
        )}
        {block.ctaLabel && block.ctaLink && (
          <Link
            href={block.ctaLink}
            className="mt-8 inline-flex items-center rounded-lg bg-[#A2211E] px-8 py-3.5 font-semibold text-white hover:bg-[#712E2F] transition-colors"
          >
            {block.ctaLabel}
          </Link>
        )}
      </div>
    </section>
  )
}

function ContentBlock({ block }: { block: BlockDoc }) {
  const text = richTextToPlain(block.richText)
  if (!text) return null
  return (
    <section className="prose prose-lg mx-auto max-w-3xl py-8 text-[#374151]">
      {text.split('\n\n').map((p: string, i: number) => (
        <p key={i} className={i > 0 ? 'mt-4' : ''}>
          {p}
        </p>
      ))}
    </section>
  )
}

function CtaBlock({ block }: { block: BlockDoc }) {
  return (
    <section className="mx-auto my-12 max-w-4xl rounded-2xl bg-[#A2211E] px-8 py-12 text-center text-white">
      {block.heading && <h2 className="text-2xl md:text-3xl font-bold">{block.heading}</h2>}
      {block.description && (
        <p className="mt-3 text-white/85 max-w-xl mx-auto">{block.description}</p>
      )}
      {block.buttonLabel && block.buttonLink && (
        <Link
          href={block.buttonLink}
          className="mt-6 inline-flex items-center rounded-lg bg-white px-6 py-3 font-semibold text-[#A2211E] hover:bg-[#FEF9E9] transition-colors"
        >
          {block.buttonLabel}
        </Link>
      )}
    </section>
  )
}

function FaqBlock({ block }: { block: BlockDoc }) {
  const items = Array.isArray(block.items) ? block.items : []
  if (items.length === 0) return null
  return (
    <section className="mx-auto max-w-3xl py-8">
      {block.heading && (
        <h2 className="mb-6 text-2xl md:text-3xl font-bold text-[#054A57] text-center">
          {block.heading}
        </h2>
      )}
      <div className="space-y-3">
        {items.map((item: any, i: number) => (
          <details
            key={i}
            className="group overflow-hidden rounded-xl border border-[#DCD8C7] bg-[#FEF9E9]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
              <span className="font-semibold text-[#054A57]">{item.question}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#A2211E] transition-transform group-open:rotate-180"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="border-t border-[#DCD8C7] bg-white px-5 py-4 text-[15px] leading-relaxed text-[#374151]">
              {richTextToPlain(item.answer)}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

function ImageBlock({ block }: { block: BlockDoc }) {
  const src = block.image?.url
  if (!src) return null
  return (
    <figure className="mx-auto my-10 max-w-4xl">
      <div className="relative aspect-video overflow-hidden rounded-2xl">
        <Image
          src={src}
          alt={block.caption || ''}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 900px"
        />
      </div>
      {block.caption && (
        <figcaption className="mt-3 text-center text-sm text-[#6B7280] italic">
          {block.caption}
        </figcaption>
      )}
    </figure>
  )
}
