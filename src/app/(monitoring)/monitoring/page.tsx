import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const TILES = [
  {
    href: '/monitoring/api-status',
    title: 'API Status',
    description:
      'Vérification temps réel de la disponibilité des 7 endpoints /api/external/v1/*. Dépendances, secrets, quotas. Auto-refresh 30s disponible.',
    badge: 'Health-check',
    color: '#10b981',
  },
  {
    href: '/monitoring/api-console',
    title: 'API Console',
    description:
      'Console interactive pour tester les payloads d\'ingest depuis le navigateur, sans manipuler la clé API ni le HMAC secret. Templates wiki + blog pré-remplis.',
    badge: 'Testing',
    color: '#0ea5e9',
  },
  {
    href: '/monitoring/ingest-log',
    title: 'Ingest Log',
    description:
      'Dashboard d\'observabilité — KPI (total, succès, échecs, latence), breakdown par résultat, top 10 partenaires, tableau détail filtrable.',
    badge: 'Observability',
    color: '#a855f7',
  },
]

export default async function MonitoringIndexPage() {
  const payload = await getPayload({ config: configPromise })
  const reqHeaders = await headers()
  const auth = await payload.auth({ headers: reqHeaders })
  const user = auth?.user as { role?: string } | null
  if (!user || user.role !== 'admin') {
    redirect('/admin/login')
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, margin: 0, fontWeight: 600 }}>
          Monitoring — API externe
        </h1>
        <p style={{ color: '#9ca3af', margin: '8px 0 0', fontSize: 14 }}>
          Outils de supervision et de test de l'API d'ingestion partenaire
          (<code>/api/external/v1/*</code>).
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            style={{
              display: 'block',
              textDecoration: 'none',
              background: '#151b23',
              border: '1px solid #1f2933',
              borderRadius: 8,
              padding: 24,
              color: '#e5e9f0',
              transition: 'border-color 0.15s, transform 0.15s',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                fontSize: 10,
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: tile.color,
                border: `1px solid ${tile.color}66`,
                background: `${tile.color}15`,
                padding: '3px 8px',
                borderRadius: 3,
                marginBottom: 16,
              }}
            >
              {tile.badge}
            </div>
            <h2 style={{ fontSize: 20, margin: '0 0 8px', fontWeight: 600 }}>{tile.title}</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>
              {tile.description}
            </p>
            <div style={{ marginTop: 16, fontSize: 12, color: tile.color, fontFamily: 'monospace' }}>
              {tile.href} →
            </div>
          </Link>
        ))}
      </section>

      <footer style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #1f2933', fontSize: 12, color: '#6b7280' }}>
        <p style={{ margin: 0 }}>
          Pour le monitoring public unauthenticated (UptimeRobot, BetterUptime),
          utilise <code>/api/health</code>. Pour la documentation à transmettre
          au partenaire, voir <code>Documentation/api-access-partner.md</code>.
        </p>
      </footer>
    </main>
  )
}
