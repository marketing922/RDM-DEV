/**
 * Shared metadata helpers for Next.js pages.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'

/**
 * Base URL used by Next.js to resolve relative OG / Twitter image and
 * alternates URLs. Return a fresh URL each call to avoid mutation.
 */
export function siteMetadataBase(): URL {
  return new URL(SITE_URL)
}
