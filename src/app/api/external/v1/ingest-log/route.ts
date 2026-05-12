import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { authenticateExternal } from '@/lib/external-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

/**
 * GET /api/external/v1/ingest-log
 *   ?limit=N         (default 50, max 200)
 *   ?cursor=<id>     (pagination — passer le `nextCursor` retourné)
 *   ?status=success|failed|all (default all)
 *   ?since=<ISO>     (filtre created_at >= since)
 *
 * Le partenaire consulte UNIQUEMENT son propre historique d'ingest
 * (filtré côté serveur sur `actor_id` = sa clé API hashée).
 *
 * Utile pour :
 *   - Audit (qui a poussé quoi quand)
 *   - Debug (retrouver un payload qui a échoué)
 *   - Monitoring (taux d'erreur, latence)
 *   - Idempotency (savoir si un envoi a réussi avant de retry)
 */
export async function GET(req: NextRequest) {
  const auth = authenticateExternal(req)
  if (!auth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = req.nextUrl
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50))
  const cursor = url.searchParams.get('cursor')
  const statusFilter = url.searchParams.get('status') || 'all'
  const since = url.searchParams.get('since')

  const payload = await getPayload({ config: configPromise })
  const pool = (payload.db as any).pool
  if (!pool) {
    return NextResponse.json({ error: 'pool_unavailable' }, { status: 503 })
  }

  const params: any[] = [auth.actorId]
  const conditions: string[] = ['actor_id = $1']

  if (cursor) {
    params.push(parseInt(cursor, 10))
    conditions.push(`id < $${params.length}`)
  }
  if (since) {
    params.push(since)
    conditions.push(`created_at >= $${params.length}`)
  }
  if (statusFilter === 'success') {
    conditions.push(`result IN ('created', 'replayed')`)
  } else if (statusFilter === 'failed') {
    conditions.push(`result IN ('validation_failed', 'rejected', 'error')`)
  }

  params.push(limit + 1)
  const limitParamIdx = params.length

  const query = `
    SELECT
      id, kind, locale, slug, doc_id, idempotency_key, status_code, result,
      error_code, duration_ms, payload_size_bytes, compliance_verdict,
      webhook_url, webhook_status, webhook_response_code, replayed, created_at
    FROM rdm_audit.external_ingest_log
    WHERE ${conditions.join(' AND ')}
    ORDER BY id DESC
    LIMIT $${limitParamIdx}
  `

  try {
    const { rows } = await pool.query(query, params)
    const hasMore = rows.length > limit
    const slice = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? String(slice[slice.length - 1].id) : null

    return NextResponse.json({
      docs: slice.map((r: any) => ({
        id: r.id,
        kind: r.kind,
        locale: r.locale,
        slug: r.slug,
        docId: r.doc_id,
        idempotencyKey: r.idempotency_key,
        statusCode: r.status_code,
        result: r.result,
        errorCode: r.error_code,
        durationMs: r.duration_ms,
        payloadSizeBytes: r.payload_size_bytes,
        complianceVerdict: r.compliance_verdict,
        webhook: r.webhook_url
          ? {
              url: r.webhook_url,
              status: r.webhook_status,
              responseCode: r.webhook_response_code,
            }
          : null,
        replayed: r.replayed,
        createdAt: r.created_at,
      })),
      hasMore,
      nextCursor,
      filters: { limit, status: statusFilter, since: since || null },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'query_failed', message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
