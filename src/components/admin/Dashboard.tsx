import React from 'react'
import type { AdminViewServerProps } from 'payload'

import DashboardClient, { type ActivityItem } from './DashboardClient'

const collectionLabels: Record<string, string> = {
  wikiEntries: 'Plante',
  benefits: 'Bienfait',
  blogPosts: 'Article',
  products: 'Produit',
  pages: 'Page',
  media: 'Média',
  authors: 'Auteur',
  categories: 'Catégorie',
  tags: 'Tag',
  users: 'Utilisateur',
}

const actionLabels: Record<string, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
}

const formatRelative = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

const Dashboard: React.FC<AdminViewServerProps> = async ({ initPageResult }) => {
  const { req } = initPageResult
  const { payload, user } = req

  const [plants, benefits, articles, products, audit] = await Promise.all([
    payload.count({ collection: 'wikiEntries' }).catch(() => ({ totalDocs: 0 })),
    payload.count({ collection: 'benefits' }).catch(() => ({ totalDocs: 0 })),
    payload.count({ collection: 'blogPosts' }).catch(() => ({ totalDocs: 0 })),
    payload.count({ collection: 'products' }).catch(() => ({ totalDocs: 0 })),
    payload
      .find({
        collection: 'auditLog',
        sort: '-timestamp',
        limit: 5,
        depth: 1,
      })
      .catch(() => ({ docs: [] as any[] })),
  ])

  const activities: ActivityItem[] = (audit as any).docs.map((doc: any) => {
    const collLabel = collectionLabels[doc.collection] ?? doc.collection ?? 'Document'
    const actLabel = actionLabels[doc.action] ?? doc.action ?? 'Action'
    const userName =
      (doc.user && typeof doc.user === 'object' && (doc.user.name || doc.user.email)) ||
      'Système'
    return {
      id: String(doc.id),
      type: `${actLabel} · ${collLabel}`,
      description: doc.documentId ? `Document ${doc.documentId}` : 'Action enregistrée',
      timestamp: doc.timestamp ? formatRelative(doc.timestamp) : '',
      user: userName,
    }
  })

  const userName =
    (user && ((user as any).name || (user as any).email?.split('@')[0])) || undefined

  return (
    <DashboardClient
      counts={{
        plants: (plants as any).totalDocs ?? 0,
        benefits: (benefits as any).totalDocs ?? 0,
        articles: (articles as any).totalDocs ?? 0,
        products: (products as any).totalDocs ?? 0,
      }}
      activities={activities}
      userName={userName}
    />
  )
}

export default Dashboard
