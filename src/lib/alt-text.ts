import 'server-only'
import { getPromptWithVersion } from './ai/prompts'

// Vision helper: generates an accessible alt-text (and optional caption) for an
// image using Gemini 2.5 Flash Lite. The caller is responsible for checking
// budget / rate-limit / kill-switch BEFORE invoking this function.

export const ALT_TEXT_MODEL = 'gemini-2.5-flash-lite' as const

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 Mo

export type AltTextResult = {
  alt: string
  caption?: string
  promptTokens?: number
  completionTokens?: number
  model: typeof ALT_TEXT_MODEL
  /** Version of the vision prompt used (for audit). */
  promptVersion?: string
}

export type AltTextContext = {
  collection?: string
  filename?: string
  hint?: string
}

export type GenerateAltTextParams = {
  imageUrl: string
  mimeType?: string
  context?: AltTextContext
  locale?: 'fr' | 'en'
}

function buildPrompt(locale: 'fr' | 'en', context?: AltTextContext): { text: string; version: string } {
  const resolved = getPromptWithVersion({
    kind: 'vision',
    locale,
    hint: context?.hint,
  })
  return { text: resolved.text, version: resolved.version }
}

function sanitizeMimeType(mime: string | null | undefined): string {
  if (!mime) return 'image/jpeg'
  // Strip any parameters, eg "image/jpeg; charset=binary" -> "image/jpeg"
  const bare = mime.split(';')[0]?.trim().toLowerCase()
  if (!bare || !bare.startsWith('image/')) return 'image/jpeg'
  return bare
}

function tryParseJson(text: string): { alt?: unknown; caption?: unknown } | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  // Strip fenced code blocks a model might add despite JSON mode.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const candidate = fenced ? fenced[1] : trimmed
  try {
    const parsed = JSON.parse(candidate) as unknown
    if (parsed && typeof parsed === 'object') {
      return parsed as { alt?: unknown; caption?: unknown }
    }
    return null
  } catch {
    return null
  }
}

export async function generateAltText(
  params: GenerateAltTextParams,
): Promise<AltTextResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const { imageUrl } = params
  if (!imageUrl) throw new Error('imageUrl is required')

  const locale: 'fr' | 'en' = params.locale === 'en' ? 'en' : 'fr'

  // 1) Fetch the image server-side.
  let res: Response
  try {
    res = await fetch(imageUrl)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`image_fetch_failed: ${msg}`)
  }
  if (!res.ok) {
    throw new Error(`image_fetch_failed: HTTP ${res.status}`)
  }

  const contentTypeHeader = res.headers.get('content-type')
  const mimeType = sanitizeMimeType(params.mimeType || contentTypeHeader)

  const buf = await res.arrayBuffer()
  if (buf.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('image_too_large')
  }
  if (buf.byteLength === 0) {
    throw new Error('image_empty')
  }

  const base64 = Buffer.from(buf).toString('base64')

  // 2) Dynamic import to keep the SDK out of client bundles.
  const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = await import(
    '@google/generative-ai'
  )
  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({
    model: ALT_TEXT_MODEL,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
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
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 300,
      responseMimeType: 'application/json',
    },
  })

  const built = buildPrompt(locale, params.context)
  const promptText = built.text
  const promptVersion = `vision:${built.version}`

  let result
  try {
    result = await model.generateContent([
      { text: promptText },
      { inlineData: { mimeType, data: base64 } },
    ])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`gemini_vision_failed: ${msg}`)
  }

  const text = result.response.text().trim()
  if (!text) throw new Error('gemini_vision_empty_response')

  const parsed = tryParseJson(text)
  let alt: string | undefined
  let caption: string | undefined
  if (parsed) {
    if (typeof parsed.alt === 'string') alt = parsed.alt.trim()
    if (typeof parsed.caption === 'string') caption = parsed.caption.trim()
  }
  if (!alt) {
    // Fallback: use the raw text as alt (collapse whitespace/newlines).
    alt = text.replace(/\s+/g, ' ').trim()
  }
  if (!alt) throw new Error('gemini_vision_empty_alt')

  const usage = result.response.usageMetadata
  return {
    alt,
    caption: caption || undefined,
    promptTokens: usage?.promptTokenCount,
    completionTokens: usage?.candidatesTokenCount,
    model: ALT_TEXT_MODEL,
    promptVersion,
  }
}
