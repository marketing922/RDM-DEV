/**
 * Slugify a string for use in URLs.
 * Handles accents, spaces, punctuation. Returns lowercase kebab-case.
 */
export function slugify(input: string): string {
  if (!input) return ''
  return input
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80) // cap length
}
