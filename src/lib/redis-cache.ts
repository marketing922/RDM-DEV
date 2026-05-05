import 'server-only'
import { createHash } from 'node:crypto'
import type { Pool } from 'pg'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Cache key/value persistant (TTL court) backé par Postgres
 * (`rdm_ai.kv_cache`). Aucune dépendance externe (pas d'Upstash).
 *
 * - Best-effort partout : aucune erreur DB ne casse un endpoint (fail open
 *   → cache miss).
 * - Skip silencieux des entrées > 100 kB.
 * - Les API publiques (`buildKey`, `getCached`, `setCached`, `bustCache`,
 *   `CACHE_TTL`, types `CacheKind` / `CacheEntry`) sont conservées.
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
// Pool helper (cf. rate-limit.ts pour le pattern).
// ---------------------------------------------------------------------------

type Logger = {
  error?: (...a: unknown[]) => void
  warn?: (...a: unknown[]) => void
}

async function getCtx(): Promise<{ pool: Pool; logger?: Logger } | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const pool = (payload.db as unknown as { pool?: Pool }).pool
    if (!pool) return null
    return { pool, logger: payload.logger as Logger }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Normalisation + clés
// ---------------------------------------------------------------------------

function normalize(value: unknown): unknown {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value.toLowerCase()
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map(normalize)
  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>
    const sortedKeys = Object.keys(rec).sort()
    const out: Record<string, unknown> = {}
    for (const k of sortedKeys) out[k] = normalize(rec[k])
    return out
  }
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
  const ctx = await getCtx()
  if (!ctx) return null
  try {
    const res = await ctx.pool.query<{ value: CacheEntry<T> }>(
      `SELECT value FROM rdm_ai.kv_cache
        WHERE key = $1
          AND (expires_at IS NULL OR expires_at > now())
        LIMIT 1;`,
      [key],
    )
    const row = res.rows[0]
    if (!row) return null
    const parsed = row.value as CacheEntry<T> | null
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as CacheEntry<T>).cachedAt !== 'number'
    ) {
      return null
    }
    return parsed
  } catch (err) {
    ctx.logger?.warn?.({ err, key }, '[kv-cache] getCached failed — fail open')
    return null
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  const entry: CacheEntry<T> = { data: value, cachedAt: Date.now() }
  const serialized = JSON.stringify(entry)
  if (Buffer.byteLength(serialized, 'utf8') > MAX_ENTRY_BYTES) return

  const ctx = await getCtx()
  if (!ctx) return
  try {
    const ttl = Math.max(1, ttlSeconds)
    await ctx.pool.query(
      `INSERT INTO rdm_ai.kv_cache (key, value, expires_at)
       VALUES ($1, $2::jsonb, now() + ($3 || ' seconds')::interval)
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         expires_at = EXCLUDED.expires_at;`,
      [key, serialized, String(ttl)],
    )
  } catch (err) {
    ctx.logger?.warn?.({ err, key }, '[kv-cache] setCached failed')
  }
}

/**
 * Supprime toutes les clés dont le nom commence par `prefix`. Best-effort.
 * Retourne le nombre de lignes supprimées.
 */
export async function bustCache(prefix: string): Promise<number> {
  const ctx = await getCtx()
  if (!ctx) return 0
  try {
    const res = await ctx.pool.query(
      `DELETE FROM rdm_ai.kv_cache WHERE key LIKE $1;`,
      [`${prefix}%`],
    )
    return res.rowCount ?? 0
  } catch (err) {
    ctx.logger?.warn?.({ err, prefix }, '[kv-cache] bustCache failed')
    return 0
  }
}
