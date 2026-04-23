'use client'

import React from 'react'

/**
 * Official "Les Remèdes de Mamie" wordmark (red script logo).
 * Source: /public/assets/brand/rm-logo.png (1200×859, aspect ratio ≈ 1.397).
 *
 * Backwards-compat note: the old API accepted `color`, `size`, `tight`. The
 * image logo renders identically regardless of color/tight — we keep `size`
 * (interpreted as height in px) and `color` is now a no-op. `tight` is also
 * a no-op since the image is always the full wordmark.
 */
export function Wordmark({
  size = 32,
  height,
  alt = 'Les Remèdes de Mamie',
  style,
}: {
  size?: number
  height?: number
  alt?: string
  color?: string
  tight?: boolean
  style?: React.CSSProperties
}) {
  const h = height ?? size
  const w = Math.round(h * 1.397)
  return (
    <img
      src="/assets/brand/rm-logo.png"
      alt={alt}
      width={w}
      height={h}
      style={{ width: w, height: h, objectFit: 'contain', display: 'block', ...style }}
    />
  )
}
