'use client'

import { useEffect, useState } from 'react'

type EndpointSpec = {
  path: string
  method: 'GET' | 'POST'
  expectedStatus: number[]
  description: string
  optional?: boolean
}

const ENDPOINTS: EndpointSpec[] = [
  {
    path: '/schema',
    method: 'GET',
    expectedStatus: [200],
    description: 'Contrat self-documented',
  },
  {
    path: '/taxonomy',
    method: 'GET',
    expectedStatus: [200],
    description: 'Slugs valides (categories, tags, plants, benefits, products)',
  },
  {
    path: '/plants?limit=1',
    method: 'GET',
    expectedStatus: [200],
    description: 'Catalogue plantes',
  },
  {
    path: '/benefits?limit=1',
    method: 'GET',
    expectedStatus: [200],
    description: 'Catalogue bienfaits',
  },
  {
    path: '/products?limit=1',
    method: 'GET',
    expectedStatus: [200],
    description: 'Catalogue produits',
  },
  {
    path: '/ingest-log?limit=1',
    method: 'GET',
    expectedStatus: [200],
    description: 'Historique des ingests partenaire',
  },
  {
    path: '/validate',
    method: 'POST',
    expectedStatus: [400], // body vide → 400 attendu (validation_failed), pas une erreur d'auth
    description: 'Dry-run (body vide → doit retourner 400 validation_failed)',
  },
]

type PingResult = {
  path: string
  method: string
  status: 'pending' | 'ok' | 'fail'
  httpStatus?: number
  durationMs?: number
  message?: string
  rateLimitHour?: string
  rateLimitDay?: string
  aiBudgetRemaining?: string
}

async function pingEndpoint(ep: EndpointSpec): Promise<PingResult> {
  const started = Date.now()
  try {
    const res = await fetch('/api/admin/api-console-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: ep.path,
        method: ep.method,
        body: ep.method === 'POST' ? '' : null,
      }),
    })
    const json = await res.json()
    const httpStatus = json.upstreamStatus ?? res.status
    const ok = ep.expectedStatus.includes(httpStatus)
    const headers = (json.upstreamHeaders || {}) as Record<string, string>

    return {
      path: ep.path,
      method: ep.method,
      status: ok ? 'ok' : 'fail',
      httpStatus,
      durationMs: Date.now() - started,
      message: ok
        ? 'OK'
        : `Attendu ${ep.expectedStatus.join('/')}, reçu ${httpStatus}`,
      rateLimitHour: headers['x-rdm-ratelimit-remaining-hour'],
      rateLimitDay: headers['x-rdm-ratelimit-remaining-day'],
      aiBudgetRemaining: headers['x-rdm-ai-budget-remaining'],
    }
  } catch (err) {
    return {
      path: ep.path,
      method: ep.method,
      status: 'fail',
      durationMs: Date.now() - started,
      message: err instanceof Error ? err.message : String(err),
    }
  }
}

type Props = {
  baseUrl: string
}

export default function ApiStatusClient({ baseUrl }: Props) {
  const [results, setResults] = useState<PingResult[]>(
    ENDPOINTS.map((ep) => ({
      path: ep.path,
      method: ep.method,
      status: 'pending' as const,
    })),
  )
  const [running, setRunning] = useState(false)
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  async function runAll() {
    setRunning(true)
    const next = [...results]
    // Reset à pending
    for (let i = 0; i < ENDPOINTS.length; i++) {
      next[i] = { path: ENDPOINTS[i].path, method: ENDPOINTS[i].method, status: 'pending' }
    }
    setResults([...next])

    // Ping séquentiellement pour ne pas saturer le rate-limit (et avoir
    // une UX progressive : on voit chaque ligne se mettre à jour).
    for (let i = 0; i < ENDPOINTS.length; i++) {
      const r = await pingEndpoint(ENDPOINTS[i])
      next[i] = r
      setResults([...next])
    }
    setRunning(false)
    setLastRunAt(new Date())
  }

  // Premier run au montage
  useEffect(() => {
    runAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh toutes les 30s si activé
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => {
      if (!running) runAll()
    }, 30_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, running])

  const okCount = results.filter((r) => r.status === 'ok').length
  const failCount = results.filter((r) => r.status === 'fail').length
  const pendingCount = results.filter((r) => r.status === 'pending').length

  // Récupère le dernier set de headers throttling vu pour afficher les quotas
  const lastWithBudget = [...results].reverse().find((r) => r.aiBudgetRemaining)

  return (
    <section
      style={{
        background: '#151b23',
        border: '1px solid #1f2933',
        borderRadius: 8,
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 16,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 12,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              margin: '0 0 4px',
            }}
          >
            Endpoints — disponibilité
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#e5e9f0' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>{okCount}</span> OK
            {' · '}
            <span style={{ color: failCount > 0 ? '#ef4444' : '#9ca3af', fontWeight: 600 }}>
              {failCount}
            </span>{' '}
            KO
            {pendingCount > 0 && (
              <>
                {' · '}
                <span style={{ color: '#f59e0b' }}>{pendingCount} en cours</span>
              </>
            )}
            {lastRunAt && (
              <span style={{ marginLeft: 12, color: '#6b7280', fontSize: 12 }}>
                dernier run : {lastRunAt.toLocaleTimeString('fr-FR')}
              </span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh 30 s
          </label>
          <button
            onClick={runAll}
            disabled={running}
            style={{
              background: '#0ea5e9',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: running ? 'wait' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              opacity: running ? 0.6 : 1,
            }}
          >
            {running ? 'Run…' : '↻ Relancer'}
          </button>
        </div>
      </div>

      {/* Quotas actuels */}
      {lastWithBudget && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 16,
            padding: 12,
            background: '#0b0f14',
            border: '1px solid #1f2933',
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          <div>
            <span style={{ color: '#9ca3af' }}>Budget IA restant : </span>
            <span style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: 600 }}>
              {parseFloat(lastWithBudget.aiBudgetRemaining || '0').toFixed(2)} €
            </span>
          </div>
          {lastWithBudget.rateLimitHour && (
            <div>
              <span style={{ color: '#9ca3af' }}>Rate-limit (h) : </span>
              <span style={{ color: '#06b6d4', fontFamily: 'monospace', fontWeight: 600 }}>
                {lastWithBudget.rateLimitHour}/30
              </span>
            </div>
          )}
          {lastWithBudget.rateLimitDay && (
            <div>
              <span style={{ color: '#9ca3af' }}>Rate-limit (jour) : </span>
              <span style={{ color: '#06b6d4', fontFamily: 'monospace', fontWeight: 600 }}>
                {lastWithBudget.rateLimitDay}/200
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tableau endpoints */}
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: '#6b7280', textAlign: 'left' }}>
            <th style={{ padding: '8px 0', fontWeight: 500, width: 24 }}></th>
            <th style={{ padding: '8px 0', fontWeight: 500, width: 70 }}>Method</th>
            <th style={{ padding: '8px 0', fontWeight: 500 }}>Endpoint</th>
            <th style={{ padding: '8px 0', fontWeight: 500 }}>Description</th>
            <th style={{ padding: '8px 0', fontWeight: 500, textAlign: 'right' }}>HTTP</th>
            <th style={{ padding: '8px 0', fontWeight: 500, textAlign: 'right' }}>Latence</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => {
            const ep = ENDPOINTS[i]
            return (
              <tr key={r.path} style={{ borderTop: '1px solid #1f2933' }}>
                <td style={{ padding: '10px 0' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background:
                        r.status === 'ok'
                          ? '#10b981'
                          : r.status === 'fail'
                            ? '#ef4444'
                            : '#f59e0b',
                    }}
                  />
                </td>
                <td style={{ padding: '10px 0' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontFamily: 'monospace',
                      background: r.method === 'GET' ? '#1e3a5f' : '#5b2c2c',
                      color: r.method === 'GET' ? '#7dd3fc' : '#fca5a5',
                      padding: '1px 6px',
                      borderRadius: 3,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {r.method}
                  </span>
                </td>
                <td style={{ padding: '10px 0', fontFamily: 'monospace', fontSize: 12 }}>
                  {r.path}
                </td>
                <td style={{ padding: '10px 0', color: '#9ca3af' }}>{ep.description}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                  {r.httpStatus ? (
                    <span
                      style={{
                        color:
                          r.status === 'ok'
                            ? '#10b981'
                            : '#ef4444',
                      }}
                    >
                      {r.httpStatus}
                    </span>
                  ) : (
                    <span style={{ color: '#f59e0b' }}>…</span>
                  )}
                </td>
                <td
                  style={{
                    padding: '10px 0',
                    textAlign: 'right',
                    fontFamily: 'monospace',
                    color: '#9ca3af',
                  }}
                >
                  {r.durationMs ? `${r.durationMs} ms` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Détail des erreurs */}
      {failCount > 0 && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: '#5b2c2c22',
            border: '1px solid #5b2c2c',
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          <p style={{ margin: '0 0 6px', color: '#fca5a5', fontWeight: 600 }}>Endpoints KO :</p>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#fca5a5' }}>
            {results
              .filter((r) => r.status === 'fail')
              .map((r) => (
                <li key={r.path} style={{ marginBottom: 4 }}>
                  <code>{r.method} {r.path}</code> — {r.message}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Footer info */}
      <p style={{ marginTop: 16, fontSize: 11, color: '#6b7280' }}>
        Endpoints testés sur <code>{baseUrl}/api/external/v1/*</code>. Auth automatique
        (clé API + HMAC injectés côté serveur via /api/admin/api-console-proxy).
        Pour un monitoring externe public (UptimeRobot, BetterUptime), utiliser{' '}
        <code>{baseUrl}/api/health</code> qui est unauthenticated.
      </p>
    </section>
  )
}
