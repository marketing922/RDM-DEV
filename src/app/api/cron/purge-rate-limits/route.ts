import { NextRequest, NextResponse } from 'next/server'
import type { Pool } from 'pg'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/purge-rate-limits
 *
 * Supprime les buckets de rate-limit dont la fenêtre est ancienne
 * (> 1 heure). Authentifié par `Authorization: Bearer ${CRON_SECRET}`
 * (modèle identique à /api/cron/autopilot/tick).
 */

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') || ''
  const vercelSig = req.headers.get('x-vercel-cron-signature') || ''

  let authorized = false
  if (cronSecret && auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim()
    if (token && token === cronSecret) authorized = true
  }
  if (!authorized && vercelSig && cronSecret) authorized = true

  if (!authorized) {
    return NextResponse.json(
      { error: 'unauthorized' },
      { status: 401 },
    )
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const pool = (payload.db as unknown as { pool?: Pool }).pool
    if (!pool) {
      return NextResponse.json({ error: 'pool_unavailable' }, { status: 503 })
    }
    const rl = await pool.query(
      `DELETE FROM rdm_ai.rate_limit_buckets
         WHERE window_start < now() - interval '1 hour';`,
    )
    const kv = await pool.query(
      `DELETE FROM rdm_ai.kv_cache
         WHERE expires_at IS NOT NULL AND expires_at < now();`,
    )
    const locks = await pool.query(
      `DELETE FROM rdm_ai.locks
         WHERE expires_at < now();`,
    )
    // Fingerprints d'ingest : 24h de fenêtre logique, on purge au-delà.
    const fps = await pool.query(
      `DELETE FROM rdm_ai.ingest_fingerprints
         WHERE first_seen_at < now() - interval '24 hours';`,
    )
    return NextResponse.json({
      deleted: {
        rate_limit_buckets: rl.rowCount ?? 0,
        kv_cache: kv.rowCount ?? 0,
        locks: locks.rowCount ?? 0,
        ingest_fingerprints: fps.rowCount ?? 0,
      },
    })
  } catch (err) {
    try {
      const payload = await getPayload({ config: configPromise })
      payload.logger.error({ err }, '[cron purge-rate-limits] failed')
    } catch {
      /* swallow logger failure */
    }
    return NextResponse.json(
      { error: 'purge_failed', message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cron/purge-rate-limits',
    method: 'POST',
    auth: 'Bearer CRON_SECRET',
  })
}
