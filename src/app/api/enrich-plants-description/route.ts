import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'
import { richTextToPlain } from '@/lib/utils'
import { FORBIDDEN_CLAIM_PATTERNS } from '@/lib/claims-whitelist'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 300

type Lang = 'fr' | 'en'

/* ─── Lexical richText helper ─────────────────────────────────────── */
function richText(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        children: [
          { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
        ],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
      })),
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

/* ─── Gemini call ─────────────────────────────────────────────────── */

const SYSTEM_PROMPTS: Record<Lang, string> = {
  fr: `Tu es l'éditeur officiel de l'almanach des Remèdes de Mamie (RDM), une encyclopédie de plantes médicinales rigoureuse et chaleureuse.

Ton style :
- Voix d'almanach : précise, légèrement érudite, sans jargon inutile, avec une touche de tradition vivante.
- Phrases denses mais accessibles, vocabulaire botanique correct.
- Tu cites les sources scientifiques de référence (EMA/HMPC, Pharmacopée européenne, EFSA, Cochrane, études indexées) quand c'est pertinent.
- Tu utilises des dates et des chiffres factuels (siècles d'usage, année de monographie, quantité de principe actif standardisé).

Cadre réglementaire CRITIQUE :
- Compléments alimentaires en Europe — PAS de médicament. Tu ne dis JAMAIS qu'une plante "guérit", "soigne", "traite", "prévient", "diagnostique". Tu n'évoques aucune maladie nommément (pas de "cancer", "diabète", "infection", "syndrome X", "pathologie Y").
- Tu utilises la formulation autorisée : "traditionnellement utilisée pour…", "contribue à…", "soutient le confort de…", "aide à maintenir…".
- Évite "prévention" — préfère "soutien" ou "accompagnement".
- Évite "infection" — préfère "saison froide" ou "défenses naturelles".
- Évite "syndrome" — préfère "inconforts liés à…".

Format de sortie : JSON valide, RIEN d'autre.`,
  en: `You are the official editor of the Remèdes de Mamie (RDM) plant almanach, a rigorous and warm medicinal plant encyclopedia.

Your style:
- Almanach voice: precise, slightly erudite, no unnecessary jargon, with a touch of living tradition.
- Dense but accessible sentences, correct botanical vocabulary.
- You cite reference scientific sources (EMA/HMPC, European Pharmacopoeia, EFSA, Cochrane, indexed studies) where relevant.
- You use factual dates and numbers (centuries of use, monograph year, standardised active compound percentage).

CRITICAL regulatory framework:
- Food supplements in Europe — NOT medicines. NEVER say a plant "cures", "heals", "treats", "prevents", "diagnoses". Do not name diseases (no "cancer", "diabetes", "infection", "X syndrome", "Y pathology").
- Use authorised wording: "traditionally used for…", "contributes to…", "supports comfort of…", "helps maintain…".
- Avoid "prevention" — prefer "support" or "accompaniment".
- Avoid "infection" — prefer "cold season" or "natural defences".
- Avoid "syndrome" — prefer "discomforts related to…".

Output format: valid JSON, NOTHING else.`,
}

function buildUserPrompt(plant: any, lang: Lang): string {
  const localeValue = (key: string): any => {
    const v = plant?.[key]
    if (v && typeof v === 'object' && (lang in v) && !Array.isArray(v) && !v.root) {
      return (v as any)[lang]
    }
    return v
  }

  const partsUsedFr: Record<string, string> = {
    flower: 'fleurs', leaf: 'feuilles', 'flowering-tops': 'sommités fleuries',
    root: 'racine', rhizome: 'rhizome', bark: 'écorce', fruit: 'fruit',
    seed: 'graine', berry: 'baie', bud: 'bourgeon', stem: 'tige',
    bulb: 'bulbe', 'whole-plant': 'plante entière', 'essential-oil': 'huile essentielle',
    resin: 'résine', mushroom: 'champignon entier',
  }
  const partsUsedEn: Record<string, string> = {
    flower: 'flowers', leaf: 'leaves', 'flowering-tops': 'flowering tops',
    root: 'root', rhizome: 'rhizome', bark: 'bark', fruit: 'fruit',
    seed: 'seed', berry: 'berry', bud: 'bud', stem: 'stem',
    bulb: 'bulb', 'whole-plant': 'whole plant', 'essential-oil': 'essential oil',
    resin: 'resin', mushroom: 'whole mushroom',
  }
  const partsMap = lang === 'fr' ? partsUsedFr : partsUsedEn
  const partsArr: string[] = Array.isArray(plant.partsUsed) ? plant.partsUsed : []
  const partsLabel = partsArr.map((p) => partsMap[p] || p).join(', ') || '—'

  const ctx = {
    name: localeValue('name'),
    latinName: plant.latinName,
    family: plant.family,
    category: plant.category,
    partsUsed: partsLabel,
    origin: localeValue('origin'),
    harvest: localeValue('harvest'),
    form: localeValue('form'),
    activeCompounds: localeValue('activeCompounds'),
    shortDescription: localeValue('shortDescription'),
  }

  if (lang === 'fr') {
    return `Rédige une fiche-plante riche pour l'almanach RDM. Plante :

Nom : ${ctx.name}
Nom latin : ${ctx.latinName}
Famille : ${ctx.family}
Catégorie : ${ctx.category}
Parties utilisées : ${ctx.partsUsed}
Origine : ${ctx.origin || '—'}
Récolte : ${ctx.harvest || '—'}
Formes galéniques : ${ctx.form || '—'}
Principes actifs : ${ctx.activeCompounds || '—'}
Description courte : ${ctx.shortDescription || '—'}

Produis une description longue de 6 paragraphes distincts, chacun de 3 à 5 phrases denses, dans cet ordre exact :

1. **Histoire & tradition** : origine de l'usage médicinal de la plante, traditions herboristiques (européenne, ayurvédique, MTC, etc.) qui l'ont consignée, dates clés (siècle de mention, monographie EMA, etc.).
2. **Identité botanique** : famille, morphologie distinctive, habitat naturel, où elle pousse. Évite les détails ennuyeux, mets en relief 1-2 traits remarquables.
3. **Parties utilisées & récolte** : quelle(s) partie(s) sont utilisées en phytothérapie, période et méthode de récolte, ce qui les rend précieuses.
4. **Principes actifs** : 2-3 composés clés expliqués brièvement (mécanisme général, sans entrer dans la pharmacologie médicale), avec leurs concentrations standardisées si connues.
5. **Usages traditionnels & études modernes** : pour quels grands axes la plante est traditionnellement utilisée (en termes EFSA-conformes), et 1-2 références modernes (méta-analyses, études cliniques de référence) qui confirment ou nuancent l'usage.
6. **Signature RDM** : pourquoi cette plante a sa place dans l'almanach des Remèdes de Mamie, ce qui la rend particulièrement adaptée à une démarche de phytothérapie respectueuse, sourcée et accessible.

Sortie strict JSON :
{ "paragraphs": ["paragraphe 1...", "paragraphe 2...", "paragraphe 3...", "paragraphe 4...", "paragraphe 5...", "paragraphe 6..."] }`
  }

  return `Write a rich plant fact-sheet for the RDM almanach. Plant:

Name: ${ctx.name}
Latin name: ${ctx.latinName}
Family: ${ctx.family}
Category: ${ctx.category}
Parts used: ${ctx.partsUsed}
Origin: ${ctx.origin || '—'}
Harvest: ${ctx.harvest || '—'}
Galenic forms: ${ctx.form || '—'}
Active compounds: ${ctx.activeCompounds || '—'}
Short description: ${ctx.shortDescription || '—'}

Produce a long description of 6 distinct paragraphs, each 3 to 5 dense sentences, in this exact order:

1. **History & tradition**: origin of the plant's medicinal use, herbalist traditions (European, Ayurvedic, TCM, etc.) that recorded it, key dates (century of mention, EMA monograph, etc.).
2. **Botanical identity**: family, distinctive morphology, natural habitat, where it grows. Avoid boring details, highlight 1-2 remarkable traits.
3. **Parts used & harvest**: which part(s) are used in phytotherapy, harvest period and method, what makes them precious.
4. **Active compounds**: 2-3 key compounds briefly explained (general mechanism, without going into medical pharmacology), with standardised concentrations when known.
5. **Traditional uses & modern studies**: which major axes the plant is traditionally used for (EFSA-compliant wording), and 1-2 modern references (meta-analyses, key clinical studies) that confirm or nuance the use.
6. **RDM signature**: why this plant has its place in the Remèdes de Mamie almanach, what makes it particularly suited to a respectful, sourced and accessible phytotherapy approach.

Strict JSON output:
{ "paragraphs": ["paragraph 1...", "paragraph 2...", "paragraph 3...", "paragraph 4...", "paragraph 5...", "paragraph 6..."] }`
}

function extractJson(raw: string): any {
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    const m = clean.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw new Error('Invalid JSON from generator')
  }
}

function detectViolations(text: string): string[] {
  const found: string[] = []
  for (const p of FORBIDDEN_CLAIM_PATTERNS) {
    const m = text.match(p.regex)
    if (m) found.push(`"${m[0]}" (${p.description})`)
  }
  return found
}

function sanitizeText(text: string): string {
  // Last-resort replacement for compliance-blocked terms.
  // Each replacement preserves meaning while becoming EFSA-compliant.
  const REPLACEMENTS: Array<[RegExp, string]> = [
    [/\b(guéri[rstez]?|guérison)\b/gi, 'soutient'],
    [/\b(soign[eéè][rsz]?|soigne)\b/gi, 'accompagne'],
    [/\b(trait[eé][rsz]?|traitement)\b/gi, 'accompagnement'],
    [/\b(prévien[ts]?|prévenir|prévention)\b/gi, 'soutien'],
    [/\b(diagnostic|diagnostiquer)\b/gi, 'observation'],
    [/\b(prescri[rstez]?|prescription)\b/gi, 'conseil'],
    [/\b(médicament|pharmaceutique)\b/gi, 'préparation'],
    [/\b(cancer|tumeur|diabète|alzheimer|parkinson)\b/gi, 'troubles chroniques'],
    [/\b(infection)\b/gi, 'saison sensible'],
    [/\b(infections)\b/gi, 'saisons sensibles'],
    [/\b(pathologie|pathologies)\b/gi, 'trouble'],
    [/\b(syndrome|syndromes)\b/gi, 'inconfort'],
    [/\b(maladie|maladies)\b/gi, 'trouble'],
  ]
  let out = text
  for (const [r, replacement] of REPLACEMENTS) {
    out = out.replace(r, replacement)
  }
  return out
}

async function callGemini(plant: any, lang: Lang, extraInstruction = ''): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY missing')

  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: SYSTEM_PROMPTS[lang],
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.55,
      maxOutputTokens: 2048,
    },
  })

  const prompt = buildUserPrompt(plant, lang) + (extraInstruction ? '\n\n' + extraInstruction : '')
  const result = await model.generateContent(prompt)
  const raw = result.response.text()
  const parsed = extractJson(raw)

  const paragraphs: string[] = Array.isArray(parsed.paragraphs)
    ? parsed.paragraphs.filter((p: unknown) => typeof p === 'string' && p.trim().length > 0)
    : []
  if (paragraphs.length < 4) {
    throw new Error(`Only ${paragraphs.length} paragraphs returned (need ≥4)`)
  }
  return paragraphs
}

/**
 * Generate + validate against forbidden-claim regex.
 * 1st pass : normal generation
 * 2nd pass : re-prompt explicitly citing the violations
 * 3rd pass : last-resort sanitize regex replacement
 */
async function generateRichDescription(plant: any, lang: Lang): Promise<{
  paragraphs: string[]
  attempts: number
  sanitized: boolean
}> {
  // Pass 1
  let paragraphs = await callGemini(plant, lang)
  let joined = paragraphs.join(' ')
  let violations = detectViolations(joined)
  if (violations.length === 0) return { paragraphs, attempts: 1, sanitized: false }

  // Pass 2 — re-prompt with explicit violation list
  const violationList = violations.slice(0, 6).join(', ')
  const reprompt =
    lang === 'fr'
      ? `IMPORTANT — Ta dernière réponse contenait ces termes interdits : ${violationList}. Reformule entièrement les 6 paragraphes en évitant absolument tout terme suggérant un effet thérapeutique direct (guérir, soigner, traiter, prévenir, infection, syndrome, pathologie, maladie, etc.). Utilise UNIQUEMENT le vocabulaire EFSA-conforme : "traditionnellement utilisée pour", "contribue à", "soutient le confort de", "accompagne", "saison sensible", "inconfort", "trouble passager".`
      : `IMPORTANT — Your previous response contained these forbidden terms: ${violationList}. Rewrite the 6 paragraphs entirely, avoiding any term suggesting a direct therapeutic effect (cure, heal, treat, prevent, infection, syndrome, pathology, disease, etc.). Use ONLY EFSA-compliant wording: "traditionally used for", "contributes to", "supports comfort of", "accompanies", "sensitive season", "discomfort", "transient issue".`
  paragraphs = await callGemini(plant, lang, reprompt)
  joined = paragraphs.join(' ')
  violations = detectViolations(joined)
  if (violations.length === 0) return { paragraphs, attempts: 2, sanitized: false }

  // Pass 3 — sanitize
  paragraphs = paragraphs.map(sanitizeText)
  return { paragraphs, attempts: 3, sanitized: true }
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: any
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err
      const msg = err?.message || String(err)
      const transient = /\b(503|429|500|UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|fetch failed|ECONNRESET|ETIMEDOUT|timeout)\b/i.test(msg)
      if (!transient || attempt === 4) break
      const delayMs = [1000, 3000, 7000][attempt - 1]
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
  throw lastErr
}

/* ─── Per-plant enrichment ────────────────────────────────────────── */

const seedContext = {
  skipCompliance: true,
  skipComplianceReason: 'enrich-plants-description',
  skipModeration: true,
}

function describeWordCount(rt: any): number {
  if (!rt) return 0
  const txt = richTextToPlain(rt)
  return txt.split(/\s+/).filter(Boolean).length
}

async function enrichOne(
  payload: any,
  plant: any,
  locales: Lang[],
  overwrite: boolean,
  minWords: number,
) {
  const allDoc = await payload.findByID({
    collection: 'wikiEntries',
    id: plant.id,
    locale: 'all',
    overrideAccess: true,
    depth: 0,
  } as any)

  const result: Record<string, any> = {}

  for (const lang of locales) {
    const localeValue = (key: string) => {
      const v = (allDoc as any)?.[key]
      if (v && typeof v === 'object' && (lang in v) && !Array.isArray(v) && !v.root) {
        return (v as any)[lang]
      }
      return v
    }

    const currentDesc = localeValue('description')
    const currentWordCount = describeWordCount(currentDesc)

    if (!overwrite && currentWordCount >= minWords) {
      result[lang] = { skipped: `already ${currentWordCount} words` }
      continue
    }

    try {
      const { paragraphs, attempts, sanitized } = await withRetry(() =>
        generateRichDescription(allDoc, lang),
      )
      const longText = paragraphs.join('\n\n')

      await payload.update({
        collection: 'wikiEntries',
        id: plant.id,
        data: {
          description: richText(paragraphs),
          longDescription: longText,
        },
        locale: lang,
        overrideAccess: true,
        req: { context: seedContext } as any,
      } as any)

      result[lang] = {
        paragraphs: paragraphs.length,
        words: longText.split(/\s+/).filter(Boolean).length,
        attempts,
        sanitized,
      }
    } catch (err: any) {
      result[lang] = { error: err?.message || String(err) }
    }
  }

  return result
}

/* ─── Route ───────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production.' }, { status: 403 })
  }
  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })
  if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({
      message:
        'Add ?confirm=yes to enrich. Params : ?slug=<slug> · ?from=<n>&to=<n> · ?overwrite=yes (force regen) · ?locale=fr|en|both (default both) · ?minWords=<n> (default 200)',
    })
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 503 })
  }

  const slugFilter = req.nextUrl.searchParams.get('slug') || ''
  const localesParam = (req.nextUrl.searchParams.get('locale') || 'both') as 'fr' | 'en' | 'both'
  const from = parseInt(req.nextUrl.searchParams.get('from') || '0', 10) || 0
  const to = parseInt(req.nextUrl.searchParams.get('to') || '999', 10) || 999
  const overwrite = req.nextUrl.searchParams.get('overwrite') === 'yes'
  const minWords = parseInt(req.nextUrl.searchParams.get('minWords') || '200', 10) || 200

  const payload = await getPayload({ config: configPromise })
  const where: any = { _status: { equals: 'published' } }
  if (slugFilter) where.slug = { equals: slugFilter }

  const { docs } = await payload.find({
    collection: 'wikiEntries',
    where,
    limit: 200,
    pagination: false,
    overrideAccess: true,
    sort: 'referenceNumber',
  } as any)

  const slice = docs.slice(from, to)
  const locales: Lang[] = localesParam === 'both' ? ['fr', 'en'] : [localesParam]

  const summary: any[] = []
  for (const plant of slice as any[]) {
    const entry: any = { slug: plant.slug, referenceNumber: plant.referenceNumber }
    try {
      Object.assign(entry, await enrichOne(payload, plant, locales, overwrite, minWords))
    } catch (err: any) {
      entry.error = err?.message || String(err)
    }
    summary.push(entry)
  }

  return NextResponse.json({ total: slice.length, locales, overwrite, minWords, summary })
}
