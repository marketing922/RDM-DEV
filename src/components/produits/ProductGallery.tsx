'use client'
import React, { useState } from 'react'
import Image from 'next/image'

type Props = {
  images: string[]
  alt: string
}

export default function ProductGallery({ images, alt }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const active = images[activeIdx] || images[0]

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative aspect-square w-full bg-rm-paper border border-rm-rule overflow-hidden">
        {active && (
          <Image
            src={active}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-6"
            priority
          />
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2.5">
          {images.slice(0, 5).map((src, idx) => {
            const isActive = idx === activeIdx
            return (
              <button
                key={src + idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                aria-label={`Image ${idx + 1}`}
                aria-current={isActive ? 'true' : undefined}
                className={`relative aspect-square bg-rm-paper overflow-hidden border transition-colors ${
                  isActive
                    ? 'border-rm-burgundy ring-2 ring-rm-burgundy/20'
                    : 'border-rm-rule hover:border-rm-ruleStrong'
                }`}
              >
                <Image
                  src={src}
                  alt={`${alt} — miniature ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1.5"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
