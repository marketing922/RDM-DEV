import 'server-only'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'

/**
 * Single batched Gemini call to fill the GEO fields that aren't covered by
 * `generateGeoField` (which only handles directAnswer / definition /
 * keyTakeaways / faq).
 *
 * Returns:
 *  - quotableStatements  array<{ statement, source? }>
 *  - dataPoints          array<{ metric, value, unit?, source? }>
 *  - sources             array<{ title, publisher?, year?, url? }>
 *  - targetAIQueries     array<{ query }>
 *  - authoritySignals    string
 *
 * All optional — best-effort, never throws on parse errors.
 */

export const GEO_EXTRAS_MODEL = 'gemini-2.5-flash-lite' as const

export type GeoExtrasContext = {
  kind: 'plant' | 'article'
  name: string
  latinName?: string
  shortDescription?: string
  longDescription?: string
  factsBlock?: string
  category?: string
  tags?: string[]
}

export type GeoExtrasResult = {
  quotableStatements: Array<{ statement: string; source?: string }>
  dataPoints: Array<{ metric: string; value: string; unit?: string; source?: string }>
  sources: Array<{ title: string; publisher?: string; year?: number; url?: string }>
  targetAIQueries: Array<{ query: string }>
  authoritySignals: string
  promptTokens?: number
  completionTokens?: number
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function clip(s: string | undefined, max: number): string {
  if (!s) return ''
  const v = s.trim()
  return v.length > max ? v.slice(0, max).trim() : v
}

function buildContextBlock(ctx: GeoExtrasContext): string {
  const lines: string[] = []
  lines.push(`Type : ${ctx.kind === 'plant' ? 'plante médicinale' : 'article éditorial'}`)
  lines.push(`Sujet : ${escapeXml(clip(ctx.name, 200))}`)
  if (ctx.latinName) lines.push(`Nom latin : ${escapeXml(clip(ctx.latinName, 100))}`)
  if (ctx.category) lines.push(`Catégorie : ${escapeXml(clip(ctx.category, 100))}`)
  if (ctx.tags && ctx.tags.length) {
    lines.push(`Tags : ${escapeXml(clip(ctx.tags.join(', '), 200))}`)
  }
  if (ctx.shortDescription) {
    lines.push(`Résumé : ${escapeXml(clip(ctx.shortDescription, 400))}`)
  }
  if (ctx.longDescription) {
    lines.push(`Texte long : ${escapeXml(clip(ctx.longDescription, 1500))}`)
  }
  if (ctx.factsBlock) {
    lines.push(`Faits collectés :\n${escapeXml(clip(ctx.factsBlock, 2000))}`)
  }
  return lines.join('\n')
}

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function tryParseJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (!m) return null
    try {
      return JSON.parse(m[0]) as Record<string, unknown>
    } catch {
      return null
    }
  }
}

export async function generateGeoExtras(
  ctx: GeoExtrasContext,
): Promise<GeoExtrasResult> {
  const apiKey = process.env.GEMINI_API_KEY
  const empty: GeoExtrasResult = {
    quotableStatements: [],
    dataPoints: [],
    sources: [],
    targetAIQueries: [],
    authoritySignals: '',
  }
  if (!apiKey) return empty

  const prompt = [
    `Tu produis des extraits structurés "prêts à être cités" par les LLM (ChatGPT, Perplexity, AI Overviews) pour un contenu de phytothérapie.`,
    `Réponds STRICTEMENT en JSON valide UTF-8, sans markdown, sans préambule.`,
    `Aucune allégation santé, aucune promesse de guérison. Reste factuel et sourcé.`,
    ``,
    `--- CONTEXTE ---`,
    buildContextBlock(ctx),
    ``,
    `--- TÂCHE ---`,
    `Produis un JSON avec EXACTEMENT ces clés :`,
    `{`,
    `  "quotableStatements": [`,
    `    { "statement": "phrase ≤25 mots, factuelle, vérifiable", "source": "publication ou organisation" }`,
    `  ],   // 3 à 5 entrées`,
    `  "dataPoints": [`,
    `    { "metric": "ex: Temps d'endormissement", "value": "ex: 15", "unit": "ex: minutes", "source": "ex: étude X 2022" }`,
    `  ],   // 4 à 8 entrées, unités SI préférées`,
    `  "sources": [`,
    `    { "title": "titre de la publication", "publisher": "éditeur", "year": 2023, "url": "https://…" }`,
    `  ],   // 3 à 6 sources primaires (EMA/HMPC, ANSES, PubMed, monographies, Wikipedia FR)`,
    `  "targetAIQueries": [`,
    `    { "query": "Question naturelle qu'un utilisateur poserait à ChatGPT" }`,
    `  ],   // 4 à 6 requêtes`,
    `  "authoritySignals": "1 paragraphe (≤300 caractères) listant credentials/affiliations/références qui renforcent la confiance du contenu"`,
    `}`,
    ``,
    `Aucune autre clé. Pas de commentaire. JSON UNIQUEMENT.`,
  ].join('\n')

  try {
    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({
      model: GEO_EXTRAS_MODEL,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
        maxOutputTokens: 1800,
      },
    })

    const result = await model.generateContent(prompt)
    const raw = result.response.text()
    const usage = result.response.usageMetadata
    const parsed = tryParseJson(raw)
    if (!parsed) {
      return {
        ...empty,
        promptTokens: usage?.promptTokenCount,
        completionTokens: usage?.candidatesTokenCount,
      }
    }

    const quotableStatements = safeArray<{ statement?: unknown; source?: unknown }>(
      parsed.quotableStatements,
    )
      .map((x) => ({
        statement: typeof x.statement === 'string' ? x.statement.trim() : '',
        source: typeof x.source === 'string' ? x.source.trim() : undefined,
      }))
      .filter((x) => x.statement.length > 0)
      .slice(0, 5)

    const dataPoints = safeArray<{
      metric?: unknown
      value?: unknown
      unit?: unknown
      source?: unknown
    }>(parsed.dataPoints)
      .map((x) => ({
        metric: typeof x.metric === 'string' ? x.metric.trim() : '',
        value: typeof x.value === 'string' ? x.value.trim() : String(x.value ?? '').trim(),
        unit: typeof x.unit === 'string' ? x.unit.trim() : undefined,
        source: typeof x.source === 'string' ? x.source.trim() : undefined,
      }))
      .filter((x) => x.metric.length > 0 && x.value.length > 0)
      .slice(0, 10)

    const sources = safeArray<{
      title?: unknown
      publisher?: unknown
      year?: unknown
      url?: unknown
    }>(parsed.sources)
      .map((x) => {
        const yr = typeof x.year === 'number' ? x.year : Number(x.year)
        return {
          title: typeof x.title === 'string' ? x.title.trim() : '',
          publisher: typeof x.publisher === 'string' ? x.publisher.trim() : undefined,
          year: Number.isFinite(yr) ? yr : undefined,
          url: typeof x.url === 'string' ? x.url.trim() : undefined,
        }
      })
      .filter((x) => x.title.length > 0)
      .slice(0, 8)

    const targetAIQueries = safeArray<{ query?: unknown }>(parsed.targetAIQueries)
      .map((x) => ({ query: typeof x.query === 'string' ? x.query.trim() : '' }))
      .filter((x) => x.query.length > 0)
      .slice(0, 8)

    const authoritySignals =
      typeof parsed.authoritySignals === 'string'
        ? clip(parsed.authoritySignals, 600)
        : ''

    return {
      quotableStatements,
      dataPoints,
      sources,
      targetAIQueries,
      authoritySignals,
      promptTokens: usage?.promptTokenCount,
      completionTokens: usage?.candidatesTokenCount,
    }
  } catch {
    return empty
  }
}

/**
 * Lightweight self-scoring of GEO completeness based on filled buckets.
 * 0..100. Used for `geoReadinessScore` field.
 */
export function computeGeoReadinessScore(input: {
  hasDirectAnswer: boolean
  hasDefinition: boolean
  keyTakeawaysCount: number
  faqCount: number
  quotableStatementsCount: number
  dataPointsCount: number
  sourcesCount: number
  targetAIQueriesCount: number
  hasAuthoritySignals: boolean
}): number {
  let score = 0
  if (input.hasDirectAnswer) score += 12
  if (input.hasDefinition) score += 10
  score += Math.min(15, input.keyTakeawaysCount * 3)
  score += Math.min(15, input.faqCount * 3)
  score += Math.min(12, input.quotableStatementsCount * 3)
  score += Math.min(12, input.dataPointsCount * 2)
  score += Math.min(12, input.sourcesCount * 2)
  score += Math.min(8, input.targetAIQueriesCount * 2)
  if (input.hasAuthoritySignals) score += 4
  return Math.max(0, Math.min(100, score))
}
