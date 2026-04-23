/**
 * SEO helpers for @payloadcms/plugin-seo auto-generation.
 *
 * Goal: produce titles (50–60 chars) and descriptions (100–150 chars) that
 * match Google best-practice lengths so the plugin UI stops flagging
 * "Too short" / "Too long" on newly-created documents.
 */

export const BRAND = 'Les Remèdes de Mamie'

export const TAGLINES_BY_COLLECTION: Record<string, string> = {
  wikiEntries: 'Fiche botanique détaillée',
  blogPosts: 'Journal des plantes',
  benefits: 'Bienfaits & usages traditionnels',
  pages: 'Les Remèdes de Mamie',
}

/**
 * Pick the first title variant that falls in [min, max] chars, preferring
 * the most informative composition (name · tagline | brand). Falls back to
 * a word-safe truncation if everything is too long.
 */
export function fitTitle(
  base: string,
  brand: string = BRAND,
  tagline: string = BRAND,
  min = 50,
  max = 60,
): string {
  base = (base || '').trim()
  if (!base) return brand

  const candidates = [
    `${base} · ${tagline} | ${brand}`,
    `${base} — ${tagline}`,
    `${base} | ${brand}`,
    `${base} · ${brand}`,
    base,
  ]

  const inRange = candidates.find((c) => c.length >= min && c.length <= max)
  if (inRange) return inRange

  const underMax = candidates.filter((c) => c.length <= max)
  if (underMax.length) return underMax[0]

  const suffix = ` | ${brand}`
  const room = max - suffix.length - 1 // -1 for the ellipsis char
  const safeRoom = Math.max(10, room)
  return `${base.slice(0, safeRoom).trim()}…${suffix}`
}

/**
 * Recursively collect plain text from a Lexical rich-text JSON tree.
 * Handles the standard Payload shape: { root: { children: [...] } }.
 */
export function stripLexical(rt: any): string {
  if (!rt || !rt.root || !Array.isArray(rt.root.children)) return ''
  const collect = (node: any): string => {
    if (!node) return ''
    if (typeof node.text === 'string') return node.text
    if (Array.isArray(node.children)) return node.children.map(collect).join(' ')
    return ''
  }
  return rt.root.children.map(collect).join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Trim a meta description to [min, max] chars at a word boundary.
 * If too short, return as-is (let the editor extend it manually).
 */
export function fitDescription(base: string, min = 100, max = 150): string {
  base = (base || '').replace(/\s+/g, ' ').trim()
  if (!base) return ''
  if (base.length >= min && base.length <= max) return base
  if (base.length < min) return base

  const cut = base.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  const end = lastSpace > 80 ? lastSpace : cut.length
  return `${cut.slice(0, end)}…`
}

/**
 * Pull the first usable text from a Pages `layout` blocks array.
 * Tries hero subheading/heading, then richText content blocks.
 */
function extractPageLayoutText(layout: any[]): string {
  if (!Array.isArray(layout)) return ''
  for (const block of layout) {
    if (!block) continue
    if (block.blockType === 'hero') {
      const t = block.subheading || block.heading
      if (t) return String(t)
    }
    if (block.blockType === 'content' && block.richText) {
      const t = stripLexical(block.richText)
      if (t) return t
    }
    if (block.blockType === 'cta') {
      const t = block.description || block.heading
      if (t) return String(t)
    }
  }
  return ''
}

/**
 * Safely extract a string from a potentially-localized field.
 * Payload localized fields come through as `{ fr: "...", en: "..." }`
 * depending on the caller's API shape, or as a plain string when the
 * current locale is already resolved. This handles both cases.
 */
function localizedText(v: any, locale?: string): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') {
    if (locale && typeof v[locale] === 'string') return v[locale]
    if (typeof v.fr === 'string') return v.fr
    if (typeof v.en === 'string') return v.en
  }
  return ''
}

/**
 * Resolve the best source text for a meta description, per collection.
 * Order reflects what an editor is most likely to have filled in first.
 * Always returns SOMETHING — falls back to the doc's name/title so the
 * Auto-generate button never leaves the field empty.
 */
export function resolveDescriptionSource(
  doc: any,
  collectionSlug?: string,
  locale?: string,
): string {
  const d = doc || {}
  const g = (field: string) => localizedText(d[field], locale)
  let result = ''
  switch (collectionSlug) {
    case 'wikiEntries':
      result =
        g('shortDescription') ||
        g('longDescription') ||
        stripLexical(d.description) ||
        g('latinName') ||
        ''
      break
    case 'blogPosts':
      result = g('excerpt') || stripLexical(d.content) || ''
      break
    case 'benefits':
      result = g('shortDescription') || stripLexical(d.description) || ''
      break
    case 'pages':
      result = g('excerpt') || extractPageLayoutText(d.layout) || ''
      break
    default:
      result = g('excerpt') || g('shortDescription') || ''
  }
  // Last-chance fallback: use the document's display name so the button
  // never appears inert to the editor.
  if (!result) {
    const label = g('name') || g('title') || ''
    if (label) result = `${label} — ${BRAND}, l'almanach des plantes qui soignent depuis toujours.`
  }
  return result
}

/**
 * Find the first attached media id on a doc, checking common field names.
 * Returns `undefined` when nothing suitable is available.
 */
export function resolveImageId(doc: any): string | number | undefined {
  const d = doc || {}
  if (d?.featuredImage?.id) return d.featuredImage.id
  if (typeof d?.featuredImage === 'string' || typeof d?.featuredImage === 'number') {
    return d.featuredImage
  }
  if (d?.heroImage?.id) return d.heroImage.id
  if (Array.isArray(d?.images) && d.images[0]?.image?.id) return d.images[0].image.id
  if (Array.isArray(d?.images) && typeof d.images[0]?.image === 'string') return d.images[0].image
  return undefined
}
