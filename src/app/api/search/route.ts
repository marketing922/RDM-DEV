import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { semanticSearch, type SemanticSearchResult } from '@/lib/embeddings-db'
// NOTE: src/lib/embeddings.ts est produit par un lot parallèle. S'il n'existe pas
// encore à l'instant du tsc, ajouter un TODO ci-dessous et fallback string.
// TODO(embeddings): si tsc échoue ici, c'est que src/lib/embeddings.ts n'a pas
// encore été committé — attendre le merge du lot parallèle.
import { generateEmbedding, EMBEDDING_MODEL } from '@/lib/embeddings'
import { checkAiRateLimit } from '@/lib/rate-limit'
import { isAiAvailable } from '@/lib/ai-settings'
import { isWithinDailyBudget } from '@/lib/ai-budget'
import { logAiCall, hashIp } from '@/lib/ai-audit'
import { captureError } from '@/lib/error-tracker'
import {
  buildKey,
  getCached,
  setCached,
  CACHE_TTL,
} from '@/lib/redis-cache'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// -----------------------------------------------------------------------------
// Types & constantes
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

type SearchResponse = {
  hits: SearchHit[]
  took: number
  query: string
}

type CollectionSlug = 'wikiEntries' | 'blogPosts' | 'benefits' | 'products'

const TYPE_TO_COLLECTION: Record<SearchType, CollectionSlug> = {
  plant: 'wikiEntries',
  article: 'blogPosts',
  benefit: 'benefits',
  product: 'products',
}

const COLLECTION_TO_TYPE: Record<CollectionSlug, SearchType> = {
  wikiEntries: 'plant',
  blogPosts: 'article',
  benefits: 'benefit',
  products: 'product',
}

// Mapping slug -> préfixe chemin frontend, cf. seoPlugin.generateURL dans
// payload.config.ts. Chemins RELATIFS (le client ajoute l'origine).
const COLLECTION_TO_PREFIX: Record<CollectionSlug, string> = {
  wikiEntries: '/plantes',
  blogPosts: '/blog',
  benefits: '/bienfaits',
  products: '/produits',
}

const ALL_TYPES: SearchType[] = ['plant', 'article', 'benefit', 'product']

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function parseTypes(raw: string | null): SearchType[] | null {
  if (!raw) return null
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!parts.length) return null
  const invalid = parts.find((p) => !ALL_TYPES.includes(p as SearchType))
  if (invalid) return null
  // dedupe
  return Array.from(new Set(parts)) as SearchType[]
}

function parseLocale(raw: string | null): Locale {
  return raw === 'en' ? 'en' : 'fr'
}

function clampNumber(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

/**
 * Extrait une URL d'image à partir d'un doc enrichi (depth=1 → relations
 * populées). Teste plusieurs champs connus et formats (upload direct, array).
 */
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
  // Arrays d'images (ex: wikiEntries.images[].image, products.images[].image)
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

function buildUrl(collectionSlug: CollectionSlug, locale: Locale, slug: string): string {
  const prefix = COLLECTION_TO_PREFIX[collectionSlug]
  return `/${locale}${prefix}/${slug}`
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

function ipFromReq(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    ''
  )
}

// -----------------------------------------------------------------------------
// Handler
// -----------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const startedAt = Date.now()
  const { searchParams } = req.nextUrl

  // 1. Parse + validation
  const q = (searchParams.get('q') ?? '').trim()
  if (q.length < 3 || q.length > 200) {
    return NextResponse.json(
      {
        error: 'invalid_query',
        message:
          'Le paramètre "q" doit comporter entre 3 et 200 caractères.',
      },
      { status: 400 },
    )
  }

  const typesParam = searchParams.get('type')
  if (typesParam !== null) {
    // If provided but empty or invalid → 400
    if (typesParam.trim().length === 0) {
      return NextResponse.json(
        { error: 'invalid_query', message: 'Paramètre "type" vide.' },
        { status: 400 },
      )
    }
  }
  const types =
    typesParam === null ? ALL_TYPES : parseTypes(typesParam)
  if (!types) {
    return NextResponse.json(
      {
        error: 'invalid_query',
        message:
          'Le paramètre "type" doit être une liste de plant|article|benefit|product.',
      },
      { status: 400 },
    )
  }
  const collectionSlugs: CollectionSlug[] = types.map(
    (t) => TYPE_TO_COLLECTION[t],
  )

  const locale = parseLocale(searchParams.get('locale'))

  const limitRaw = Number(searchParams.get('limit') ?? '10')
  if (searchParams.get('limit') !== null && !Number.isFinite(limitRaw)) {
    return NextResponse.json(
      { error: 'invalid_query', message: 'Paramètre "limit" invalide.' },
      { status: 400 },
    )
  }
  const limit = clampNumber(limitRaw, 1, 20)

  const minScoreRaw = Number(searchParams.get('minScore') ?? '0.6')
  if (searchParams.get('minScore') !== null && !Number.isFinite(minScoreRaw)) {
    return NextResponse.json(
      { error: 'invalid_query', message: 'Paramètre "minScore" invalide.' },
      { status: 400 },
    )
  }
  const minScore = clampNumber(minScoreRaw, 0, 1)

  const ipRaw = ipFromReq(req)
  const ipHash = ipRaw ? hashIp(ipRaw) : 'anon'

  // 2. Cache Redis (best-effort, avant rate-limit pour court-circuiter le
  // travail lourd ; le rate-limit reste néanmoins appliqué avant return).
  const bypassCache = searchParams.get('nocache') === '1'
  const cacheKey = buildKey('search', {
    q,
    type: types.slice().sort(),
    locale,
    limit,
    minScore,
  })
  let cachedHit: SearchResponse | null = null
  let cacheAgeSec = 0
  if (!bypassCache) {
    const entry = await getCached<SearchResponse>(cacheKey)
    if (entry) {
      const ageMs = Date.now() - entry.cachedAt
      const maxAgeMs = CACHE_TTL.search * 1000
      if (ageMs >= 0 && ageMs <= maxAgeMs) {
        cachedHit = entry.data
        cacheAgeSec = Math.max(0, Math.floor(ageMs / 1000))
      }
    }
  }

  // 3. Rate-limit par IP (appliqué même sur HIT pour éviter l'abus de queries
  // triviales servies depuis le cache).
  const rl = await checkAiRateLimit({
    userId: `ip:${ipHash}`,
    endpoint: 'search',
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

  if (cachedHit) {
    return NextResponse.json(cachedHit, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache': 'HIT',
        Age: String(cacheAgeSec),
      },
    })
  }

  // 3. Kill-switch + budget
  let payload
  try {
    payload = await getPayload({ config: configPromise })
  } catch (err) {
    await captureError(err, {
      subsystem: 'api',
      level: 'critical',
      route: 'GET /api/search',
      ipHash,
    })
    return NextResponse.json(
      { error: 'internal_error', message: 'Erreur interne' },
      { status: 500 },
    )
  }

  const availability = await isAiAvailable()
  if (!availability.ok) {
    return NextResponse.json(
      {
        error: 'ai_unavailable',
        message:
          availability.message ||
          'La recherche intelligente est momentanément indisponible, utilisez la recherche classique.',
      },
      { status: 503 },
    )
  }

  const budget = await isWithinDailyBudget(payload)
  if (!budget.ok) {
    return NextResponse.json(
      {
        error: 'ai_budget_exceeded',
        message:
          'La recherche intelligente est momentanément indisponible, utilisez la recherche classique.',
      },
      { status: 503 },
    )
  }

  // 4. Embedding de la requête
  let vector: number[]
  let embeddingTokens: number | undefined
  try {
    const result = await generateEmbedding(q)
    vector = result.vector
    embeddingTokens = result.promptTokens
  } catch (err) {
    await captureError(err, {
      subsystem: 'ai-embedding',
      level: 'error',
      route: 'GET /api/search',
      ipHash,
      context: { q: q.slice(0, 120) },
    })
    await logAiCall(
      payload,
      {
        subsystem: 'ai-embedding',
        model: EMBEDDING_MODEL,
        userId: 'public-search',
        ipHash,
      },
      startedAt,
      null,
      {
        code: (err as { name?: string })?.name || 'embedding_failed',
        message: (err as { message?: string })?.message,
      },
    )
    return NextResponse.json(
      {
        error: 'embedding_failed',
        message:
          'La recherche intelligente est momentanément indisponible, utilisez la recherche classique.',
      },
      { status: 502 },
    )
  }

  // 5. Similarity search
  let raw: SemanticSearchResult[] = []
  try {
    raw = await semanticSearch({
      queryVector: vector,
      collectionSlugs,
      locale,
      model: EMBEDDING_MODEL,
      limit,
      minScore,
    })
  } catch (err) {
    await captureError(err, {
      subsystem: 'ai-embedding',
      level: 'error',
      route: 'GET /api/search',
      ipHash,
      context: { q: q.slice(0, 120) },
    })
    return NextResponse.json(
      {
        error: 'search_failed',
        message:
          'La recherche intelligente est momentanément indisponible, utilisez la recherche classique.',
      },
      { status: 502 },
    )
  }

  // 6. Enrichissement parallèle (findByID depth 1, tolère 404)
  const enriched = await Promise.all(
    raw.map(async (r) => {
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
        // Doc supprimé ou not-found → skip
        return null
      }
    }),
  )
  const hits = enriched.filter((h): h is SearchHit => h !== null && h.url !== '')

  // 7. Audit
  await logAiCall(
    payload,
    {
      subsystem: 'ai-embedding',
      model: EMBEDDING_MODEL,
      userId: 'public-search',
      ipHash,
    },
    startedAt,
    {
      promptTokens: embeddingTokens ?? Math.ceil(q.length / 4),
      promptExcerpt: q.slice(0, 200),
      responseExcerpt: `hits=${hits.length}`,
    },
    null,
  )

  const took = Date.now() - startedAt
  const response: SearchResponse = { hits, took, query: q }

  // 8. Cache write best-effort (sans bloquer la réponse côté Edge ; await
  // pour rester déterministe en serverless qui gèle l'event loop au return).
  if (!bypassCache) {
    await setCached(cacheKey, response, CACHE_TTL.search)
  }

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'X-Cache': bypassCache ? 'BYPASS' : 'MISS',
    },
  })
}
