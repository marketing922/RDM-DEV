import 'server-only'
import { Redis } from '@upstash/redis'

/**
 * Client Upstash Redis partagé entre rate-limit, cache, et autres consommateurs.
 *
 * Si UPSTASH_REDIS_REST_URL ou UPSTASH_REDIS_REST_TOKEN est absent, `redis` vaut
 * `null` — chaque consommateur doit gérer son fallback (in-memory) en
 * conséquence.
 */

export const hasUpstashEnv =
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' &&
  process.env.UPSTASH_REDIS_REST_URL.length > 0 &&
  typeof process.env.UPSTASH_REDIS_REST_TOKEN === 'string' &&
  process.env.UPSTASH_REDIS_REST_TOKEN.length > 0

export const redis: Redis | null = hasUpstashEnv
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL as string,
      token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
    })
  : null
