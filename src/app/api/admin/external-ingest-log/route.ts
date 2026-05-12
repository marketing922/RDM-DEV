import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

/**
 * GET /api/admin/external-ingest-log
 *
 * Vue éditeur de TOUS les ingests externes (pas filtré par actor — c'est
 * la version côté nous, pas celle exposée au partenaire qui voit juste les
 * siens via /api/external/v1/ingest-log).
 *
 * Auth : session admin Payload (cookie). Aucun partenaire externe ne peut
 * atteindre cet endpoint, même avec son x-api-key.
 *
 * Paramètres :
 *   ?limit=N         (default 100, max 500)
 *   ?cursor=<id>     (pagination)
 *   ?actor=<hash>    (filtre par clé API hashée)
 *   ?kind=wiki|blog
 *   ?result=created|replayed|validation_failed|rejected|error
 *   ?errorCode=<code>
 *   ?since=<ISO>
 *   ?aggregate=yes   (renvoie un summary group by au lieu de la liste)
 */
export async function GET(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: req.headers })
  const user = auth?.user as { role?: string } | null
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'admin_required' }, { status: 401 })
  }

  const url = req.nextUrl
  const aggregate = url.searchParams.get('aggregate') === 'yes'
  const pool = (payload.db as any).pool
  if (!pool) {
    return NextResponse.json({ error: 'pool_unavailable' }, { status: 503 })
  }

  // ── Mode agrégé : statistiques globales sur 24h glissantes ────────────
  if (aggregate) {
    const since = url.searchParams.get('since') || new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    try {
      const { rows: byResult } = await pool.query(
        `SELECT result, COUNT(*)::int AS count
         FROM rdm_audit.external_ingest_log
         WHERE created_at >= $1
         GROUP BY result
         ORDER BY count DESC`,
        [since],
      )
      const { rows: byActor } = await pool.query(
        `SELECT actor_id, COUNT(*)::int AS count,
                AVG(duration_ms)::int AS avg_duration_ms,
                MAX(duration_ms)::int AS max_duration_ms,
                COUNT(*) FILTER (WHERE result IN ('validation_failed','rejected','error')) AS failures
         FROM rdm_audit.external_ingest_log
         WHERE created_at >= $1
         GROUP BY actor_id
         ORDER BY count DESC
         LIMIT 50`,
        [since],
      )
      const { rows: byErrorCode } = await pool.query(
        `SELECT error_code, COUNT(*)::int AS count
         FROM rdm_audit.external_ingest_log
         WHERE created_at >= $1 AND error_code IS NOT NULL
         GROUP BY error_code
         ORDER BY count DESC`,
        [since],
      )
      const { rows: byHour } = await pool.query(
        `SELECT date_trunc('hour', created_at) AS hour, COUNT(*)::int AS count
         FROM rdm_audit.external_ingest_log
         WHERE created_at >= $1
         GROUP BY 1
         ORDER BY 1 DESC
         LIMIT 24`,
        [since],
      )
      const { rows: totalsRow } = await pool.query(
        `SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE result IN ('created','replayed'))::int AS success,
            COUNT(*) FILTER (WHERE result IN ('validation_failed','rejected','error'))::int AS failure,
            AVG(duration_ms)::int AS avg_duration_ms,
            COUNT(DISTINCT actor_id)::int AS distinct_actors
         FROM rdm_audit.external_ingest_log
         WHERE created_at >= $1`,
        [since],
      )
      return NextResponse.json({
        since,
        totals: totalsRow[0],
        byResult,
        byActor,
        byErrorCode,
        byHour,
      })
    } catch (err) {
      return NextResponse.json(
        { error: 'query_failed', message: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      )
    }
  }

  // ── Mode listing détaillé ─────────────────────────────────────────────
  const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get('limit') || '100', 10) || 100))
  const cursor = url.searchParams.get('cursor')
  const actor = url.searchParams.get('actor')
  const kind = url.searchParams.get('kind')
  const result = url.searchParams.get('result')
  const errorCode = url.searchParams.get('errorCode')
  const since = url.searchParams.get('since')

  const params: any[] = []
  const conditions: string[] = []
  if (cursor) {
    params.push(parseInt(cursor, 10))
    conditions.push(`id < $${params.length}`)
  }
  if (actor) {
    params.push(actor)
    conditions.push(`actor_id = $${params.length}`)
  }
  if (kind) {
    params.push(kind)
    conditions.push(`kind = $${params.length}`)
  }
  if (result) {
    params.push(result)
    conditions.push(`result = $${params.length}`)
  }
  if (errorCode) {
    params.push(errorCode)
    conditions.push(`error_code = $${params.length}`)
  }
  if (since) {
    params.push(since)
    conditions.push(`created_at >= $${params.length}`)
  }
  params.push(limit + 1)
  const limitParamIdx = params.length

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const query = `
    SELECT
      id, actor_id, api_key_hash, ip_hash, kind, locale, slug, doc_id,
      idempotency_key, status_code, result, error_code, duration_ms,
      payload_size_bytes, compliance_verdict, webhook_url, webhook_status,
      webhook_response_code, replayed, created_at
    FROM rdm_audit.external_ingest_log
    ${whereClause}
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
        actorId: r.actor_id,
        apiKeyHash: r.api_key_hash,
        ipHash: r.ip_hash,
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
      filters: { limit, actor, kind, result, errorCode, since },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'query_failed', message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
