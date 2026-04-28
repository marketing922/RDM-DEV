import 'server-only'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'
import { getGeoFieldSpec, getPromptWithVersion } from './ai/prompts'

export type GeoFieldType =
  | 'directAnswer'
  | 'definition'
  | 'keyTakeaways'
  | 'faq'

export type GeoLocale = 'fr' | 'en'

export type GeoContext = {
  kind: 'plant' | 'benefit' | 'article' | 'page'
  id?: string | number
  name?: string
  latinName?: string
  shortDescription?: string
  longDescription?: string
  category?: string
  tags?: string[]
  content?: string
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const contextBlock = (ctx: GeoContext, locale: GeoLocale): string => {
  const labels = locale === 'en'
    ? {
        kind: 'Content type',
        name: 'Name',
        latin: 'Latin name',
        category: 'Category',
        tags: 'Tags',
        short: 'Short description',
        long: 'Long description',
        content: 'Editorial content',
      }
    : {
        kind: 'Type de contenu',
        name: 'Nom',
        latin: 'Nom latin',
        category: 'Catégorie',
        tags: 'Tags',
        short: 'Description courte',
        long: 'Description longue',
        content: 'Contenu rédactionnel',
      }

  const lines: string[] = []
  lines.push(`${labels.kind} : ${escapeXml(ctx.kind)}`)
  if (ctx.name) lines.push(`${labels.name} : ${escapeXml(ctx.name)}`)
  if (ctx.latinName) lines.push(`${labels.latin} : ${escapeXml(ctx.latinName)}`)
  if (ctx.category) lines.push(`${labels.category} : ${escapeXml(ctx.category)}`)
  if (ctx.tags?.length) lines.push(`${labels.tags} : ${escapeXml(ctx.tags.join(', '))}`)
  if (ctx.shortDescription) lines.push(`${labels.short} : ${escapeXml(ctx.shortDescription)}`)
  if (ctx.longDescription) {
    const trimmed = ctx.longDescription.slice(0, 1500)
    lines.push(`${labels.long} : ${escapeXml(trimmed)}${ctx.longDescription.length > 1500 ? '…' : ''}`)
  }
  if (ctx.content) {
    const trimmed = ctx.content.slice(0, 4000)
    lines.push(`${labels.content} :\n${escapeXml(trimmed)}${ctx.content.length > 4000 ? '…' : ''}`)
  }
  return `<document_content locked="true">\n${lines.join('\n')}\n</document_content>`
}

const extractJson = (raw: string): any => {
  const clean = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  try {
    return JSON.parse(clean)
  } catch {
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Invalid JSON from generator')
  }
}

export type GenerateResult =
  | { field: 'directAnswer' | 'definition'; text: string }
  | { field: 'keyTakeaways'; items: string[] }
  | { field: 'faq'; items: Array<{ question: string; answer: string }> }

export type GeoGenerateResponse = GenerateResult & {
  promptTokens?: number
  completionTokens?: number
  model: string
  /** Versions of the prompts used to produce this response (for audit). */
  promptVersion?: string
}

export async function generateGeoField(
  field: GeoFieldType,
  ctx: GeoContext,
  locale: GeoLocale = 'fr',
): Promise<GeoGenerateResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY manquante dans les variables d\'environnement')
  }

  const fieldSpec = getGeoFieldSpec(field, locale)
  const sysResolved = getPromptWithVersion({ kind: 'geoSystem', locale })
  const promptVersion = `geoSystem:${sysResolved.version}+geo.${field}:${fieldSpec.version}`

  const taskHeader = locale === 'en' ? '--- CONTEXT ---' : '--- CONTEXTE ---'
  const outputHeader = locale === 'en' ? '--- OUTPUT FORMAT ---' : '--- FORMAT DE SORTIE ---'

  const prompt = [
    fieldSpec.instruction,
    '',
    taskHeader,
    contextBlock(ctx, locale),
    '',
    outputHeader,
    fieldSpec.schemaHint,
  ].join('\n')

  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
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
      maxOutputTokens: 1024,
    },
  })

  const result = await model.generateContent(prompt)
  const raw = result.response.text()
  const usage = result.response.usageMetadata
  const parsed = extractJson(raw)

  const meta = {
    model: 'gemini-2.5-flash-lite',
    promptTokens: usage?.promptTokenCount,
    completionTokens: usage?.candidatesTokenCount,
    promptVersion,
  }

  if (field === 'directAnswer' || field === 'definition') {
    if (typeof parsed.text !== 'string') throw new Error('Réponse sans champ text')
    return { field, text: parsed.text.trim(), ...meta }
  }

  if (field === 'keyTakeaways') {
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter((s: unknown) => typeof s === 'string')
      : []
    if (items.length === 0) throw new Error('Aucun point-clé généré')
    return { field, items: items.slice(0, 5), ...meta }
  }

  if (field === 'faq') {
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .filter(
            (x: any) => x && typeof x.question === 'string' && typeof x.answer === 'string',
          )
          .map((x: any) => ({ question: x.question.trim(), answer: x.answer.trim() }))
      : []
    if (items.length === 0) throw new Error('Aucune FAQ générée')
    return { field, items: items.slice(0, 6), ...meta }
  }

  throw new Error(`Type de champ inconnu : ${field}`)
}
