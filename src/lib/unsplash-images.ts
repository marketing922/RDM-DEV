import 'server-only'

import type { ImageCandidate } from './web-research-types'

/**
 * Recherche d'images sur Unsplash pour les articles éditoriaux.
 *
 * Pourquoi Unsplash : Wikimedia Commons est excellent pour les fiches plantes
 * (photos botaniques licenciées CC), mais souvent trop "encyclopédique" pour
 * un article de blog grand-public. Unsplash propose des photos éditoriales
 * adaptées au ton chaleureux du magazine, sous licence libre (Unsplash
 * License — usage commercial autorisé, attribution appréciée).
 *
 * Best-effort :
 *  - Silencieux si UNSPLASH_ACCESS_KEY n'est pas défini.
 *  - Quota 50 req/h ; on cap à 1 appel par production.
 *  - Filtre qualité : minWidth, likes, alt_description non vide.
 *  - Filtre pertinence : si `validationTerms` fourni, on ne garde que les
 *    photos dont l'alt_description contient au moins un terme.
 */

const UNSPLASH_API = 'https://api.unsplash.com/search/photos'
const DEFAULT_TIMEOUT_MS = 8000

type UnsplashSearchResponse = {
  results?: Array<{
    id: string
    description: string | null
    alt_description: string | null
    width: number
    height: number
    likes?: number
    urls?: {
      regular?: string
      full?: string
      raw?: string
      small?: string
      thumb?: string
    }
    links?: { html?: string }
    user?: { name?: string; username?: string; links?: { html?: string } }
    tags?: Array<{ title?: string; type?: string }>
  }>
}

async function fetchJsonWithTimeout<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    })
    if (!res.ok) {
      console.warn(`[unsplash] HTTP ${res.status} for ${url}`)
      return null
    }
    return (await res.json()) as T
  } catch (err) {
    console.warn('[unsplash] fetch failed', String(err))
    return null
  } finally {
    clearTimeout(timer)
  }
}

export type UnsplashSearchOptions = {
  /** Max photos to return. Default 4. */
  limit?: number
  /** Locale for content (fr / en). Adjusts search keywords slightly. */
  locale?: 'fr' | 'en'
  /** Minimum image width to accept. Default 1200. */
  minWidth?: number
  /** Orientation hint (Unsplash supports landscape/portrait/squarish). */
  orientation?: 'landscape' | 'portrait' | 'squarish'
  /** Minimum likes count — quality proxy. Default 30. */
  minLikes?: number
  /**
   * If provided, the photo must contain at least one of these terms in its
   * `alt_description`, `description` or `tags` (case-insensitive). Filters
   * out off-topic results. Pass [] or omit to skip the filter.
   */
  validationTerms?: string[]
  /** Order: 'relevant' (default) or 'latest' or 'editorial'. */
  orderBy?: 'relevant' | 'latest' | 'editorial'
}

function normalizeForMatch(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function passesValidation(
  photo: NonNullable<UnsplashSearchResponse['results']>[number],
  terms: string[],
): boolean {
  if (!terms.length) return true
  const haystack = normalizeForMatch(
    [
      photo.alt_description ?? '',
      photo.description ?? '',
      ...(photo.tags ?? []).map((t) => t?.title ?? ''),
    ].join(' '),
  )
  if (!haystack.trim()) return false
  for (const term of terms) {
    const t = normalizeForMatch(term).trim()
    if (!t) continue
    if (haystack.includes(t)) return true
  }
  return false
}

export async function searchUnsplashImages(
  query: string,
  opts: UnsplashSearchOptions = {},
): Promise<ImageCandidate[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) return []

  const cleanQuery = query.trim()
  if (!cleanQuery) return []

  const limit = Math.max(1, Math.min(10, opts.limit ?? 4))
  const minWidth = opts.minWidth ?? 1200
  const minLikes = opts.minLikes ?? 30
  const orientation = opts.orientation ?? 'landscape'
  const orderBy = opts.orderBy ?? 'relevant'
  const lang = opts.locale === 'en' ? 'en' : 'fr'
  const validationTerms = (opts.validationTerms ?? []).map((t) => t.trim()).filter(Boolean)

  const params = new URLSearchParams({
    query: cleanQuery,
    // Pull more than we need so we can filter aggressively.
    per_page: String(Math.min(20, limit * 4 + 4)),
    orientation,
    content_filter: 'high',
    lang,
    order_by: orderBy,
  })

  const data = await fetchJsonWithTimeout<UnsplashSearchResponse>(
    `${UNSPLASH_API}?${params.toString()}`,
    {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    },
  )

  if (!data?.results || !data.results.length) return []

  const out: ImageCandidate[] = []
  for (const r of data.results) {
    // Quality gates : taille, likes, alt non vide.
    if (r.width < minWidth) continue
    if ((r.likes ?? 0) < minLikes) continue
    const altDesc = (r.alt_description ?? '').trim()
    if (!altDesc) continue
    // Topic relevance gate.
    if (!passesValidation(r, validationTerms)) continue

    // `regular` = 1080w optimized JPEG (Unsplash's recommended display size).
    // `full` is the raw original (huge); we don't need it.
    const url = r.urls?.regular || r.urls?.full
    const thumbUrl = r.urls?.small || r.urls?.thumb
    if (!url) continue

    const photographer = r.user?.name || r.user?.username || 'Unsplash'
    const photoLink = r.links?.html ?? `https://unsplash.com/photos/${r.id}`
    const attribution = `Photo : ${photographer} sur Unsplash`

    out.push({
      source: 'unsplash',
      url,
      thumbUrl,
      width: r.width,
      height: r.height,
      mime: 'image/jpeg',
      license: 'Unsplash License',
      attribution,
      fileName: `unsplash-${r.id}.jpg`,
      sourcePage: photoLink,
    })

    if (out.length >= limit) break
  }
  return out
}
