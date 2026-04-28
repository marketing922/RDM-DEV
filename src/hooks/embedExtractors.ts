import { richTextToPlain } from '@/lib/utils'
import type { ExtractorFn } from './embedAfterChange'

/**
 * Text extractors for each embeddable collection. They produce a single
 * "document fingerprint" string concatenating the fields most relevant for
 * semantic search. Each field is stringified defensively and empty segments
 * are dropped before joining with a ` · ` separator.
 *
 * The resulting text is always trimmed and capped at 4000 chars to stay well
 * below the model's input window while keeping the prompt cheap.
 */

const MAX_TEXT_LENGTH = 4000
const SEPARATOR = ' · '

function asString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  // If it looks like a Lexical node tree, extract text.
  if (typeof value === 'object' && value !== null && 'root' in (value as Record<string, unknown>)) {
    return richTextToPlain(value).trim()
  }
  return ''
}

/**
 * Either a plain textarea string or a Lexical node — the wiki's long
 * description has been migrated back and forth in the past, so we handle both.
 */
function anyTextual(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'object') return richTextToPlain(value).trim()
  return ''
}

/**
 * Extract a display label from a relationship value. Accepts:
 *   - plain string/number id
 *   - populated object with `name`, `title`, or `slug`
 *   - arrays of either
 */
function tagLabels(value: unknown): string[] {
  if (!value) return []
  const arr = Array.isArray(value) ? value : [value]
  const labels: string[] = []
  for (const item of arr) {
    if (!item) continue
    if (typeof item === 'string') {
      labels.push(item)
      continue
    }
    if (typeof item === 'object') {
      const rec = item as Record<string, unknown>
      const label =
        (typeof rec.name === 'string' && rec.name) ||
        (typeof rec.title === 'string' && rec.title) ||
        (typeof rec.slug === 'string' && rec.slug) ||
        ''
      if (label) labels.push(String(label).trim())
    }
  }
  return labels.filter(Boolean)
}

const BODY_REGION_LABELS: Record<string, string> = {
  tete: 'Tête',
  gorge: 'Gorge',
  respiration: 'Respiration',
  digestion: 'Digestion',
  feminin: 'Féminin',
  circulation: 'Circulation',
}

function bodyRegionLabel(value: unknown): string {
  if (typeof value !== 'string' || !value) return ''
  return BODY_REGION_LABELS[value] ?? value
}

function composeText(parts: Array<string | undefined | null>): string {
  const filtered = parts
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter((p) => p.length > 0)
  const joined = filtered.join(SEPARATOR).trim()
  if (joined.length <= MAX_TEXT_LENGTH) return joined
  return joined.slice(0, MAX_TEXT_LENGTH)
}

export const wikiEntriesExtractor: ExtractorFn = (doc) => {
  const name = asString(doc.name)
  const latinName = asString(doc.latinName)
  const shortDescription = asString(doc.shortDescription)
  // longDescription is currently a textarea but was richText in prior schemas;
  // handle both shapes defensively.
  const longDescription = anyTextual(doc.longDescription)
  const family = asString(doc.family)
  const origin = asString(doc.origin)
  const partsUsed = asString(doc.partsUsed)
  const tags = tagLabels(doc.tags).join(', ')

  const text = composeText([
    name,
    latinName,
    shortDescription,
    longDescription,
    family,
    origin,
    partsUsed,
    tags,
  ])

  return {
    text,
    locale: typeof doc.locale === 'string' ? doc.locale : undefined,
    meta: {
      name: name || undefined,
      latinName: latinName || undefined,
    },
  }
}

export const blogPostsExtractor: ExtractorFn = (doc) => {
  const title = asString(doc.title)
  const excerpt = asString(doc.excerpt)
  const content = anyTextual(doc.content)
  const tags = tagLabels(doc.tags).join(', ')

  const text = composeText([title, excerpt, content, tags])

  return {
    text,
    locale: typeof doc.locale === 'string' ? doc.locale : undefined,
    meta: {
      title: title || undefined,
    },
  }
}

export const benefitsExtractor: ExtractorFn = (doc) => {
  const name = asString(doc.name)
  const shortDescription = asString(doc.shortDescription)
  const bodyRegion = bodyRegionLabel(doc.bodyRegion)
  const tags = tagLabels(doc.tags).join(', ')

  const text = composeText([name, shortDescription, bodyRegion, tags])

  return {
    text,
    locale: typeof doc.locale === 'string' ? doc.locale : undefined,
    meta: {
      name: name || undefined,
      bodyRegion: bodyRegion || undefined,
    },
  }
}

export const productsExtractor: ExtractorFn = (doc) => {
  const name = asString(doc.name)
  const shortDescription = asString(doc.shortDescription)
  const ingredients = asString(doc.ingredients)
  const tags = tagLabels(doc.tags).join(', ')

  const text = composeText([name, shortDescription, ingredients, tags])

  return {
    text,
    locale: typeof doc.locale === 'string' ? doc.locale : undefined,
    meta: {
      name: name || undefined,
      sku: asString(doc.sku) || undefined,
    },
  }
}
