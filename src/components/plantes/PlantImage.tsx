'use client'
import Image from 'next/image'
import { useState } from 'react'
import { DEFAULT_PLANT_IMAGE } from '@/lib/brand-assets'

const FALLBACK = DEFAULT_PLANT_IMAGE

type Props = {
  src?: string | null
  alt: string
  sizes?: string
  className?: string
}

/**
 * Plant image with onError fallback to the default RDM placeholder.
 * Always fills its parent (aspect-square container expected) and uses
 * object-cover so every card displays at the exact same dimensions
 * regardless of the source image's native aspect ratio.
 */
export default function PlantImage({ src, alt, sizes, className }: Props) {
  const [errored, setErrored] = useState(false)
  const finalSrc = !src || errored ? FALLBACK : src

  return (
    <Image
      src={finalSrc}
      alt={alt}
      fill
      sizes={sizes ?? '(max-width: 768px) 100vw, 25vw'}
      className={className ?? 'object-cover'}
      onError={() => setErrored(true)}
    />
  )
}
