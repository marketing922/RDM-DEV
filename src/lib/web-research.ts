import 'server-only'

import { calcCostEur } from './ai-pricing'
import { groundedSearch } from './gemini-grounding'
import type {
  ImageCandidate,
  ResearchFact,
  ResearchResult,
  ResearchSource,
  StructuredPlantData,
} from './web-research-types'
import { searchCommonsImages } from './wiki-commons'
import { getPageContent, getPageSummary } from './wikipedia-fetch'

export type {
  ImageCandidate,
  ResearchFact,
  ResearchResult,
  ResearchSource,
  StructuredPlantData,
} from './web-research-types'

/**
 * Orchestrateur public — agrège Wikipedia + Wikimedia Commons + Gemini grounding.
 * Aucun throw : en cas d'échec partiel, on accumule des `warnings` et on rend
 * ce qui a pu être collecté.
 */

type ResearchOpts = {
  query: string
  kind: 'plant' | 'topic'
  brief?: string
  locale?: 'fr' | 'en'
}

const SNIPPET_MIN = 100
const SNIPPET_MAX = 500

function clampSnippet(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= SNIPPET_MAX) return t
  // Cut on sentence boundary if possible.
  const cut = t.slice(0, SNIPPET_MAX)
  const lastDot = cut.lastIndexOf('.')
  if (lastDot >= SNIPPET_MIN) return cut.slice(0, lastDot + 1)
  return cut + '…'
}

function takeFirstParagraphChars(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const lastDot = cut.lastIndexOf('.')
  return lastDot > 60 ? cut.slice(0, lastDot + 1) : cut + '…'
}

const LATIN_BINOMIAL_RE = /\(([A-Z][a-z]+ [a-z]+(?: [a-z]+)?)\)/

function extractLatinName(extract: string, infobox?: Record<string, string>): string | undefined {
  // Prefer infobox: "Nom binominal", "Nom binomial", "Espèce".
  if (infobox) {
    for (const key of Object.keys(infobox)) {
      const lower = key.toLowerCase()
      if (
        lower.includes('binominal') ||
        lower.includes('binomial') ||
        lower.includes('nom scientifique')
      ) {
        const v = infobox[key]
        if (v) {
          const m = v.match(/[A-Z][a-z]+ [a-z]+(?: [a-z]+)?/)
          if (m) return m[0]
        }
      }
    }
  }
  const m = extract.match(LATIN_BINOMIAL_RE)
  return m ? m[1] : undefined
}

function extractFamily(infobox?: Record<string, string>): string | undefined {
  if (!infobox) return undefined
  for (const key of Object.keys(infobox)) {
    if (key.toLowerCase().startsWith('famille')) {
      return infobox[key]
    }
  }
  return undefined
}

function extractOrigin(infobox?: Record<string, string>): string | undefined {
  if (!infobox) return undefined
  for (const key of Object.keys(infobox)) {
    const lower = key.toLowerCase()
    if (
      lower.includes('répartition') ||
      lower.includes('aire') ||
      lower.includes('origine')
    ) {
      return infobox[key]
    }
  }
  return undefined
}

function tryParseJson<T>(raw: string): T | null {
  // Tolerate ```json ...``` fences.
  const cleaned = raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Try to grab the first {...} block.
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (!m) return null
    try {
      return JSON.parse(m[0]) as T
    } catch {
      return null
    }
  }
}

async function logResearchAiCall(args: {
  startedAt: number
  promptTokens?: number
  completionTokens?: number
  promptExcerpt?: string
  responseExcerpt?: string
  error?: { code?: string; message?: string }
  query: string
  kind: 'plant' | 'topic'
}): Promise<void> {
  try {
    // Lazy-load Payload + audit — the Payload SDK pulls in `next/env` which
    // fails to bootstrap outside a Next.js runtime (e.g. CLI scripts on
    // Node 24). The research pipeline must keep working even when audit
    // logging is unavailable.
    const [{ getPayloadClient }, { logAiCall }] = await Promise.all([
      import('./payload'),
      import('./ai-audit'),
    ])
    const payload = await getPayloadClient()
    await logAiCall(
      payload,
      {
        subsystem: 'ai-research',
        model: 'gemini-2.5-flash',
        collectionTarget: `research:${args.kind}`,
        fieldTarget: args.query.slice(0, 80),
      },
      args.startedAt,
      {
        promptTokens: args.promptTokens,
        completionTokens: args.completionTokens,
        promptExcerpt: args.promptExcerpt,
        responseExcerpt: args.responseExcerpt,
      },
      args.error ?? null,
    )
  } catch (logErr) {
    // Audit log failure is non-blocking — research must still succeed.
    console.warn('[web-research] audit log failed', String(logErr))
  }
}

async function researchPlant(
  query: string,
  locale: 'fr' | 'en',
): Promise<ResearchResult> {
  const startedAt = Date.now()
  const warnings: string[] = []
  const facts: ResearchFact[] = []
  let totalCostEur = 0
  const structured: StructuredPlantData = { name: query }

  // 1) Wikipedia FR (then EN fallback).
  const primaryLocale: 'fr' | 'en' = locale
  const fallbackLocale: 'fr' | 'en' = primaryLocale === 'fr' ? 'en' : 'fr'

  let summary = await getPageSummary(query, primaryLocale)
  let usedLocale: 'fr' | 'en' = primaryLocale
  if (!summary) {
    summary = await getPageSummary(query, fallbackLocale)
    if (summary) {
      usedLocale = fallbackLocale
      warnings.push(
        `Wikipedia article not found in ${primaryLocale}, fallback ${fallbackLocale}`,
      )
    } else {
      warnings.push(`Wikipedia article not found for "${query}" (fr/en)`)
    }
  }

  let content: Awaited<ReturnType<typeof getPageContent>> = null
  if (summary) {
    content = await getPageContent(summary.title, usedLocale)
    if (!content) {
      warnings.push(`Wikipedia parse failed for "${summary.title}" (${usedLocale})`)
    }
  }

  if (summary) {
    const shortDesc = takeFirstParagraphChars(summary.extract, 250)
    structured.shortDescription = shortDesc

    facts.push({
      source: 'wikipedia',
      title: summary.title,
      snippet: clampSnippet(summary.extract),
      url: summary.url,
    })
  }

  if (content) {
    if (content.longExtract) {
      structured.longDescription = content.longExtract
    }
    structured.latinName = extractLatinName(
      content.extract || summary?.extract || '',
      content.infobox,
    )
    structured.family = extractFamily(content.infobox)
    structured.origin = extractOrigin(content.infobox)

    // Add a section-derived fact for "Composition" / "Principes actifs" if found.
    const compoSection = content.sections.find((s) =>
      /composition|principes? actifs?|phytochim/i.test(s.title),
    )
    if (compoSection && content.longExtract) {
      // We don't have section bodies in V1 (would need anchored re-parse),
      // but we surface the section title as a hint to downstream agents.
      facts.push({
        source: 'wikipedia',
        title: `${content.title} — ${compoSection.title}`,
        snippet: clampSnippet(
          `Section "${compoSection.title}" disponible sur la page Wikipedia ${content.title}. Contenu détaillé non extrait en V1.`,
        ),
        url: `${content.url}#${compoSection.anchor ?? ''}`,
      })
    }
  }

  // 2) Images Commons — best-effort, query latin name first if known.
  const imageQuery = structured.latinName ?? query
  let imageCandidates: ImageCandidate[] = []
  try {
    imageCandidates = await searchCommonsImages(imageQuery, {
      limit: 5,
      minWidth: 1200,
    })
    if (imageCandidates.length === 0 && imageQuery !== query) {
      // Retry with raw query.
      imageCandidates = await searchCommonsImages(query, {
        limit: 5,
        minWidth: 1200,
      })
    }
  } catch (err) {
    warnings.push(`Wikimedia Commons search failed: ${String(err)}`)
  }

  // 3) Optional Gemini grounded fill for missing fields.
  // Cover the full botanical card so the wiki page is never half-empty when
  // Wikipedia's infobox is sparse or the page doesn't exist at all.
  const missing: string[] = []
  if (!structured.latinName) missing.push('latinName')
  if (!structured.family) missing.push('family')
  if (!structured.origin) missing.push('origin')
  if (!structured.partsUsed) missing.push('partsUsed')
  if (!structured.activeCompounds) missing.push('activeCompounds')
  if (!structured.harvest) missing.push('harvest')
  if (!structured.form) missing.push('form')
  if (!structured.conservation) missing.push('conservation')
  if (!structured.precautionsText) missing.push('precautionsText')

  if (missing.length > 0) {
    const aiStartedAt = Date.now()
    const plantName = structured.latinName
      ? `${query} (${structured.latinName})`
      : query
    const fieldHints: Record<string, string> = {
      latinName: 'nom binominal officiel (genre + espèce, ex. "Matricaria chamomilla"). String COURTE.',
      family: 'famille botanique (ex. "Astéracées"). String courte.',
      origin: "régions d'origine et répartition naturelle (ex. \"Europe, Asie occidentale\"). 1 phrase.",
      partsUsed: "parties de la plante utilisées en phytothérapie (ex. \"Fleurs, capitules, sommités fleuries\"). 1 phrase.",
      activeCompounds: 'principaux composés actifs documentés (ex. "Chamazulène, alpha-bisabolol, flavonoïdes, coumarines"). 1-2 phrases.',
      harvest: 'période et méthode de récolte (ex. "Mai à août, par temps sec"). 1 phrase.',
      form: 'formes galéniques courantes (ex. "Tisane, infusion, huile essentielle, teinture"). 1 phrase.',
      conservation: "conditions de conservation (ex. \"À l'abri de la lumière, en bocal hermétique\"). 1 phrase.",
      precautionsText: 'précautions d\'emploi et contre-indications connues. 2-3 phrases factuelles.',
    }
    const hintsBlock = missing
      .map((k) => `- ${k} : ${fieldHints[k] ?? 'valeur factuelle, 1-3 phrases'}`)
      .join('\n')
    const prompt =
      `Donne-moi pour la plante "${plantName}", en JSON strict, exactement ces clés :\n` +
      `${JSON.stringify(missing)}.\n\n` +
      `Spécifications :\n${hintsBlock}\n\n` +
      `Chaque valeur est une chaîne factuelle, sourcée sur des références botaniques ou pharmacopée européenne (Wikipedia, EMA/HMPC, ANSES, Tela Botanica). ` +
      `Aucune allégation santé promotionnelle, aucune promesse de guérison. ` +
      `Réponds UNIQUEMENT par un objet JSON valide, sans préambule, sans markdown.`
    try {
      const ai = await groundedSearch({
        query: prompt,
        maxOutputTokens: 1400,
      })
      const cost = calcCostEur({
        model: 'gemini-2.5-flash',
        promptTokens: ai.promptTokens,
        completionTokens: ai.completionTokens,
      })
      totalCostEur += cost

      await logResearchAiCall({
        startedAt: aiStartedAt,
        promptTokens: ai.promptTokens,
        completionTokens: ai.completionTokens,
        promptExcerpt: prompt,
        responseExcerpt: ai.text,
        query,
        kind: 'plant',
      })

      const parsed = tryParseJson<Record<string, string>>(ai.text)
      if (parsed) {
        for (const key of missing) {
          const v = parsed[key]
          if (typeof v === 'string' && v.trim().length > 0) {
            ;(structured as Record<string, string | undefined>)[key] = v.trim()
          }
        }
      } else {
        warnings.push('Gemini grounding fill: JSON parse failed')
      }

      // Attach citations as facts.
      for (const c of ai.citations.slice(0, 6)) {
        facts.push({
          source: 'gemini-grounding',
          title: c.title || c.uri,
          snippet: clampSnippet(
            `Source citée par Gemini grounding pour combler les champs manquants : ${c.title || c.uri}.`,
          ),
          url: c.uri,
        })
      }
      if (!ai.grounded) {
        warnings.push('Gemini grounding unavailable — used plain generate as fallback')
      }
    } catch (err) {
      warnings.push(`Gemini fill failed: ${String(err)}`)
      await logResearchAiCall({
        startedAt: aiStartedAt,
        promptExcerpt: prompt,
        error: { code: 'gemini-fill-failed', message: String(err) },
        query,
        kind: 'plant',
      })
    }
  }

  return {
    facts,
    imageCandidates,
    structured,
    totalCostEur: Math.round(totalCostEur * 1_000_000) / 1_000_000,
    totalDurationMs: Date.now() - startedAt,
    warnings,
  }
}

async function researchTopic(
  query: string,
  brief: string | undefined,
  locale: 'fr' | 'en',
): Promise<ResearchResult> {
  const startedAt = Date.now()
  const warnings: string[] = []
  const facts: ResearchFact[] = []
  let totalCostEur = 0

  // 1) Gemini grounded — broad search.
  const aiStartedAt = Date.now()
  const briefLine = brief ? `\nBrief de l'article : ${brief}` : ''
  const prompt =
    `Donne-moi 8 à 12 faits factuels sourcés sur le sujet "${query}", ` +
    `avec un angle "phytothérapie / herboristerie traditionnelle".${briefLine}\n` +
    `Couvre IMPÉRATIVEMENT (1 à 2 puces par axe) : ` +
    `(a) origine / histoire / culture, ` +
    `(b) usages traditionnels documentés, ` +
    `(c) composés actifs ou propriétés étudiées, ` +
    `(d) précautions / contre-indications connues, ` +
    `(e) données chiffrées (dosage, durée, étude clé) si disponibles.\n` +
    `Format : liste à puces (commence chaque puce par "- "), chaque puce 80–250 caractères, ` +
    `factuelle, vérifiable. Aucune allégation santé promotionnelle. ` +
    `Cite des références neutres (Wikipedia, ANSES, EMA/HMPC, monographies, PubMed).`
  let aiText = ''
  try {
    const ai = await groundedSearch({
      query: prompt,
      maxOutputTokens: 2000,
    })
    aiText = ai.text
    const cost = calcCostEur({
      model: 'gemini-2.5-flash',
      promptTokens: ai.promptTokens,
      completionTokens: ai.completionTokens,
    })
    totalCostEur += cost

    await logResearchAiCall({
      startedAt: aiStartedAt,
      promptTokens: ai.promptTokens,
      completionTokens: ai.completionTokens,
      promptExcerpt: prompt,
      responseExcerpt: ai.text,
      query,
      kind: 'topic',
    })

    // Parse bullets into facts.
    const lines = aiText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => /^[-*•]\s+/.test(l))
    for (const line of lines) {
      const snippet = clampSnippet(line.replace(/^[-*•]\s+/, ''))
      if (snippet.length >= SNIPPET_MIN) {
        facts.push({
          source: 'gemini-grounding',
          title: query,
          snippet,
        })
      } else if (snippet.length > 0) {
        // Pad short snippets with a generic suffix to meet the floor.
        facts.push({
          source: 'gemini-grounding',
          title: query,
          snippet: `${snippet} (extrait condensé issu de la recherche Gemini ancrée sur Google Search).`.slice(
            0,
            SNIPPET_MAX,
          ),
        })
      }
    }
    // Attach citations.
    for (const c of ai.citations.slice(0, 8)) {
      facts.push({
        source: 'gemini-grounding',
        title: c.title || c.uri,
        snippet: clampSnippet(
          `Source citée par Gemini pour le sujet "${query}" : ${c.title || c.uri}.`,
        ),
        url: c.uri,
      })
    }
    if (!ai.grounded) {
      warnings.push('Gemini grounding unavailable — used plain generate as fallback')
    }
  } catch (err) {
    warnings.push(`Gemini grounded search failed: ${String(err)}`)
    await logResearchAiCall({
      startedAt: aiStartedAt,
      promptExcerpt: prompt,
      error: { code: 'gemini-topic-failed', message: String(err) },
      query,
      kind: 'topic',
    })
  }

  // 2) Wikipedia summary if a page exists. Try fr first, then en.
  let wikiSummaryTitle: string | undefined
  try {
    let summary = await getPageSummary(query, locale)
    if (!summary && locale === 'fr') summary = await getPageSummary(query, 'en')
    if (summary) {
      wikiSummaryTitle = summary.title
      facts.push({
        source: 'wikipedia',
        title: summary.title,
        snippet: clampSnippet(summary.extract),
        url: summary.url,
      })
      // Pull longer extract sections to deepen the research.
      try {
        const content = await getPageContent(summary.title, locale)
        if (content?.longExtract) {
          // Split into chunks of 1–3 sentences for downstream consumption.
          const chunks = content.longExtract
            .split(/(?<=\.)\s+(?=[A-ZÉÈÀÂÎÔÛŸÇ])/)
            .reduce<string[]>((acc, sentence) => {
              if (!acc.length) return [sentence]
              const last = acc[acc.length - 1]
              if (last.length + sentence.length < 280) {
                acc[acc.length - 1] = `${last} ${sentence}`
              } else {
                acc.push(sentence)
              }
              return acc
            }, [])
            .slice(0, 4)
          for (const ch of chunks) {
            const snippet = clampSnippet(ch)
            if (snippet.length >= SNIPPET_MIN) {
              facts.push({
                source: 'wikipedia',
                title: `${summary.title} (extrait)`,
                snippet,
                url: summary.url,
              })
            }
          }
        }
      } catch (err) {
        warnings.push(`Wikipedia long extract failed: ${String(err)}`)
      }
    } else {
      warnings.push(`Wikipedia: no page for topic "${query}" (${locale})`)
    }
  } catch (err) {
    warnings.push(`Wikipedia topic lookup failed: ${String(err)}`)
  }

  // 3) Image candidates — search Commons by query (always), then by Latin
  // binomial in brief (if any), then by Wikipedia title (fallback).
  let imageCandidates: ImageCandidate[] = []
  const seenImageUrls = new Set<string>()
  const tryAddImages = async (imgQuery: string) => {
    if (imageCandidates.length >= 4) return
    try {
      const more = await searchCommonsImages(imgQuery, { limit: 4, minWidth: 1200 })
      for (const cand of more) {
        if (!seenImageUrls.has(cand.url)) {
          seenImageUrls.add(cand.url)
          imageCandidates.push(cand)
        }
        if (imageCandidates.length >= 4) break
      }
    } catch (err) {
      warnings.push(`Commons search (topic, "${imgQuery}") failed: ${String(err)}`)
    }
  }
  await tryAddImages(query)
  if (brief) {
    const m = brief.match(/[A-Z][a-z]+ [a-z]+/)
    if (m) await tryAddImages(m[0])
  }
  if (wikiSummaryTitle && imageCandidates.length < 2) {
    await tryAddImages(wikiSummaryTitle)
  }

  return {
    facts,
    imageCandidates,
    structured: undefined,
    totalCostEur: Math.round(totalCostEur * 1_000_000) / 1_000_000,
    totalDurationMs: Date.now() - startedAt,
    warnings,
  }
}

export async function researchWeb(opts: ResearchOpts): Promise<ResearchResult> {
  const locale = opts.locale ?? 'fr'
  if (!opts.query || !opts.query.trim()) {
    return {
      facts: [],
      imageCandidates: [],
      structured: opts.kind === 'plant' ? {} : undefined,
      totalCostEur: 0,
      totalDurationMs: 0,
      warnings: ['empty query'],
    }
  }
  if (opts.kind === 'plant') {
    return researchPlant(opts.query.trim(), locale)
  }
  return researchTopic(opts.query.trim(), opts.brief, locale)
}
