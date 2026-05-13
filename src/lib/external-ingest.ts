import 'server-only'
import { z } from 'zod'
import type { Payload } from 'payload'

import { moderateClaims, type ModerationResult } from './ai-moderate'
import { lexicalToPlainText } from './lexical-builder'
import { computeGeoReadinessScore } from './geo-extras'
import { hasForbiddenClaim } from './claims-whitelist'
import { acquireLock } from './production-locks'
import { slugify } from './slugify'
import type { Pool } from 'pg'

/**
 * External-app ingestion contract.
 *
 * Used by `/api/external/v1/{ingest,validate}`. The external app is a
 * dedicated content factory : it produces fully-formed wiki / blog posts
 * (Lexical content, complete GEO bloc, image URLs, relations by slug). RDM
 * validates, moderates, resolves slugs → IDs, downloads images, then writes
 * the doc via Payload.
 *
 * Hard rules :
 *  - slug is REQUIRED (never auto-generated for external content).
 *  - GEO bloc is REQUIRED in full (except `geoReadinessScore` which is
 *    computed server-side).
 *  - moderation runs always — if it blocks, we return 422 with details.
 *    No auto-rewrite : the factory is expected to retry with cleaner copy.
 *  - relations are passed by slug ; unknown slugs → 422 with the missing list.
 */

// ─── Zod schemas ────────────────────────────────────────────────────────

const SeoSchema = z.object({
  title: z.string().min(1).max(70),
  description: z.string().min(1).max(180),
  keywords: z.array(z.string().min(1)).min(3).max(15),
})

const KeyTakeawaySchema = z.object({
  takeaway: z.string().min(1).max(280),
})

const QuotableStatementSchema = z.object({
  statement: z.string().min(1).max(280),
  source: z.string().min(1).max(200),
})

const DataPointSchema = z.object({
  metric: z.string().min(1).max(120),
  value: z.string().min(1).max(60),
  unit: z.string().max(40).optional(),
  source: z.string().max(200).optional(),
})

const FaqSchema = z.object({
  question: z.string().min(1).max(280),
  answer: z.string().min(1).max(800),
})

const TargetAIQuerySchema = z.object({
  query: z.string().min(1).max(280),
})

const SourceSchema = z.object({
  title: z.string().min(1).max(280),
  publisher: z.string().max(200).optional(),
  year: z.number().int().min(1500).max(2100).optional(),
  url: z.string().url().max(2000).optional(),
})

const GeoSchema = z.object({
  directAnswer: z.string().min(80).max(800),
  definition: z.string().min(60).max(600),
  keyTakeaways: z.array(KeyTakeawaySchema).min(3).max(5),
  quotableStatements: z.array(QuotableStatementSchema).min(1).max(5),
  dataPoints: z.array(DataPointSchema).min(3).max(10),
  faq: z.array(FaqSchema).min(3).max(10),
  targetAIQueries: z.array(TargetAIQuerySchema).min(3).max(10),
  authoritySignals: z.string().min(20).max(1000),
  sources: z.array(SourceSchema).min(3).max(20),
  lastFactCheckedAt: z.string().datetime(),
})

const ImageSchema = z.object({
  url: z.string().url().max(2000),
  alt: z.string().min(1).max(200),
  role: z.enum(['featured', 'section']),
  sectionIndex: z.number().int().min(0).max(20).optional(),
})

const RelationsBlogSchema = z.object({
  categorySlug: z.string().max(120).optional(),
  tagSlugs: z.array(z.string().max(120)).max(20).optional(),
  plantSlugs: z.array(z.string().max(120)).max(20).optional(),
  benefitSlugs: z.array(z.string().max(120)).max(20).optional(),
  productSlugs: z.array(z.string().max(120)).max(20).optional(),
})

const RelationsWikiSchema = z.object({
  benefitSlugs: z.array(z.string().max(120)).max(20).optional(),
  productSlugs: z.array(z.string().max(120)).max(20).optional(),
  relatedPostSlugs: z.array(z.string().max(120)).max(20).optional(),
})

// Lexical root — permissive shape (Payload validates the rest).
const LexicalContentSchema = z.object({
  root: z.object({
    type: z.literal('root'),
    children: z.array(z.unknown()),
  }).passthrough(),
}).passthrough()

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?$/

const BlogDataSchema = z.object({
  slug: z.string().regex(SLUG_RE, 'slug must be kebab-case (a-z, 0-9, -)'),
  title: z.string().min(3).max(200),
  excerpt: z.string().min(40).max(400),
  content: LexicalContentSchema,
  seo: SeoSchema,
  geo: GeoSchema,
  images: z.array(ImageSchema).max(6).optional().default([]),
  relations: RelationsBlogSchema.optional().default({}),
})

const WikiDataSchema = z.object({
  slug: z.string().regex(SLUG_RE, 'slug must be kebab-case (a-z, 0-9, -)'),
  title: z.string().min(2).max(200), // = name
  excerpt: z.string().min(40).max(400), // = shortDescription
  content: LexicalContentSchema, // = longDescription rendered as Lexical
  latinName: z.string().min(2).max(120),
  family: z.string().max(120).optional(),
  origin: z.string().max(500).optional(),
  partsUsed: z.string().max(500).optional(),
  activeCompounds: z.string().max(800).optional(),
  harvest: z.string().max(500).optional(),
  form: z.string().max(500).optional(),
  conservation: z.string().max(500).optional(),
  precautionsText: z.string().max(1500).optional(),
  seo: SeoSchema,
  geo: GeoSchema,
  images: z.array(ImageSchema).max(6).optional().default([]),
  relations: RelationsWikiSchema.optional().default({}),
})

// Callback HTTPS optionnel — appelé après création/replay. URL whitelistée
// (HTTPS public uniquement, pas d'IP privée — cf. isAllowedWebhookUrl).
const WebhookUrlSchema = z.string().url().max(500).optional()

export const ExternalIngestSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('blog'),
    locale: z.enum(['fr', 'en']).default('fr'),
    publish: z.boolean().default(true),
    idempotencyKey: z.string().uuid(),
    webhookUrl: WebhookUrlSchema,
    data: BlogDataSchema,
  }),
  z.object({
    kind: z.literal('wiki'),
    locale: z.enum(['fr', 'en']).default('fr'),
    publish: z.boolean().default(true),
    idempotencyKey: z.string().uuid(),
    webhookUrl: WebhookUrlSchema,
    data: WikiDataSchema,
  }),
])

export type ExternalIngestInput = z.infer<typeof ExternalIngestSchema>

// ─── Slug → ID resolution ───────────────────────────────────────────────

type Resolved = {
  ids: {
    category?: number | string
    tags: Array<number | string>
    plants: Array<number | string>
    products: Array<number | string>
    benefits: Array<number | string>
    relatedPosts: Array<number | string>
  }
  unknownSlugs: Record<string, string[]>
}

async function findIdBySlug(
  payload: Payload,
  collection: string,
  slug: string,
): Promise<number | string | null> {
  try {
    const res = await payload.find({
      collection: collection as never,
      where: { slug: { equals: slug } } as never,
      limit: 1,
      pagination: false,
      depth: 0,
    })
    const docs = (res?.docs ?? []) as Array<{ id: number | string }>
    return docs[0]?.id ?? null
  } catch {
    return null
  }
}

async function resolveMany(
  payload: Payload,
  collection: string,
  slugs: string[] | undefined,
): Promise<{ ids: Array<number | string>; unknown: string[] }> {
  if (!slugs || slugs.length === 0) return { ids: [], unknown: [] }
  const ids: Array<number | string> = []
  const unknown: string[] = []
  for (const slug of slugs) {
    const id = await findIdBySlug(payload, collection, slug)
    if (id !== null) ids.push(id)
    else unknown.push(slug)
  }
  return { ids, unknown }
}

async function resolveRelations(
  payload: Payload,
  input: ExternalIngestInput,
): Promise<Resolved> {
  const out: Resolved = {
    ids: { tags: [], plants: [], products: [], benefits: [], relatedPosts: [] },
    unknownSlugs: {},
  }
  const rel = (input.data.relations ?? {}) as Record<string, unknown>

  if (input.kind === 'blog') {
    if (typeof rel.categorySlug === 'string' && rel.categorySlug) {
      const id = await findIdBySlug(payload, 'categories', rel.categorySlug)
      if (id !== null) out.ids.category = id
      else out.unknownSlugs.categorySlug = [rel.categorySlug]
    }
    const tags = await resolveMany(payload, 'tags', rel.tagSlugs as string[] | undefined)
    out.ids.tags = tags.ids
    if (tags.unknown.length) out.unknownSlugs.tagSlugs = tags.unknown

    const plants = await resolveMany(payload, 'wikiEntries', rel.plantSlugs as string[] | undefined)
    out.ids.plants = plants.ids
    if (plants.unknown.length) out.unknownSlugs.plantSlugs = plants.unknown

    const benefits = await resolveMany(payload, 'benefits', rel.benefitSlugs as string[] | undefined)
    out.ids.benefits = benefits.ids
    if (benefits.unknown.length) out.unknownSlugs.benefitSlugs = benefits.unknown

    const products = await resolveMany(payload, 'products', rel.productSlugs as string[] | undefined)
    out.ids.products = products.ids
    if (products.unknown.length) out.unknownSlugs.productSlugs = products.unknown
  } else {
    const benefits = await resolveMany(payload, 'benefits', rel.benefitSlugs as string[] | undefined)
    out.ids.benefits = benefits.ids
    if (benefits.unknown.length) out.unknownSlugs.benefitSlugs = benefits.unknown

    const products = await resolveMany(payload, 'products', rel.productSlugs as string[] | undefined)
    out.ids.products = products.ids
    if (products.unknown.length) out.unknownSlugs.productSlugs = products.unknown

    const posts = await resolveMany(payload, 'blogPosts', rel.relatedPostSlugs as string[] | undefined)
    out.ids.relatedPosts = posts.ids
    if (posts.unknown.length) out.unknownSlugs.relatedPostSlugs = posts.unknown
  }

  return out
}

// ─── Image download → Payload Media upload ──────────────────────────────

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

async function downloadAndUploadImage(
  payload: Payload,
  url: string,
  alt: string,
  slugHint: string,
): Promise<number | string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'RemedesDeMamie-ExternalIngest/1.0 (https://www.remedes-mamie.fr; contact@remedes-mamie.fr)',
    },
    redirect: 'follow',
  })
  if (!res.ok) {
    throw new Error(`image_download_failed:${res.status}:${url}`)
  }
  const contentType =
    res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || 'image/jpeg'
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.byteLength === 0) throw new Error(`image_empty:${url}`)
  if (buf.byteLength > MAX_IMAGE_BYTES) {
    throw new Error(`image_too_large:${buf.byteLength}:${url}`)
  }
  const ext =
    contentType.includes('png') ? '.png' :
    contentType.includes('webp') ? '.webp' :
    contentType.includes('gif') ? '.gif' :
    '.jpg'
  const base = `${slugHint}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .slice(0, 80)
  const fileName = `${base}${ext}`

  const created = (await payload.create({
    collection: 'media',
    overrideAccess: true,
    data: { alt: alt.slice(0, 200) } as never,
    file: {
      data: buf,
      mimetype: contentType,
      name: fileName,
      size: buf.byteLength,
    },
  })) as { id: number | string }
  return created.id
}

// ─── Moderation source-text builder ─────────────────────────────────────

function buildModerationText(input: ExternalIngestInput): string {
  const data = input.data
  const contentText = lexicalToPlainText(data.content as never)
  const geoText = [
    data.geo.directAnswer,
    data.geo.definition,
    ...data.geo.keyTakeaways.map((k) => k.takeaway),
    ...data.geo.faq.map((f) => `${f.question} ${f.answer}`),
    ...data.geo.quotableStatements.map((q) => q.statement),
  ].join('\n')
  return [data.excerpt, contentText, geoText].filter(Boolean).join('\n\n').slice(0, 8000)
}

// ─── Idempotency (Postgres : rdm_ai.ingest_fingerprints) ────────────────
//
// Backé par `rdm_ai.ingest_fingerprints` ; la fenêtre logique d'idempotence
// est de 24 h (filtrée à la lecture sur first_seen_at). Best-effort :
// toute erreur DB → on traite comme un miss (l'ingest replay sera créé).

const IDEMPOTENCY_TTL_SEC = 24 * 60 * 60

function fingerprintKey(key: string): string {
  return `rdm:ingest:idem:${key}`
}

async function getIngestPool(payload: Payload): Promise<Pool | null> {
  const pool = (payload.db as unknown as { pool?: Pool }).pool
  return pool ?? null
}

async function getCachedIdempotent(
  payload: Payload,
  key: string,
): Promise<unknown | null> {
  const pool = await getIngestPool(payload)
  if (!pool) return null
  try {
    const res = await pool.query<{ metadata: unknown }>(
      `SELECT metadata FROM rdm_ai.ingest_fingerprints
        WHERE fingerprint = $1
          AND first_seen_at > now() - ($2 || ' seconds')::interval
        LIMIT 1;`,
      [fingerprintKey(key), String(IDEMPOTENCY_TTL_SEC)],
    )
    return res.rows[0]?.metadata ?? null
  } catch {
    return null
  }
}

async function setCachedIdempotent(
  payload: Payload,
  key: string,
  value: unknown,
): Promise<void> {
  const pool = await getIngestPool(payload)
  if (!pool) return
  try {
    await pool.query(
      `INSERT INTO rdm_ai.ingest_fingerprints (fingerprint, metadata)
         VALUES ($1, $2::jsonb)
       ON CONFLICT (fingerprint) DO UPDATE SET
         metadata = EXCLUDED.metadata,
         first_seen_at = now();`,
      [fingerprintKey(key), JSON.stringify(value)],
    )
  } catch {
    // best-effort
  }
}

// ─── Result types ───────────────────────────────────────────────────────

export type IngestSuccess = {
  ok: true
  docId: number | string
  slug: string
  url: string
  kind: 'blog' | 'wiki'
  moderation: { verdict: 'ok' | 'risk'; confidence: number }
  geoReadinessScore: number
  warnings: string[]
  replayed?: boolean
}

export type IngestFailure = {
  ok: false
  error:
    | 'validation_failed'
    | 'moderation_blocked'
    | 'unknown_relation_slug'
    | 'slug_conflict'
    | 'forbidden_claim'
    | 'image_failed'
    | 'internal_error'
  message: string
  details?: unknown
}

export type IngestResult = IngestSuccess | IngestFailure

// ─── Main entrypoint ────────────────────────────────────────────────────

export async function runExternalIngest(opts: {
  payload: Payload
  input: ExternalIngestInput
  dryRun: boolean
  actorId: string
  baseUrl?: string
}): Promise<IngestResult> {
  const { payload, input, dryRun, actorId } = opts
  const baseUrl = opts.baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.remedes-mamie.fr'
  const data = input.data
  const warnings: string[] = []

  // 0. Idempotence (only for non-dry-run)
  if (!dryRun) {
    const cached = await getCachedIdempotent(payload, input.idempotencyKey)
    if (cached && typeof cached === 'object') {
      return { ...(cached as IngestSuccess), replayed: true }
    }
  }

  // 1. Slug conflict (always check, even dry-run)
  const collection = input.kind === 'wiki' ? 'wikiEntries' : 'blogPosts'
  const existingId = await findIdBySlug(payload, collection, data.slug)
  if (existingId !== null && !dryRun) {
    return {
      ok: false,
      error: 'slug_conflict',
      message: `Le slug "${data.slug}" existe déjà dans ${collection}.`,
      details: { existingId, slug: data.slug, collection },
    }
  }

  // 2. Lock during the whole ingest to prevent two concurrent ingests on the
  // same slug (double-create race).
  const lockKey = `lock:produce:external-${input.kind}:${data.slug}`
  if (!dryRun) {
    const lock = await acquireLock(lockKey, 120)
    if (!lock.ok) {
      return {
        ok: false,
        error: 'slug_conflict',
        message: `Une ingestion est déjà en cours pour le slug "${data.slug}".`,
      }
    }
  }

  try {
    // 3. Forbidden-claim hard regex (catches "guérir/traiter/maladie/etc.").
    const fullText = buildModerationText(input)
    if (hasForbiddenClaim(fullText)) {
      return {
        ok: false,
        error: 'forbidden_claim',
        message: 'Le contenu contient des termes thérapeutiques interdits (regex EU 1924/2006).',
      }
    }

    // 4. Resolve relations → IDs (reject unknown slugs).
    const resolved = await resolveRelations(payload, input)
    if (Object.keys(resolved.unknownSlugs).length > 0) {
      return {
        ok: false,
        error: 'unknown_relation_slug',
        message: 'Certains slugs de relation sont introuvables côté RDM.',
        details: resolved.unknownSlugs,
      }
    }

    // 5. Moderation (LLM judge).
    let moderation: ModerationResult
    try {
      moderation = await moderateClaims({
        text: fullText,
        locale: input.locale,
        context: { collection },
      })
    } catch (err) {
      return {
        ok: false,
        error: 'internal_error',
        message: `Modération indisponible : ${err instanceof Error ? err.message : String(err)}`,
      }
    }
    if (
      moderation.verdict === 'block' ||
      (moderation.verdict === 'risk' && (moderation.confidence ?? 0) >= 0.7)
    ) {
      return {
        ok: false,
        error: 'moderation_blocked',
        message: `Modération : ${moderation.verdict} (${moderation.reason})`,
        details: {
          verdict: moderation.verdict,
          confidence: moderation.confidence,
          matchedClaims: moderation.matchedClaims,
          suggestion: moderation.suggestion,
          reason: moderation.reason,
        },
      }
    }
    if (moderation.verdict === 'risk') {
      warnings.push(`Modération à risque (confidence ${moderation.confidence?.toFixed(2)}): ${moderation.reason}`)
    }

    // Compute GEO score (server-side authoritative).
    const geoReadinessScore = computeGeoReadinessScore({
      hasDirectAnswer: !!data.geo.directAnswer,
      hasDefinition: !!data.geo.definition,
      keyTakeawaysCount: data.geo.keyTakeaways.length,
      faqCount: data.geo.faq.length,
      quotableStatementsCount: data.geo.quotableStatements.length,
      dataPointsCount: data.geo.dataPoints.length,
      sourcesCount: data.geo.sources.length,
      targetAIQueriesCount: data.geo.targetAIQueries.length,
      hasAuthoritySignals: data.geo.authoritySignals.trim().length > 0,
    })

    if (dryRun) {
      return {
        ok: true,
        docId: 0,
        slug: data.slug,
        url: `${baseUrl}/${input.kind === 'blog' ? 'blog' : 'plantes'}/${data.slug}`,
        kind: input.kind,
        moderation: { verdict: moderation.verdict as 'ok' | 'risk', confidence: moderation.confidence },
        geoReadinessScore,
        warnings,
      }
    }

    // 6. Mapping images → URLs directes (zéro téléchargement filesystem).
    // Compatible Vercel (filesystem read-only). Le champ externalImageUrl
    // sert l'image principale sur la fiche ; galleryUrls sert les images
    // de section avec leur sectionIndex.
    const images = data.images || []
    const featured = images.find((i) => i.role === 'featured') || images[0] || null
    const sectionImgs = images.filter((i) => i.role === 'section' && i.url !== featured?.url)
    const externalImageUrl: string | null = featured?.url || null
    const galleryUrlsPayload: Array<{ url: string; caption?: string; sectionIndex?: number }> =
      sectionImgs.map((img) => ({
        url: img.url,
        caption: img.alt,
        sectionIndex: typeof img.sectionIndex === 'number' && img.sectionIndex > 0
          ? img.sectionIndex
          : undefined,
      }))

    // 7. Build the doc payload.
    const lastFactCheckedAt = data.geo.lastFactCheckedAt
    const baseDoc: Record<string, unknown> = {
      slug: data.slug,
      meta: {
        title: data.seo.title,
        description: data.seo.description,
        keywords: data.seo.keywords.join(', '),
      },
      directAnswer: data.geo.directAnswer,
      definition: data.geo.definition,
      keyTakeaways: data.geo.keyTakeaways,
      faq: data.geo.faq,
      quotableStatements: data.geo.quotableStatements,
      dataPoints: data.geo.dataPoints,
      sources: data.geo.sources,
      targetAIQueries: data.geo.targetAIQueries,
      authoritySignals: data.geo.authoritySignals,
      lastFactCheckedAt,
      geoReadinessScore,
      status: input.publish ? 'published' : 'draft',
      complianceStatus: 'approved',
      complianceLLM: {
        verdict: moderation.verdict,
        confidence: moderation.confidence,
        matchedClaims: (moderation.matchedClaims || []).map((c) => ({ claim: c })),
        reason: moderation.reason,
        at: new Date().toISOString(),
      },
    }

    let createData: Record<string, unknown>
    if (input.kind === 'blog') {
      const d = data as z.infer<typeof BlogDataSchema>
      createData = {
        ...baseDoc,
        title: d.title,
        excerpt: d.excerpt,
        content: d.content,
        externalImageUrl: externalImageUrl || undefined,
        galleryUrls: galleryUrlsPayload.length > 0 ? galleryUrlsPayload : undefined,
        category: resolved.ids.category,
        tags: resolved.ids.tags,
        relatedPlants: resolved.ids.plants,
        relatedProducts: resolved.ids.products,
        relatedBenefits: resolved.ids.benefits,
      }
    } else {
      const d = data as z.infer<typeof WikiDataSchema>
      createData = {
        ...baseDoc,
        name: d.title,
        latinName: d.latinName,
        shortDescription: d.excerpt,
        longDescription: lexicalToPlainText(d.content as never),
        family: d.family,
        origin: d.origin,
        partsUsed: d.partsUsed,
        activeCompounds: d.activeCompounds,
        harvest: d.harvest,
        form: d.form,
        conservation: d.conservation,
        precautionsText: d.precautionsText,
        externalImageUrl: externalImageUrl || undefined,
        galleryUrls: galleryUrlsPayload.length > 0 ? galleryUrlsPayload : undefined,
        benefits: resolved.ids.benefits,
        relatedProducts: resolved.ids.products,
        relatedPosts: resolved.ids.relatedPosts,
      }
    }

    // 8. Create + publish.
    let doc: { id: number | string }
    try {
      doc = (await payload.create({
        collection: collection as never,
        locale: input.locale as never,
        overrideAccess: true,
        // skipCompliance/skipModeration : we already moderated ; the regex
        // hook still runs (defensive), and gate-publish allows publication
        // because complianceStatus === 'approved'.
        context: {
          skipModeration: true,
          skipCompliance: true,
          externalIngest: true,
          externalActor: actorId,
        } as never,
        data: createData as never,
      })) as { id: number | string }
    } catch (err) {
      return {
        ok: false,
        error: 'internal_error',
        message: `Création du document échouée : ${err instanceof Error ? err.message : String(err)}`,
      }
    }

    if (input.publish) {
      try {
        await payload.update({
          collection: collection as never,
          id: doc.id as never,
          locale: input.locale as never,
          overrideAccess: true,
          context: { skipModeration: true, skipCompliance: true } as never,
          data: {
            _status: 'published',
            status: 'published',
            complianceStatus: 'approved',
            publishedAt: new Date().toISOString(),
          } as never,
        })
      } catch (err) {
        warnings.push(`Publication forcée échouée (doc créé en draft) : ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    const url = `${baseUrl}/${input.kind === 'blog' ? 'blog' : 'plantes'}/${data.slug}`
    const success: IngestSuccess = {
      ok: true,
      docId: doc.id,
      slug: data.slug,
      url,
      kind: input.kind,
      moderation: { verdict: moderation.verdict as 'ok' | 'risk', confidence: moderation.confidence },
      geoReadinessScore,
      warnings,
    }

    // 9. Idempotency cache.
    await setCachedIdempotent(payload, input.idempotencyKey, success)

    return success
  } finally {
    if (!dryRun) {
      // best-effort lock release
      try {
        const { releaseLock } = await import('./production-locks')
        await releaseLock(lockKey)
      } catch {
        // ignore
      }
    }
  }
}
