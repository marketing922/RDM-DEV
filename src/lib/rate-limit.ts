import { Ratelimit } from '@upstash/ratelimit'
import { redis, hasUpstashEnv } from './redis-client'

type LimiterLike = {
  limit: (identifier: string) => Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
  }>
}

type Scope = 'user-hour' | 'user-day' | 'global-day'

// WHY: Vercel serverless is stateless across invocations — in-memory fallback is dev-only, never prod.
function createInMemoryLimiter(
  max: number,
  windowMs: number,
  kind: 'sliding' | 'fixed',
  prefix: string,
): LimiterLike {
  const buckets = new Map<string, number[]>()
  return {
    async limit(identifier: string) {
      const key = `${prefix}:${identifier}`
      const now = Date.now()
      const windowStart =
        kind === 'fixed' ? Math.floor(now / windowMs) * windowMs : now - windowMs
      const reset =
        kind === 'fixed' ? windowStart + windowMs : now + windowMs
      const entries = (buckets.get(key) ?? []).filter((ts) =>
        kind === 'fixed' ? ts >= windowStart : ts > windowStart,
      )
      if (entries.length >= max) {
        buckets.set(key, entries)
        const earliest = entries[0] ?? now
        const resetAt = kind === 'fixed' ? reset : earliest + windowMs
        return { success: false, limit: max, remaining: 0, reset: resetAt }
      }
      entries.push(now)
      buckets.set(key, entries)
      return {
        success: true,
        limit: max,
        remaining: max - entries.length,
        reset,
      }
    },
  }
}

if (!hasUpstashEnv) {
  console.warn(
    '[rate-limit] Rate-limit en mode in-memory — ne tient pas en production Vercel (stateless). Configure UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.',
  )
}

export const aiUserHour: LimiterLike = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 h'),
      prefix: 'rdm:ai:user:1h',
      analytics: false,
    })
  : createInMemoryLimiter(30, 60 * 60 * 1000, 'sliding', 'rdm:ai:user:1h')

export const aiUserDay: LimiterLike = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, '24 h'),
      prefix: 'rdm:ai:user:1d',
      analytics: false,
    })
  : createInMemoryLimiter(200, 24 * 60 * 60 * 1000, 'sliding', 'rdm:ai:user:1d')

export const aiGlobalDay: LimiterLike = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(1000, '1 d'),
      prefix: 'rdm:ai:global:1d',
      analytics: false,
    })
  : createInMemoryLimiter(
      1000,
      24 * 60 * 60 * 1000,
      'fixed',
      'rdm:ai:global:1d',
    )

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

export async function checkAiRateLimit(opts: {
  userId: string
  endpoint: string
}): Promise<AiRateLimitResult> {
  const userKey = `${opts.userId}:${opts.endpoint}`
  const globalKey = `global:${opts.endpoint}`

  const hour = await aiUserHour.limit(userKey)
  if (!hour.success) {
    const retryAfterSec = Math.max(1, Math.ceil((hour.reset - Date.now()) / 1000))
    return { ok: false, scope: 'user-hour', reset: hour.reset, retryAfterSec }
  }

  const day = await aiUserDay.limit(userKey)
  if (!day.success) {
    const retryAfterSec = Math.max(1, Math.ceil((day.reset - Date.now()) / 1000))
    return { ok: false, scope: 'user-day', reset: day.reset, retryAfterSec }
  }

  const globalDay = await aiGlobalDay.limit(globalKey)
  if (!globalDay.success) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((globalDay.reset - Date.now()) / 1000),
    )
    return {
      ok: false,
      scope: 'global-day',
      reset: globalDay.reset,
      retryAfterSec,
    }
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
