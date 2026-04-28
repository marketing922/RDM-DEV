import 'server-only'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'
import { getSeoPrompt } from './ai/prompts'

export const SEO_MODEL = 'gemini-2.5-flash-lite' as const

export type SeoLocale = 'fr' | 'en'

export type SeoCollection =
  | 'wikiEntries'
  | 'blogPosts'
  | 'benefits'
  | 'products'

export type SeoGenerateContext = {
  name?: string
  title?: string
  latinName?: string
  shortDescription?: string
  longDescription?: string
  excerpt?: string
  category?: string
  tags?: string[]
  bodyRegion?: string
}

export type SeoGenerateInput = {
  collection: SeoCollection
  context: SeoGenerateContext
  locale?: SeoLocale
  hint?: string
}

export type SeoPackResult = {
  title: string
  description: string
  keywords: string[]
  promptTokens?: number
  completionTokens?: number
  model: typeof SEO_MODEL
  promptVersion?: string
}

const FIELD_TRUNC = 600
const TITLE_MAX = 60
const DESC_MAX = 155
const KEYWORDS_MAX = 8

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function clip(value: string | undefined, max: number): string {
  if (!value) return ''
  const v = String(value).trim()
  if (v.length <= max) return v
  return v.slice(0, max).trim()
}

function buildContextBlock(
  collection: SeoCollection,
  ctx: SeoGenerateContext,
  locale: SeoLocale,
): string {
  const labels =
    locale === 'en'
      ? {
          collection: 'Collection',
          name: 'Name',
          title: 'Title',
          latin: 'Latin name',
          short: 'Short description',
          long: 'Long description',
          excerpt: 'Excerpt',
          category: 'Category',
          tags: 'Tags',
          bodyRegion: 'Body region',
        }
      : {
          collection: 'Collection',
          name: 'Nom',
          title: 'Titre',
          latin: 'Nom latin',
          short: 'Description courte',
          long: 'Description longue',
          excerpt: 'Extrait',
          category: 'Catégorie',
          tags: 'Tags',
          bodyRegion: 'Zone du corps',
        }

  const lines: string[] = []
  lines.push(`${labels.collection} : ${escapeXml(collection)}`)
  if (ctx.name) lines.push(`${labels.name} : ${escapeXml(clip(ctx.name, FIELD_TRUNC))}`)
  if (ctx.title) lines.push(`${labels.title} : ${escapeXml(clip(ctx.title, FIELD_TRUNC))}`)
  if (ctx.latinName) lines.push(`${labels.latin} : ${escapeXml(clip(ctx.latinName, FIELD_TRUNC))}`)
  if (ctx.category) lines.push(`${labels.category} : ${escapeXml(clip(ctx.category, FIELD_TRUNC))}`)
  if (ctx.bodyRegion) lines.push(`${labels.bodyRegion} : ${escapeXml(clip(ctx.bodyRegion, FIELD_TRUNC))}`)
  if (ctx.tags && ctx.tags.length) {
    lines.push(`${labels.tags} : ${escapeXml(clip(ctx.tags.join(', '), FIELD_TRUNC))}`)
  }
  if (ctx.shortDescription) {
    lines.push(`${labels.short} : ${escapeXml(clip(ctx.shortDescription, FIELD_TRUNC))}`)
  }
  if (ctx.excerpt) {
    lines.push(`${labels.excerpt} : ${escapeXml(clip(ctx.excerpt, FIELD_TRUNC))}`)
  }
  if (ctx.longDescription) {
    lines.push(`${labels.long} : ${escapeXml(clip(ctx.longDescription, FIELD_TRUNC))}`)
  }

  const body = lines.length
    ? lines.join('\n')
    : locale === 'en'
      ? '(empty document — produce a generic SEO pack from the collection name only)'
      : '(document vide — produire un pack SEO générique à partir du nom de la collection seulement)'

  return `<document_content locked="true">\n${body}\n</document_content>`
}

function extractJson(raw: string): unknown {
  const clean = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  try {
    return JSON.parse(clean)
  } catch {
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

function sanitizeKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') continue
    const trimmed = item.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
    if (out.length >= KEYWORDS_MAX) break
  }
  return out
}

export async function generateSeoPack(
  input: SeoGenerateInput,
): Promise<SeoPackResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY manquante dans les variables d\'environnement')
  }

  const locale: SeoLocale = input.locale === 'en' ? 'en' : 'fr'
  const sysResolved = getSeoPrompt(locale)
  const promptVersion = `seoPack:${sysResolved.version}`

  const taskHeader = locale === 'en' ? '--- CONTEXT ---' : '--- CONTEXTE ---'
  const outputHeader =
    locale === 'en' ? '--- OUTPUT FORMAT ---' : '--- FORMAT DE SORTIE ---'

  const hint = input.hint ? clip(input.hint, FIELD_TRUNC) : ''
  const hintLine = hint
    ? locale === 'en'
      ? `Editor hint (guidance only): ${escapeXml(hint)}`
      : `Indication éditoriale (orientation seulement) : ${escapeXml(hint)}`
    : ''

  const schemaHint =
    locale === 'en'
      ? `Return ONLY a JSON object: { "title": "…", "description": "…", "keywords": ["…", "…"] }`
      : `Retourne UNIQUEMENT un objet JSON : { "title": "…", "description": "…", "keywords": ["…", "…"] }`

  const prompt = [
    taskHeader,
    buildContextBlock(input.collection, input.context || {}, locale),
    hintLine,
    '',
    outputHeader,
    schemaHint,
  ]
    .filter(Boolean)
    .join('\n')

  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({
    model: SEO_MODEL,
    systemInstruction: sysResolved.text,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
      maxOutputTokens: 600,
    },
  })

  const result = await model.generateContent(prompt)
  const raw = result.response.text()
  const usage = result.response.usageMetadata
  if (typeof raw !== 'string') {
    throw new Error('Réponse vide de Gemini (SEO pack)')
  }

  const parsed = extractJson(raw) as
    | { title?: unknown; description?: unknown; keywords?: unknown }
    | null
    | undefined

  const meta = {
    model: SEO_MODEL,
    promptTokens: usage?.promptTokenCount,
    completionTokens: usage?.candidatesTokenCount,
    promptVersion,
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      title: '',
      description: '',
      keywords: [],
      ...meta,
    }
  }

  const titleRaw = typeof parsed.title === 'string' ? parsed.title : ''
  const descRaw = typeof parsed.description === 'string' ? parsed.description : ''
  const title = clip(titleRaw, TITLE_MAX)
  const description = clip(descRaw, DESC_MAX)
  const keywords = sanitizeKeywords(parsed.keywords)

  return {
    title,
    description,
    keywords,
    ...meta,
  }
}
