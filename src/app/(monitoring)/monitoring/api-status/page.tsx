import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import ApiStatusClient from './ApiStatusClient'

export const dynamic = 'force-dynamic'

/**
 * Page admin de vérification de disponibilité de l'API externe.
 *
 * Ping chacun des endpoints /api/external/v1/* + vérifie la santé des
 * dépendances (BD, secrets configurés, schéma rdm_ai, table de log,
 * extension pgvector). Sert de page de status à partager côté monitoring
 * (UptimeRobot, BetterUptime, etc.) ou à consulter manuellement quand on
 * a un doute sur la disponibilité.
 *
 * Auth admin Payload (cookie).
 */
export default async function ApiStatusPage() {
  const payload = await getPayload({ config: configPromise })
  const reqHeaders = await headers()
  const auth = await payload.auth({ headers: reqHeaders })
  const user = auth?.user as { role?: string } | null
  if (!user || user.role !== 'admin') {
    redirect('/admin/login')
  }

  // Pré-checks côté serveur : visibles dès le 1er render, sans attendre le client
  const checks: {
    label: string
    ok: boolean
    detail?: string
  }[] = []

  // 1. Env vars
  let apiKeysCount = 0
  try {
    const raw = process.env.AI_PIPELINE_API_KEYS || '[]'
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) apiKeysCount = parsed.filter((k) => typeof k === 'string' && k.length > 0).length
  } catch {/* noop */}
  checks.push({
    label: 'AI_PIPELINE_API_KEYS (clés API actives)',
    ok: apiKeysCount > 0,
    detail: `${apiKeysCount} clé${apiKeysCount > 1 ? 's' : ''} configurée${apiKeysCount > 1 ? 's' : ''}`,
  })
  checks.push({
    label: 'AI_PIPELINE_HMAC_SECRET',
    ok: !!(process.env.AI_PIPELINE_HMAC_SECRET && process.env.AI_PIPELINE_HMAC_SECRET.length >= 16),
    detail: process.env.AI_PIPELINE_HMAC_SECRET
      ? `${process.env.AI_PIPELINE_HMAC_SECRET.length} chars`
      : 'manquant — HMAC désactivé, fallback x-api-key',
  })
  checks.push({
    label: 'GEMINI_API_KEY (modération IA)',
    ok: !!process.env.GEMINI_API_KEY,
    detail: process.env.GEMINI_API_KEY ? 'présent' : 'absent — /ingest sera 503',
  })

  // 2. BD : schémas + tables
  const pool = (payload.db as any).pool
  if (pool) {
    try {
      const { rows: schemas } = await pool.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('rdm_ai', 'rdm_audit')`,
      )
      const schemaNames = new Set(schemas.map((r: any) => r.schema_name))
      checks.push({
        label: 'Schéma rdm_ai',
        ok: schemaNames.has('rdm_ai'),
        detail: schemaNames.has('rdm_ai') ? 'présent' : 'manquant — lancer la migration',
      })
      checks.push({
        label: 'Schéma rdm_audit',
        ok: schemaNames.has('rdm_audit'),
        detail: schemaNames.has('rdm_audit') ? 'présent' : 'manquant — lancer la migration',
      })

      const { rows: tables } = await pool.query(
        `SELECT table_schema, table_name FROM information_schema.tables
         WHERE (table_schema = 'rdm_ai' AND table_name IN ('embeddings','rate_limit_buckets','kv_cache','locks','ingest_fingerprints'))
            OR (table_schema = 'rdm_audit' AND table_name IN ('worm_backups','external_ingest_log'))`,
      )
      const tableSet = new Set(tables.map((r: any) => `${r.table_schema}.${r.table_name}`))
      const expected = [
        'rdm_ai.embeddings',
        'rdm_ai.rate_limit_buckets',
        'rdm_ai.kv_cache',
        'rdm_ai.locks',
        'rdm_ai.ingest_fingerprints',
        'rdm_audit.worm_backups',
        'rdm_audit.external_ingest_log',
      ]
      const missing = expected.filter((t) => !tableSet.has(t))
      checks.push({
        label: 'Tables d\'infrastructure',
        ok: missing.length === 0,
        detail: missing.length === 0 ? `${expected.length}/${expected.length} présentes` : `Manquantes : ${missing.join(', ')}`,
      })

      const { rows: ext } = await pool.query(
        `SELECT extname FROM pg_extension WHERE extname = 'vector'`,
      )
      checks.push({
        label: 'Extension pgvector',
        ok: ext.length > 0,
        detail: ext.length > 0 ? 'activée' : 'manquante — CREATE EXTENSION vector',
      })
    } catch (err) {
      checks.push({
        label: 'Connexion BD',
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
    }
  } else {
    checks.push({
      label: 'Pool BD',
      ok: false,
      detail: 'pool indisponible',
    })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://rdm-dev-test.vercel.app'

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0, fontWeight: 600 }}>
          API Status — disponibilité temps réel
        </h1>
        <p style={{ color: '#9ca3af', margin: '4px 0 0', fontSize: 13 }}>
          Vérifie en temps réel la santé de l'API d'ingestion externe :
          dépendances, secrets, endpoints, quotas.
        </p>
        <p style={{ color: '#6b7280', margin: '12px 0 0', fontSize: 12 }}>
          Base URL : <code>{baseUrl}/api/external/v1</code>
        </p>
      </header>

      {/* ─── Pré-checks serveur (sync) ─── */}
      <section
        style={{
          background: '#151b23',
          border: '1px solid #1f2933',
          borderRadius: 8,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 12,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            margin: '0 0 16px',
          }}
        >
          Dépendances & configuration
        </h3>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <tbody>
            {checks.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1f2933' }}>
                <td style={{ padding: '10px 0', width: 24 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: c.ok ? '#10b981' : '#ef4444',
                    }}
                  />
                </td>
                <td style={{ padding: '10px 0', color: '#e5e9f0' }}>{c.label}</td>
                <td
                  style={{
                    padding: '10px 0',
                    color: c.ok ? '#10b981' : '#ef4444',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    textAlign: 'right',
                  }}
                >
                  {c.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ─── Endpoints (client ping) ─── */}
      <ApiStatusClient baseUrl={baseUrl} />
    </main>
  )
}
