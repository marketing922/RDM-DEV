import 'server-only'
import type { Pool } from 'pg'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Helper d'accès à la table `embeddings` (gérée hors schéma Payload car
 * Payload ne connaît pas le type `vector`). Voir migration
 * `src/migrations/<timestamp>_pgvector_embeddings.ts`.
 *
 * Deux opérations exposées :
 *   - upsertEmbedding : insert ou remplace un vecteur pour (collection, entry, locale, model)
 *   - semanticSearch  : recherche de similarité cosinus, filtrable par collection/locale
 *
 * Erreurs table manquante (42P01) : semanticSearch retourne [], upsertEmbedding log warn.
 * Cela permet de déployer le code avant que `payload migrate` n'ait tourné.
 */

export type EmbeddingRow = {
  id: number
  collection_slug: string
  entry_id: string
  locale: string
  model: string
  dimensions: number
  source_hash: string
  vector: number[]
  meta: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type UpsertEmbeddingInput = {
  collectionSlug: string
  entryId: string
  locale?: string
  model: string
  sourceHash: string
  vector: number[]
  meta?: Record<string, unknown>
}

export type SemanticSearchInput = {
  queryVector: number[]
  collectionSlugs?: string[] // filter
  locale?: string
  model: string
  limit?: number // default 10
  minScore?: number // 0..1 cosine similarity minimum, default 0.6
}

export type SemanticSearchResult = {
  collection_slug: string
  entry_id: string
  locale: string
  score: number // 0..1, 1 = identique
  meta: Record<string, unknown> | null
}

/**
 * pgvector accepte une string literal `'[0.1,0.2,...]'` castée en `::vector`.
 * C'est plus fiable cross-driver que de passer un array Postgres natif.
 */
function toPgVectorLiteral(vec: number[]): string {
  // toFixed/toString conserve la précision. JSON.stringify ajoute juste les crochets.
  return `[${vec.join(',')}]`
}

async function getPool(): Promise<Pool> {
  const payload = await getPayload({ config: configPromise })
  // Payload's DatabaseAdapter ne type pas `pool` publiquement ; cast ciblé.
  const pool = (payload.db as unknown as { pool?: Pool }).pool
  if (!pool) {
    throw new Error('[embeddings-db] payload.db.pool not available — not using postgresAdapter?')
  }
  return pool
}

function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; message?: string }
  return e.code === '42P01' || Boolean(e.message && e.message.includes('embeddings'))
}

export async function upsertEmbedding(input: UpsertEmbeddingInput): Promise<void> {
  const {
    collectionSlug,
    entryId,
    locale = 'fr',
    model,
    sourceHash,
    vector,
    meta,
  } = input

  if (!vector.length) {
    throw new Error('[embeddings-db] upsertEmbedding: empty vector')
  }

  const dimensions = vector.length
  const vectorLiteral = toPgVectorLiteral(vector)
  const metaJson = meta ? JSON.stringify(meta) : null

  let pool: Pool
  try {
    pool = await getPool()
  } catch (err) {
    console.warn('[embeddings-db] upsertEmbedding: pool unavailable', err)
    return
  }

  try {
    await pool.query(
      `INSERT INTO rdm_ai.embeddings
         (collection_slug, entry_id, locale, model, dimensions, source_hash, vector, meta)
       VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8::jsonb)
       ON CONFLICT (collection_slug, entry_id, locale, model) DO UPDATE SET
         vector = EXCLUDED.vector,
         dimensions = EXCLUDED.dimensions,
         source_hash = EXCLUDED.source_hash,
         meta = EXCLUDED.meta,
         updated_at = now();`,
      [collectionSlug, entryId, locale, model, dimensions, sourceHash, vectorLiteral, metaJson],
    )
  } catch (err) {
    if (isMissingTableError(err)) {
      console.warn(
        '[embeddings-db] upsertEmbedding: table `embeddings` missing — run `npx payload migrate`',
      )
      return
    }
    throw err
  }
}

/**
 * Delete embeddings whose `entry_id` no longer exists in the underlying
 * Payload collection. Best-effort — runs one collection at a time so a
 * single bad query doesn't lose progress for the others.
 *
 * Returns the count purged per collection (excluding entries whose tables
 * weren't readable). Pure SQL — never instantiates Payload.
 */
export async function purgeOrphanEmbeddings(opts?: {
  collections?: string[]
  /** Tables Payload (slug -> table) ; default mapping for our collections. */
  collectionToTable?: Record<string, string>
}): Promise<{ purgedByCollection: Record<string, number>; totalPurged: number; warnings: string[] }> {
  const out: Record<string, number> = {}
  const warnings: string[] = []
  let pool: Pool
  try {
    pool = await getPool()
  } catch (err) {
    return { purgedByCollection: out, totalPurged: 0, warnings: [String(err)] }
  }

  const mapping: Record<string, string> = {
    wikiEntries: 'wiki_entries',
    blogPosts: 'blog_posts',
    benefits: 'benefits',
    products: 'products',
    pages: 'pages',
    sitePages: 'site_pages',
    ...(opts?.collectionToTable ?? {}),
  }
  const targets = opts?.collections ?? Object.keys(mapping)

  for (const slug of targets) {
    const table = mapping[slug]
    if (!table) {
      warnings.push(`No table mapping for collection "${slug}"`)
      continue
    }
    try {
      const res = await pool.query(
        `DELETE FROM rdm_ai.embeddings
         WHERE collection_slug = $1
           AND NOT EXISTS (
             SELECT 1 FROM "${table}" t WHERE t.id::text = rdm_ai.embeddings.entry_id
           )`,
        [slug],
      )
      out[slug] = res.rowCount ?? 0
    } catch (err) {
      if (isMissingTableError(err)) {
        warnings.push(`Skipped ${slug}: missing table`)
        continue
      }
      warnings.push(`Failed ${slug}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const totalPurged = Object.values(out).reduce((a, b) => a + b, 0)
  return { purgedByCollection: out, totalPurged, warnings }
}

export async function semanticSearch(input: SemanticSearchInput): Promise<SemanticSearchResult[]> {
  const {
    queryVector,
    collectionSlugs,
    locale,
    model,
    limit = 10,
    minScore = 0.6,
  } = input

  if (!queryVector.length) return []

  const vectorLiteral = toPgVectorLiteral(queryVector)

  let pool: Pool
  try {
    pool = await getPool()
  } catch (err) {
    console.warn('[embeddings-db] semanticSearch: pool unavailable', err)
    return []
  }

  try {
    const result = await pool.query<{
      collection_slug: string
      entry_id: string
      locale: string
      score: number | string
      meta: Record<string, unknown> | null
    }>(
      `SELECT
         collection_slug,
         entry_id,
         locale,
         1 - (vector <=> $1::vector) AS score,
         meta
       FROM rdm_ai.embeddings
       WHERE model = $4
         AND ($2::text[] IS NULL OR collection_slug = ANY($2::text[]))
         AND ($3::text IS NULL OR locale = $3::text)
       ORDER BY vector <=> $1::vector
       LIMIT $5;`,
      [
        vectorLiteral,
        collectionSlugs && collectionSlugs.length > 0 ? collectionSlugs : null,
        locale ?? null,
        model,
        limit,
      ],
    )

    return result.rows
      .map((row) => ({
        collection_slug: row.collection_slug,
        entry_id: row.entry_id,
        locale: row.locale,
        score: typeof row.score === 'string' ? Number(row.score) : row.score,
        meta: row.meta,
      }))
      .filter((r) => r.score >= minScore)
  } catch (err) {
    if (isMissingTableError(err)) {
      console.warn(
        '[embeddings-db] semanticSearch: table `embeddings` missing — run `npx payload migrate`',
      )
      return []
    }
    throw err
  }
}
