import 'server-only'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Payload } from 'payload'

import { callAI } from './ai'
import { logAiCall } from './ai-audit'
import { isWithinDailyBudget } from './ai-budget'
import { moderateClaims } from './ai-moderate'
import { calcCostEur } from './ai-pricing'
import { isAiAvailable } from './ai-settings'
import { getDefaultAuthorId } from './default-author'
import { captureError } from './error-tracker'
import { generateGeoExtras, computeGeoReadinessScore } from './geo-extras'
import { generateGeoField, type GeoFieldType } from './geoGenerator'
import {
  buildRichText,
  estimateReadingTimeMinutes,
  lexicalToPlainText,
  type LexicalSection,
} from './lexical-builder'
import { notify } from './notify'
import { acquireLock, releaseLock } from './production-locks'
import { matchWikiRelations, matchBlogRelations } from './relations-matcher'
import { generateSeoPack } from './seo-generator'
import { slugify } from './slugify'
import { generateImageKeywords } from './image-keywords'
import { searchCommonsImages } from './wiki-commons'
import { searchUnsplashImages } from './unsplash-images'
import { researchWeb } from './web-research'
import type {
  ImageCandidate,
  ResearchResult,
  StructuredPlantData,
} from './web-research-types'

// ─── Public types ───────────────────────────────────────────────────────

export type ProduceKind = 'wiki' | 'blog'
export type ProduceMode = 'autonomous' | 'import-json'
// WHY: only 'fail' is supported by policy. We keep the type alias to preserve
// the public API contract; the value is always coerced to 'fail' at the entry.
export type ConflictPolicy = 'fail'

export type ProduceOptions = {
  kind: ProduceKind
  /** Nom de plante OU sujet d'article (slug-friendly). */
  seed: string
  mode?: ProduceMode
  conflictPolicy?: ConflictPolicy
  /** Pour blog : angle / instructions auteur. */
  brief?: string
  /** Pour mode 'import-json' : champs déjà rédigés. */
  importedJson?: Record<string, unknown>
  initiatedBy?: 'admin-ui' | 'api-key' | 'cli' | 'cron'
  actorId?: string
  locale?: 'fr' | 'en'
}

export type ProductionStep =
  | 'queued'
  | 'researching'
  | 'extracting'
  | 'generating-fields'
  | 'generating-geo'
  | 'generating-seo'
  | 'fetching-images'
  | 'moderating'
  | 'creating-doc'
  | 'uploading-images'
  | 'publishing'
  | 'done'
  | 'failed'

export type ProduceResult = {
  runId: string | number
  status: ProductionStep
  docCollection?: 'wikiEntries' | 'blogPosts'
  docId?: string | number
  docSlug?: string
  totalCostEur: number
  totalDurationMs: number
  errorCode?: string
  errorMessage?: string
  warnings: string[]
}

// ─── Internal types ─────────────────────────────────────────────────────

type StepEntry = {
  name: string
  status: 'pending' | 'ok' | 'failed'
  durationMs: number
  output?: Record<string, unknown> | null
  errorMessage?: string
}

type RunCtx = {
  payload: Payload
  runId: string | number
  kind: ProduceKind
  seed: string
  slug: string
  locale: 'fr' | 'en'
  brief?: string
  steps: StepEntry[]
  warnings: string[]
  costEur: number
  startedAt: number
}

const LOCK_TTL_SEC = 600

// ─── Main entrypoint ────────────────────────────────────────────────────

export async function produceContent(opts: ProduceOptions): Promise<ProduceResult> {
  const startedAt = Date.now()
  const locale: 'fr' | 'en' = opts.locale === 'en' ? 'en' : 'fr'
  const mode: ProduceMode = opts.mode ?? 'autonomous'
  // Conflict policy is always 'fail' (no auto-overwrite, no merge).
  const conflictPolicy: ConflictPolicy = 'fail'
  const slug = slugify(opts.seed)

  const payload = await getPayload({ config: configPromise })

  // Pre-flight: cap unifié + kill-switch
  // (sont gérés au niveau de chaque appel IA via les libs dédiées, mais on
  // refuse une production qui démarre alors que l'IA est explicitement off)
  const availability = await isAiAvailable()
  if (!availability.ok) {
    return {
      runId: '0',
      status: 'failed',
      totalCostEur: 0,
      totalDurationMs: Date.now() - startedAt,
      errorCode: 'ai_unavailable',
      errorMessage: availability.message || `IA indisponible (${availability.reason})`,
      warnings: [],
    }
  }

  const budget = await isWithinDailyBudget(payload)
  if (!budget.ok) {
    return {
      runId: '0',
      status: 'failed',
      totalCostEur: 0,
      totalDurationMs: Date.now() - startedAt,
      errorCode: 'budget_exceeded',
      errorMessage: `Budget IA quotidien dépassé (${budget.spentEur.toFixed(4)}€ / ${budget.budgetEur.toFixed(2)}€).`,
      warnings: [],
    }
  }

  if (!slug) {
    return {
      runId: '0',
      status: 'failed',
      totalCostEur: 0,
      totalDurationMs: Date.now() - startedAt,
      errorCode: 'invalid_seed',
      errorMessage: 'La graine fournie ne produit pas de slug valide.',
      warnings: [],
    }
  }

  // ── Acquire distributed lock ────────────────────────────────────────
  const lockKey = `lock:produce:${opts.kind}:${slug}`
  const lock = await acquireLock(lockKey, LOCK_TTL_SEC)
  if (!lock.ok) {
    return {
      runId: '0',
      status: 'failed',
      totalCostEur: 0,
      totalDurationMs: Date.now() - startedAt,
      errorCode: 'lock_busy',
      errorMessage: lock.existingLockHolder
        ? `Production déjà en cours sur ${lockKey} (holder: ${lock.existingLockHolder}).`
        : `Production déjà en cours sur ${lockKey}.`,
      warnings: [],
    }
  }

  // ── Conflict check ──────────────────────────────────────────────────
  const targetCollection: 'wikiEntries' | 'blogPosts' =
    opts.kind === 'wiki' ? 'wikiEntries' : 'blogPosts'

  try {
    const existing = await payload.find({
      collection: targetCollection,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const docs = (existing?.docs ?? []) as Array<{ id: string | number }>
    if (docs.length > 0) {
      const existingId = docs[0].id
      const adminLink = `/admin/collections/${targetCollection}/${existingId}`
      await releaseLock(lockKey)
      return {
        runId: '0',
        status: 'failed',
        docCollection: targetCollection,
        docId: existingId,
        docSlug: slug,
        totalCostEur: 0,
        totalDurationMs: Date.now() - startedAt,
        errorCode: 'slug_exists',
        errorMessage: `Déjà existant : ${adminLink}`,
        warnings: [],
      }
    }
  } catch (err) {
    await releaseLock(lockKey)
    await captureError(err, {
      subsystem: 'content-orchestrator',
      context: { phase: 'conflict-check', kind: opts.kind, slug },
    })
    return {
      runId: '0',
      status: 'failed',
      totalCostEur: 0,
      totalDurationMs: Date.now() - startedAt,
      errorCode: 'conflict_check_failed',
      errorMessage: err instanceof Error ? err.message : String(err),
      warnings: [],
    }
  }

  // ── Create initial ProductionRun doc ────────────────────────────────
  let runId: string | number
  try {
    const created = (await payload.create({
      collection: 'productionRun' as never,
      overrideAccess: true,
      data: {
        kind: opts.kind,
        seed: opts.seed.slice(0, 200),
        mode,
        conflictPolicy,
        status: 'queued',
        brief: opts.brief,
        importedJson: opts.importedJson as never,
        steps: [],
        totalCostEur: 0,
        totalDurationMs: 0,
        warnings: [],
        initiatedBy: opts.initiatedBy,
        actorId: opts.actorId,
        locale,
      } as never,
    })) as { id: string | number }
    runId = created.id
  } catch (err) {
    await releaseLock(lockKey)
    await captureError(err, {
      subsystem: 'content-orchestrator',
      context: { phase: 'create-run', kind: opts.kind, slug },
    })
    return {
      runId: '0',
      status: 'failed',
      totalCostEur: 0,
      totalDurationMs: Date.now() - startedAt,
      errorCode: 'run_create_failed',
      errorMessage: err instanceof Error ? err.message : String(err),
      warnings: [],
    }
  }

  const ctx: RunCtx = {
    payload,
    runId,
    kind: opts.kind,
    seed: opts.seed,
    slug,
    locale,
    brief: opts.brief,
    steps: [],
    warnings: [],
    costEur: 0,
    startedAt,
  }

  // Conflict policy is fail-only → we never reach the pipelines with an
  // existing doc id. Pipelines therefore always run in "create" mode.
  const existingId = undefined as string | number | undefined

  try {
    if (mode === 'import-json') {
      return await runImportJson(ctx, opts, existingId, lockKey)
    }
    if (opts.kind === 'wiki') {
      return await runWikiPipeline(ctx, existingId, lockKey)
    }
    return await runBlogPipeline(ctx, existingId, lockKey)
  } catch (err) {
    // Ultimate safety net — should normally be caught inside the pipelines.
    await captureError(err, {
      subsystem: 'content-orchestrator',
      context: { phase: 'pipeline-uncaught', kind: opts.kind, slug, runId },
    })
    await finalizeRun(ctx, {
      status: 'failed',
      errorCode: 'unexpected',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    await releaseLock(lockKey)
    return buildResult(ctx, 'failed', undefined, undefined, undefined, {
      errorCode: 'unexpected',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
  }
}

// ─── Wiki pipeline (autonomous) ─────────────────────────────────────────

async function runWikiPipeline(
  ctx: RunCtx,
  existingId: string | number | undefined,
  lockKey: string,
): Promise<ProduceResult> {
  // 1. Researching
  const research = await runStep(ctx, 'researching', async () => {
    await updateRunStatus(ctx, 'researching')
    const r = await researchWeb({ query: ctx.seed, kind: 'plant', locale: ctx.locale })
    ctx.costEur += r.totalCostEur || 0
    if (r.warnings?.length) ctx.warnings.push(...r.warnings)
    return { result: r, output: { factsCount: r.facts.length, imagesCount: r.imageCandidates.length, costEur: r.totalCostEur } }
  })
  if (!research.ok) return await abort(ctx, lockKey, 'research_failed', research.error)

  // 2. Extracting
  const extract = await runStep(ctx, 'extracting', async () => {
    const out = extractWikiBaseFields(research.value.result, ctx.seed)
    if (!out.name || !out.shortDescription) {
      throw new Error('Données minimales manquantes (name + shortDescription).')
    }
    return { result: out, output: { hasLatinName: !!out.latinName, descLength: (out.longDescription || '').length } }
  })
  if (!extract.ok) return await abort(ctx, lockKey, 'extract_failed', extract.error)

  // 3. Generating fields (filling gaps via callAI). The web research step
  // already attempts to fill the botanical card via Gemini grounding; this
  // step is a safety net for any field still empty plus the long-form
  // description which doesn't fit the structured Gemini fill.
  const filled = await runStep(ctx, 'generating-fields', async () => {
    const base = extract.value.result
    const gaps: Array<keyof typeof base> = []
    if (!base.longDescription || base.longDescription.length < 200) gaps.push('longDescription')
    if (!base.precautionsText) gaps.push('precautionsText')
    if (!base.latinName) gaps.push('latinName')
    if (!base.family) gaps.push('family')
    if (!base.origin) gaps.push('origin')
    if (!base.partsUsed) gaps.push('partsUsed')
    if (!base.activeCompounds) gaps.push('activeCompounds')
    if (!base.harvest) gaps.push('harvest')
    if (!base.form) gaps.push('form')
    if (!base.conservation) gaps.push('conservation')

    const FIELD_INSTRUCTIONS: Partial<Record<string, string>> = {
      latinName:
        'Donne le nom binominal officiel (genre + espèce, ex. "Matricaria chamomilla"). Réponds UNIQUEMENT par les 2 mots latins, sans guillemets, sans préambule.',
      family:
        'Donne la famille botanique en français (ex. "Astéracées", "Lamiacées"). Réponds UNIQUEMENT par le nom de famille, sans guillemets, sans préambule.',
      origin:
        "Décris l'origine géographique et la répartition naturelle de la plante en 1 phrase factuelle (ex. \"Originaire d'Europe et d'Asie occidentale, naturalisée dans les régions tempérées.\"). Pas de guillemets.",
      partsUsed:
        'Liste les parties de la plante utilisées en phytothérapie en 1 phrase courte (ex. "Fleurs, feuilles et sommités fleuries."). Pas de guillemets.',
      activeCompounds:
        'Liste les principaux composés actifs documentés en 1-2 phrases factuelles (ex. "Chamazulène, alpha-bisabolol, flavonoïdes (apigénine, lutéoline) et coumarines."). Sources botaniques / pharmacopée. Pas de guillemets.',
      harvest:
        'Précise la période et la méthode de récolte traditionnelle en 1 phrase (ex. "Récolte des fleurs de mai à août, par temps sec, en milieu de matinée."). Pas de guillemets.',
      form:
        'Liste les formes galéniques courantes en 1 phrase (ex. "Tisane, infusion, huile essentielle, teinture mère, gélules."). Pas de guillemets.',
      conservation:
        "Précise les conditions de conservation en 1 phrase (ex. \"Conserver les fleurs séchées en bocal hermétique, à l'abri de la lumière et de l'humidité, pendant 12 mois maximum.\"). Pas de guillemets.",
      precautionsText:
        "Décris les précautions d'emploi et contre-indications connues de la plante en 2-3 phrases factuelles. Mentionne explicitement la grossesse, l'allaitement et les enfants si pertinent. Aucune allégation de guérison.",
      longDescription:
        'Rédige 3-5 paragraphes (séparés par une ligne vide) qui présentent la plante : histoire / origine, propriétés botaniques, usages traditionnels documentés, particularités. Ton encyclopédique, factuel, neutre. Pas de markdown.',
    }

    const filledData = { ...base }
    for (const g of gaps) {
      try {
        const text = await callAIForField(
          ctx,
          String(g),
          {
            name: base.name,
            latinName: filledData.latinName,
            shortDescription: base.shortDescription,
            longDescription: filledData.longDescription,
          },
          FIELD_INSTRUCTIONS[String(g)],
        )
        if (text) (filledData as Record<string, unknown>)[g as string] = text
      } catch (err) {
        ctx.warnings.push(
          `Génération du champ "${String(g)}" échouée : ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    }
    return { result: filledData, output: { gapsFilled: gaps } }
  })
  if (!filled.ok) return await abort(ctx, lockKey, 'fields_failed', filled.error)

  // 4. Generating GEO
  const geo = await runStep(ctx, 'generating-geo', async () => {
    const base = filled.value.result
    const geoCtx = {
      kind: 'plant' as const,
      name: base.name,
      latinName: base.latinName,
      shortDescription: base.shortDescription,
      longDescription: base.longDescription,
    }
    const fields: GeoFieldType[] = ['directAnswer', 'definition', 'keyTakeaways', 'faq']
    const out: {
      directAnswer?: string
      definition?: string
      keyTakeaways: Array<{ takeaway: string }>
      faq: Array<{ question: string; answer: string }>
    } = { keyTakeaways: [], faq: [] }
    for (const f of fields) {
      try {
        const r = await generateGeoField(f, geoCtx, ctx.locale)
        const cost = calcCostEur({
          model: 'gemini-2.5-flash-lite',
          promptTokens: r.promptTokens,
          completionTokens: r.completionTokens,
        })
        ctx.costEur += cost
        await logAiCall(
          ctx.payload,
          {
            subsystem: 'ai-geo',
            model: 'gemini-2.5-flash-lite',
            collectionTarget: 'wikiEntries',
            fieldTarget: f,
          },
          Date.now(),
          { promptTokens: r.promptTokens, completionTokens: r.completionTokens },
          null,
        ).catch(() => undefined)
        if (r.field === 'directAnswer' || r.field === 'definition') {
          out[r.field] = r.text
        } else if (r.field === 'keyTakeaways') {
          out.keyTakeaways = r.items.map((t) => ({ takeaway: t }))
        } else if (r.field === 'faq') {
          out.faq = r.items
        }
      } catch (err) {
        ctx.warnings.push(`GEO ${f} : ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    return { result: out, output: { directAnswer: !!out.directAnswer, faqCount: out.faq.length } }
  })
  if (!geo.ok) return await abort(ctx, lockKey, 'geo_failed', geo.error)

  // 5. Generating SEO
  const seo = await runStep(ctx, 'generating-seo', async () => {
    const base = filled.value.result
    const r = await generateSeoPack({
      collection: 'wikiEntries',
      locale: ctx.locale,
      context: {
        name: base.name,
        latinName: base.latinName,
        shortDescription: base.shortDescription,
        longDescription: base.longDescription,
      },
    })
    const cost = calcCostEur({
      model: 'gemini-2.5-flash-lite',
      promptTokens: r.promptTokens,
      completionTokens: r.completionTokens,
    })
    ctx.costEur += cost
    return { result: r, output: { titleLen: r.title.length, keywordsCount: r.keywords.length } }
  })
  if (!seo.ok) return await abort(ctx, lockKey, 'seo_failed', seo.error)

  // 6. Fetching images — Wiki Commons (botanical, primary) + Unsplash fallback,
  // both driven by clean English keywords + Latin name.
  const wikiImageCandidates = await runStep(ctx, 'fetching-images', async () => {
    const acc: ImageCandidate[] = [...research.value.result.imageCandidates]
    const seenUrls = new Set(acc.map((c) => c.url))

    const kwStart = Date.now()
    const kw = await generateImageKeywords({
      seed: ctx.seed,
      kind: 'plant',
      latinName: filled.value.result.latinName,
      excerpt: filled.value.result.shortDescription,
    })
    {
      const cost = calcCostEur({
        model: 'gemini-2.5-flash-lite',
        promptTokens: kw.promptTokens,
        completionTokens: kw.completionTokens,
      })
      ctx.costEur += cost
      await logAiCall(
        ctx.payload,
        {
          subsystem: 'ai-image-keywords',
          model: 'gemini-2.5-flash-lite',
          collectionTarget: 'wikiEntries',
          fieldTarget: 'imageKeywords',
        },
        kwStart,
        { promptTokens: kw.promptTokens, completionTokens: kw.completionTokens },
        null,
      ).catch(() => undefined)
    }

    // Top-up Commons with the Latin name (more precise for plants).
    if (acc.length < 3 && filled.value.result.latinName) {
      try {
        const more = await searchCommonsImages(filled.value.result.latinName, {
          limit: 3,
          minWidth: 1200,
        })
        for (const cand of more) {
          if (!seenUrls.has(cand.url)) {
            seenUrls.add(cand.url)
            acc.push(cand)
          }
          if (acc.length >= 3) break
        }
      } catch (err) {
        ctx.warnings.push(`Commons (latin) failed: ${String(err)}`)
      }
    }

    // Unsplash fallback — quality-filtered, validated against plant terms.
    if (acc.length < 3) {
      try {
        for (const q of kw.keywords) {
          if (acc.length >= 3) break
          const more = await searchUnsplashImages(q, {
            limit: 3,
            locale: 'en',
            minLikes: 30,
            minWidth: 1200,
            validationTerms: kw.validationTerms,
          })
          for (const cand of more) {
            if (!seenUrls.has(cand.url)) {
              seenUrls.add(cand.url)
              acc.push(cand)
            }
            if (acc.length >= 3) break
          }
        }
      } catch (err) {
        ctx.warnings.push(`Unsplash search (wiki) failed: ${String(err)}`)
      }
    }
    return {
      result: acc,
      output: {
        count: acc.length,
        sources: acc.map((c) => c.source),
        keywords: kw.keywords,
      },
    }
  })

  // 7. Moderating
  const moderation = await runStep(ctx, 'moderating', async () => {
    const base = filled.value.result
    const text = [base.shortDescription, base.longDescription].filter(Boolean).join('\n\n')
    const verdict = await moderateClaims({
      text,
      locale: ctx.locale,
      context: { collection: 'wikiEntries' },
    })
    const cost = calcCostEur({
      model: 'gemini-2.5-flash-lite',
      promptTokens: verdict.promptTokens,
      completionTokens: verdict.completionTokens,
    })
    ctx.costEur += cost
    if (verdict.verdict === 'block') {
      throw new Error(`MODERATION_BLOCK:${verdict.reason}`)
    }
    if (verdict.verdict === 'risk') {
      // High-confidence "risk" verdict is treated as a block — it usually
      // means the LLM detected a borderline EFSA claim. Below 0.7 confidence
      // we let it through with a warning (still requires regex compliance).
      if ((verdict.confidence ?? 0) >= 0.7) {
        throw new Error(`MODERATION_BLOCK:risk-high-confidence:${verdict.reason}`)
      }
      ctx.warnings.push(`Modération à risque (confidence ${verdict.confidence?.toFixed(2) ?? '?'}): ${verdict.reason}`)
    }
    return { result: verdict, output: { verdict: verdict.verdict, confidence: verdict.confidence } }
  })
  if (!moderation.ok) {
    const isBlocked = moderation.error?.message?.startsWith('MODERATION_BLOCK')
    return await abort(
      ctx,
      lockKey,
      isBlocked ? 'moderation_blocked' : 'moderation_failed',
      moderation.error,
    )
  }

  // 8. Uploading images
  const uploaded = await runStep(ctx, 'uploading-images', async () => {
    const candidates = (
      wikiImageCandidates.ok ? wikiImageCandidates.value.result : []
    ).slice(0, 3) as ImageCandidate[]
    const ids: Array<string | number> = []
    for (const cand of candidates) {
      try {
        const id = await uploadImageCandidate(ctx, cand)
        if (id !== null) ids.push(id)
      } catch (err) {
        ctx.warnings.push(
          `Upload image (${cand.fileName ?? cand.url}) échoué : ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    }
    return { result: ids, output: { uploaded: ids.length, attempted: candidates.length } }
  })
  // images sont best-effort

  // 8b. Match relations (best-effort, before doc creation)
  let wikiRelations: {
    benefits: Array<number | string>
    relatedProducts: Array<number | string>
    relatedPosts: Array<number | string>
  } = { benefits: [], relatedProducts: [], relatedPosts: [] }
  try {
    const base = filled.value.result
    wikiRelations = await matchWikiRelations({
      payload: ctx.payload,
      name: base.name || ctx.seed,
      latinName: base.latinName,
      shortDescription: base.shortDescription || '',
      longDescription: base.longDescription || '',
      locale: ctx.locale,
    })
  } catch (err) {
    ctx.warnings.push(
      `Relation matching failed (non-blocking): ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // 8c. GEO extras for the wiki entry
  const wikiFactsBlock = research.value.result.facts
    .slice(0, 8)
    .map((f) => `- ${f.snippet}${f.url ? ` (${f.url})` : ''}`)
    .join('\n')
  const wikiGeoExtrasStart = Date.now()
  const wikiGeoExtras = await generateGeoExtras({
    kind: 'plant',
    name: filled.value.result.name || ctx.seed,
    latinName: filled.value.result.latinName,
    shortDescription: filled.value.result.shortDescription,
    longDescription: filled.value.result.longDescription,
    factsBlock: wikiFactsBlock,
  })
  {
    const cost = calcCostEur({
      model: 'gemini-2.5-flash-lite',
      promptTokens: wikiGeoExtras.promptTokens,
      completionTokens: wikiGeoExtras.completionTokens,
    })
    ctx.costEur += cost
    await logAiCall(
      ctx.payload,
      {
        subsystem: 'ai-geo-extras',
        model: 'gemini-2.5-flash-lite',
        collectionTarget: 'wikiEntries',
        fieldTarget: 'geoExtras',
      },
      wikiGeoExtrasStart,
      { promptTokens: wikiGeoExtras.promptTokens, completionTokens: wikiGeoExtras.completionTokens },
      null,
    ).catch(() => undefined)
  }

  // 8d. Resolve default author
  let wikiAuthorId: string | number | null = null
  try {
    wikiAuthorId = await getDefaultAuthorId(ctx.payload)
  } catch (err) {
    ctx.warnings.push(
      `Default author resolution failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // 9. Creating doc
  const created = await runStep(ctx, 'creating-doc', async () => {
    const base = filled.value.result
    const geoData = geo.value.result
    const seoData = seo.value.result
    const imageIds = (uploaded.ok ? uploaded.value.result : []) as Array<string | number>

    const readinessScore = computeGeoReadinessScore({
      hasDirectAnswer: !!geoData.directAnswer,
      hasDefinition: !!geoData.definition,
      keyTakeawaysCount: geoData.keyTakeaways.length,
      faqCount: geoData.faq.length,
      quotableStatementsCount: wikiGeoExtras.quotableStatements.length,
      dataPointsCount: wikiGeoExtras.dataPoints.length,
      sourcesCount: wikiGeoExtras.sources.length,
      targetAIQueriesCount: wikiGeoExtras.targetAIQueries.length,
      hasAuthoritySignals: wikiGeoExtras.authoritySignals.length > 0,
    })

    const data: Record<string, unknown> = {
      name: base.name,
      latinName: base.latinName,
      slug: ctx.slug,
      shortDescription: base.shortDescription,
      longDescription: base.longDescription,
      family: base.family,
      origin: base.origin,
      partsUsed: base.partsUsed,
      activeCompounds: base.activeCompounds,
      harvest: base.harvest,
      conservation: base.conservation,
      form: base.form,
      precautionsText: base.precautionsText,
      images: imageIds.map((id) => ({ image: id })),
      benefits: wikiRelations.benefits,
      relatedProducts: wikiRelations.relatedProducts,
      relatedPosts: wikiRelations.relatedPosts,
      author: wikiAuthorId ?? undefined,
      status: 'published',
      complianceStatus: 'approved',
      directAnswer: geoData.directAnswer,
      definition: geoData.definition,
      keyTakeaways: geoData.keyTakeaways,
      faq: geoData.faq,
      quotableStatements: wikiGeoExtras.quotableStatements.map((q) => ({
        statement: q.statement,
        source: q.source,
      })),
      dataPoints: wikiGeoExtras.dataPoints.map((d) => ({
        metric: d.metric,
        value: d.value,
        unit: d.unit,
        source: d.source,
      })),
      sources: wikiGeoExtras.sources.map((s) => ({
        title: s.title,
        publisher: s.publisher,
        year: s.year,
        url: s.url,
      })),
      targetAIQueries: wikiGeoExtras.targetAIQueries,
      authoritySignals: wikiGeoExtras.authoritySignals,
      lastFactCheckedAt: new Date().toISOString(),
      geoReadinessScore: readinessScore,
      meta: {
        title: seoData.title,
        description: seoData.description,
        keywords: seoData.keywords?.join(', '),
      },
      complianceLLM: {
        verdict: moderation.value.result.verdict,
        confidence: moderation.value.result.confidence,
        matchedClaims: (moderation.value.result.matchedClaims || []).map((c) => ({ claim: c })),
        reason: moderation.value.result.reason,
        at: new Date().toISOString(),
      },
    }
    let doc: { id: string | number }
    if (existingId !== undefined) {
      doc = (await ctx.payload.update({
        collection: 'wikiEntries',
        id: existingId,
        locale: ctx.locale as never,
        overrideAccess: true,
        context: { skipModeration: true, skipCompliance: true } as never,
        data: data as never,
      })) as { id: string | number }
    } else {
      doc = (await ctx.payload.create({
        collection: 'wikiEntries',
        locale: ctx.locale as never,
        overrideAccess: true,
        context: { skipModeration: true, skipCompliance: true } as never,
        data: data as never,
      })) as { id: string | number }
    }
    return { result: doc, output: { docId: String(doc.id), updated: existingId !== undefined } }
  })
  if (!created.ok) return await abort(ctx, lockKey, 'doc_create_failed', created.error)

  // 10. Publishing (auto with watchdog)
  const published = await runStep(ctx, 'publishing', async () => {
    const docId = created.value.result.id
    await ctx.payload.update({
      collection: 'wikiEntries',
      id: docId,
      locale: ctx.locale as never,
      overrideAccess: true,
      context: { skipModeration: true, skipCompliance: true } as never,
      data: {
        _status: 'published',
        status: 'published',
        complianceStatus: 'approved',
        reviewedBy: null,
        reviewedAt: new Date().toISOString(),
      } as never,
    })
    return { result: { docId }, output: { published: true } }
  })
  if (!published.ok) return await abort(ctx, lockKey, 'publish_failed', published.error)

  const docId = created.value.result.id
  const docTitle = filled.value.result.name || ctx.seed
  await emitWatchdog(ctx, 'wikiEntries', docId, docTitle)

  await finalizeRun(ctx, {
    status: 'done',
    docCollection: 'wikiEntries',
    docId,
    docSlug: ctx.slug,
    publishedAt: new Date().toISOString(),
  })
  await releaseLock(lockKey)
  return buildResult(ctx, 'done', 'wikiEntries', docId, ctx.slug)
}

// ─── Blog pipeline (autonomous) ─────────────────────────────────────────

async function runBlogPipeline(
  ctx: RunCtx,
  existingId: string | number | undefined,
  lockKey: string,
): Promise<ProduceResult> {
  // 1. Researching
  const research = await runStep(ctx, 'researching', async () => {
    await updateRunStatus(ctx, 'researching')
    const r = await researchWeb({
      query: ctx.seed,
      kind: 'topic',
      brief: ctx.brief,
      locale: ctx.locale,
    })
    ctx.costEur += r.totalCostEur || 0
    if (r.warnings?.length) ctx.warnings.push(...r.warnings)
    return { result: r, output: { factsCount: r.facts.length, imagesCount: r.imageCandidates.length } }
  })
  if (!research.ok) return await abort(ctx, lockKey, 'research_failed', research.error)

  // 2. Extracting
  const extract = await runStep(ctx, 'extracting', async () => {
    const facts = research.value.result.facts.slice(0, 12)
    const bullets = facts.map((f) => {
      const cite = f.url ? ` (${f.url})` : f.source ? ` (${f.source})` : ''
      return `- ${f.snippet}${cite}`
    })
    return { result: { facts, bullets }, output: { factsCount: facts.length } }
  })
  if (!extract.ok) return await abort(ctx, lockKey, 'extract_failed', extract.error)

  // 3. Generating fields (title, excerpt, content)
  const fields = await runStep(ctx, 'generating-fields', async () => {
    const factsBlock = extract.value.result.bullets.join('\n') || '(aucun fait collecté — utilise tes connaissances générales sur le sujet)'

    // Tone guideline applied to every blog generation step.
    const BLOG_TONE =
      "Ton éditorial : chaleureux, éducatif, humain, bienveillant. Tu t'adresses à un lecteur curieux comme à une personne chère, en partageant un savoir transmis (grand-mère / herboristerie traditionnelle), sans jargon clinique. Tu accueilles les questions, tu rassures, tu invites à explorer. Évite le ton publicitaire, les superlatifs, les promesses santé."
 
    // CRITICAL : sanitizeContext (allowlist) strips topic/brief/facts from
    // `context`. We pass them inline in `instructions` so the model actually
    // sees the article subject — otherwise it generates from a vacuum.
    const subjectBlock = [
      `SUJET DE L'ARTICLE : "${ctx.seed}"`,
      ctx.brief ? `ANGLE / BRIEF : ${ctx.brief}` : '',
      `FAITS COLLECTÉS PAR LA RECHERCHE WEB :`,
      factsBlock,
    ]
      .filter(Boolean)
      .join('\n')

    // Title
    const title = await callAIForField(
      ctx,
      'title',
      { topic: ctx.seed },
      `${BLOG_TONE}\n\n${subjectBlock}\n\nGénère un titre éditorial chaleureux et engageant (50-65 caractères, sans guillemets) qui mentionne EXPLICITEMENT le sujet "${ctx.seed}" et reflète l'angle. Le titre doit donner envie d'apprendre, pas vendre.`,
    )
    // Excerpt
    const excerpt = await callAIForField(
      ctx,
      'excerpt',
      { topic: ctx.seed, title },
      `${BLOG_TONE}\n\n${subjectBlock}\n\nTitre choisi : "${title}".\n\nRédige un extrait (1 paragraphe, 140-200 caractères) qui accueille le lecteur avec bienveillance et lui donne envie de poursuivre. L'extrait doit parler EXPLICITEMENT du sujet "${ctx.seed}".`,
    )

    // Content sections (3 sections)
    const sections: LexicalSection[] = []
    const headingsRaw = await callAIForField(
      ctx,
      'sections-outline',
      { topic: ctx.seed, title },
      `${BLOG_TONE}\n\n${subjectBlock}\n\nTitre : "${title}"\n\nPropose 3 titres de sections h2 pour structurer un article sur "${ctx.seed}" comme un récit progressif (origine/contexte, usages traditionnels, conseils pratiques modernes par exemple). UN titre par ligne, sans numérotation, sans guillemets. Préfère des titres en phrase complète plutôt que des mots-clés secs. Chaque titre doit ancrer le lecteur dans le sujet "${ctx.seed}".`,
    )
    const headings = (headingsRaw || '')
      .split('\n')
      .map((s) => s.replace(/^[-*\d.\s]+/, '').trim())
      .filter((s) => s.length > 0)
      .slice(0, 4)
    if (headings.length === 0) headings.push('Tout savoir sur ' + (title || ctx.seed))

    for (const heading of headings) {
      try {
        const para = await callAIForField(
          ctx,
          'section-content',
          { topic: ctx.seed, heading },
          `${BLOG_TONE}\n\n${subjectBlock}\n\nTitre de l'article : "${title}"\nSection en cours : "${heading}"\n\nRédige 2-3 paragraphes (séparés par une ligne vide) qui développent la section "${heading}" en restant TOUJOURS centré sur le sujet "${ctx.seed}". Reste factuel mais incarne le ton chaleureux : phrases qui invitent ("Vous découvrirez…", "Imaginez…", "On l'utilisait autrefois…"), images sensorielles quand pertinent (parfum, couleur, saison). Pas de liste, pas de markdown, français naturel et fluide. Appuie-toi sur les FAITS COLLECTÉS plus haut quand c'est pertinent.`,
        )
        const paragraphs = (para || '')
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
        sections.push({ heading, paragraphs: paragraphs.length ? paragraphs : [para || ''] })
      } catch (err) {
        ctx.warnings.push(
          `Section "${heading}" : ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    }

    return {
      result: { title, excerpt, sections, sectionsCount: sections.length },
      output: { titleLen: (title || '').length, sections: sections.length },
    }
  })
  if (!fields.ok) return await abort(ctx, lockKey, 'fields_failed', fields.error)

  // 3b. Build a working plain-text representation for SEO/moderation/GEO.
  const sectionsPlain = fields.value.result.sections
    .map((s) => `${s.heading ? `## ${s.heading}\n` : ''}${s.paragraphs.join('\n\n')}`)
    .join('\n\n')

  // 4. Generating SEO
  const seo = await runStep(ctx, 'generating-seo', async () => {
    const f = fields.value.result
    const r = await generateSeoPack({
      collection: 'blogPosts',
      locale: ctx.locale,
      context: {
        title: f.title,
        excerpt: f.excerpt,
        longDescription: sectionsPlain.slice(0, 2000),
      },
    })
    const cost = calcCostEur({
      model: 'gemini-2.5-flash-lite',
      promptTokens: r.promptTokens,
      completionTokens: r.completionTokens,
    })
    ctx.costEur += cost
    return { result: r, output: { titleLen: r.title.length, descLen: r.description.length, keywords: r.keywords.length } }
  })
  if (!seo.ok) return await abort(ctx, lockKey, 'seo_failed', seo.error)

  // 4b. Generating GEO (directAnswer / definition / keyTakeaways / faq)
  const geo = await runStep(ctx, 'generating-geo', async () => {
    const f = fields.value.result
    const geoCtx = {
      kind: 'article' as const,
      name: f.title,
      shortDescription: f.excerpt,
      longDescription: sectionsPlain.slice(0, 4000),
      content: sectionsPlain,
    }
    const fieldsToGen: GeoFieldType[] = ['directAnswer', 'definition', 'keyTakeaways', 'faq']
    const out: {
      directAnswer?: string
      definition?: string
      keyTakeaways: Array<{ takeaway: string }>
      faq: Array<{ question: string; answer: string }>
    } = { keyTakeaways: [], faq: [] }
    for (const fld of fieldsToGen) {
      try {
        const r = await generateGeoField(fld, geoCtx, ctx.locale)
        const cost = calcCostEur({
          model: 'gemini-2.5-flash-lite',
          promptTokens: r.promptTokens,
          completionTokens: r.completionTokens,
        })
        ctx.costEur += cost
        if (r.field === 'directAnswer' || r.field === 'definition') {
          out[r.field] = r.text
        } else if (r.field === 'keyTakeaways') {
          out.keyTakeaways = r.items.map((t) => ({ takeaway: t }))
        } else if (r.field === 'faq') {
          out.faq = r.items
        }
      } catch (err) {
        ctx.warnings.push(`GEO ${fld} : ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    return { result: out, output: { hasDirectAnswer: !!out.directAnswer, faqCount: out.faq.length } }
  })

  // 4c. GEO extras (quotables / dataPoints / sources / target queries / authority)
  const factsBlockForGeo = research.value.result.facts
    .slice(0, 8)
    .map((f) => `- ${f.snippet}${f.url ? ` (${f.url})` : ''}`)
    .join('\n')
  const geoExtrasStart = Date.now()
  const geoExtras = await generateGeoExtras({
    kind: 'article',
    name: fields.value.result.title || ctx.seed,
    shortDescription: fields.value.result.excerpt,
    longDescription: sectionsPlain.slice(0, 4000),
    factsBlock: factsBlockForGeo,
  })
  {
    const cost = calcCostEur({
      model: 'gemini-2.5-flash-lite',
      promptTokens: geoExtras.promptTokens,
      completionTokens: geoExtras.completionTokens,
    })
    ctx.costEur += cost
    await logAiCall(
      ctx.payload,
      {
        subsystem: 'ai-geo-extras',
        model: 'gemini-2.5-flash-lite',
        collectionTarget: 'blogPosts',
        fieldTarget: 'geoExtras',
      },
      geoExtrasStart,
      { promptTokens: geoExtras.promptTokens, completionTokens: geoExtras.completionTokens },
      null,
    ).catch(() => undefined)
  }

  // 5. Moderating
  const moderation = await runStep(ctx, 'moderating', async () => {
    const f = fields.value.result
    const text = [f.excerpt, sectionsPlain].filter(Boolean).join('\n\n')
    const verdict = await moderateClaims({
      text,
      locale: ctx.locale,
      context: { collection: 'blogPosts' },
    })
    const cost = calcCostEur({
      model: 'gemini-2.5-flash-lite',
      promptTokens: verdict.promptTokens,
      completionTokens: verdict.completionTokens,
    })
    ctx.costEur += cost
    if (verdict.verdict === 'block') {
      throw new Error(`MODERATION_BLOCK:${verdict.reason}`)
    }
    if (verdict.verdict === 'risk') {
      // High-confidence "risk" verdict is treated as a block — it usually
      // means the LLM detected a borderline EFSA claim. Below 0.7 confidence
      // we let it through with a warning (still requires regex compliance).
      if ((verdict.confidence ?? 0) >= 0.7) {
        throw new Error(`MODERATION_BLOCK:risk-high-confidence:${verdict.reason}`)
      }
      ctx.warnings.push(`Modération à risque (confidence ${verdict.confidence?.toFixed(2) ?? '?'}): ${verdict.reason}`)
    }
    return { result: verdict, output: { verdict: verdict.verdict, confidence: verdict.confidence } }
  })
  if (!moderation.ok) {
    const isBlocked = moderation.error?.message?.startsWith('MODERATION_BLOCK')
    return await abort(
      ctx,
      lockKey,
      isBlocked ? 'moderation_blocked' : 'moderation_failed',
      moderation.error,
    )
  }

  // 6. Fetching images — clean English keywords first, then Unsplash (with
  // quality + relevance filters), then Wiki Commons fallback.
  const imageCandidates = await runStep(ctx, 'fetching-images', async () => {
    const acc: ImageCandidate[] = []
    const seenUrls = new Set<string>()

    // Step 1 : convert the (possibly French, verbose) seed/title into clean
    // English search keywords + validation terms. This avoids passing
    // "Le thym, un allié précieux pour l'hiver" verbatim to Unsplash.
    const kwStart = Date.now()
    const kw = await generateImageKeywords({
      seed: ctx.seed,
      kind: 'blog',
      excerpt: fields.value.result.excerpt,
    })
    {
      const cost = calcCostEur({
        model: 'gemini-2.5-flash-lite',
        promptTokens: kw.promptTokens,
        completionTokens: kw.completionTokens,
      })
      ctx.costEur += cost
      await logAiCall(
        ctx.payload,
        {
          subsystem: 'ai-image-keywords',
          model: 'gemini-2.5-flash-lite',
          collectionTarget: 'blogPosts',
          fieldTarget: 'imageKeywords',
        },
        kwStart,
        { promptTokens: kw.promptTokens, completionTokens: kw.completionTokens },
        null,
      ).catch(() => undefined)
    }

    // Step 2 : Unsplash with each keyword in priority order, filtered by
    // alt_description containing one of the validation terms.
    try {
      for (const q of kw.keywords) {
        if (acc.length >= 3) break
        const more = await searchUnsplashImages(q, {
          limit: 3,
          locale: 'en',
          minLikes: 30,
          minWidth: 1200,
          validationTerms: kw.validationTerms,
        })
        for (const cand of more) {
          if (!seenUrls.has(cand.url)) {
            seenUrls.add(cand.url)
            acc.push(cand)
          }
          if (acc.length >= 3) break
        }
      }
    } catch (err) {
      ctx.warnings.push(`Unsplash search failed: ${String(err)}`)
    }

    // Step 3 : if Unsplash returns nothing on-topic, retry once without the
    // strict validation filter (still bound by likes / size).
    if (acc.length === 0) {
      try {
        const fallback = await searchUnsplashImages(kw.keywords[0] || ctx.seed, {
          limit: 3,
          locale: 'en',
          minLikes: 15,
          minWidth: 1200,
        })
        for (const cand of fallback) {
          if (!seenUrls.has(cand.url)) {
            seenUrls.add(cand.url)
            acc.push(cand)
          }
        }
      } catch {
        // ignore
      }
    }

    // Step 4 : top-up with research's Commons hits.
    for (const cand of research.value.result.imageCandidates) {
      if (acc.length >= 4) break
      if (!seenUrls.has(cand.url)) {
        seenUrls.add(cand.url)
        acc.push(cand)
      }
    }

    // Step 5 : Commons direct search using the conceptNoun (English).
    if (acc.length < 3) {
      try {
        const more = await searchCommonsImages(kw.conceptNoun, {
          limit: 4,
          minWidth: 1200,
        })
        for (const cand of more) {
          if (!seenUrls.has(cand.url)) {
            seenUrls.add(cand.url)
            acc.push(cand)
          }
          if (acc.length >= 4) break
        }
      } catch (err) {
        ctx.warnings.push(`Commons additional search failed: ${String(err)}`)
      }
    }
    return {
      result: acc,
      output: {
        count: acc.length,
        sources: acc.map((c) => c.source),
        keywords: kw.keywords,
        conceptNoun: kw.conceptNoun,
      },
    }
  })

  // 7. Uploading images — featured (1) + up to 2 inline body images.
  const upload = await runStep(ctx, 'uploading-images', async () => {
    const cands = (imageCandidates.ok ? imageCandidates.value.result : []) as ImageCandidate[]
    const uploaded: Array<{ id: string | number; caption: string }> = []
    for (const cand of cands.slice(0, 3)) {
      try {
        const id = await uploadImageCandidate(ctx, cand)
        if (id !== null) {
          uploaded.push({ id, caption: cand.attribution.slice(0, 200) })
        }
      } catch (err) {
        ctx.warnings.push(
          `Upload image échoué : ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    }
    return {
      result: uploaded,
      output: { uploaded: uploaded.length, attempted: cands.length },
    }
  })
  // upload images best-effort

  // 7b. Match relations (best-effort, before doc creation)
  let blogRelations: {
    relatedPlants: Array<number | string>
    relatedProducts: Array<number | string>
    relatedBenefits: Array<number | string>
    tags: Array<number | string>
    category?: number | string
  } = { relatedPlants: [], relatedProducts: [], relatedBenefits: [], tags: [] }
  try {
    const f = fields.value.result
    blogRelations = await matchBlogRelations({
      payload: ctx.payload,
      title: f.title || ctx.seed,
      excerpt: f.excerpt || '',
      contentPlain: sectionsPlain,
      locale: ctx.locale,
    })
  } catch (err) {
    ctx.warnings.push(
      `Relation matching failed (non-blocking): ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // Resolve default author (find or create "Rédaction Les Remèdes de Mamie").
  let authorId: string | number | null = null
  try {
    authorId = await getDefaultAuthorId(ctx.payload)
  } catch (err) {
    ctx.warnings.push(
      `Default author resolution failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // 8. Creating doc
  const created = await runStep(ctx, 'creating-doc', async () => {
    const f = fields.value.result
    const seoData = seo.value.result
    const geoData = geo.ok ? geo.value.result : { keyTakeaways: [], faq: [] as Array<{ question: string; answer: string }> }
    const uploadedImgs = (upload.ok ? upload.value.result : []) as Array<{ id: string | number; caption: string }>
    const featuredImage = uploadedImgs[0]?.id ?? null
    const bodyImages = uploadedImgs.slice(1, 3) // up to 2 inline images

    // Distribute body images across the body sections (after heading, before paragraphs).
    const sectionsWithImages: LexicalSection[] = f.sections.map((s, i) => {
      const img = bodyImages[i] // image[0] -> section[0], image[1] -> section[1]
      if (!img) return s
      return { ...s, imageId: img.id }
    })

    const content = buildRichText({ sections: sectionsWithImages })
    const plain = lexicalToPlainText(content)
    const readingTime = estimateReadingTimeMinutes(plain)

    const readinessScore = computeGeoReadinessScore({
      hasDirectAnswer: !!('directAnswer' in geoData ? (geoData as { directAnswer?: string }).directAnswer : undefined),
      hasDefinition: !!('definition' in geoData ? (geoData as { definition?: string }).definition : undefined),
      keyTakeawaysCount: geoData.keyTakeaways.length,
      faqCount: geoData.faq.length,
      quotableStatementsCount: geoExtras.quotableStatements.length,
      dataPointsCount: geoExtras.dataPoints.length,
      sourcesCount: geoExtras.sources.length,
      targetAIQueriesCount: geoExtras.targetAIQueries.length,
      hasAuthoritySignals: geoExtras.authoritySignals.length > 0,
    })

    const data: Record<string, unknown> = {
      title: f.title,
      slug: ctx.slug,
      excerpt: f.excerpt,
      content,
      readingTime,
      featuredImage: featuredImage ?? undefined,
      author: authorId ?? undefined,
      tags: blogRelations.tags,
      category: blogRelations.category,
      relatedPlants: blogRelations.relatedPlants,
      relatedProducts: blogRelations.relatedProducts,
      relatedBenefits: blogRelations.relatedBenefits,
      // Workflow internal — always published for IA-produced content (the
      // public visibility is governed by `_status`, but this status appears
      // explicitly in the admin Publication tab).
      status: 'published',
      complianceStatus: 'approved',
      meta: {
        title: seoData.title,
        description: seoData.description,
        keywords: seoData.keywords?.join(', '),
      },
      // GEO bloc complet (4 fields générés + 5 extras + auto-score).
      directAnswer: 'directAnswer' in geoData ? (geoData as { directAnswer?: string }).directAnswer : undefined,
      definition: 'definition' in geoData ? (geoData as { definition?: string }).definition : undefined,
      keyTakeaways: geoData.keyTakeaways,
      faq: geoData.faq,
      quotableStatements: geoExtras.quotableStatements.map((q) => ({
        statement: q.statement,
        source: q.source,
      })),
      dataPoints: geoExtras.dataPoints.map((d) => ({
        metric: d.metric,
        value: d.value,
        unit: d.unit,
        source: d.source,
      })),
      sources: geoExtras.sources.map((s) => ({
        title: s.title,
        publisher: s.publisher,
        year: s.year,
        url: s.url,
      })),
      targetAIQueries: geoExtras.targetAIQueries,
      authoritySignals: geoExtras.authoritySignals,
      lastFactCheckedAt: new Date().toISOString(),
      geoReadinessScore: readinessScore,
      complianceLLM: {
        verdict: moderation.value.result.verdict,
        confidence: moderation.value.result.confidence,
        matchedClaims: (moderation.value.result.matchedClaims || []).map((c) => ({ claim: c })),
        reason: moderation.value.result.reason,
        at: new Date().toISOString(),
      },
    }
    let doc: { id: string | number }
    if (existingId !== undefined) {
      doc = (await ctx.payload.update({
        collection: 'blogPosts',
        id: existingId,
        locale: ctx.locale as never,
        overrideAccess: true,
        context: { skipModeration: true, skipCompliance: true } as never,
        data: data as never,
      })) as { id: string | number }
    } else {
      doc = (await ctx.payload.create({
        collection: 'blogPosts',
        locale: ctx.locale as never,
        overrideAccess: true,
        context: { skipModeration: true, skipCompliance: true } as never,
        data: data as never,
      })) as { id: string | number }
    }
    return { result: doc, output: { docId: String(doc.id), updated: existingId !== undefined } }
  })
  if (!created.ok) return await abort(ctx, lockKey, 'doc_create_failed', created.error)

  // 9. Publishing
  const published = await runStep(ctx, 'publishing', async () => {
    const docId = created.value.result.id
    await ctx.payload.update({
      collection: 'blogPosts',
      id: docId,
      locale: ctx.locale as never,
      overrideAccess: true,
      context: { skipModeration: true, skipCompliance: true } as never,
      data: {
        _status: 'published',
        status: 'published',
        complianceStatus: 'approved',
        reviewedBy: null,
        reviewedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      } as never,
    })
    return { result: { docId }, output: { published: true } }
  })
  if (!published.ok) return await abort(ctx, lockKey, 'publish_failed', published.error)

  const docId = created.value.result.id
  const docTitle = fields.value.result.title || ctx.seed
  await emitWatchdog(ctx, 'blogPosts', docId, docTitle)

  await finalizeRun(ctx, {
    status: 'done',
    docCollection: 'blogPosts',
    docId,
    docSlug: ctx.slug,
    publishedAt: new Date().toISOString(),
  })
  await releaseLock(lockKey)
  return buildResult(ctx, 'done', 'blogPosts', docId, ctx.slug)
}

// ─── Import-JSON pipeline ───────────────────────────────────────────────

async function runImportJson(
  ctx: RunCtx,
  opts: ProduceOptions,
  existingId: string | number | undefined,
  lockKey: string,
): Promise<ProduceResult> {
  const json = (opts.importedJson ?? {}) as Record<string, unknown>

  // Validation minimale
  const validation = await runStep(ctx, 'extracting', async () => {
    if (ctx.kind === 'wiki') {
      const required = ['name', 'latinName', 'shortDescription', 'longDescription'] as const
      for (const k of required) {
        if (typeof json[k] !== 'string' || !(json[k] as string).trim()) {
          throw new Error(`Champ requis manquant : ${k}`)
        }
      }
    } else {
      const required = ['title', 'excerpt', 'content'] as const
      for (const k of required) {
        if (json[k] === undefined || json[k] === null || json[k] === '') {
          throw new Error(`Champ requis manquant : ${k}`)
        }
      }
    }
    return { result: json, output: { fieldsCount: Object.keys(json).length } }
  })
  if (!validation.ok) return await abort(ctx, lockKey, 'invalid_json', validation.error)

  // Modération
  const moderation = await runStep(ctx, 'moderating', async () => {
    let text = ''
    if (ctx.kind === 'wiki') {
      text = [json.shortDescription, json.longDescription].filter(Boolean).join('\n\n') as string
    } else {
      const content = json.content
      text = [
        typeof json.excerpt === 'string' ? json.excerpt : '',
        typeof content === 'string' ? content : lexicalToPlainText(content),
      ]
        .filter(Boolean)
        .join('\n\n')
    }
    const verdict = await moderateClaims({
      text,
      locale: ctx.locale,
      context: { collection: ctx.kind === 'wiki' ? 'wikiEntries' : 'blogPosts' },
    })
    const cost = calcCostEur({
      model: 'gemini-2.5-flash-lite',
      promptTokens: verdict.promptTokens,
      completionTokens: verdict.completionTokens,
    })
    ctx.costEur += cost
    if (verdict.verdict === 'block') {
      throw new Error(`MODERATION_BLOCK:${verdict.reason}`)
    }
    if (verdict.verdict === 'risk') {
      // High-confidence "risk" verdict is treated as a block — it usually
      // means the LLM detected a borderline EFSA claim. Below 0.7 confidence
      // we let it through with a warning (still requires regex compliance).
      if ((verdict.confidence ?? 0) >= 0.7) {
        throw new Error(`MODERATION_BLOCK:risk-high-confidence:${verdict.reason}`)
      }
      ctx.warnings.push(`Modération à risque (confidence ${verdict.confidence?.toFixed(2) ?? '?'}): ${verdict.reason}`)
    }
    return { result: verdict, output: { verdict: verdict.verdict } }
  })
  if (!moderation.ok) {
    const isBlocked = moderation.error?.message?.startsWith('MODERATION_BLOCK')
    return await abort(
      ctx,
      lockKey,
      isBlocked ? 'moderation_blocked' : 'moderation_failed',
      moderation.error,
    )
  }

  // Création du doc
  const created = await runStep(ctx, 'creating-doc', async () => {
    const data: Record<string, unknown> = { ...json, slug: ctx.slug }
    const collection = ctx.kind === 'wiki' ? 'wikiEntries' : 'blogPosts'
    let doc: { id: string | number }
    if (existingId !== undefined) {
      doc = (await ctx.payload.update({
        collection,
        id: existingId,
        locale: ctx.locale as never,
        overrideAccess: true,
        context: { skipModeration: true, skipCompliance: true } as never,
        data: data as never,
      })) as { id: string | number }
    } else {
      doc = (await ctx.payload.create({
        collection,
        locale: ctx.locale as never,
        overrideAccess: true,
        context: { skipModeration: true, skipCompliance: true } as never,
        data: data as never,
      })) as { id: string | number }
    }
    return { result: doc, output: { docId: String(doc.id), updated: existingId !== undefined } }
  })
  if (!created.ok) return await abort(ctx, lockKey, 'doc_create_failed', created.error)

  // Publishing
  const published = await runStep(ctx, 'publishing', async () => {
    const docId = created.value.result.id
    const collection = ctx.kind === 'wiki' ? 'wikiEntries' : 'blogPosts'
    const data: Record<string, unknown> = {
      _status: 'published',
      status: 'published',
      complianceStatus: 'approved',
      reviewedBy: null,
      reviewedAt: new Date().toISOString(),
    }
    if (collection === 'blogPosts') {
      data.publishedAt = new Date().toISOString()
    }
    await ctx.payload.update({
      collection,
      id: docId,
      locale: ctx.locale as never,
      overrideAccess: true,
      context: { skipModeration: true, skipCompliance: true } as never,
      data: data as never,
    })
    return { result: { docId }, output: { published: true } }
  })
  if (!published.ok) return await abort(ctx, lockKey, 'publish_failed', published.error)

  const docId = created.value.result.id
  const collection = ctx.kind === 'wiki' ? 'wikiEntries' : 'blogPosts'
  const docTitle =
    (typeof json.name === 'string' && json.name) ||
    (typeof json.title === 'string' && json.title) ||
    ctx.seed
  await emitWatchdog(ctx, collection, docId, String(docTitle))

  await finalizeRun(ctx, {
    status: 'done',
    docCollection: collection,
    docId,
    docSlug: ctx.slug,
    publishedAt: new Date().toISOString(),
  })
  await releaseLock(lockKey)
  return buildResult(ctx, 'done', collection, docId, ctx.slug)
}

// ─── Helpers ────────────────────────────────────────────────────────────

async function runStep<T>(
  ctx: RunCtx,
  name: ProductionStep,
  fn: () => Promise<{ result: T; output?: Record<string, unknown> | null }>,
): Promise<
  | { ok: true; value: { result: T; output?: Record<string, unknown> | null } }
  | { ok: false; error: { code?: string; message: string } }
> {
  await updateRunStatus(ctx, name)
  const t0 = Date.now()
  try {
    const value = await fn()
    ctx.steps.push({
      name,
      status: 'ok',
      durationMs: Date.now() - t0,
      output: value.output ?? null,
    })
    return { ok: true, value }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    ctx.steps.push({
      name,
      status: 'failed',
      durationMs: Date.now() - t0,
      errorMessage: message,
    })
    await captureError(err, {
      subsystem: 'content-orchestrator',
      context: { step: name, kind: ctx.kind, slug: ctx.slug, runId: ctx.runId },
    })
    return { ok: false, error: { message } }
  }
}

async function abort(
  ctx: RunCtx,
  lockKey: string,
  errorCode: string,
  error: { message: string } | undefined,
): Promise<ProduceResult> {
  await finalizeRun(ctx, {
    status: 'failed',
    errorCode,
    errorMessage: error?.message,
  })
  await releaseLock(lockKey)
  return buildResult(ctx, 'failed', undefined, undefined, undefined, {
    errorCode,
    errorMessage: error?.message,
  })
}

async function updateRunStatus(ctx: RunCtx, status: ProductionStep): Promise<void> {
  try {
    await ctx.payload.update({
      collection: 'productionRun' as never,
      id: ctx.runId,
      overrideAccess: true,
      data: {
        status,
        steps: ctx.steps as never,
        totalCostEur: ctx.costEur,
        totalDurationMs: Date.now() - ctx.startedAt,
        warnings: ctx.warnings.map((m) => ({ message: m })) as never,
      } as never,
    })
  } catch (err) {
    console.error('[content-orchestrator] updateRunStatus failed', err)
  }
}

async function finalizeRun(
  ctx: RunCtx,
  finalState: {
    status: ProductionStep
    docCollection?: 'wikiEntries' | 'blogPosts'
    docId?: string | number
    docSlug?: string
    publishedAt?: string
    errorCode?: string
    errorMessage?: string
  },
): Promise<void> {
  try {
    await ctx.payload.update({
      collection: 'productionRun' as never,
      id: ctx.runId,
      overrideAccess: true,
      data: {
        status: finalState.status,
        steps: ctx.steps as never,
        totalCostEur: ctx.costEur,
        totalDurationMs: Date.now() - ctx.startedAt,
        warnings: ctx.warnings.map((m) => ({ message: m })) as never,
        docCollection: finalState.docCollection,
        docId: finalState.docId !== undefined ? String(finalState.docId) : undefined,
        docSlug: finalState.docSlug,
        publishedAt: finalState.publishedAt,
        errorCode: finalState.errorCode,
        errorMessage: finalState.errorMessage,
      } as never,
    })
  } catch (err) {
    console.error('[content-orchestrator] finalizeRun failed', err)
  }
}

function buildResult(
  ctx: RunCtx,
  status: ProductionStep,
  docCollection?: 'wikiEntries' | 'blogPosts',
  docId?: string | number,
  docSlug?: string,
  err?: { errorCode?: string; errorMessage?: string },
): ProduceResult {
  return {
    runId: ctx.runId,
    status,
    docCollection,
    docId,
    docSlug,
    totalCostEur: Math.round(ctx.costEur * 1_000_000) / 1_000_000,
    totalDurationMs: Date.now() - ctx.startedAt,
    errorCode: err?.errorCode,
    errorMessage: err?.errorMessage,
    warnings: [...ctx.warnings],
  }
}

async function emitWatchdog(
  ctx: RunCtx,
  collection: 'wikiEntries' | 'blogPosts',
  docId: string | number,
  docTitle: string,
): Promise<void> {
  try {
    await notify({
      type: 'critical',
      subsystem: 'content',
      title: `Contenu auto-publié : ${ctx.kind}/${docTitle}`,
      body: `Production ${ctx.runId} terminée. Ce contenu a été publié automatiquement après modération LLM. Vérification post-publication recommandée par le directeur de publication.`,
      link: `/admin/collections/${collection}/${docId}`,
      source: 'content-orchestrator',
      meta: {
        runId: ctx.runId,
        kind: ctx.kind,
        slug: ctx.slug,
        costEur: Math.round(ctx.costEur * 1_000_000) / 1_000_000,
        durationMs: Date.now() - ctx.startedAt,
      },
    })
  } catch (err) {
    console.error('[content-orchestrator] watchdog notify failed', err)
  }
}

// ─── Wiki extractor ─────────────────────────────────────────────────────

function extractWikiBaseFields(
  research: ResearchResult,
  seed: string,
): StructuredPlantData {
  const s: StructuredPlantData = research.structured ? { ...research.structured } : {}
  if (!s.name) s.name = seed.trim()
  if (!s.shortDescription) {
    const firstFact = research.facts[0]?.snippet
    if (firstFact) s.shortDescription = firstFact.slice(0, 250)
  }
  if (!s.longDescription) {
    const joined = research.facts
      .slice(0, 5)
      .map((f) => f.snippet)
      .filter(Boolean)
      .join('\n\n')
    if (joined.length > 0) s.longDescription = joined
  }
  return s
}

// ─── callAI helper for free-form fields ────────────────────────────────

async function callAIForField(
  ctx: RunCtx,
  fieldKey: string,
  context: Record<string, unknown>,
  instructions?: string,
): Promise<string> {
  const t0 = Date.now()
  try {
    const res = await callAI({
      collection: ctx.kind === 'wiki' ? 'wikiEntries' : 'blogPosts',
      field: fieldKey,
      fieldType: 'textarea',
      context,
      instructions,
      locale: ctx.locale,
    })
    const cost = calcCostEur({
      model: 'gemini-2.5-flash-lite',
      promptTokens: res.promptTokens,
      completionTokens: res.completionTokens,
    })
    ctx.costEur += cost
    await logAiCall(
      ctx.payload,
      {
        subsystem: 'ai-pipeline',
        model: 'gemini-2.5-flash-lite',
        collectionTarget: ctx.kind === 'wiki' ? 'wikiEntries' : 'blogPosts',
        fieldTarget: fieldKey,
      },
      t0,
      { promptTokens: res.promptTokens, completionTokens: res.completionTokens },
      null,
    ).catch(() => undefined)
    return res.text
  } catch (err) {
    await logAiCall(
      ctx.payload,
      {
        subsystem: 'ai-pipeline',
        model: 'gemini-2.5-flash-lite',
        collectionTarget: ctx.kind === 'wiki' ? 'wikiEntries' : 'blogPosts',
        fieldTarget: fieldKey,
      },
      t0,
      null,
      { code: 'callAI_failed', message: err instanceof Error ? err.message : String(err) },
    ).catch(() => undefined)
    throw err
  }
}

// ─── Image upload helper ────────────────────────────────────────────────

async function uploadImageCandidate(
  ctx: RunCtx,
  cand: ImageCandidate,
): Promise<string | number | null> {
  const url = cand.url || cand.thumbUrl
  if (!url) return null
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent':
          'RemedesDeMamie-Orchestrator/1.0 (https://www.remedes-mamie.fr; contact@remedes-mamie.fr)',
      },
    })
  } catch (err) {
    ctx.warnings.push(
      `Téléchargement image échoué (${url}) : ${err instanceof Error ? err.message : String(err)}`,
    )
    return null
  }
  if (!res.ok) {
    ctx.warnings.push(`Téléchargement image échoué (${url}) : HTTP ${res.status}`)
    return null
  }
  const contentType =
    res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || 'image/jpeg'
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.byteLength === 0) {
    ctx.warnings.push(`Image vide : ${url}`)
    return null
  }

  const baseName = (cand.fileName || `${ctx.slug}-${Date.now()}`)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .slice(0, 80)
  const ext = guessExtension(contentType)
  const fileName = baseName.endsWith(ext) ? baseName : `${baseName}${ext}`

  const altRaw = cand.attribution.split('—')[0]?.trim() || ctx.seed
  const alt = altRaw.slice(0, 200)

  try {
    const created = (await ctx.payload.create({
      collection: 'media',
      overrideAccess: true,
      data: { alt } as never,
      file: {
        data: buf,
        mimetype: contentType,
        name: fileName,
        size: buf.byteLength,
      },
    })) as { id: string | number }
    return created.id
  } catch (err) {
    ctx.warnings.push(
      `Création Media échouée (${fileName}) : ${err instanceof Error ? err.message : String(err)}`,
    )
    return null
  }
}

function guessExtension(mime: string): string {
  if (mime.includes('png')) return '.png'
  if (mime.includes('webp')) return '.webp'
  if (mime.includes('gif')) return '.gif'
  if (mime.includes('svg')) return '.svg'
  return '.jpg'
}
