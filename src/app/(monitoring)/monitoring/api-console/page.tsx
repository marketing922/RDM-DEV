import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import ApiConsoleClient from './ApiConsoleClient'

export const dynamic = 'force-dynamic'

/**
 * Page admin pour tester les endpoints de l'API externe /api/external/v1/*
 * depuis le navigateur. Fournit :
 *   - Sélecteur d'endpoint (schema, taxonomy, plants, benefits, products,
 *     validate, ingest, ingest-log)
 *   - Body templates pré-remplis pour les POST
 *   - Calcul auto de la signature HMAC côté serveur (la clé HMAC ne quitte
 *     pas le serveur ; le client envoie le body en clair, on signe et on
 *     forward)
 *   - Affichage de la réponse avec status, durée, headers de throttling
 *
 * Auth : session admin Payload (cookie). Pas d'API key requise puisque
 * le serveur lit AI_PIPELINE_API_KEYS pour signer lui-même.
 */
export default async function ApiConsolePage() {
  const payload = await getPayload({ config: configPromise })
  const reqHeaders = await headers()
  const auth = await payload.auth({ headers: reqHeaders })
  const user = auth?.user as { role?: string } | null
  if (!user || user.role !== 'admin') {
    redirect('/admin/login')
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0, fontWeight: 600 }}>
          API Console — /api/external/v1/*
        </h1>
        <p style={{ color: '#9ca3af', margin: '4px 0 0', fontSize: 13 }}>
          Outil de test interactif pour valider les payloads avant transmission
          au partenaire. La clé API et le secret HMAC sont injectés côté serveur
          — vous ne les manipulez pas ici.
        </p>
        <p style={{ color: '#6b7280', margin: '12px 0 0', fontSize: 12 }}>
          Base URL : <code>{baseUrl || '<NEXT_PUBLIC_SITE_URL manquante>'}/api/external/v1</code>
        </p>
      </header>

      <ApiConsoleClient />
    </main>
  )
}
