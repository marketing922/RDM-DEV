// AI text-generation helpers for the Payload admin.
// - `generateFieldValue`: client-side fetch wrapper (safe to import from client)
// - `callAI`: server-side Gemini call — uses a dynamic import of
//   @google/generative-ai so the SDK is never bundled into the client chunk.
//
// Model: gemini-2.5-flash-lite. API key from GEMINI_API_KEY env var.

import { sanitizeContext } from './ai/exposable-fields'
import { getPromptWithVersion } from './ai/prompts'

export type AIGenerateRequest = {
  collection: string // e.g. 'wikiEntries'
  field: string // field path, e.g. 'shortDescription' or 'description.fr'
  fieldType: 'text' | 'textarea'
  context: Record<string, any> // current form data (all fields)
  instructions?: string // optional extra instruction
  locale?: string // 'fr' | 'en'
  targetLength?: { min?: number; max?: number }
}

export type AIGenerateResponse = {
  text: string
  model: string
}

export type AiCallResponse = {
  text: string
  model: string
  promptTokens?: number
  completionTokens?: number
  /** Versions of the prompts used to produce this response (for audit). */
  promptVersion?: string
}

// ─── CLIENT-SIDE helper ─────────────────────────────────────────────
// The field components import this. It does nothing but wrap fetch.
export async function generateFieldValue(req: AIGenerateRequest): Promise<AIGenerateResponse> {
  if (typeof console !== 'undefined') {
    console.debug('[AI] generate request', { collection: req.collection, field: req.field, fieldType: req.fieldType })
  }
  const res = await fetch('/api/admin/ai-generate', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  const raw = await res.text()
  let parsed: any = null
  try { parsed = raw ? JSON.parse(raw) : null } catch {}

  if (!res.ok) {
    const serverMsg =
      (parsed && (parsed.message || parsed.error)) || raw || `HTTP ${res.status}`
    if (typeof console !== 'undefined') {
      console.error('[AI] generate failed', { status: res.status, body: parsed ?? raw })
    }
    throw new Error(String(serverMsg))
  }
  if (!parsed || typeof parsed.text !== 'string') {
    throw new Error('Réponse invalide du serveur IA')
  }
  if (typeof console !== 'undefined') {
    console.debug('[AI] generate ok', { length: parsed.text.length, model: parsed.model })
  }
  return parsed as AIGenerateResponse
}

// ─── SERVER-SIDE Gemini call ────────────────────────────────────────

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeValue(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return escapeXml(v)
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  try {
    return escapeXml(JSON.stringify(v))
  } catch {
    return ''
  }
}

export async function callAI(req: AIGenerateRequest): Promise<AiCallResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  // Dynamic import so @google/generative-ai never ships to the client bundle
  // (this file is imported by 'use client' field components).
  const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = await import('@google/generative-ai')
  const client = new GoogleGenerativeAI(apiKey)
  const locale = req.locale === 'en' ? 'en' : 'fr'

  const sysResolved = getPromptWithVersion({ kind: 'editorial', locale })
  const fieldKey = `${req.collection}.${req.field.replace(/\..*/, '')}`
  const fieldGuideResolved = getPromptWithVersion({ kind: 'fieldGuides', field: fieldKey })

  // promptVersion is a compact triple "editorial:vN+fieldGuides:vM" so the
  // audit log can capture both moving parts in a single string.
  const promptVersion = `editorial:${sysResolved.version}+fieldGuides:${fieldGuideResolved.version}`

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
      temperature: 0.4,
      maxOutputTokens: 600,
    },
  })

  const prompt = buildPrompt(req, fieldGuideResolved.text)
  const result = await model.generateContent(prompt)
  const raw = result.response.text().trim()
  const text = raw.replace(/^['"«»]+|['"«»]+$/g, '').trim()
  const usage = result.response.usageMetadata
  return {
    text,
    model: 'gemini-2.5-flash-lite',
    promptTokens: usage?.promptTokenCount,
    completionTokens: usage?.candidatesTokenCount,
    promptVersion,
  }
}

function buildPrompt(req: AIGenerateRequest, fieldGuideText: string): string {
  return [
    '--- CONTEXTE DU DOCUMENT ---',
    buildContextBlock(req),
    '',
    '--- TÂCHE ---',
    buildInstructionBlock(req, fieldGuideText),
    '',
    '--- FORMAT DE SORTIE ---',
    'Génère UNIQUEMENT le contenu du champ, sans préambule, sans commentaire, sans guillemets autour. Une réponse directe, prête à insérer.',
  ].join('\n')
}

function buildContextBlock(req: AIGenerateRequest): string {
  const safe = sanitizeContext(req.collection, req.context || {})
  const lines: string[] = []
  for (const [k, v] of Object.entries(safe)) {
    if (v === null || v === undefined) continue
    lines.push(`${escapeXml(k)} : ${escapeValue(v)}`)
  }
  const body = lines.length
    ? lines.join('\n')
    : '(document vide — utilise uniquement les indications de la tâche)'
  return `<document_content locked="true">\n${body}\n</document_content>`
}

function buildInstructionBlock(req: AIGenerateRequest, fieldGuideText: string): string {
  const lengthHint = req.targetLength
    ? `Longueur cible : entre ${req.targetLength.min ?? 50} et ${req.targetLength.max ?? 200} caractères.`
    : ''
  const fieldGuide = fieldGuideText && fieldGuideText.length > 0
    ? fieldGuideText
    : `Champ "${req.field}" de type ${req.fieldType}.`
  const extra = req.instructions ? `Instruction supplémentaire : ${req.instructions}` : ''
  return [
    `Collection : ${req.collection}`,
    `Champ à générer : ${req.field} (${req.fieldType})`,
    fieldGuide,
    lengthHint,
    extra,
  ]
    .filter(Boolean)
    .join('\n')
}
