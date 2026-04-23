import React from 'react'
import { unstable_cache } from 'next/cache'
import type { AdminViewServerProps } from 'payload'

import DashboardClient, {
  type ActivityItem,
  type DashboardData,
  type QueueItem,
} from './DashboardClient'
import { loadSiteSettings } from '@/lib/siteSettings'

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

const actionVerbs: Record<string, string> = {
  create: 'a publié',
  update: 'a mis à jour',
  delete: 'a archivé',
}

const formatHM = (iso: string): string => {
  try {
    const d = new Date(iso)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  } catch {
    return ''
  }
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

const resolveUserName = (u: any): string => {
  if (!u) return 'Système'
  if (typeof u !== 'object') return 'Système'
  const first = (u.firstName ?? '').toString().trim()
  const last = (u.lastName ?? '').toString().trim()
  const full = `${first} ${last}`.trim()
  if (full) return full
  if (u.name) return String(u.name)
  if (u.email) return String(u.email).split('@')[0]
  return 'Système'
}

const resolveAuthorName = (a: any): string => {
  if (!a || typeof a !== 'object') return 'Auteur inconnu'
  if (a.name) return String(a.name)
  const first = (a.firstName ?? '').toString().trim()
  const last = (a.lastName ?? '').toString().trim()
  const full = `${first} ${last}`.trim()
  if (full) return full
  if (a.email) return String(a.email).split('@')[0]
  return 'Auteur inconnu'
}

const buildGreeting = (userName: string | undefined): string => {
  const now = new Date()
  const day = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const capitalized = day.charAt(0).toUpperCase() + day.slice(1)
  const first = (userName ?? '').split(' ')[0] || 'Marie'
  return `${capitalized} · bonjour ${first}`
}

const getDashboardCounts = (payload: any) =>
  unstable_cache(
    async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const pendingWhere = {
        or: [
          { _status: { equals: 'draft' } },
          { complianceStatus: { equals: 'pending' } },
        ],
      }
      const stalePendingWhere = {
        and: [
          {
            or: [
              { _status: { equals: 'draft' } },
              { complianceStatus: { equals: 'pending' } },
            ],
          },
          { updatedAt: { less_than: sevenDaysAgo } },
        ],
      }
      const newContentWhere = {
        and: [
          { _status: { equals: 'published' } },
          { updatedAt: { greater_than: thirtyDaysAgo } },
        ],
      }

      const [
        publishedPlantsWeek,
        publishedArticlesWeek,
        pendingPlants,
        pendingArticles,
        pendingBenefits,
        stalePendingPlants,
        stalePendingArticles,
        stalePendingBenefits,
        newPlants30d,
        newArticles30d,
        newBenefits30d,
        newProducts30d,
      ] = await Promise.all([
        payload
          .count({
            collection: 'wikiEntries',
            where: {
              _status: { equals: 'published' },
              updatedAt: { greater_than: sevenDaysAgo },
            },
          })
          .catch(() => ({ totalDocs: 0 })),
        payload
          .count({
            collection: 'blogPosts',
            where: {
              _status: { equals: 'published' },
              updatedAt: { greater_than: sevenDaysAgo },
            },
          })
          .catch(() => ({ totalDocs: 0 })),
        payload
          .count({ collection: 'wikiEntries', where: pendingWhere })
          .catch(() => ({ totalDocs: 0 })),
        payload
          .count({ collection: 'blogPosts', where: pendingWhere })
          .catch(() => ({ totalDocs: 0 })),
        payload
          .count({ collection: 'benefits', where: pendingWhere })
          .catch(() => ({ totalDocs: 0 })),
        payload
          .count({ collection: 'wikiEntries', where: stalePendingWhere })
          .catch(() => ({ totalDocs: 0 })),
        payload
          .count({ collection: 'blogPosts', where: stalePendingWhere })
          .catch(() => ({ totalDocs: 0 })),
        payload
          .count({ collection: 'benefits', where: stalePendingWhere })
          .catch(() => ({ totalDocs: 0 })),
        payload
          .count({ collection: 'wikiEntries', where: newContentWhere })
          .catch(() => ({ totalDocs: 0 })),
        payload
          .count({ collection: 'blogPosts', where: newContentWhere })
          .catch(() => ({ totalDocs: 0 })),
        payload
          .count({ collection: 'benefits', where: newContentWhere })
          .catch(() => ({ totalDocs: 0 })),
        payload
          .count({ collection: 'products', where: newContentWhere })
          .catch(() => ({ totalDocs: 0 })),
      ])

      return {
        publishedPlantsWeek: publishedPlantsWeek.totalDocs ?? 0,
        publishedArticlesWeek: publishedArticlesWeek.totalDocs ?? 0,
        pendingPlants: pendingPlants.totalDocs ?? 0,
        pendingArticles: pendingArticles.totalDocs ?? 0,
        pendingBenefits: pendingBenefits.totalDocs ?? 0,
        stalePendingPlants: stalePendingPlants.totalDocs ?? 0,
        stalePendingArticles: stalePendingArticles.totalDocs ?? 0,
        stalePendingBenefits: stalePendingBenefits.totalDocs ?? 0,
        newPlants30d: newPlants30d.totalDocs ?? 0,
        newArticles30d: newArticles30d.totalDocs ?? 0,
        newBenefits30d: newBenefits30d.totalDocs ?? 0,
        newProducts30d: newProducts30d.totalDocs ?? 0,
      }
    },
    ['dashboard-counts-v3'],
    { revalidate: 60 },
  )()

type QueueCollection = 'wikiEntries' | 'blogPosts' | 'benefits'

const fetchQueueFor = async (
  payload: any,
  collection: QueueCollection,
): Promise<Array<QueueItem & { _updatedAt: string }>> => {
  const pendingWhere = {
    or: [
      { _status: { equals: 'draft' } },
      { complianceStatus: { equals: 'pending' } },
    ],
  }
  const res = await payload
    .find({
      collection,
      where: pendingWhere,
      limit: 3,
      depth: 1,
      sort: '-updatedAt',
    })
    .catch(() => ({ docs: [] as any[] }))

  return (res.docs as any[]).map((doc) => {
    const title = doc.name || doc.title || `Document ${doc.id}`
    const author = resolveAuthorName(doc.author)
    const isPending = doc.complianceStatus === 'pending'
    const action = isPending ? 'à relire' : 'en rédaction'
    const updatedAt = doc.updatedAt || doc.createdAt || new Date().toISOString()
    return {
      id: String(doc.id),
      collection,
      title: String(title),
      author,
      action,
      time: formatRelative(updatedAt),
      href: `/admin/collections/${collection}/${doc.id}`,
      _updatedAt: updatedAt,
    }
  })
}

const Dashboard: React.FC<AdminViewServerProps> = async ({ initPageResult }) => {
  const { req } = initPageResult
  const { payload, user } = req

  const [counts, auditRes, queuePlants, queueArticles, queueBenefits, settings] =
    await Promise.all([
      getDashboardCounts(payload),
      payload
        .find({
          collection: 'auditLog',
          sort: '-timestamp',
          limit: 5,
          depth: 1,
        })
        .catch(() => ({ docs: [] as any[] })),
      fetchQueueFor(payload, 'wikiEntries'),
      fetchQueueFor(payload, 'blogPosts'),
      fetchQueueFor(payload, 'benefits'),
      loadSiteSettings(payload).catch(() => null),
    ])

  const mergedQueue: QueueItem[] = [...queuePlants, ...queueArticles, ...queueBenefits]
    .sort((a, b) => new Date(b._updatedAt).getTime() - new Date(a._updatedAt).getTime())
    .slice(0, 5)
    .map(({ _updatedAt: _omit, ...rest }) => rest)

  const activity: ActivityItem[] = ((auditRes as any).docs as any[]).map((doc) => {
    const collLabel = collectionLabels[doc.collection] ?? doc.collection ?? 'Document'
    const verb = actionVerbs[doc.action] ?? 'a modifié'
    const who = resolveUserName(doc.user)
    const afterTitle =
      (doc.after && (doc.after.name || doc.after.title)) ||
      (doc.before && (doc.before.name || doc.before.title)) ||
      null
    const target = afterTitle
      ? `${collLabel.toLowerCase()} "${afterTitle}"`
      : `${collLabel.toLowerCase()} ${doc.documentId ? `#${String(doc.documentId).slice(0, 6)}` : ''}`.trim()
    return {
      id: String(doc.id),
      time: doc.timestamp ? formatHM(doc.timestamp) : '',
      who,
      verb,
      target,
    }
  })

  const userName = resolveUserName(user)
  const pendingTotal =
    counts.pendingPlants + counts.pendingArticles + counts.pendingBenefits
  const urgentPending =
    counts.stalePendingPlants +
    counts.stalePendingArticles +
    counts.stalePendingBenefits

  const newTotal30d =
    counts.newPlants30d +
    counts.newArticles30d +
    counts.newBenefits30d +
    counts.newProducts30d

  const newsletterProvider = settings?.newsletter?.provider ?? 'none'
  const newsletterListId = settings?.newsletter?.listId ?? ''
  const newsletterConfigured =
    newsletterProvider === 'brevo' && Boolean(newsletterListId)

  const data: DashboardData = {
    userName,
    greeting: buildGreeting(userName),
    publishedWeek: {
      total: counts.publishedPlantsWeek + counts.publishedArticlesWeek,
      plants: counts.publishedPlantsWeek,
      articles: counts.publishedArticlesWeek,
      href: '/admin/collections/blogPosts?where[_status][equals]=published&limit=25&sort=-updatedAt',
    },
    pendingReview: {
      total: pendingTotal,
      urgent: urgentPending,
      href: '/admin/collections/blogPosts?where[_status][equals]=draft&sort=-updatedAt',
    },
    newContent30d: {
      total: newTotal30d,
      plants: counts.newPlants30d,
      articles: counts.newArticles30d,
      products: counts.newProducts30d,
      href: '/admin/collections/blogPosts?sort=-updatedAt&limit=25',
    },
    newsletter: {
      provider: newsletterProvider,
      listId: newsletterListId || undefined,
      configured: newsletterConfigured,
      href: '/admin/settings#settings-newsletter',
    },
    queue: mergedQueue,
    activity,
  }

  return <DashboardClient data={data} />
}

export default Dashboard
