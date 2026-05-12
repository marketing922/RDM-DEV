import StatusClient from './StatusClient'

export const dynamic = 'force-dynamic'

/**
 * Page status PUBLIQUE — aucune auth requise.
 *
 * À partager avec les partenaires API, équipes ops externes, ou simplement
 * à afficher en tant que page de pilotage. Lit /api/health (qui est lui
 * aussi public) côté client, donc 100% statique côté serveur.
 *
 * À configurer en tant que cible UptimeRobot / BetterUptime :
 *   https://rdm-dev-test.vercel.app/status
 *
 * Pour les checks programmatiques (machine-readable JSON), utiliser :
 *   https://rdm-dev-test.vercel.app/api/health
 */
export default function PublicStatusPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rdm-dev-test.vercel.app'

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
      <header style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: 11,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            margin: '0 0 8px',
          }}
        >
          Les Remèdes de Mamie · API status
        </p>
        <h1 style={{ fontSize: 32, margin: 0, fontWeight: 600, lineHeight: 1.2 }}>
          État des services en temps réel
        </h1>
        <p style={{ color: '#9ca3af', margin: '12px 0 0', fontSize: 14, lineHeight: 1.5 }}>
          Cette page reflète l'état de fonctionnement de l'API d'ingestion partenaire.
          Données rafraîchies automatiquement toutes les 60 secondes. Sources
          machine-readable :{' '}
          <a
            href={`${baseUrl}/api/health`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0ea5e9', textDecoration: 'underline' }}
          >
            /api/health
          </a>
          .
        </p>
      </header>

      <StatusClient healthUrl={`${baseUrl}/api/health`} />

      <footer style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #1f2933', fontSize: 12, color: '#6b7280' }}>
        <p style={{ margin: 0 }}>
          Incident ou question :{' '}
          <a href="mailto:communication@calebasse.com" style={{ color: '#0ea5e9' }}>
            communication@calebasse.com
          </a>
        </p>
        <p style={{ margin: '8px 0 0' }}>
          Mise à jour : ce panneau interroge un endpoint health-check
          public qui inclut la connectivité base de données, la présence des
          variables d'environnement requises et la validation du schéma applicatif.
        </p>
      </footer>
    </main>
  )
}
