import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Pool } from 'pg'

import { semanticSearch, type SemanticSearchResult } from '@/lib/embeddings-db'
// NOTE: src/lib/embeddings.ts est produit par un lot parallèle.
// TODO(embeddings): si tsc échoue ici, c'est que src/lib/embeddings.ts n'a pas
// encore été committé — attendre le merge du lot parallèle.
import { EMBEDDING_MODEL } from '@/lib/embeddings'
import { checkAiRateLimit } from '@/lib/rate-limit'
import { isAiAvailable } from '@/lib/ai-settings'
import { isWithinDailyBudget } from '@/lib/ai-budget'
import { logAiCall, hashIp } from '@/lib/ai-audit'
import { captureError } from '@/lib/error-tracker'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type SearchType = 'plant' | 'article' | 'benefit' | 'product'
type Locale = 'fr' | 'en'

type SearchHit = {
  type: SearchType
  id: string
  slug: string | null
  title: string
  excerpt: string | null
  imageUrl: string | null
  score: number
  url: string
}

type CollectionSlug = 'wikiEntries' | 'blogPosts' | 'benefits' | 'products'

const VALID_COLLECTIONS: CollectionSlug[] = [
  'wikiEntries',
  'blogPosts',
  'benefits',
  'products',
]

const COLLECTION_TO_TYPE: Record<CollectionSlug, SearchType> = {
  wikiEntries: 'plant',
  blogPosts: 'article',
  benefits: 'benefit',
  products: 'product',
}

const COLLECTION_TO_PREFIX: Record<CollectionSlug, string> = {
  wikiEntries: '/plantes',
  blogPosts: '/blog',
  benefits: '/bienfaits',
  products: '/produits',
}

// -----------------------------------------------------------------------------
// Helpers (dup minimale avec /api/search — factorisable plus tard)
// -----------------------------------------------------------------------------

function parseLocale(raw: string | null): Locale {
  return raw === 'en' ? 'en' : 'fr'
}

function clampNumber(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

function firstString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value
  return null
}

function docTitle(doc: Record<string, unknown>): string {
  return (
    firstString(doc.name) ||
    firstString(doc.title) ||
    firstString((doc as { label?: unknown }).label) ||
    ''
  )
}

function docExcerpt(doc: Record<string, unknown>): string | null {
  return (
    firstString(doc.excerpt) ||
    firstString(doc.shortDescription) ||
    firstString(doc.description) ||
    firstString(doc.latinName) ||
    null
  )
}

function urlFromMediaLike(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return null
  const rec = value as Record<string, unknown>
  if (typeof rec.url === 'string' && rec.url.length > 0) return rec.url
  const sizes = rec.sizes as Record<string, { url?: string | null }> | undefined
  if (sizes) {
    const card = sizes.card?.url
    if (typeof card === 'string' && card) return card
    const thumb = sizes.thumbnail?.url
    if (typeof thumb === 'string' && thumb) return thumb
  }
  if (typeof rec.thumbnailURL === 'string' && rec.thumbnailURL)
    return rec.thumbnailURL
  return null
}

function extractImageUrl(doc: Record<string, unknown>): string | null {
  const candidates: Array<unknown> = [
    doc.image,
    doc.thumbnail,
    doc.cover,
    doc.media,
    doc.featuredImage,
    doc.mainImage,
    doc.heroImage,
  ]
  for (const c of candidates) {
    const url = urlFromMediaLike(c)
    if (url) return url
  }
  const images = doc.images
  if (Array.isArray(images)) {
    for (const item of images) {
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>
        const url = urlFromMediaLike(rec.image) || urlFromMediaLike(rec.media)
        if (url) return url
      }
    }
  }
  return null
}

function buildUrl(collectionSlug: CollectionSlug, locale: Locale, slug: string): string {
  const prefix = COLLECTION_TO_PREFIX[collectionSlug]
  return `/${locale}${prefix}/${slug}`
}

/**
 * pgvector peut renvoyer le vecteur comme string `'[0.1,0.2,…]'` ou comme
 * number[] selon le driver/config. Normalise.
 */
function parsePgVector(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    const arr = value as unknown[]
    const nums: number[] = []
    for (const v of arr) {
      const n = typeof v === 'number' ? v : Number(v)
      if (!Number.isFinite(n)) return null
      nums.push(n)
    }
    return nums
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null
    const body = trimmed.slice(1, -1)
    if (body.length === 0) return []
    const parts = body.split(',')
    const nums: number[] = []
    for (const p of parts) {
      const n = Number(p.trim())
      if (!Number.isFinite(n)) return null
      nums.push(n)
    }
    return nums
  }
  return null
}

async function fetchSourceVector(
  pool: Pool,
  source: CollectionSlug,
  id: string,
  locale: Locale,
): Promise<number[] | null> {
  try {
    const result = await pool.query<{ vector: unknown }>(
      `SELECT vector FROM embeddings
       WHERE collection_slug = $1 AND entry_id = $2 AND locale = $3 AND model = $4
       LIMIT 1`,
      [source, id, locale, EMBEDDING_MODEL],
    )
    if (!result.rows.length) return null
    return parsePgVector(result.rows[0].vector)
  } catch (err) {
    const e = err as { code?: string }
    if (e?.code === '42P01') return null
    throw err
  }
}

// -----------------------------------------------------------------------------
// Handler
// -----------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const startedAt = Date.now()

  let payload
  try {
    payload = await getPayload({ config: configPromise })
  } catch (err) {
    await captureError(err, {
      subsystem: 'api',
      level: 'critical',
      route: 'GET /api/admin/suggestions',
    })
    return NextResponse.json(
      { error: 'internal_error', message: 'Erreur interne' },
      { status: 500 },
    )
  }

  // 1. Auth (admin/editor)
  let user: { id?: string | number; role?: string } | null = null
  try {
    const auth = await payload.auth({ headers: req.headers })
    user = (auth?.user as { id?: string | number; role?: string } | null) ?? null
  } catch {
    user = null
  }
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const role = user.role
  if (role && !['admin', 'editor'].includes(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const userId = String(user.id ?? '')

  const ipRaw =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    ''
  const ipHash = ipRaw ? hashIp(ipRaw) : undefined

  // 2. Parse params
  const { searchParams } = req.nextUrl
  const collectionParam = searchParams.get('collection')
  const idParam = searchParams.get('id')
  const targetParam = searchParams.get('target')

  if (!collectionParam || !VALID_COLLECTIONS.includes(collectionParam as CollectionSlug)) {
    return NextResponse.json(
      {
        error: 'invalid_query',
        message: 'Paramètre "collection" manquant ou invalide.',
      },
      { status: 400 },
    )
  }
  if (!idParam || idParam.trim().length === 0) {
    return NextResponse.json(
      { error: 'invalid_query', message: 'Paramètre "id" manquant.' },
      { status: 400 },
    )
  }
  if (!targetParam || !VALID_COLLECTIONS.includes(targetParam as CollectionSlug)) {
    return NextResponse.json(
      {
        error: 'invalid_query',
        message: 'Paramètre "target" manquant ou invalide.',
      },
      { status: 400 },
    )
  }

  const source = collectionParam as CollectionSlug
  const target = targetParam as CollectionSlug
  const sourceId = idParam.trim()
  const locale = parseLocale(searchParams.get('locale'))

  const limitRaw = Number(searchParams.get('limit') ?? '5')
  const limit = clampNumber(
    Number.isFinite(limitRaw) ? limitRaw : 5,
    1,
    10,
  )

  // 3. Rate-limit
  const rl = await checkAiRateLimit({
    userId: `user:${userId}`,
    endpoint: 'suggestions',
  })
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: 'rate_limit_exceeded',
        scope: rl.scope,
        retryAfterSec: rl.retryAfterSec,
      },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    )
  }

  // 4. Kill-switch + budget
  const availability = await isAiAvailable()
  if (!availability.ok) {
    return NextResponse.json(
      {
        error: 'ai_unavailable',
        message: availability.message || 'Suggestions IA indisponibles.',
      },
      { status: 503 },
    )
  }
  const budget = await isWithinDailyBudget(payload)
  if (!budget.ok) {
    return NextResponse.json(
      {
        error: 'ai_budget_exceeded',
        message: `Budget IA quotidien atteint (${budget.spentEur.toFixed(4)}€ / ${budget.budgetEur}€).`,
      },
      { status: 503 },
    )
  }

  // 5. Récupérer le vecteur source via la pool PG
  const pool = (payload.db as unknown as { pool?: Pool }).pool
  if (!pool) {
    await captureError(
      new Error('payload.db.pool indisponible — adapter non postgres ?'),
      {
        subsystem: 'api',
        level: 'critical',
        route: 'GET /api/admin/suggestions',
        userId,
        ipHash,
      },
    )
    return NextResponse.json(
      { error: 'internal_error', message: 'Erreur interne' },
      { status: 500 },
    )
  }

  let sourceVector: number[] | null
  try {
    sourceVector = await fetchSourceVector(pool, source, sourceId, locale)
  } catch (err) {
    await captureError(err, {
      subsystem: 'ai-embedding',
      level: 'error',
      route: 'GET /api/admin/suggestions',
      userId,
      ipHash,
      context: { source, sourceId, locale },
    })
    return NextResponse.json(
      { error: 'source_lookup_failed', message: 'Impossible de lire le vecteur source.' },
      { status: 502 },
    )
  }

  if (!sourceVector || sourceVector.length === 0) {
    return NextResponse.json(
      {
        hits: [],
        reason: 'source-not-indexed',
        message:
          'Le document source n\'a pas de vecteur indexé. Ré-enregistrez le document pour forcer la génération de l\'embedding.',
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  }

  // 6. Similarity search — on demande limit+1 puis on filtre l'id source
  let raw: SemanticSearchResult[] = []
  try {
    raw = await semanticSearch({
      queryVector: sourceVector,
      collectionSlugs: [target],
      locale,
      model: EMBEDDING_MODEL,
      limit: limit + 1,
      minScore: 0.5,
    })
  } catch (err) {
    await captureError(err, {
      subsystem: 'ai-embedding',
      level: 'error',
      route: 'GET /api/admin/suggestions',
      userId,
      ipHash,
      context: { source, sourceId, target, locale },
    })
    return NextResponse.json(
      { error: 'search_failed', message: 'Recherche de similarité échouée.' },
      { status: 502 },
    )
  }

  // Filtre out le doc source si source===target
  const filtered = raw.filter(
    (r) => !(r.collection_slug === source && r.entry_id === sourceId),
  ).slice(0, limit)

  // 7. Enrichissement parallèle
  const enriched = await Promise.all(
    filtered.map(async (r) => {
      const collectionSlug = r.collection_slug as CollectionSlug
      if (!COLLECTION_TO_TYPE[collectionSlug]) return null
      try {
        const doc = (await payload.findByID({
          collection: collectionSlug as 'wikiEntries',
          id: r.entry_id,
          depth: 1,
          locale: locale as 'fr',
        })) as Record<string, unknown> | null
        if (!doc) return null
        const slug = firstString(doc.slug)
        const title = docTitle(doc)
        if (!title) return null
        const hit: SearchHit = {
          type: COLLECTION_TO_TYPE[collectionSlug],
          id: String(doc.id ?? r.entry_id),
          slug,
          title,
          excerpt: docExcerpt(doc),
          imageUrl: extractImageUrl(doc),
          score: Math.max(0, Math.min(1, r.score)),
          url: slug ? buildUrl(collectionSlug, locale, slug) : '',
        }
        return hit
      } catch {
        return null
      }
    }),
  )
  const hits = enriched.filter((h): h is SearchHit => h !== null && h.url !== '')

  // 8. Audit
  await logAiCall(
    payload,
    {
      subsystem: 'ai-embedding',
      model: EMBEDDING_MODEL,
      userId,
      ipHash,
      collectionTarget: target,
    },
    startedAt,
    {
      promptExcerpt: `suggest:${source}/${sourceId}->${target}`,
      responseExcerpt: `hits=${hits.length}`,
    },
    null,
  )

  const took = Date.now() - startedAt
  return NextResponse.json(
    { hits, took, source, target },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  )
}
