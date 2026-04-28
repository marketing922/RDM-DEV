import 'server-only'
import { createHash } from 'node:crypto'

import { redis, hasUpstashEnv } from './redis-client'

/**
 * Cache Upstash partagé. TTL courts. Bypass : `?nocache=1`.
 *
 * - Réutilise le client Upstash partagé (cf. redis-client.ts) qu'utilise aussi
 *   le rate-limit.
 * - Fallback in-memory avec TTL via setTimeout si Upstash n'est pas configuré
 *   (dev only, pas tenable en production Vercel stateless).
 * - Best-effort partout : aucune erreur Redis ne doit casser un endpoint.
 * - Skip silencieux des entrées > 100 kB (free tier Upstash).
 */

export type CacheKind = 'search' | 'suggestions'

export type CacheEntry<T = unknown> = {
  data: T
  cachedAt: number
}

export const CACHE_TTL: Record<CacheKind, number> = {
  search: 300,
  suggestions: 120,
}

const KEY_PREFIX = 'rdm:cache'
const MAX_ENTRY_BYTES = 100 * 1024

// ---------------------------------------------------------------------------
// Fallback in-memory (dev only)
// ---------------------------------------------------------------------------

type MemEntry = { value: string; expiresAt: number; timer: NodeJS.Timeout }
const memStore = new Map<string, MemEntry>()
let memWarned = false

function memWarnOnce(): void {
  if (memWarned) return
  memWarned = true
  console.warn(
    '[redis-cache] Cache en mode in-memory — ne tient pas en production Vercel (stateless). Configure UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.',
  )
}

function memSet(key: string, value: string, ttlSeconds: number): void {
  const existing = memStore.get(key)
  if (existing) clearTimeout(existing.timer)
  const expiresAt = Date.now() + ttlSeconds * 1000
  const timer = setTimeout(() => {
    memStore.delete(key)
  }, ttlSeconds * 1000)
  // unref pour ne pas bloquer le shutdown du process
  if (typeof timer.unref === 'function') timer.unref()
  memStore.set(key, { value, expiresAt, timer })
}

function memGet(key: string): string | null {
  const entry = memStore.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    clearTimeout(entry.timer)
    memStore.delete(key)
    return null
  }
  return entry.value
}

function memDeleteByPrefix(prefix: string): number {
  let n = 0
  for (const k of Array.from(memStore.keys())) {
    if (k.startsWith(prefix)) {
      const entry = memStore.get(k)
      if (entry) clearTimeout(entry.timer)
      memStore.delete(k)
      n++
    }
  }
  return n
}

// ---------------------------------------------------------------------------
// Normalisation + clés
// ---------------------------------------------------------------------------

/**
 * Normalisation déterministe : sort des clés d'objet, lowercase des strings.
 * Booléens / nombres / null laissés tel quel. Récursif pour objets / arrays.
 */
function normalize(value: unknown): unknown {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value.toLowerCase()
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map(normalize)
  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>
    const sortedKeys = Object.keys(rec).sort()
    const out: Record<string, unknown> = {}
    for (const k of sortedKeys) {
      out[k] = normalize(rec[k])
    }
    return out
  }
  // fonctions / symboles : on ignore
  return null
}

export function buildKey(
  kind: CacheKind,
  params: Record<string, unknown>,
): string {
  const normalized = JSON.stringify(normalize(params))
  const hash = createHash('sha256').update(normalized).digest('hex')
  return `${KEY_PREFIX}:${kind}:${hash}`
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

export async function getCached<T>(
  key: string,
): Promise<CacheEntry<T> | null> {
  try {
    let raw: string | null
    if (redis) {
      // Upstash auto-deserialize si JSON ; on demande string brute pour rester
      // déterministe.
      const v = await redis.get<string>(key)
      raw = typeof v === 'string' ? v : v == null ? null : JSON.stringify(v)
    } else {
      memWarnOnce()
      raw = memGet(key)
    }
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry<T>
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.cachedAt !== 'number'
    ) {
      return null
    }
    return parsed
  } catch (err) {
    console.warn('[redis-cache] getCached failed', (err as Error)?.message)
    return null
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data: value, cachedAt: Date.now() }
    const serialized = JSON.stringify(entry)
    // Skip silencieux si payload > 100kB
    if (Buffer.byteLength(serialized, 'utf8') > MAX_ENTRY_BYTES) {
      return
    }
    if (redis) {
      await redis.set(key, serialized, { ex: Math.max(1, ttlSeconds) })
    } else {
      memWarnOnce()
      memSet(key, serialized, Math.max(1, ttlSeconds))
    }
  } catch (err) {
    console.warn('[redis-cache] setCached failed', (err as Error)?.message)
  }
}

/**
 * Supprime toutes les clés dont le nom commence par `prefix`. SCAN + DEL côté
 * Upstash (paginé), ou itération in-memory en fallback. Best-effort.
 */
export async function bustCache(prefix: string): Promise<number> {
  try {
    if (!redis) {
      memWarnOnce()
      return memDeleteByPrefix(prefix)
    }
    const match = `${prefix}*`
    let cursor: string | number = 0
    let deleted = 0
    do {
      const res = (await redis.scan(cursor, { match, count: 100 })) as [
        string | number,
        string[],
      ]
      const nextCursor = res[0]
      const keys = res[1] ?? []
      if (keys.length > 0) {
        deleted += await redis.del(...keys)
      }
      cursor = nextCursor
    } while (cursor !== 0 && cursor !== '0')
    return deleted
  } catch (err) {
    console.warn('[redis-cache] bustCache failed', (err as Error)?.message)
    return 0
  }
}
