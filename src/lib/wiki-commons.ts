import 'server-only'

import type { ImageCandidate } from './web-research-types'

/**
 * Recherche d'images sur Wikimedia Commons via la MediaWiki API.
 * Filtre par licence (CC / Public Domain / GFDL) et largeur min.
 *
 * Stratégie pour limiter les requêtes :
 *  - 1 requête `list=search` (multi-résultats)
 *  - 1 requête `prop=imageinfo` groupée (jusqu'à 10 titres en une fois)
 */

const DEFAULT_TIMEOUT_MS = 8000
const USER_AGENT =
  'RemedesDeMamie-Research/1.0 (https://www.remedes-mamie.fr; contact@remedes-mamie.fr)'

const ACCEPTABLE_LICENSE_RE =
  /(cc[\s_-]?(by|0)|public[\s_-]?domain|pd-|gfdl|creative\s*commons)/i

async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      console.warn(`[wiki-commons] HTTP ${res.status} for ${url}`)
      return null
    }
    return (await res.json()) as T
  } catch (err) {
    console.warn('[wiki-commons] fetch failed', String(err))
    return null
  } finally {
    clearTimeout(timer)
  }
}

function stripHtmlTight(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

type SearchApiResponse = {
  query?: {
    search?: Array<{ title?: string; pageid?: number }>
  }
}

type ImageInfoApiResponse = {
  query?: {
    pages?: Record<
      string,
      {
        pageid?: number
        title?: string
        imageinfo?: Array<{
          url?: string
          thumburl?: string
          width?: number
          height?: number
          mime?: string
          extmetadata?: Record<string, { value?: string } | undefined>
        }>
      }
    >
  }
}

export async function searchCommonsImages(
  query: string,
  opts: { limit?: number; minWidth?: number } = {},
): Promise<ImageCandidate[]> {
  const limit = Math.min(Math.max(opts.limit ?? 5, 1), 20)
  const minWidth = opts.minWidth ?? 600
  const trimmed = query.trim()
  if (!trimmed) return []

  // 1) Search File: namespace (srnamespace=6).
  const searchUrl =
    `https://commons.wikimedia.org/w/api.php?action=query&list=search` +
    `&srsearch=${encodeURIComponent(trimmed)}&srnamespace=6&format=json` +
    `&srlimit=${limit * 2}&origin=*`
  const searchData = await fetchJsonWithTimeout<SearchApiResponse>(searchUrl)
  const titles = (searchData?.query?.search ?? [])
    .map((r) => r.title)
    .filter((t): t is string => typeof t === 'string' && t.length > 0)
  if (titles.length === 0) return []

  // Drop SVGs & doc-like files early — we want photographs.
  const photoLike = titles.filter((t) => {
    const lower = t.toLowerCase()
    return (
      !lower.endsWith('.svg') &&
      !lower.endsWith('.pdf') &&
      !lower.endsWith('.tif') &&
      !lower.endsWith('.tiff') &&
      !lower.endsWith('.ogg') &&
      !lower.endsWith('.webm')
    )
  })
  if (photoLike.length === 0) return []

  // 2) imageinfo (grouped) — up to 50 per call but we cap at 10 to stay polite.
  const batch = photoLike.slice(0, Math.min(10, limit * 2))
  const titlesParam = batch.map((t) => encodeURIComponent(t)).join('|')
  const iiprops = ['url', 'extmetadata', 'size', 'mime'].join('|')
  const infoUrl =
    `https://commons.wikimedia.org/w/api.php?action=query` +
    `&titles=${titlesParam}&prop=imageinfo&iiprop=${iiprops}&iiurlwidth=320` +
    `&format=json&formatversion=2&origin=*`
  const infoData = await fetchJsonWithTimeout<{
    query?: {
      pages?: Array<{
        pageid?: number
        title?: string
        imageinfo?: Array<{
          url?: string
          thumburl?: string
          width?: number
          height?: number
          mime?: string
          extmetadata?: Record<string, { value?: string } | undefined>
        }>
      }>
    }
  }>(infoUrl)

  // formatversion=2 returns pages as array
  const pages = infoData?.query?.pages ?? []
  const candidates: ImageCandidate[] = []
  for (const page of pages) {
    const info = page.imageinfo?.[0]
    if (!info?.url) continue
    const width = info.width ?? 0
    const height = info.height ?? 0
    const mime = info.mime ?? ''
    if (mime && !mime.startsWith('image/')) continue
    if (width > 0 && width < minWidth) continue

    const ext = info.extmetadata ?? {}
    const licenseRaw =
      ext.LicenseShortName?.value ??
      ext.License?.value ??
      ext.UsageTerms?.value ??
      ''
    const license = stripHtmlTight(String(licenseRaw))
    if (!license || !ACCEPTABLE_LICENSE_RE.test(license)) continue

    const artistRaw = ext.Artist?.value ?? ext.Credit?.value ?? ''
    const artist = stripHtmlTight(String(artistRaw)) || 'Auteur inconnu'

    const fileName = (page.title ?? '').replace(/^File:/i, '')
    let attribution = `${artist} — ${license} via Wikimedia Commons`
    if (attribution.length > 200) attribution = attribution.slice(0, 197) + '...'

    candidates.push({
      source: 'wiki-commons',
      url: info.url,
      thumbUrl: info.thumburl,
      license,
      attribution,
      width: width || undefined,
      height: height || undefined,
      fileName,
    })
    if (candidates.length >= limit) break
  }

  return candidates
}
