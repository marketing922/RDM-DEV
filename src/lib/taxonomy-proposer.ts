import 'server-only'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'

/**
 * Asks the LLM to propose 3–6 relevant tags + 1 category derived from the
 * actual article subject. Tags returned by name (no slug); the caller is
 * responsible for find-or-create / slug deduplication. Best-effort: returns
 * empty arrays on any failure.
 */

export type TaxonomyProposal = {
  tags: string[]
  category?: string
  promptTokens?: number
  completionTokens?: number
}

export type TaxonomyProposerInput = {
  title: string
  excerpt: string
  contentPlain: string
  locale: 'fr' | 'en'
  existingTags?: string[]
  existingCategories?: string[]
}

const MODEL = 'gemini-2.5-flash-lite' as const

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function clip(s: string | undefined, max: number): string {
  if (!s) return ''
  const v = s.trim()
  return v.length > max ? v.slice(0, max).trim() : v
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

export async function proposeTaxonomy(
  input: TaxonomyProposerInput,
): Promise<TaxonomyProposal> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { tags: [], category: undefined }

  const language = input.locale === 'en' ? 'English' : 'French'

  const prompt = [
    `You curate the editorial taxonomy of a phytotherapy / herbalism magazine.`,
    `From the article below, propose tags and a category in ${language}.`,
    ``,
    `--- ARTICLE ---`,
    `Title: ${escapeXml(clip(input.title, 200))}`,
    `Excerpt: ${escapeXml(clip(input.excerpt, 400))}`,
    `Content: ${escapeXml(clip(input.contentPlain, 3000))}`,
    ``,
    input.existingTags && input.existingTags.length
      ? `Existing tags already assigned (avoid duplicating): ${input.existingTags.join(', ')}`
      : '',
    input.existingCategories && input.existingCategories.length
      ? `Existing categories already considered: ${input.existingCategories.join(', ')}`
      : '',
    ``,
    `--- TASK ---`,
    `Return STRICT JSON, no markdown, no preface. Schema:`,
    `{`,
    `  "tags": ["3 to 6 short, lowercase-friendly tag labels — concrete subject keywords from THIS article (plant names, organs, body system, traditional use, season, etc.). Each ≤30 chars."],`,
    `  "category": "ONE high-level category label that fits the article's editorial bucket (ex: 'Plantes médicinales', 'Bien-être', 'Traditions', 'Recettes', 'Conseils saisonniers'). ≤40 chars."`,
    `}`,
    ``,
    `Use Title Case for tags and category in French. Avoid generic words like "santé" or "phytothérapie". Be specific to the article.`,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({
      model: MODEL,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.5,
        maxOutputTokens: 400,
      },
    })

    const result = await model.generateContent(prompt)
    const raw = result.response.text()
    const usage = result.response.usageMetadata
    const parsed = tryParseJson(raw)
    if (!parsed)
      return {
        tags: [],
        category: undefined,
        promptTokens: usage?.promptTokenCount,
        completionTokens: usage?.candidatesTokenCount,
      }

    const tags = Array.isArray(parsed.tags)
      ? (parsed.tags as unknown[])
          .filter((t) => typeof t === 'string')
          .map((t) => (t as string).trim())
          .filter((t) => t.length > 0 && t.length <= 40)
          .slice(0, 6)
      : []

    const category =
      typeof parsed.category === 'string' && parsed.category.trim().length > 0
        ? parsed.category.trim().slice(0, 60)
        : undefined

    return {
      tags,
      category,
      promptTokens: usage?.promptTokenCount,
      completionTokens: usage?.candidatesTokenCount,
    }
  } catch {
    return { tags: [], category: undefined }
  }
}
