import { NextResponse } from 'next/server'
import type { Pool } from 'pg'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

/**
 * GET /api/health
 *
 * Health check léger pour Vercel / monitoring externe. Retourne :
 *   - status: 'ok' | 'degraded' | 'down'
 *   - checks: { db: 'ok'|'fail', ... }
 *   - ts: epoch ms
 *
 * Pas d'auth — endpoint public mais ne révèle aucune donnée sensible
 * (juste OK / fail + timestamp). Utilisable par UptimeRobot, BetterUptime,
 * ou un script CI.
 *
 * Code de status HTTP :
 *   - 200 si tout OK
 *   - 503 si la BD est inaccessible (le service est en panne)
 */
export async function GET() {
  const ts = Date.now()
  const checks: Record<string, 'ok' | 'fail' | 'skipped'> = {}

  // ── DB ping
  let dbOk = false
  try {
    const payload = await getPayload({ config: configPromise })
    const pool = (payload.db as unknown as { pool?: Pool }).pool
    if (pool) {
      const r = await pool.query('SELECT 1 AS ok')
      dbOk = r.rows.length > 0
    }
    checks.db = dbOk ? 'ok' : 'fail'
  } catch {
    checks.db = 'fail'
  }

  // ── Env vars critiques (présence seulement, pas de valeur)
  checks.env = process.env.PAYLOAD_SECRET && process.env.DATABASE_URI ? 'ok' : 'fail'

  // ── Migrations clés (existence du schéma rdm_ai)
  if (dbOk) {
    try {
      const payload = await getPayload({ config: configPromise })
      const pool = (payload.db as unknown as { pool?: Pool }).pool!
      const r = await pool.query(
        `SELECT 1 FROM information_schema.schemata WHERE schema_name = 'rdm_ai' LIMIT 1`,
      )
      checks.schema_rdm_ai = r.rows.length > 0 ? 'ok' : 'fail'
    } catch {
      checks.schema_rdm_ai = 'fail'
    }
  } else {
    checks.schema_rdm_ai = 'skipped'
  }

  const allOk = Object.values(checks).every((v) => v === 'ok' || v === 'skipped')
  const status = allOk ? 'ok' : 'degraded'
  const httpStatus = checks.db === 'ok' ? 200 : 503

  return NextResponse.json(
    {
      status,
      checks,
      ts,
      durationMs: Date.now() - ts,
    },
    { status: httpStatus, headers: { 'Cache-Control': 'no-store' } },
  )
}
