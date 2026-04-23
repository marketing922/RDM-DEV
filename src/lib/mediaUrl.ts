export type MediaDocLike = {
  id?: string | number
  url?: string | null
  filename?: string | null
  mimeType?: string | null
  sizes?: Record<string, { url?: string | null }> | null
  thumbnailURL?: string | null
}

const PUBLIC_PREFIX = '/images'

/**
 * Resolve the best-available URL for a media doc, preferring:
 * 1. Explicit thumbnail variant (if requested size exists)
 * 2. The doc.url set by Payload
 * 3. A fallback to the static public path when the doc was uploaded locally
 * Returns null if nothing works.
 */
export function resolveMediaUrl(
  doc: MediaDocLike | null | undefined,
  variant: 'thumbnail' | 'card' | 'original' = 'original',
): string | null {
  if (!doc) return null
  if (variant !== 'original' && doc.sizes && (doc.sizes as any)[variant]?.url) {
    return (doc.sizes as any)[variant].url as string
  }
  if (doc.url) return doc.url
  if (doc.filename) return `${PUBLIC_PREFIX}/${doc.filename}`
  return null
}

export function isImageMedia(doc: MediaDocLike | null | undefined): boolean {
  return !!doc?.mimeType?.startsWith('image/')
}
