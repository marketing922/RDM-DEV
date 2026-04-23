import 'server-only'
import { GoogleGenerativeAI } from '@google/generative-ai'

export type GeoFieldType =
  | 'directAnswer'
  | 'definition'
  | 'keyTakeaways'
  | 'faq'

export type GeoContext = {
  kind: 'plant' | 'benefit' | 'article' | 'page'
  name?: string
  latinName?: string
  shortDescription?: string
  longDescription?: string
  category?: string
  tags?: string[]
  content?: string
}

type PromptSpec = {
  instruction: string
  schemaHint: string
}

const PROMPTS: Record<GeoFieldType, PromptSpec> = {
  directAnswer: {
    instruction: `Rédige une "réponse directe" de 40 à 60 mots, en français, optimisée pour extraction par les IA (Google AI Overviews, ChatGPT, Perplexity).

Règles strictes :
- Commence par la réponse, pas par du contexte ("Dans cet article…" est INTERDIT)
- Auto-portante : compréhensible sans le reste de la page
- Factuelle et neutre (pas de promesses thérapeutiques)
- Intègre le nom du sujet dès la première phrase`,
    schemaHint: `Retourne UNIQUEMENT un objet JSON : { "text": "…" }`,
  },
  definition: {
    instruction: `Rédige une définition standalone de 25 à 50 mots, en français.

Règles strictes :
- Format obligatoire : "[Nom du sujet] est/sont une/un …"
- Commence toujours par le terme défini
- Factuelle, neutre, vérifiable
- Si plante : inclure nom latin entre parenthèses + famille botanique`,
    schemaHint: `Retourne UNIQUEMENT un objet JSON : { "text": "…" }`,
  },
  keyTakeaways: {
    instruction: `Génère entre 3 et 5 points-clés auto-portants en français.

Règles strictes :
- Chaque point est COMPRÉHENSIBLE SANS LES AUTRES (pas de "il", "cette plante", "ce bienfait" — répéter le nom)
- Un fait précis par point
- Court (≤ 20 mots), factuel, neutre
- Pas de promesses thérapeutiques, pas d'impératifs commerciaux`,
    schemaHint: `Retourne UNIQUEMENT un objet JSON : { "items": ["…", "…", "…"] }`,
  },
  faq: {
    instruction: `Génère 4 à 6 paires question/réponse en français, alignées avec les requêtes que poseraient de vrais utilisateurs à ChatGPT ou Google.

Règles strictes :
- Questions formulées comme un utilisateur (pas comme un SEO)
- Réponses concises (2 à 4 phrases), auto-portantes, factuelles
- Pas d'allégation thérapeutique non reconnue (EFSA/EMA)
- Varier les angles : utilisation, précautions, bienfaits, préparation, interactions`,
    schemaHint: `Retourne UNIQUEMENT un objet JSON : { "items": [{ "question": "…", "answer": "…" }] }`,
  },
}

const contextBlock = (ctx: GeoContext): string => {
  const lines: string[] = []
  lines.push(`Type de contenu : ${ctx.kind}`)
  if (ctx.name) lines.push(`Nom : ${ctx.name}`)
  if (ctx.latinName) lines.push(`Nom latin : ${ctx.latinName}`)
  if (ctx.category) lines.push(`Catégorie : ${ctx.category}`)
  if (ctx.tags?.length) lines.push(`Tags : ${ctx.tags.join(', ')}`)
  if (ctx.shortDescription) lines.push(`Description courte : ${ctx.shortDescription}`)
  if (ctx.longDescription) {
    const trimmed = ctx.longDescription.slice(0, 1500)
    lines.push(`Description longue : ${trimmed}${ctx.longDescription.length > 1500 ? '…' : ''}`)
  }
  if (ctx.content) {
    const trimmed = ctx.content.slice(0, 4000)
    lines.push(`Contenu rédactionnel :\n${trimmed}${ctx.content.length > 4000 ? '…' : ''}`)
  }
  return lines.join('\n')
}

const DISCLAIMER = `Contrainte éditoriale : Les Remèdes de Mamie est un site français encadré par le Règlement (CE) 1924/2006 et (UE) 432/2012. N'utilise JAMAIS d'allégations thérapeutiques. Reste descriptif et factuel. Traditionnellement utilisé, favorise, contribue à — formulations admises. Soigne, guérit, traite — INTERDIT.`

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

export async function generateGeoField(
  field: GeoFieldType,
  ctx: GeoContext,
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY manquante dans les variables d\'environnement')
  }

  const spec = PROMPTS[field]
  const prompt = [
    spec.instruction,
    '',
    DISCLAIMER,
    '',
    '--- CONTEXTE ---',
    contextBlock(ctx),
    '',
    '--- FORMAT DE SORTIE ---',
    spec.schemaHint,
  ].join('\n')

  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
      maxOutputTokens: 1024,
    },
  })

  const result = await model.generateContent(prompt)
  const raw = result.response.text()
  const parsed = extractJson(raw)

  if (field === 'directAnswer' || field === 'definition') {
    if (typeof parsed.text !== 'string') throw new Error('Réponse sans champ text')
    return { field, text: parsed.text.trim() }
  }

  if (field === 'keyTakeaways') {
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter((s: unknown) => typeof s === 'string')
      : []
    if (items.length === 0) throw new Error('Aucun point-clé généré')
    return { field, items: items.slice(0, 5) }
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
    return { field, items: items.slice(0, 6) }
  }

  throw new Error(`Type de champ inconnu : ${field}`)
}
