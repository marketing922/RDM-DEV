'use client'

import Image from 'next/image'
import { useState } from 'react'
import { BuyPopup } from '@/components/shared/BuyPopup'
import { formatPrice } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/mediaUrl'

type ProductImage = { image?: { url?: string; alt?: string } | null } | null

type RelOrId =
  | string
  | number
  | { id?: string | number; name?: string | null; slug?: string | null; icon?: string | null }

type ProductCardProps = {
  product: {
    id: string | number
    name: string
    slug?: string
    price: number
    compareAtPrice?: number
    shortDescription?: string
    images?: ProductImage[]
    externalImageUrl?: string
    weight?: string
    inStock?: boolean
    amazonUrl?: string
    temuUrl?: string
    tags?: RelOrId[]
    benefits?: RelOrId[]
  }
}

function extractChips(rels?: RelOrId[]): Array<{ id: string; name: string; icon?: string }> {
  if (!rels?.length) return []
  return rels
    .filter((r): r is { id?: string | number; name?: string | null; icon?: string | null } =>
      typeof r === 'object' && r !== null,
    )
    .map((r) => ({
      id: String(r.id ?? r.name ?? Math.random()),
      name: r.name || '',
      icon: r.icon || undefined,
    }))
    .filter((r) => r.name.trim().length > 0)
}

export function ProductCard({ product }: ProductCardProps) {
  const [popupOpen, setPopupOpen] = useState(false)

  const {
    name,
    price,
    compareAtPrice,
    shortDescription,
    images,
    externalImageUrl,
    weight,
    inStock = true,
    amazonUrl,
    temuUrl,
    tags,
    benefits,
  } = product

  const firstImage = images?.[0]?.image
  const imageUrl = resolveMediaUrl(firstImage, 'card') ?? externalImageUrl
  const imageAlt = firstImage?.alt || name

  const hasPromo = !!compareAtPrice && compareAtPrice > price

  // Cap total chips to keep cards uniform; benefits get priority.
  const allBenefits = extractChips(benefits)
  const allTags = extractChips(tags)
  const benefitChips = allBenefits.slice(0, 3)
  const tagChips = allTags.slice(0, Math.max(0, 3 - benefitChips.length))

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#DCD8C7]/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-[#DCD8C7]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="text-[15px] font-semibold text-[#712E2F] line-clamp-2 min-h-[42px]">
            {name}
          </h3>

          <p className="text-xs text-[#712E2F]/70 line-clamp-2 min-h-[32px]">
            {shortDescription || ''}
          </p>

          <div className="flex flex-nowrap gap-1.5 h-6 overflow-hidden">
            {benefitChips.map((b) => (
              <span
                key={`b-${b.id}`}
                className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#D0802C]/10 px-2 py-0.5 text-[11px] font-medium text-[#D0802C]"
              >
                {b.name}
              </span>
            ))}
            {tagChips.map((t) => (
              <span
                key={`t-${t.id}`}
                className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#DCD8C7]/50 px-2 py-0.5 text-[11px] font-medium text-[#712E2F]/80"
              >
                #{t.name}
              </span>
            ))}
          </div>

          <div className="mt-auto flex items-baseline gap-2 pt-1">
            <span className="text-lg font-bold text-[#A2211E]">{formatPrice(price)}</span>
            {hasPromo && (
              <span className="text-sm text-[#712E2F]/50 line-through">
                {formatPrice(compareAtPrice!)}
              </span>
            )}
          </div>

          <p className="text-xs text-[#712E2F]/70 min-h-[16px]">{weight || ''}</p>

          <button
            type="button"
            onClick={() => setPopupOpen(true)}
            disabled={!inStock}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#A2211E] text-sm font-semibold text-white transition-colors hover:bg-[#8a1c1a] disabled:cursor-not-allowed disabled:bg-[#DCD8C7] disabled:text-[#712E2F]/60"
          >
            {inStock && (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
            {inStock ? 'O\u00f9 l\u2019acheter ?' : 'Rupture de stock'}
          </button>
        </div>
      </article>

      <BuyPopup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        productName={name}
        amazonUrl={amazonUrl}
        temuUrl={temuUrl}
      />
    </>
  )
}
