import React from 'react'
import type { ListViewServerProps } from 'payload'

import SitePagesListClient, { type SitePageRow } from './SitePagesListClient'

const formatRelative = (iso: string): string => {
  try {
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
  } catch {
    return ''
  }
}

// Human-readable labels for the 9 locked slugs. Kept in sync with the
// `slug` select options of the sitePages collection.
export const SITE_PAGE_SLUGS: Record<string, string> = {
  'a-propos': 'À propos',
  contact: 'Contact',
  faq: 'FAQ',
  cgv: 'CGV',
  'mentions-legales': 'Mentions légales',
  'politique-confidentialite': 'Politique de confidentialité',
  'politique-cookies': 'Politique cookies',
  'avertissement-sante': 'Avertissement santé',
  accessibilite: 'Accessibilité',
}

const TOTAL_SLOTS = 9

type StatusKey = 'all' | 'published' | 'draft'

const SitePagesList: React.FC<ListViewServerProps> = async (props) => {
  const payload: any =
    (props as any).payload ?? (props as any).req?.payload ?? null
  const searchParams: Record<string, any> =
    (props as any).searchParams ?? (props as any).req?.searchParams ?? {}

  const search = String(searchParams?.search ?? '').trim()
  const rawStatus = String(searchParams?.status ?? 'all')
  const status: StatusKey = (['all', 'published', 'draft'] as const).includes(
    rawStatus as StatusKey,
  )
    ? (rawStatus as StatusKey)
    : 'all'
  const page = Math.max(1, Number(searchParams?.page) || 1)
  const limit = 20

  const where: any = {}
  if (search) {
    where.title = { contains: search }
  }
  if (status === 'published') where._status = { equals: 'published' }
  else if (status === 'draft') where._status = { equals: 'draft' }

  let docs: any[] = []
  let totalDocs = 0
  let totalPages = 1
  let currentPage = page
  try {
    if (payload) {
      const result = await payload.find({
        collection: 'sitePages',
        where,
        limit,
        page,
        sort: '-updatedAt',
        depth: 0,
        overrideAccess: true,
      })
      docs = Array.isArray(result?.docs) ? result.docs : []
      totalDocs = typeof result?.totalDocs === 'number' ? result.totalDocs : docs.length
      totalPages =
        typeof result?.totalPages === 'number' && result.totalPages > 0 ? result.totalPages : 1
      currentPage = typeof result?.page === 'number' ? result.page : page
    } else {
      const data: any = (props as any).data
      docs = Array.isArray(data?.docs) ? data.docs : []
      totalDocs = typeof data?.totalDocs === 'number' ? data.totalDocs : docs.length
      totalPages = typeof data?.totalPages === 'number' ? data.totalPages : 1
      currentPage = typeof data?.page === 'number' ? data.page : 1
    }
  } catch {
    docs = []
    totalDocs = 0
    totalPages = 1
  }

  // Published count — independent of active filters
  let publishedCount = 0
  try {
    if (payload) {
      const res = await payload.count({
        collection: 'sitePages',
        where: { _status: { equals: 'published' } },
        overrideAccess: true,
      })
      publishedCount = res?.totalDocs ?? 0
    }
  } catch {
    publishedCount = 0
  }

  // Drafts count
  let draftsCount = 0
  try {
    if (payload) {
      const res = await payload.count({
        collection: 'sitePages',
        where: { _status: { equals: 'draft' } },
        overrideAccess: true,
      })
      draftsCount = res?.totalDocs ?? 0
    }
  } catch {
    draftsCount = 0
  }

  // Total (unfiltered) — should be <= 9
  let totalAll = 0
  try {
    if (payload) {
      const res = await payload.count({
        collection: 'sitePages',
        overrideAccess: true,
      })
      totalAll = res?.totalDocs ?? 0
    } else {
      totalAll = totalDocs
    }
  } catch {
    totalAll = totalDocs
  }

  // Unfiltered list of configured slugs — used by the checklist so that it
  // always reflects the global state, independently of search/status filters.
  let allConfigured: Array<{ slug: string; statusLabel: string; href: string }> = []
  try {
    if (payload) {
      const res = await payload.find({
        collection: 'sitePages',
        where: {},
        limit: 50,
        depth: 0,
        overrideAccess: true,
      })
      const all = Array.isArray(res?.docs) ? res.docs : []
      allConfigured = all
        .map((d: any) => {
          const slug = d?.slug ? String(d.slug) : ''
          if (!slug) return null
          const idStr = String(d.id ?? '')
          const statusLabel =
            d._status === 'published'
              ? 'Publié'
              : d._status === 'draft'
                ? 'Brouillon'
                : 'Publié'
          return { slug, statusLabel, href: `/admin/collections/sitePages/${idStr}` }
        })
        .filter(
          (x: any): x is { slug: string; statusLabel: string; href: string } => Boolean(x),
        )
    }
  } catch {
    allConfigured = []
  }

  const rows: SitePageRow[] = docs.map((doc) => {
    const idStr = String(doc.id ?? '')
    const ref = idStr ? `S-${idStr.slice(-3).toUpperCase()}` : 'S-???'
    const statusLabel =
      doc._status === 'published' ? 'Publié' : doc._status === 'draft' ? 'Brouillon' : 'Publié'
    const updatedAt = doc.updatedAt || doc.createdAt || new Date().toISOString()
    const slug = doc.slug ? String(doc.slug) : ''
    const slugLabel = SITE_PAGE_SLUGS[slug] || slug || '(slug manquant)'
    return {
      id: idStr,
      ref,
      title: doc.title ? String(doc.title) : '(sans titre)',
      slug,
      slugLabel,
      statusLabel,
      updatedLabel: formatRelative(updatedAt),
      href: `/admin/collections/sitePages/${idStr}`,
    }
  })

  return (
    <SitePagesListClient
      rows={rows}
      allConfigured={allConfigured}
      totalDocs={totalDocs}
      totalPages={totalPages}
      page={currentPage}
      limit={limit}
      publishedCount={publishedCount}
      draftsCount={draftsCount}
      totalAll={totalAll}
      totalSlots={TOTAL_SLOTS}
      initialSearch={search}
      initialStatus={status}
    />
  )
}

export default SitePagesList
