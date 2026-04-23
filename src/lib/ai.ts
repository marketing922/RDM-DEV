// AI text-generation helpers for the Payload admin.
// - `generateFieldValue`: client-side fetch wrapper (safe to import from client)
// - `callAI`: server-side Gemini call — uses a dynamic import of
//   @google/generative-ai so the SDK is never bundled into the client chunk.
//
// Model: gemini-2.5-flash-lite. API key from GEMINI_API_KEY env var.

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
// EU compliance constraint — same wording as src/lib/geoGenerator.ts
const DISCLAIMER = `Contrainte éditoriale : Les Remèdes de Mamie est un site français encadré par le Règlement (CE) 1924/2006 et (UE) 432/2012. N'utilise JAMAIS d'allégations thérapeutiques. Reste descriptif et factuel. "Traditionnellement utilisé", "favorise", "contribue à" — formulations admises. "Soigne", "guérit", "traite" — INTERDIT.`

export async function callAI(req: AIGenerateRequest): Promise<AIGenerateResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  // Dynamic import so @google/generative-ai never ships to the client bundle
  // (this file is imported by 'use client' field components).
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 600,
    },
  })

  const prompt = buildPrompt(req)
  const result = await model.generateContent(prompt)
  const raw = result.response.text().trim()
  const text = raw.replace(/^['"«»]+|['"«»]+$/g, '').trim()
  return { text, model: 'gemini-2.5-flash-lite' }
}

function buildPrompt(req: AIGenerateRequest): string {
  return [
    buildSystemBlock(req),
    '',
    DISCLAIMER,
    '',
    '--- CONTEXTE DU DOCUMENT ---',
    buildContextBlock(req),
    '',
    '--- TÂCHE ---',
    buildInstructionBlock(req),
    '',
    '--- FORMAT DE SORTIE ---',
    'Génère UNIQUEMENT le contenu du champ, sans préambule, sans commentaire, sans guillemets autour. Une réponse directe, prête à insérer.',
  ].join('\n')
}

function buildSystemBlock(req: AIGenerateRequest): string {
  const locale = req.locale || 'fr'
  if (locale === 'en') {
    return `You are the editorial assistant of "Les Remèdes de Mamie", a French herbal encyclopedia. Write in a sober, factual, warm style. Avoid unproven health claims.`
  }
  return `Tu es l'assistant éditorial des "Remèdes de Mamie", une encyclopédie botanique française. Style sobre, factuel, chaleureux. Respecte strictement la pharmacopée française et la médecine traditionnelle chinoise.`
}

function buildContextBlock(req: AIGenerateRequest): string {
  const simple = simplifyContext(req.context)
  const lines: string[] = []
  for (const [k, v] of Object.entries(simple)) {
    if (v === null || v === undefined) continue
    if (typeof v === 'object') {
      lines.push(`${k} : ${JSON.stringify(v)}`)
    } else {
      lines.push(`${k} : ${String(v)}`)
    }
  }
  return lines.length ? lines.join('\n') : '(document vide — utilise uniquement les indications de la tâche)'
}

function buildInstructionBlock(req: AIGenerateRequest): string {
  const lengthHint = req.targetLength
    ? `Longueur cible : entre ${req.targetLength.min ?? 50} et ${req.targetLength.max ?? 200} caractères.`
    : ''
  const fieldGuide = describeField(req.collection, req.field, req.fieldType)
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

function simplifyContext(ctx: any): any {
  const out: any = {}
  for (const [k, v] of Object.entries(ctx || {})) {
    if (['id', '_id', 'createdAt', 'updatedAt', '_status', 'complianceStatus', 'complianceNotes'].includes(k)) continue
    if (v === null || v === undefined) continue
    if (typeof v === 'string' && v.length > 600) {
      out[k] = v.slice(0, 600) + '…'
      continue
    }
    if (Array.isArray(v) && v.length > 10) {
      out[k] = v.slice(0, 10)
      continue
    }
    out[k] = v
  }
  return out
}

function describeField(collection: string, field: string, type: string): string {
  const guides: Record<string, string> = {
    'wikiEntries.shortDescription': 'Résumé botanique en 1-2 phrases, factuel, auto-portant.',
    'wikiEntries.longDescription': 'Paragraphe détaillé (origine, propriétés, usages traditionnels) en 4-6 phrases.',
    'wikiEntries.description': 'Paragraphe détaillé sur la plante (origine, propriétés, usages traditionnels).',
    'wikiEntries.name': 'Nom commun français de la plante (1-3 mots).',
    'blogPosts.excerpt': "Chapô éditorial en 1-2 phrases qui donne envie de lire l'article.",
    'blogPosts.title': 'Titre éditorial accrocheur, 50-70 caractères.',
    'benefits.shortDescription': 'Description courte du bienfait en 1-2 phrases.',
    'benefits.description': 'Explication du bienfait avec les plantes traditionnellement associées.',
    'benefits.name': 'Nom du bienfait (1-3 mots).',
    'products.description': 'Description produit en 2-3 phrases, ton éditorial mais clair.',
    'products.shortDescription': 'Une phrase accroche produit.',
    'products.name': 'Nom du produit (3-6 mots).',
  }
  const key = `${collection}.${field.replace(/\..*/, '')}`
  return guides[key] || `Champ "${field}" de type ${type}.`
}
