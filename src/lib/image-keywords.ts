import 'server-only'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'

/**
 * Demande au LLM de produire des **mots-clés courts en anglais** propres à
 * une recherche d'images stock (Unsplash, Wikimedia). Les bibliothèques
 * d'images sont indexées massivement en anglais — un titre français long
 * (« Le thym, un allié précieux pour l'hiver ») produit zéro pertinence.
 *
 * Renvoie 3 à 5 candidats en ordre de priorité décroissante :
 *  1. Le sujet le plus spécifique (ex. "thyme herb fresh")
 *  2. Le terme botanique latin (ex. "thymus vulgaris")
 *  3. Le concept général (ex. "herbal medicine winter")
 *
 * Tolérant : retourne `[seed]` en fallback si Gemini échoue.
 */

export type ImageKeywordsInput = {
  /** Sujet brut (titre d'article ou nom de plante). */
  seed: string
  /** Type de contenu pour orienter le ton des keywords. */
  kind: 'plant' | 'blog'
  /** Optionnel : nom latin pour les plantes. */
  latinName?: string
  /** Optionnel : excerpt/long pour préciser l'angle. */
  excerpt?: string
}

const MODEL = 'gemini-2.5-flash-lite' as const

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

export type ImageKeywordsResult = {
  /** 3-5 keywords en anglais, ordre décroissant de spécificité. */
  keywords: string[]
  /** Concept noun (1-2 mots) pour la validation post-recherche. */
  conceptNoun: string
  /** Synonymes / mots équivalents pour la validation des alt_description. */
  validationTerms: string[]
  promptTokens?: number
  completionTokens?: number
}

export async function generateImageKeywords(
  input: ImageKeywordsInput,
): Promise<ImageKeywordsResult> {
  const apiKey = process.env.GEMINI_API_KEY
  const fallback: ImageKeywordsResult = {
    keywords: [input.seed.trim()].filter(Boolean),
    conceptNoun: input.seed.trim(),
    validationTerms: [input.seed.trim().toLowerCase()],
  }
  if (!apiKey) return fallback

  const promptLines = [
    `You generate stock-photo search keywords (in English) for a phytotherapy / herbalism magazine article.`,
    `The image library is Unsplash + Wikimedia Commons — both indexed in English.`,
    ``,
    `--- ARTICLE ---`,
    `Type: ${input.kind === 'plant' ? 'plant encyclopedia entry' : 'editorial blog post'}`,
    `Subject (raw, possibly French): ${clip(input.seed, 200)}`,
    input.latinName ? `Latin name: ${clip(input.latinName, 100)}` : '',
    input.excerpt ? `Excerpt: ${clip(input.excerpt, 400)}` : '',
    ``,
    `--- TASK ---`,
    `Return STRICT JSON, no markdown, no preface. Schema:`,
    `{`,
    `  "keywords": [`,
    `    "3 to 5 short English search phrases (2-4 words each), ordered from most specific to most general.",`,
    `    "Do NOT include stop words like 'the', 'a', 'for', 'and'.",`,
    `    "For plants: prefer common English name + variant (ex: 'thyme herb', 'fresh thyme leaves'). Include Latin name as one entry if available.",`,
    `    "For blog: extract the concrete subject (plant, drink, scene, season). Avoid abstract concepts ('precious ally', 'wellness journey').",`,
    `    "ALL words MUST be lowercase English."`,
    `  ],`,
    `  "conceptNoun": "1-2 words English noun naming the dominant subject (ex: 'thyme', 'chamomile tea', 'lavender field').",`,
    `  "validationTerms": ["3 to 6 English words/phrases that should appear in a valid photo's alt-description (ex: ['thyme', 'thymus', 'herbs', 'aromatic']). All lowercase."]`,
    `}`,
    ``,
    `Be specific and concrete — bad keywords ('winter mood') waste API quota.`,
  ]
  const prompt = promptLines.filter(Boolean).join('\n')

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
        temperature: 0.3,
        maxOutputTokens: 350,
      },
    })

    const result = await model.generateContent(prompt)
    const raw = result.response.text()
    const usage = result.response.usageMetadata
    const tokens = {
      promptTokens: usage?.promptTokenCount,
      completionTokens: usage?.candidatesTokenCount,
    }
    const parsed = tryParseJson(raw)
    if (!parsed) return { ...fallback, ...tokens }

    const keywords = Array.isArray(parsed.keywords)
      ? (parsed.keywords as unknown[])
          .filter((k): k is string => typeof k === 'string')
          .map((k) => k.trim().toLowerCase())
          .filter((k) => k.length > 0 && k.length <= 60)
          .slice(0, 5)
      : []

    const conceptNoun =
      typeof parsed.conceptNoun === 'string' && parsed.conceptNoun.trim().length > 0
        ? parsed.conceptNoun.trim().toLowerCase()
        : (keywords[0] ?? input.seed)

    const validationTerms = Array.isArray(parsed.validationTerms)
      ? (parsed.validationTerms as unknown[])
          .filter((k): k is string => typeof k === 'string')
          .map((k) => k.trim().toLowerCase())
          .filter((k) => k.length > 0)
          .slice(0, 8)
      : []

    if (keywords.length === 0) return { ...fallback, ...tokens }

    return {
      keywords,
      conceptNoun,
      validationTerms: validationTerms.length > 0 ? validationTerms : [conceptNoun],
      ...tokens,
    }
  } catch {
    return fallback
  }
}
