import 'server-only'

/**
 * Helpers Wikipedia REST + MediaWiki API.
 * Pas d'auth, pas de coût IA — juste timeouts et erreurs maîtrisées.
 *
 * Limitations V1 :
 * - Parsing HTML wiki à la regex (suffisant pour summary + sections)
 * - Pas de gestion des redirects multi-niveaux (l'API REST les suit déjà côté serveur)
 */

export type WikiSummary = {
  title: string
  extract: string
  thumbnail?: { source: string; width?: number; height?: number }
  url: string
}

export type WikiSection = {
  level: number
  title: string
  anchor?: string
}

export type WikiContent = {
  title: string
  /** Premier paragraphe nettoyé (texte plain). */
  extract: string
  /** Concaténation des 6 premiers paragraphes (texte plain). */
  longExtract: string
  sections: WikiSection[]
  /** Map clé → valeur extraites de l'infobox principale (taxobox/infobox_v2). */
  infobox?: Record<string, string>
  /** Filenames d'images (sans préfixe "File:"). */
  images: string[]
  url: string
}

const DEFAULT_TIMEOUT_MS = 8000
const USER_AGENT =
  'RemedesDeMamie-Research/1.0 (https://www.remedes-mamie.fr; contact@remedes-mamie.fr)'

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function getPageSummary(
  title: string,
  locale: 'fr' | 'en' = 'fr',
): Promise<WikiSummary | null> {
  const encoded = encodeURIComponent(title.replace(/ /g, '_'))
  const url = `https://${locale}.wikipedia.org/api/rest_v1/page/summary/${encoded}`
  try {
    const res = await fetchWithTimeout(url)
    if (res.status === 404) return null
    if (!res.ok) {
      console.warn(`[wikipedia-fetch] summary HTTP ${res.status} for "${title}" (${locale})`)
      return null
    }
    const data = (await res.json()) as {
      title?: string
      extract?: string
      thumbnail?: { source?: string; width?: number; height?: number }
      content_urls?: { desktop?: { page?: string } }
      type?: string
    }
    if (data?.type === 'disambiguation') {
      // On garde l'extract mais signale via le warning au caller
      // (le caller pourra décider de chercher une variante).
    }
    if (!data?.title || !data?.extract) return null
    return {
      title: data.title,
      extract: data.extract,
      thumbnail: data.thumbnail?.source
        ? {
            source: data.thumbnail.source,
            width: data.thumbnail.width,
            height: data.thumbnail.height,
          }
        : undefined,
      url:
        data.content_urls?.desktop?.page ??
        `https://${locale}.wikipedia.org/wiki/${encoded}`,
    }
  } catch (err) {
    console.warn('[wikipedia-fetch] summary failed', { title, locale, err: String(err) })
    return null
  }
}

/**
 * Strip basic HTML tags & wiki refs, decode common entities.
 * Suffisant pour produire un texte "plain" lisible. Pas un parseur HTML complet.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<sup[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#160;/g, ' ')
    .replace(/\[\d+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract paragraphs from parsed HTML by isolating top-level <p>...</p> blocks.
 * Naive (no DOM), but stable for the typical Wikipedia article structure.
 */
function extractParagraphs(html: string): string[] {
  const paragraphs: string[] = []
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    const text = stripHtml(match[1] ?? '')
    if (text.length >= 40) paragraphs.push(text)
  }
  return paragraphs
}

/**
 * Extract infobox key/value pairs.
 * Wikipedia FR utilise des classes "infobox_v2", "infobox_v3", "taxobox", etc.
 * On capture le 1er bloc table.infobox* puis on parse <th>/<td>.
 */
function extractInfobox(html: string): Record<string, string> | undefined {
  const tableMatch = html.match(
    /<table[^>]*class="[^"]*(?:infobox|taxobox|biota)[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
  )
  if (!tableMatch) return undefined
  const tableHtml = tableMatch[1] ?? ''
  const out: Record<string, string> = {}
  const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
  let rowMatch: RegExpExecArray | null
  while ((rowMatch = rowRe.exec(tableHtml)) !== null) {
    const rowHtml = rowMatch[1] ?? ''
    const thMatch = rowHtml.match(/<th\b[^>]*>([\s\S]*?)<\/th>/i)
    const tdMatch = rowHtml.match(/<td\b[^>]*>([\s\S]*?)<\/td>/i)
    if (thMatch && tdMatch) {
      const key = stripHtml(thMatch[1] ?? '')
      const value = stripHtml(tdMatch[1] ?? '')
      if (key && value && key.length < 80) out[key] = value
    }
  }
  return Object.keys(out).length > 0 ? out : undefined
}

function extractSections(
  parseSections: Array<{ toclevel?: number; line?: string; anchor?: string }> | undefined,
): WikiSection[] {
  if (!Array.isArray(parseSections)) return []
  return parseSections
    .map((s) => ({
      level: typeof s.toclevel === 'number' ? s.toclevel : 1,
      title: typeof s.line === 'string' ? stripHtml(s.line) : '',
      anchor: typeof s.anchor === 'string' ? s.anchor : undefined,
    }))
    .filter((s) => s.title.length > 0)
}

export async function getPageContent(
  title: string,
  locale: 'fr' | 'en' = 'fr',
): Promise<WikiContent | null> {
  const encoded = encodeURIComponent(title.replace(/ /g, '_'))
  const url =
    `https://${locale}.wikipedia.org/w/api.php?action=parse` +
    `&page=${encoded}&format=json&prop=text|sections|images|displaytitle` +
    `&formatversion=2&redirects=1&origin=*`

  try {
    const res = await fetchWithTimeout(url)
    if (!res.ok) {
      console.warn(`[wikipedia-fetch] parse HTTP ${res.status} for "${title}" (${locale})`)
      return null
    }
    const json = (await res.json()) as {
      error?: { code?: string; info?: string }
      parse?: {
        title?: string
        displaytitle?: string
        text?: string
        sections?: Array<{ toclevel?: number; line?: string; anchor?: string }>
        images?: string[]
      }
    }
    if (json?.error || !json?.parse) {
      // 404-ish (missingtitle) → null silencieux
      if (json?.error?.code === 'missingtitle') return null
      console.warn('[wikipedia-fetch] parse error', json?.error)
      return null
    }
    const parse = json.parse
    const html = parse.text ?? ''
    const paragraphs = extractParagraphs(html)
    const extract = paragraphs[0] ?? ''
    const longExtract = paragraphs.slice(0, 6).join('\n\n')
    const infobox = extractInfobox(html)
    const sections = extractSections(parse.sections)
    const images = Array.isArray(parse.images)
      ? parse.images.filter((f): f is string => typeof f === 'string')
      : []
    const finalTitle = stripHtml(parse.displaytitle ?? parse.title ?? title)
    return {
      title: finalTitle,
      extract,
      longExtract,
      sections,
      infobox,
      images,
      url: `https://${locale}.wikipedia.org/wiki/${encoded}`,
    }
  } catch (err) {
    console.warn('[wikipedia-fetch] parse failed', { title, locale, err: String(err) })
    return null
  }
}
