import 'server-only'
import { redis } from './redis-client'

/**
 * Locks distribués pour empêcher deux productions parallèles de tomber sur le
 * même slug. Sur Upstash Redis si dispo (production), fallback in-memory en
 * dev/test (ne tient qu'un process — acceptable hors prod).
 *
 * Convention de clé : `lock:produce:${kind}:${slug}` (mais le module ne préjuge
 * pas du format — il prend la clé telle quelle).
 *
 * TTL recommandé : 600 secondes (10 min) pour une production.
 */

type InMemoryLock = { holder: string; expiresAt: number }
const inMemoryLocks = new Map<string, InMemoryLock>()

const HOLDER_PREFIX = 'rdm:'

function makeHolderId(): string {
  return `${HOLDER_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export type AcquireLockResult = {
  ok: boolean
  /**
   * Identifiant du process/run qui détient déjà le lock, ou `undefined` si
   * l'info n'est pas disponible (cas Upstash : on ne stocke que la clé).
   */
  existingLockHolder?: string
}

/**
 * Tente d'acquérir un lock distribué. Retourne `ok: true` si acquis,
 * `ok: false` (avec `existingLockHolder` si possible) sinon.
 *
 * Implémentation Upstash : `SET key value NX EX ttlSec`.
 * Implémentation in-memory : Map avec timestamp d'expiration.
 */
export async function acquireLock(
  key: string,
  ttlSec: number,
): Promise<AcquireLockResult> {
  const holder = makeHolderId()

  if (redis) {
    try {
      // NX = only set if not exists, EX = TTL in seconds
      const res = await redis.set(key, holder, { nx: true, ex: ttlSec })
      if (res === 'OK') {
        return { ok: true }
      }
      // Already locked — try to read who holds it (best effort).
      let existing: string | undefined
      try {
        const raw = await redis.get<string>(key)
        if (typeof raw === 'string' && raw.length > 0) {
          existing = raw
        }
      } catch {
        existing = undefined
      }
      return { ok: false, existingLockHolder: existing }
    } catch (err) {
      console.error('[production-locks] Upstash acquire failed', err)
      // fall through to in-memory as last resort
    }
  }

  const now = Date.now()
  const existingEntry = inMemoryLocks.get(key)
  if (existingEntry && existingEntry.expiresAt > now) {
    return { ok: false, existingLockHolder: existingEntry.holder }
  }
  inMemoryLocks.set(key, { holder, expiresAt: now + ttlSec * 1000 })
  return { ok: true }
}

/**
 * Liste tous les locks pipeline actifs (clés commençant par `lock:produce:`).
 * Best-effort — l'API Upstash `keys()` est paginée mais reste bornée car les
 * locks sont auto-expirés (TTL 600s) ; en pratique <50 entrées en circulation.
 */
export async function listProductionLocks(): Promise<
  Array<{ key: string; holder?: string }>
> {
  if (redis) {
    try {
      const keys = (await redis.keys('lock:produce:*')) as string[] | undefined
      if (!keys || keys.length === 0) return []
      const out: Array<{ key: string; holder?: string }> = []
      for (const k of keys) {
        try {
          const holder = await redis.get<string>(k)
          out.push({ key: k, holder: typeof holder === 'string' ? holder : undefined })
        } catch {
          out.push({ key: k })
        }
      }
      return out
    } catch (err) {
      console.error('[production-locks] Upstash list failed', err)
    }
  }
  const now = Date.now()
  const out: Array<{ key: string; holder?: string }> = []
  for (const [key, entry] of inMemoryLocks) {
    if (entry.expiresAt > now && key.startsWith('lock:produce:')) {
      out.push({ key, holder: entry.holder })
    }
  }
  return out
}

/**
 * Libère un lock. Idempotent — pas d'erreur si la clé n'existe pas / a déjà
 * expiré. NB : on ne vérifie pas le holder (suffisant pour notre usage où
 * seul l'orchestrateur acquiert et libère le lock dans la même invocation).
 */
export async function releaseLock(key: string): Promise<void> {
  if (redis) {
    try {
      await redis.del(key)
      return
    } catch (err) {
      console.error('[production-locks] Upstash release failed', err)
      // fall through to in-memory cleanup
    }
  }
  inMemoryLocks.delete(key)
}
