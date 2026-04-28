import 'server-only'

import { calcCostEur } from './ai-pricing'
import { groundedSearch } from './gemini-grounding'

/**
 * Trends discovery via Gemini grounding.
 *
 * Asks Gemini-with-Google-Search to surface plant names (for the wiki) or
 * editorial topics (for the blog) that are currently trending in herbal /
 * phytotherapy / natural-wellness conversations.
 *
 * The autopilot consumes these candidates, deduplicates them against existing
 * content via embeddings, and feeds one into the content orchestrator.
 */

export type TopicCandidate = {
  kind: 'wiki' | 'blog'
  /** Plant name (wiki) OR editorial article title (blog). */
  seed: string
  /** Suggested angle for blog posts. */
  brief?: string
  /** 0..1, 1 = ultra-trending. */
  trendScore: number
  /** Short justification of why this is trending. */
  rationale: string
  /** Optional grounding citations. */
  sources?: Array<{ uri: string; title?: string }>
}

export type DiscoverResult = {
  candidates: TopicCandidate[]
  totalCostEur: number
}

const MAX_SEED_LEN = 60

function truncate(text: string, max: number): string {
  const t = (text || '').trim()
  return t.length > max ? t.slice(0, max) : t
}

function safeJsonParse<T = unknown>(raw: string): T | null {
  if (!raw) return null
  // Strip markdown code fences if Gemini wrapped the JSON.
  const cleaned = raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Try to extract the first {...} block.
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0]) as T
    } catch {
      return null
    }
  }
}

function localeRegion(locale: 'fr' | 'en'): string {
  return locale === 'fr' ? 'France et Europe francophone' : 'English-speaking countries'
}

function clampScore(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

// ─── Plants (wiki) ──────────────────────────────────────────────────────

type RawPlantCandidate = {
  name?: unknown
  latinName?: unknown
  trendScore?: unknown
  rationale?: unknown
}

export async function discoverPlantTopics(opts: {
  limit?: number
  locale?: 'fr' | 'en'
}): Promise<DiscoverResult> {
  const limit = Math.max(1, Math.min(opts.limit ?? 15, 30))
  const locale: 'fr' | 'en' = opts.locale === 'en' ? 'en' : 'fr'

  const instruction =
    `Tu es un assistant éditorial pour un site de phytothérapie. Liste ${limit} plantes médicinales / herbes / racines actuellement les plus recherchées sur le web (Google Trends, Reddit, forums santé naturelle) en ${localeRegion(locale)}. ` +
    `Réponds STRICTEMENT en JSON : ` +
    `{ "candidates": [{ "name": "string", "latinName": "string optional", "trendScore": 0..1, "rationale": "string court" }] }. ` +
    `trendScore = 1 pour ultra-trending, 0.5 pour modéré, 0.2 pour niche. ` +
    `Évite les plantes très communes (camomille, menthe poivrée, lavande) sauf si une recherche spécifique les met en avant ce mois-ci. ` +
    `Pas de markdown, pas de préambule, juste l'objet JSON.`

  const query = locale === 'fr'
    ? 'Quelles plantes médicinales sont actuellement les plus recherchées en ligne ?'
    : 'Which medicinal plants are most trending online right now?'

  let totalCostEur = 0
  let raw = ''
  let citations: Array<{ uri: string; title?: string }> = []
  try {
    const ai = await groundedSearch({
      query,
      instruction,
      maxOutputTokens: 1500,
    })
    raw = ai.text
    citations = ai.citations.map((c) => ({ uri: c.uri, title: c.title }))
    totalCostEur += calcCostEur({
      model: 'gemini-2.5-flash',
      promptTokens: ai.promptTokens,
      completionTokens: ai.completionTokens,
    })
  } catch (err) {
    console.warn('[trends-discovery] discoverPlantTopics groundedSearch failed', err)
    return { candidates: [], totalCostEur }
  }

  const parsed = safeJsonParse<{ candidates?: RawPlantCandidate[] }>(raw)
  const list = Array.isArray(parsed?.candidates) ? parsed!.candidates : []

  const seen = new Set<string>()
  const candidates: TopicCandidate[] = []
  for (const raw of list) {
    const name = typeof raw?.name === 'string' ? raw.name.trim() : ''
    const trendScore = clampScore(raw?.trendScore)
    const rationale = typeof raw?.rationale === 'string' ? raw.rationale.trim() : ''
    if (!name) continue
    if (name.length > MAX_SEED_LEN) continue
    if (trendScore < 0.2) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    candidates.push({
      kind: 'wiki',
      seed: name,
      trendScore,
      rationale: truncate(rationale, 280),
      sources: citations.length ? citations : undefined,
    })
  }

  return { candidates, totalCostEur }
}

// ─── Blog topics ───────────────────────────────────────────────────────

type RawBlogCandidate = {
  title?: unknown
  brief?: unknown
  trendScore?: unknown
  rationale?: unknown
}

export async function discoverBlogTopics(opts: {
  limit?: number
  locale?: 'fr' | 'en'
}): Promise<DiscoverResult> {
  const limit = Math.max(1, Math.min(opts.limit ?? 15, 30))
  const locale: 'fr' | 'en' = opts.locale === 'en' ? 'en' : 'fr'

  const instruction =
    `Tu es un assistant éditorial pour un blog de phytothérapie, herboristerie, médecine traditionnelle et bien-être naturel. ` +
    `Propose ${limit} sujets d'articles actuellement tendance en ${localeRegion(locale)} (questions fréquentes, préoccupations, recettes, gestes de saison). ` +
    `Formule chaque sujet comme un titre éditorial concret (ex. "Comment préparer une tisane de gingembre", pas juste "Gingembre tisane"). ` +
    `Réponds STRICTEMENT en JSON : ` +
    `{ "candidates": [{ "title": "string", "brief": "string de 2 phrases qui décrit l'angle", "trendScore": 0..1, "rationale": "string court" }] }. ` +
    `trendScore = 1 pour ultra-trending, 0.5 pour modéré, 0.2 pour niche. ` +
    `Pas de markdown, pas de préambule, juste l'objet JSON.`

  const query = locale === 'fr'
    ? 'Quels sujets autour de la phytothérapie et du bien-être naturel sont actuellement les plus recherchés en ligne ?'
    : 'Which herbalism and natural-wellness topics are most searched online right now?'

  let totalCostEur = 0
  let raw = ''
  let citations: Array<{ uri: string; title?: string }> = []
  try {
    const ai = await groundedSearch({
      query,
      instruction,
      maxOutputTokens: 1500,
    })
    raw = ai.text
    citations = ai.citations.map((c) => ({ uri: c.uri, title: c.title }))
    totalCostEur += calcCostEur({
      model: 'gemini-2.5-flash',
      promptTokens: ai.promptTokens,
      completionTokens: ai.completionTokens,
    })
  } catch (err) {
    console.warn('[trends-discovery] discoverBlogTopics groundedSearch failed', err)
    return { candidates: [], totalCostEur }
  }

  const parsed = safeJsonParse<{ candidates?: RawBlogCandidate[] }>(raw)
  const list = Array.isArray(parsed?.candidates) ? parsed!.candidates : []

  const seen = new Set<string>()
  const candidates: TopicCandidate[] = []
  for (const raw of list) {
    const title = typeof raw?.title === 'string' ? raw.title.trim() : ''
    const brief = typeof raw?.brief === 'string' ? raw.brief.trim() : ''
    const trendScore = clampScore(raw?.trendScore)
    const rationale = typeof raw?.rationale === 'string' ? raw.rationale.trim() : ''
    if (!title) continue
    if (title.length > MAX_SEED_LEN * 2) continue // titles can be longer than plant names
    if (trendScore < 0.2) continue
    const key = title.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    candidates.push({
      kind: 'blog',
      seed: truncate(title, MAX_SEED_LEN * 2),
      brief: brief ? truncate(brief, 400) : undefined,
      trendScore,
      rationale: truncate(rationale, 280),
      sources: citations.length ? citations : undefined,
    })
  }

  return { candidates, totalCostEur }
}
