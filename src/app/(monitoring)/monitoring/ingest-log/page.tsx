import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

type LogRow = {
  id: string | number
  actor_id: string
  kind: string
  locale: string
  slug: string | null
  doc_id: string | null
  idempotency_key: string | null
  status_code: number
  result: string
  error_code: string | null
  duration_ms: number | null
  payload_size_bytes: number | null
  compliance_verdict: string | null
  webhook_status: string | null
  webhook_response_code: number | null
  replayed: boolean
  created_at: string
}

type Totals = {
  total: number
  success: number
  failure: number
  avg_duration_ms: number | null
  distinct_actors: number
}

async function loadData(searchParams: { [k: string]: string | undefined }) {
  const payload = await getPayload({ config: configPromise })
  const reqHeaders = await headers()
  const auth = await payload.auth({ headers: reqHeaders })
  const user = auth?.user as { role?: string } | null
  if (!user || user.role !== 'admin') {
    redirect('/admin/login')
  }

  const pool = (payload.db as any).pool
  if (!pool) {
    return { error: 'pool_unavailable' as const }
  }

  const since =
    searchParams.since ||
    new Date(Date.now() - 24 * 3600 * 1000).toISOString()

  // Aggregates
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
            COUNT(*) FILTER (WHERE result IN ('validation_failed','rejected','error'))::int AS failures
      FROM rdm_audit.external_ingest_log
      WHERE created_at >= $1
      GROUP BY actor_id
      ORDER BY count DESC
      LIMIT 10`,
    [since],
  )

  // Recent rows
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.limit || '50', 10) || 50))
  const params: any[] = [since]
  const conditions: string[] = ['created_at >= $1']
  if (searchParams.kind) {
    params.push(searchParams.kind)
    conditions.push(`kind = $${params.length}`)
  }
  if (searchParams.result) {
    params.push(searchParams.result)
    conditions.push(`result = $${params.length}`)
  }
  if (searchParams.actor) {
    params.push(searchParams.actor)
    conditions.push(`actor_id = $${params.length}`)
  }
  params.push(limit)
  const limitIdx = params.length

  const { rows } = await pool.query(
    `SELECT id, actor_id, kind, locale, slug, doc_id, idempotency_key,
            status_code, result, error_code, duration_ms, payload_size_bytes,
            compliance_verdict, webhook_status, webhook_response_code,
            replayed, created_at
      FROM rdm_audit.external_ingest_log
      WHERE ${conditions.join(' AND ')}
      ORDER BY id DESC
      LIMIT $${limitIdx}`,
    params,
  )

  return {
    since,
    totals: totalsRow[0] as Totals,
    byResult: byResult as Array<{ result: string; count: number }>,
    byActor: byActor as Array<{ actor_id: string; count: number; failures: number }>,
    rows: rows as LogRow[],
    filters: searchParams,
    limit,
  }
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return iso
  }
}

function resultColor(result: string): string {
  switch (result) {
    case 'created':
      return '#10b981'
    case 'replayed':
      return '#06b6d4'
    case 'validation_failed':
      return '#f59e0b'
    case 'rejected':
      return '#ef4444'
    case 'error':
      return '#dc2626'
    default:
      return '#9ca3af'
  }
}

type Props = {
  searchParams: Promise<{ [k: string]: string | undefined }>
}

export default async function IngestLogMonitoringPage({ searchParams }: Props) {
  const sp = await searchParams
  const data = await loadData(sp)

  if ('error' in data) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Erreur : {data.error}</h1>
      </main>
    )
  }

  const failureRate = data.totals.total > 0 ? (data.totals.failure / data.totals.total) * 100 : 0

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, margin: 0, fontWeight: 600 }}>
          Monitoring — ingests externes
        </h1>
        <p style={{ color: '#9ca3af', margin: '4px 0 0', fontSize: 13 }}>
          Période : depuis {fmtDate(data.since)} (24h glissantes par défaut, modifiable via{' '}
          <code>?since=ISO</code>)
        </p>
      </header>

      {/* ───── KPIs ───── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          { label: 'Total ingests', value: data.totals.total, color: '#e5e9f0' },
          { label: 'Succès', value: data.totals.success, color: '#10b981' },
          { label: 'Échecs', value: data.totals.failure, color: '#ef4444' },
          {
            label: 'Taux d\'échec',
            value: `${failureRate.toFixed(1)}%`,
            color: failureRate > 10 ? '#ef4444' : failureRate > 5 ? '#f59e0b' : '#10b981',
          },
          { label: 'Latence moy.', value: data.totals.avg_duration_ms ? `${data.totals.avg_duration_ms} ms` : '—', color: '#06b6d4' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: '#151b23',
              border: '1px solid #1f2933',
              borderRadius: 8,
              padding: '16px 18px',
            }}
          >
            <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: kpi.color, marginTop: 4 }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </section>

      {/* ───── Breakdowns ───── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#151b23', border: '1px solid #1f2933', borderRadius: 8, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Par résultat
          </h3>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              {data.byResult.map((r) => (
                <tr key={r.result} style={{ borderBottom: '1px solid #1f2933' }}>
                  <td style={{ padding: '8px 0', color: resultColor(r.result) }}>{r.result}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'monospace' }}>{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#151b23', border: '1px solid #1f2933', borderRadius: 8, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Top 10 partenaires
          </h3>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#6b7280', textAlign: 'left' }}>
                <th style={{ padding: '6px 0', fontWeight: 500 }}>Actor</th>
                <th style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>Total</th>
                <th style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>Échecs</th>
              </tr>
            </thead>
            <tbody>
              {data.byActor.map((a) => (
                <tr key={a.actor_id} style={{ borderBottom: '1px solid #1f2933' }}>
                  <td style={{ padding: '8px 0', fontFamily: 'monospace', fontSize: 12 }}>
                    <a
                      href={`?actor=${encodeURIComponent(a.actor_id)}`}
                      style={{ color: '#06b6d4', textDecoration: 'none' }}
                    >
                      {a.actor_id}
                    </a>
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'monospace' }}>{a.count}</td>
                  <td
                    style={{
                      padding: '8px 0',
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      color: a.failures > 0 ? '#ef4444' : '#9ca3af',
                    }}
                  >
                    {a.failures}
                  </td>
                </tr>
              ))}
              {data.byActor.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: 16, color: '#6b7280', textAlign: 'center' }}>
                    Aucun ingest sur la période.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ───── Filtres ───── */}
      <section style={{ marginBottom: 16 }}>
        <form
          method="get"
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: '#9ca3af' }}>Kind</span>
            <select
              name="kind"
              defaultValue={data.filters.kind || ''}
              style={{ background: '#151b23', color: '#e5e9f0', border: '1px solid #1f2933', padding: '6px 8px', borderRadius: 4 }}
            >
              <option value="">tous</option>
              <option value="wiki">wiki</option>
              <option value="blog">blog</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: '#9ca3af' }}>Résultat</span>
            <select
              name="result"
              defaultValue={data.filters.result || ''}
              style={{ background: '#151b23', color: '#e5e9f0', border: '1px solid #1f2933', padding: '6px 8px', borderRadius: 4 }}
            >
              <option value="">tous</option>
              <option value="created">created</option>
              <option value="replayed">replayed</option>
              <option value="validation_failed">validation_failed</option>
              <option value="rejected">rejected</option>
              <option value="error">error</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: '#9ca3af' }}>Actor</span>
            <input
              type="text"
              name="actor"
              defaultValue={data.filters.actor || ''}
              placeholder="external:abc123..."
              style={{ background: '#151b23', color: '#e5e9f0', border: '1px solid #1f2933', padding: '6px 8px', borderRadius: 4, width: 260 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: '#9ca3af' }}>Depuis (ISO)</span>
            <input
              type="text"
              name="since"
              defaultValue={data.filters.since || ''}
              placeholder="2026-05-12T00:00:00Z"
              style={{ background: '#151b23', color: '#e5e9f0', border: '1px solid #1f2933', padding: '6px 8px', borderRadius: 4, width: 220 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: '#9ca3af' }}>Limit</span>
            <input
              type="number"
              name="limit"
              defaultValue={data.filters.limit || '50'}
              min="1"
              max="200"
              style={{ background: '#151b23', color: '#e5e9f0', border: '1px solid #1f2933', padding: '6px 8px', borderRadius: 4, width: 80 }}
            />
          </label>
          <button
            type="submit"
            style={{
              background: '#0ea5e9',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              marginTop: 16,
            }}
          >
            Filtrer
          </button>
          {(data.filters.kind || data.filters.result || data.filters.actor || data.filters.since) && (
            <a
              href="?"
              style={{ marginTop: 16, color: '#6b7280', fontSize: 13, textDecoration: 'none' }}
            >
              Réinitialiser
            </a>
          )}
        </form>
      </section>

      {/* ───── Tableau détail ───── */}
      <section
        style={{
          background: '#151b23',
          border: '1px solid #1f2933',
          borderRadius: 8,
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', minWidth: 1100 }}>
          <thead>
            <tr style={{ background: '#0f141a', color: '#9ca3af', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', fontWeight: 500 }}>Date</th>
              <th style={{ padding: '10px 12px', fontWeight: 500 }}>Kind</th>
              <th style={{ padding: '10px 12px', fontWeight: 500 }}>Locale</th>
              <th style={{ padding: '10px 12px', fontWeight: 500 }}>Slug</th>
              <th style={{ padding: '10px 12px', fontWeight: 500 }}>Result</th>
              <th style={{ padding: '10px 12px', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '10px 12px', fontWeight: 500 }}>Error</th>
              <th style={{ padding: '10px 12px', fontWeight: 500, textAlign: 'right' }}>Latence</th>
              <th style={{ padding: '10px 12px', fontWeight: 500, textAlign: 'right' }}>Payload</th>
              <th style={{ padding: '10px 12px', fontWeight: 500 }}>Webhook</th>
              <th style={{ padding: '10px 12px', fontWeight: 500 }}>Actor</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
                  Aucun ingest sur la période / filtres sélectionnés.
                </td>
              </tr>
            )}
            {data.rows.map((r) => (
              <tr key={String(r.id)} style={{ borderTop: '1px solid #1f2933' }}>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#9ca3af' }}>
                  {fmtDate(r.created_at)}
                </td>
                <td style={{ padding: '8px 12px' }}>{r.kind}</td>
                <td style={{ padding: '8px 12px' }}>{r.locale}</td>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{r.slug || '—'}</td>
                <td style={{ padding: '8px 12px', color: resultColor(r.result), fontWeight: 600 }}>
                  {r.result}
                  {r.replayed && <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>(replay)</span>}
                </td>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{r.status_code}</td>
                <td style={{ padding: '8px 12px', color: r.error_code ? '#ef4444' : '#6b7280', fontFamily: 'monospace', fontSize: 11 }}>
                  {r.error_code || '—'}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                  {r.duration_ms ? `${r.duration_ms} ms` : '—'}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#9ca3af' }}>
                  {r.payload_size_bytes ? `${(r.payload_size_bytes / 1024).toFixed(1)} KB` : '—'}
                </td>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11 }}>
                  {r.webhook_status ? (
                    <span
                      style={{
                        color:
                          r.webhook_status === 'success'
                            ? '#10b981'
                            : r.webhook_status === 'failed'
                              ? '#ef4444'
                              : '#9ca3af',
                      }}
                    >
                      {r.webhook_status}
                      {r.webhook_response_code ? ` (${r.webhook_response_code})` : ''}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>
                  <a
                    href={`?actor=${encodeURIComponent(r.actor_id)}`}
                    style={{ color: '#06b6d4', textDecoration: 'none' }}
                  >
                    {r.actor_id.length > 30 ? r.actor_id.slice(0, 30) + '…' : r.actor_id}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer style={{ marginTop: 24, color: '#6b7280', fontSize: 12, textAlign: 'center' }}>
        {data.rows.length} ligne(s) — limite {data.limit}. Page lue en temps réel depuis{' '}
        <code>rdm_audit.external_ingest_log</code>.
      </footer>
    </main>
  )
}
