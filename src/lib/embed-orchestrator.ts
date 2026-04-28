import 'server-only'
import type { Payload } from 'payload'
import type { Pool } from 'pg'
import { logAiCall } from './ai-audit'
import { isWithinDailyBudget } from './ai-budget'
import { calcCostEur } from './ai-pricing'
import { isAiAvailable } from './ai-settings'
import {
  EMBEDDING_MODEL,
  generateEmbedding,
  sourceHashOf,
} from './embeddings'
import { upsertEmbedding } from './embeddings-db'
import { captureError } from './error-tracker'
import { checkAiRateLimit } from './rate-limit'
import { bustCache } from './redis-cache'

/**
 * Orchestrator that wires together the kill-switch, daily budget, rate-limit,
 * embedding generation, persistence and audit logging. Designed to be invoked
 * from Payload `afterChange` hooks — must therefore never throw.
 */

export type EmbedCollectionSlug =
  | 'wikiEntries'
  | 'blogPosts'
  | 'benefits'
  | 'products'

export type EmbedJob = {
  collectionSlug: EmbedCollectionSlug
  entryId: string
  locale?: string
  text: string
  meta?: Record<string, unknown>
}

export type EmbedOutcome =
  | { status: 'skipped-unchanged' }
  | { status: 'skipped-disabled'; reason: string }
  | { status: 'skipped-budget' }
  | { status: 'skipped-ratelimit' }
  | { status: 'success'; vectorLength: number; costEur: number }
  | { status: 'error'; message: string }

const SYSTEM_USER_ID = 'system:embed'
const RATE_LIMIT_ENDPOINT = 'ai-embedding'

/**
 * Looks up the stored source_hash for (collection, entry, locale, model) and
 * returns it. Returns null when no row exists or when the table is missing.
 * Any other database error is surfaced so the orchestrator can log it.
 */
async function fetchExistingHash(
  payload: Payload,
  collectionSlug: string,
  entryId: string,
  locale: string,
): Promise<string | null> {
  const pool = (payload.db as unknown as { pool?: Pool }).pool
  if (!pool) return null

  try {
    const result = await pool.query<{ source_hash: string }>(
      `SELECT source_hash
         FROM embeddings
        WHERE collection_slug = $1
          AND entry_id = $2
          AND locale = $3
          AND model = $4
        LIMIT 1`,
      [collectionSlug, entryId, locale, EMBEDDING_MODEL],
    )
    return result.rows[0]?.source_hash ?? null
  } catch (err) {
    const e = err as { code?: string; message?: string }
    // Table not yet migrated — treat as "no existing row" so the caller will
    // still try to upsert (upsertEmbedding handles 42P01 too).
    if (e.code === '42P01') return null
    throw err
  }
}

export async function embedAndStore(
  payload: Payload,
  job: EmbedJob,
): Promise<EmbedOutcome> {
  const locale = job.locale ?? 'fr'
  const text = job.text.trim()

  if (!text) {
    return { status: 'skipped-unchanged' }
  }

  const sourceHash = sourceHashOf(text)

  // 1. Local short-circuit: same content already embedded for this row.
  try {
    const existingHash = await fetchExistingHash(
      payload,
      job.collectionSlug,
      job.entryId,
      locale,
    )
    if (existingHash && existingHash === sourceHash) {
      return { status: 'skipped-unchanged' }
    }
  } catch (err) {
    await captureError(err, {
      subsystem: 'ai-embedding',
      level: 'warning',
      context: {
        stage: 'fetch-existing-hash',
        collection: job.collectionSlug,
        entryId: job.entryId,
        locale,
      },
    })
    // Non-fatal — continue and let upsert decide.
  }

  // 2. Kill-switch / disabled.
  const availability = await isAiAvailable()
  if (!availability.ok) {
    return {
      status: 'skipped-disabled',
      reason: availability.reason,
    }
  }

  // 3. Daily budget.
  const budget = await isWithinDailyBudget(payload)
  if (!budget.ok) {
    return { status: 'skipped-budget' }
  }

  // 4. Rate limit (dedicated system user — does not eat human quotas).
  const rl = await checkAiRateLimit({
    userId: SYSTEM_USER_ID,
    endpoint: RATE_LIMIT_ENDPOINT,
  })
  if (!rl.ok) {
    return { status: 'skipped-ratelimit' }
  }

  // 5. Generate + persist + audit.
  const startedAt = Date.now()
  try {
    const embedding = await generateEmbedding(text)

    await upsertEmbedding({
      collectionSlug: job.collectionSlug,
      entryId: job.entryId,
      locale,
      model: EMBEDDING_MODEL,
      sourceHash,
      vector: embedding.vector,
      meta: job.meta,
    })

    const costEur = calcCostEur({
      model: EMBEDDING_MODEL,
      promptTokens: embedding.promptTokens,
    })

    await logAiCall(
      payload,
      {
        subsystem: 'ai-embedding',
        model: EMBEDDING_MODEL,
        userId: 'system',
        collectionTarget: job.collectionSlug,
        fieldTarget: job.entryId,
        entryId: job.entryId,
      },
      startedAt,
      {
        promptTokens: embedding.promptTokens,
        promptExcerpt: text.slice(0, 300),
        responseExcerpt: `vec(${embedding.vector.length})`,
      },
      null,
    )

    // Invalide le cache search (best-effort) : un nouveau contenu vient d'être
    // embedé, les hits sémantiques peuvent changer. TTL court de toute façon.
    try {
      await bustCache('rdm:cache:search:')
    } catch {
      // never throw from a hook caller
    }

    return {
      status: 'success',
      vectorLength: embedding.vector.length,
      costEur,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const code = (err as { code?: string } | null)?.code

    await captureError(err, {
      subsystem: 'ai-embedding',
      level: 'error',
      context: {
        stage: 'generate-or-upsert',
        collection: job.collectionSlug,
        entryId: job.entryId,
        locale,
      },
    })

    // Audit the failure too so the dashboards reflect real attempt counts.
    try {
      await logAiCall(
        payload,
        {
          subsystem: 'ai-embedding',
          model: EMBEDDING_MODEL,
          userId: 'system',
          collectionTarget: job.collectionSlug,
          fieldTarget: job.entryId,
          entryId: job.entryId,
        },
        startedAt,
        null,
        { code, message },
      )
    } catch (logErr) {
      console.error('[embed-orchestrator] logAiCall failed', logErr)
    }

    return { status: 'error', message }
  }
}
