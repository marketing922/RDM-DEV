import 'server-only'
import crypto from 'crypto'
import type { Pool } from 'pg'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * WORM backup en Postgres.
 *
 * Avant : `./backups/worm/<collection>/<YYYY/MM>/<id>_<ts>.json` sur le FS.
 *   → Inutilisable sur Vercel (FS éphémère, perdu à chaque cold start).
 *
 * Maintenant : ligne dans `rdm_audit.worm_backups` (schéma à part, géré
 *   par migration manuelle, jamais touché par drizzle-push de Payload).
 *
 * Politique d'erreur : fail-soft (logger.error puis return null) — la
 * sauvegarde de l'admin ne doit pas être bloquée si la BD est temporairement
 * indisponible. Le hook `backupAfterChange` ne fait pas remonter l'erreur.
 */

export interface WormEntry {
  id: number
  collection: string
  documentId: string
  hash: string
  size: number
  createdAt: string
}

async function getPool(): Promise<Pool | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const pool = (payload.db as unknown as { pool?: Pool }).pool
    return pool ?? null
  } catch {
    return null
  }
}

export async function writeWormBackup(
  collection: string,
  documentId: string,
  data: Buffer | string,
): Promise<WormEntry | null> {
  const pool = await getPool()
  if (!pool) return null

  const content = typeof data === 'string' ? data : data.toString('utf-8')
  const hash = crypto.createHash('sha256').update(content).digest('hex')
  const size = Buffer.byteLength(content, 'utf-8')

  try {
    const result = await pool.query<{
      id: string
      created_at: string
    }>(
      `INSERT INTO rdm_audit.worm_backups
        (collection, document_id, snapshot, hash, size_bytes)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       RETURNING id, created_at;`,
      [collection, String(documentId), content, hash, size],
    )
    const row = result.rows[0]
    if (!row) return null
    return {
      id: Number(row.id),
      collection,
      documentId: String(documentId),
      hash,
      size,
      createdAt: new Date(row.created_at).toISOString(),
    }
  } catch (err) {
    // Fail-soft : l'admin ne doit pas être bloqué par un échec backup.
    console.error(`[worm] insert failed for ${collection}/${documentId}:`, err)
    return null
  }
}

export async function verifyWormIntegrity(
  id: number,
  expectedHash: string,
): Promise<boolean> {
  const pool = await getPool()
  if (!pool) return false
  try {
    const result = await pool.query<{ hash: string; snapshot: string }>(
      `SELECT hash, snapshot::text FROM rdm_audit.worm_backups WHERE id = $1`,
      [id],
    )
    const row = result.rows[0]
    if (!row) return false
    if (row.hash !== expectedHash) return false
    const recomputed = crypto.createHash('sha256').update(row.snapshot).digest('hex')
    return recomputed === expectedHash
  } catch {
    return false
  }
}

export async function listWormBackups(
  collection: string,
  opts: { limit?: number; documentId?: string } = {},
): Promise<WormEntry[]> {
  const pool = await getPool()
  if (!pool) return []
  const limit = Math.min(Math.max(1, opts.limit ?? 100), 500)

  try {
    const params: any[] = [collection]
    let where = `collection = $1`
    if (opts.documentId) {
      params.push(String(opts.documentId))
      where += ` AND document_id = $${params.length}`
    }
    params.push(limit)
    const result = await pool.query<{
      id: string
      collection: string
      document_id: string
      hash: string
      size_bytes: number
      created_at: string
    }>(
      `SELECT id, collection, document_id, hash, size_bytes, created_at
         FROM rdm_audit.worm_backups
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT $${params.length};`,
      params,
    )
    return result.rows.map((r) => ({
      id: Number(r.id),
      collection: r.collection,
      documentId: r.document_id,
      hash: r.hash,
      size: r.size_bytes,
      createdAt: new Date(r.created_at).toISOString(),
    }))
  } catch (err) {
    console.error(`[worm] list failed for ${collection}:`, err)
    return []
  }
}
