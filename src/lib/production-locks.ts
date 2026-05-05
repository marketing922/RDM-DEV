import 'server-only'
import type { Pool } from 'pg'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Locks distribués backés par Postgres (`rdm_ai.locks`). Aucune dépendance
 * externe (pas d'Upstash). Les locks expirés sont considérés comme libres
 * (TTL géré côté SQL via `expires_at < now()`).
 *
 * Convention de clé : `lock:produce:${kind}:${slug}` (mais le module ne
 * préjuge pas du format — il prend la clé telle quelle).
 *
 * Politique en cas d'erreur DB : **fail closed** — on n'accorde pas le lock
 * si la DB est indisponible (mieux vaut un faux positif qu'une double
 * production simultanée).
 */

const HOLDER_PREFIX = 'rdm:'

function makeHolderId(): string {
  return `${HOLDER_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

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

export type AcquireLockResult = {
  ok: boolean
  /**
   * Identifiant du process/run qui détient déjà le lock, ou `undefined` si
   * l'info n'est pas disponible.
   */
  existingLockHolder?: string
}

/**
 * Tente d'acquérir un lock distribué. INSERT … ON CONFLICT DO UPDATE
 * (uniquement si le lock existant a expiré). Retourne `ok: true` en cas
 * d'acquisition, `ok: false` (avec `existingLockHolder` si possible) sinon.
 */
export async function acquireLock(
  key: string,
  ttlSec: number,
): Promise<AcquireLockResult> {
  const holder = makeHolderId()
  const ttl = Math.max(1, Math.floor(ttlSec))

  const ctx = await getCtx()
  if (!ctx) {
    // Fail closed — pas de pool, on n'accorde pas le lock.
    return { ok: false }
  }

  try {
    // Tente INSERT, ou UPDATE atomique si l'existant a expiré.
    const res = await ctx.pool.query<{ holder: string; acquired: boolean }>(
      `INSERT INTO rdm_ai.locks (key, holder, acquired_at, expires_at)
         VALUES ($1, $2, now(), now() + ($3 || ' seconds')::interval)
       ON CONFLICT (key) DO UPDATE SET
         holder = EXCLUDED.holder,
         acquired_at = EXCLUDED.acquired_at,
         expires_at = EXCLUDED.expires_at
         WHERE rdm_ai.locks.expires_at < now()
       RETURNING holder, (xmax = 0 OR rdm_ai.locks.holder = $2) AS acquired;`,
      [key, holder, String(ttl)],
    )
    const row = res.rows[0]
    if (row && row.holder === holder) {
      return { ok: true }
    }
    // Conflit non résolu : un lock vivant existe. Lire son holder pour info.
    try {
      const cur = await ctx.pool.query<{ holder: string }>(
        `SELECT holder FROM rdm_ai.locks
          WHERE key = $1 AND expires_at > now() LIMIT 1;`,
        [key],
      )
      const existing = cur.rows[0]?.holder
      return { ok: false, existingLockHolder: existing }
    } catch {
      return { ok: false }
    }
  } catch (err) {
    ctx.logger?.error?.({ err, key }, '[locks] acquireLock failed — fail closed')
    return { ok: false }
  }
}

/**
 * Liste tous les locks pipeline actifs (clés commençant par `lock:produce:`).
 */
export async function listProductionLocks(): Promise<
  Array<{ key: string; holder?: string }>
> {
  const ctx = await getCtx()
  if (!ctx) return []
  try {
    const res = await ctx.pool.query<{ key: string; holder: string }>(
      `SELECT key, holder FROM rdm_ai.locks
        WHERE key LIKE 'lock:produce:%'
          AND expires_at > now();`,
    )
    return res.rows.map((r) => ({ key: r.key, holder: r.holder }))
  } catch (err) {
    ctx.logger?.error?.({ err }, '[locks] listProductionLocks failed')
    return []
  }
}

/**
 * Libère un lock. Idempotent — pas d'erreur si la clé n'existe pas / a
 * déjà expiré. Ne vérifie pas le holder (suffisant pour notre usage où
 * seul l'orchestrateur acquiert et libère le lock dans la même invocation).
 */
export async function releaseLock(key: string): Promise<void> {
  const ctx = await getCtx()
  if (!ctx) return
  try {
    await ctx.pool.query(`DELETE FROM rdm_ai.locks WHERE key = $1;`, [key])
  } catch (err) {
    ctx.logger?.error?.({ err, key }, '[locks] releaseLock failed')
  }
}
