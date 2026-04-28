import 'server-only'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'
import { getPromptWithVersion } from './ai/prompts'

export const MODERATION_MODEL = 'gemini-2.5-flash-lite' as const

export type ModerationVerdict = 'ok' | 'risk' | 'block'

export type ModerationResult = {
  verdict: ModerationVerdict
  confidence: number
  matchedClaims: string[]
  reason: string
  suggestion?: string
  promptTokens?: number
  completionTokens?: number
  model: 'gemini-2.5-flash-lite'
  /** Version of the moderation prompt used (for audit). */
  promptVersion?: string
}

const MAX_INPUT_CHARS = 6000

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function parseJsonLoose(raw: string): any | null {
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
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

function normaliseVerdict(v: unknown): ModerationVerdict {
  if (v === 'ok' || v === 'risk' || v === 'block') return v
  return 'risk'
}

function normaliseConfidence(c: unknown): number {
  if (typeof c !== 'number' || !Number.isFinite(c)) return 0.5
  if (c < 0) return 0
  if (c > 1) return 1
  return c
}

function normaliseMatchedClaims(arr: unknown): string[] {
  if (!Array.isArray(arr)) return []
  return arr
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 20)
}

function normaliseString(s: unknown, fallback = ''): string {
  return typeof s === 'string' ? s.trim() : fallback
}

export async function moderateClaims(params: {
  text: string
  locale?: 'fr' | 'en'
  context?: { collection?: string; field?: string }
}): Promise<ModerationResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY manquante dans les variables d\'environnement')
  }

  const locale = params.locale ?? 'fr'
  const text = (params.text ?? '').slice(0, MAX_INPUT_CHARS)
  const sysResolved = getPromptWithVersion({ kind: 'moderate', locale })
  const promptVersion = `moderate:${sysResolved.version}`

  const ctxLines: string[] = []
  if (params.context?.collection) {
    ctxLines.push(`collection: ${escapeXml(params.context.collection)}`)
  }
  if (params.context?.field) {
    ctxLines.push(`field: ${escapeXml(params.context.field)}`)
  }
  const contextBlock = ctxLines.length
    ? `<context>\n${ctxLines.join('\n')}\n</context>\n`
    : ''

  const prompt = `${contextBlock}<user_text>\n${escapeXml(text)}\n</user_text>`

  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({
    model: MODERATION_MODEL,
    systemInstruction: sysResolved.text,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      maxOutputTokens: 600,
    },
  })

  const result = await model.generateContent(prompt)
  const raw = result.response.text()
  const usage = result.response.usageMetadata
  const promptTokens = usage?.promptTokenCount
  const completionTokens = usage?.candidatesTokenCount

  const parsed = parseJsonLoose(raw)
  if (!parsed || typeof parsed !== 'object') {
    return {
      verdict: 'risk',
      confidence: 0.5,
      matchedClaims: [],
      reason: 'parse_failed',
      promptTokens,
      completionTokens,
      model: MODERATION_MODEL,
      promptVersion,
    }
  }

  const verdict = normaliseVerdict((parsed as any).verdict)
  const confidence = normaliseConfidence((parsed as any).confidence)
  const matchedClaims = normaliseMatchedClaims((parsed as any).matchedClaims)
  const reason = normaliseString((parsed as any).reason, 'unspecified')
  const rawSuggestion = normaliseString((parsed as any).suggestion, '')
  const suggestion =
    verdict === 'ok' || rawSuggestion.length === 0 ? undefined : rawSuggestion

  return {
    verdict,
    confidence,
    matchedClaims,
    reason,
    suggestion,
    promptTokens,
    completionTokens,
    model: MODERATION_MODEL,
    promptVersion,
  }
}
