import 'server-only'
import type { Pool } from 'pg'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Rate-limit fixed-window minute-based, atomic via UPSERT Postgres.
 *
 * Table : `rdm_ai.rate_limit_buckets` (voir migration
 * `20260504_120000_rate_limit_buckets.ts`).
 *
 * Politique en cas d'erreur DB : **fail open** — on laisse passer la
 * requête et on log via `payload.logger`. Mieux vaut un faux négatif
 * qu'un site cassé.
 */

type Scope = 'user-hour' | 'user-day' | 'global-day'

export type AiRateLimitResult =
  | {
      ok: true
      remaining: { hour: number; day: number; globalDay: number }
    }
  | {
      ok: false
      scope: Scope
      reset: number
      retryAfterSec: number
    }

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number }

async function getPool(): Promise<{ pool: Pool; logger?: { error: (...a: unknown[]) => void; warn: (...a: unknown[]) => void } } | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const pool = (payload.db as unknown as { pool?: Pool }).pool
    if (!pool) return null
    return { pool, logger: payload.logger as any }
  } catch {
    return null
  }
}

/**
 * Bump le compteur du bucket `key` pour la fenêtre courante (minute en cours
 * par défaut, ou tronquée à `windowSec` si fourni).
 *
 * NOTE: `windowSec` ≠ 60 reste fixed-window mais aligné sur des bornes
 * `to_timestamp(floor(extract(epoch from now()) / windowSec) * windowSec)`.
 */
export async function checkRateLimit(
  key: string,
  opts: { limit: number; windowSec?: number },
): Promise<RateLimitResult> {
  const { limit } = opts
  const windowSec = opts.windowSec ?? 60

  const ctx = await getPool()
  if (!ctx) {
    // Fail open — pas de pool dispo, on laisse passer.
    return { ok: true, remaining: limit - 1 }
  }
  const { pool, logger } = ctx

  try {
    const result = await pool.query<{ count: number; window_start: string }>(
      `INSERT INTO rdm_ai.rate_limit_buckets (key, window_start, count)
       VALUES (
         $1,
         to_timestamp(floor(extract(epoch from now()) / $2) * $2),
         1
       )
       ON CONFLICT (key) DO UPDATE SET
         count = CASE
           WHEN rdm_ai.rate_limit_buckets.window_start = to_timestamp(floor(extract(epoch from now()) / $2) * $2)
           THEN rdm_ai.rate_limit_buckets.count + 1
           ELSE 1
         END,
         window_start = to_timestamp(floor(extract(epoch from now()) / $2) * $2)
       RETURNING count, window_start;`,
      [key, windowSec],
    )
    const row = result.rows[0]
    if (!row) return { ok: true, remaining: limit - 1 }

    const count = Number(row.count)
    if (count > limit) {
      const windowStartMs = new Date(row.window_start).getTime()
      const resetMs = windowStartMs + windowSec * 1000
      const retryAfterSec = Math.max(1, Math.ceil((resetMs - Date.now()) / 1000))
      return { ok: false, retryAfterSec }
    }
    return { ok: true, remaining: Math.max(0, limit - count) }
  } catch (err) {
    logger?.error?.({ err, key }, '[rate-limit] DB error — fail open')
    return { ok: true, remaining: limit - 1 }
  }
}

/**
 * Conserve l'API existante. Trois fenêtres : user/hour, user/day, global/day.
 * Implémentées comme trois compteurs `checkRateLimit` distincts.
 */
export async function checkAiRateLimit(opts: {
  userId: string
  endpoint: string
}): Promise<AiRateLimitResult> {
  const userKey = `${opts.userId}:${opts.endpoint}`
  const globalKey = `global:${opts.endpoint}`

  const hour = await checkRateLimit(`rdm:ai:user:1h:${userKey}`, {
    limit: 30,
    windowSec: 60 * 60,
  })
  if (!hour.ok) {
    const reset = Date.now() + hour.retryAfterSec * 1000
    return { ok: false, scope: 'user-hour', reset, retryAfterSec: hour.retryAfterSec }
  }

  const day = await checkRateLimit(`rdm:ai:user:1d:${userKey}`, {
    limit: 200,
    windowSec: 24 * 60 * 60,
  })
  if (!day.ok) {
    const reset = Date.now() + day.retryAfterSec * 1000
    return { ok: false, scope: 'user-day', reset, retryAfterSec: day.retryAfterSec }
  }

  const globalDay = await checkRateLimit(`rdm:ai:global:1d:${globalKey}`, {
    limit: 1000,
    windowSec: 24 * 60 * 60,
  })
  if (!globalDay.ok) {
    const reset = Date.now() + globalDay.retryAfterSec * 1000
    return { ok: false, scope: 'global-day', reset, retryAfterSec: globalDay.retryAfterSec }
  }

  return {
    ok: true,
    remaining: {
      hour: hour.remaining,
      day: day.remaining,
      globalDay: globalDay.remaining,
    },
  }
}
