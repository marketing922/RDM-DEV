'use client'

import { useEffect, useState } from 'react'

type HealthCheck = {
  status: 'ok' | 'degraded' | 'down'
  checks: Record<string, 'ok' | 'fail' | 'skipped'>
  ts: number
  durationMs: number
}

type FetchState = {
  data: HealthCheck | null
  error: string | null
  lastFetchedAt: Date | null
  loading: boolean
}

const CHECK_LABELS: Record<string, { label: string; description: string }> = {
  db: {
    label: 'Base de données',
    description: 'Connexion Postgres principale',
  },
  env: {
    label: 'Configuration',
    description: 'Variables d\'environnement critiques',
  },
  schema_rdm_ai: {
    label: 'Schéma applicatif',
    description: 'Tables IA / rate-limit / cache',
  },
}

const CHECK_ORDER = ['db', 'env', 'schema_rdm_ai']

type Props = {
  healthUrl: string
}

export default function StatusClient({ healthUrl }: Props) {
  const [state, setState] = useState<FetchState>({
    data: null,
    error: null,
    lastFetchedAt: null,
    loading: true,
  })

  async function fetchHealth() {
    setState((s) => ({ ...s, loading: true }))
    try {
      const res = await fetch(healthUrl, { cache: 'no-store' })
      if (!res.ok && res.status !== 503) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = (await res.json()) as HealthCheck
      setState({ data, error: null, lastFetchedAt: new Date(), loading: false })
    } catch (err) {
      setState({
        data: null,
        error: err instanceof Error ? err.message : String(err),
        lastFetchedAt: new Date(),
        loading: false,
      })
    }
  }

  useEffect(() => {
    fetchHealth()
    const id = setInterval(fetchHealth, 60_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const overall: 'ok' | 'degraded' | 'down' | 'unreachable' =
    state.error ? 'unreachable' :
    !state.data ? 'down' :
    state.data.status

  const overallConfig = {
    ok: {
      label: 'Tous les services opérationnels',
      sublabel: 'Aucun incident en cours.',
      color: '#10b981',
      bg: '#10b98115',
      border: '#10b98155',
    },
    degraded: {
      label: 'Service dégradé',
      sublabel: 'Certains composants ne répondent pas normalement.',
      color: '#f59e0b',
      bg: '#f59e0b15',
      border: '#f59e0b55',
    },
    down: {
      label: 'Service indisponible',
      sublabel: 'L\'API ne répond pas. Une investigation est en cours.',
      color: '#ef4444',
      bg: '#ef444415',
      border: '#ef444455',
    },
    unreachable: {
      label: 'Endpoint de status inaccessible',
      sublabel: 'Impossible de joindre le health-check. Réessayer dans quelques secondes.',
      color: '#6b7280',
      bg: '#6b728015',
      border: '#6b728055',
    },
  }[overall]

  return (
    <>
      {/* ─── Bandeau de statut global ─── */}
      <section
        style={{
          background: overallConfig.bg,
          border: `1px solid ${overallConfig.border}`,
          borderLeft: `4px solid ${overallConfig.color}`,
          borderRadius: 8,
          padding: '24px 28px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: overallConfig.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0b0f14',
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          {overall === 'ok' ? '✓' : overall === 'degraded' ? '!' : '×'}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 4px', color: overallConfig.color, fontWeight: 600 }}>
            {overallConfig.label}
          </h2>
          <p style={{ fontSize: 14, color: '#e5e9f0', margin: 0, opacity: 0.85 }}>
            {overallConfig.sublabel}
          </p>
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', fontFamily: 'monospace' }}>
          {state.lastFetchedAt ? (
            <>
              Mise à jour :<br />
              {state.lastFetchedAt.toLocaleTimeString('fr-FR')}
            </>
          ) : (
            'Chargement…'
          )}
        </div>
      </section>

      {/* ─── Composants individuels ─── */}
      <section
        style={{
          background: '#151b23',
          border: '1px solid #1f2933',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #1f2933',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <h3
            style={{
              fontSize: 12,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              margin: 0,
            }}
          >
            Composants
          </h3>
          {state.data && (
            <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
              health-check exécuté en {state.data.durationMs} ms
            </span>
          )}
        </header>

        {state.error && (
          <div style={{ padding: 24, color: '#fca5a5', fontSize: 13 }}>
            ⚠ Endpoint health-check inatteignable : <code>{state.error}</code>
          </div>
        )}

        {state.data && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {CHECK_ORDER.map((key) => {
              const status = state.data!.checks[key] || 'skipped'
              const meta = CHECK_LABELS[key] || { label: key, description: '' }
              const statusConfig = {
                ok: { color: '#10b981', label: 'Opérationnel' },
                fail: { color: '#ef4444', label: 'Hors service' },
                skipped: { color: '#6b7280', label: 'Non vérifié' },
              }[status]
              return (
                <li
                  key={key}
                  style={{
                    padding: '18px 24px',
                    borderBottom: '1px solid #1f2933',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: statusConfig.color,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: '#e5e9f0', fontWeight: 500 }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {meta.description}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: statusConfig.color,
                      fontWeight: 600,
                      fontFamily: 'monospace',
                    }}
                  >
                    {statusConfig.label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ─── Mini-explainer ─── */}
      <section style={{ marginTop: 32, fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>
        <p style={{ margin: '0 0 12px' }}>
          <strong style={{ color: '#e5e9f0' }}>Légende des statuts :</strong>
        </p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            <span style={{ color: '#10b981' }}>● Opérationnel</span> — service répond
            normalement
          </li>
          <li>
            <span style={{ color: '#f59e0b' }}>● Dégradé</span> — fonctionne mais avec des
            limitations
          </li>
          <li>
            <span style={{ color: '#ef4444' }}>● Hors service</span> — service inaccessible
          </li>
          <li>
            <span style={{ color: '#6b7280' }}>● Non vérifié</span> — check sauté
            (dépendance amont indisponible)
          </li>
        </ul>
      </section>
    </>
  )
}
