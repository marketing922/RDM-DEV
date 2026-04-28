// Allowlist of fields exposable to the LLM per collection.
// Anything outside this list must never reach the model prompt.

export const EXPOSABLE_FIELDS: Record<string, string[]> = {
  wikiEntries: [
    'name',
    'slug',
    'latinName',
    'family',
    'origin',
    'partsUsed',
    'activeCompounds',
    'harvest',
    'form',
    'conservation',
    'category',
    'tags',
    'shortDescription',
    'longDescription',
  ],
  blogPosts: ['title', 'slug', 'excerpt', 'category', 'tags', 'content'],
  benefits: ['name', 'slug', 'icon', 'bodyRegion', 'shortDescription'],
  products: ['name', 'slug', 'shortDescription', 'ingredients', 'category', 'tags'],
  pages: ['title', 'slug'],
}

const MAX_STRING_LENGTH = 600
const MAX_ARRAY_ITEMS = 10

function truncateValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH ? value.slice(0, MAX_STRING_LENGTH) + '…' : value
  }
  if (Array.isArray(value)) {
    const slice = value.slice(0, MAX_ARRAY_ITEMS)
    return slice.map((item) => truncateValue(item))
  }
  if (typeof value === 'object') {
    // Keep nested objects shallow but truncated
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = truncateValue(v)
    }
    return out
  }
  return value
}

export function sanitizeContext(
  collection: string,
  raw: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const allowed = EXPOSABLE_FIELDS[collection]
  if (!allowed || !raw) return {}
  const out: Record<string, unknown> = {}
  for (const key of allowed) {
    if (!(key in raw)) continue
    const value = raw[key]
    if (value === null || value === undefined) continue
    out[key] = truncateValue(value)
  }
  return out
}
