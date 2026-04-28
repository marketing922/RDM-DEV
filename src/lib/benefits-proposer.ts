import 'server-only'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'

/**
 * Asks the LLM to propose 3–6 health-benefit names that are explicitly
 * relevant to a given article (or wiki plant). Returns names only — the
 * caller is responsible for find-or-create / slug deduplication.
 *
 * Best-effort: returns empty array on any failure or when the API key is
 * missing. The benefit name is non-claim ("Digestion", "Sommeil",
 * "Système immunitaire"), never a clinical promise.
 */

export type BenefitsProposerInput = {
  title: string
  excerpt: string
  contentPlain: string
  locale: 'fr' | 'en'
  existingBenefits?: string[]
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

export type BenefitsProposalResult = {
  benefits: string[]
  promptTokens?: number
  completionTokens?: number
}

export async function proposeBenefits(
  input: BenefitsProposerInput,
): Promise<BenefitsProposalResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { benefits: [] }

  const prompt = [
    `Tu cures la taxonomie "Bienfaits santé" d'un magazine de phytothérapie.`,
    `Pour l'article ci-dessous, propose 3 à 6 noms de bienfaits factuels et non-cliniques.`,
    `Chaque nom doit être un substantif court (Title Case), sans verbe, sans promesse santé.`,
    `Bons exemples : "Digestion", "Sommeil", "Système immunitaire", "Circulation", "Stress et anxiété", "Voies respiratoires".`,
    `Mauvais exemples : "Soigne le rhume", "Guérit l'insomnie", "Élimine le stress".`,
    ``,
    `--- ARTICLE ---`,
    `Titre : ${escapeXml(clip(input.title, 200))}`,
    `Extrait : ${escapeXml(clip(input.excerpt, 400))}`,
    `Contenu : ${escapeXml(clip(input.contentPlain, 3000))}`,
    ``,
    input.existingBenefits && input.existingBenefits.length
      ? `Bienfaits déjà associés (à ne pas répéter) : ${input.existingBenefits.join(', ')}`
      : '',
    ``,
    `--- TÂCHE ---`,
    `Retourne STRICTEMENT du JSON, sans markdown, sans préambule. Schéma :`,
    `{ "benefits": ["Bienfait 1", "Bienfait 2", ...] }`,
    ``,
    `Maximum 6 entrées. Chaque entrée ≤ 30 caractères. Title Case.`,
    `Reste cohérent avec le contenu réel de l'article — pas de bienfait inventé.`,
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
        temperature: 0.4,
        maxOutputTokens: 300,
      },
    })

    const result = await model.generateContent(prompt)
    const raw = result.response.text()
    const usage = result.response.usageMetadata
    const meta = {
      promptTokens: usage?.promptTokenCount,
      completionTokens: usage?.candidatesTokenCount,
    }
    const parsed = tryParseJson(raw)
    if (!parsed) return { benefits: [], ...meta }

    const benefits = Array.isArray(parsed.benefits)
      ? (parsed.benefits as unknown[])
          .filter((t): t is string => typeof t === 'string')
          .map((t) => t.trim())
          .filter((t) => t.length > 0 && t.length <= 40)
          .slice(0, 6)
      : []

    return { benefits, ...meta }
  } catch {
    return { benefits: [] }
  }
}
