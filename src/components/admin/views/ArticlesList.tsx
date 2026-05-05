import React from 'react'
import type { ListViewServerProps } from 'payload'

import ArticlesListClient, { type ArticleRow } from './ArticlesListClient'

const formatFrenchShortDate = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return '—'
  }
}

const resolveAuthor = (a: any): string => {
  if (!a || typeof a !== 'object') return '—'
  const first = (a.firstName ?? '').toString().trim()
  const last = (a.lastName ?? '').toString().trim()
  const full = `${first} ${last}`.trim()
  if (full) return full
  if (a.name) return String(a.name)
  if (a.email) return String(a.email).split('@')[0]
  return '—'
}

const resolveCategory = (c: any): string => {
  if (!c) return '—'
  if (typeof c !== 'object') return '—'
  if (c.name) return String(c.name)
  if (c.title) return String(c.title)
  if (c.label) return String(c.label)
  return '—'
}

const buildRef = (id: unknown): string => {
  const raw = String(id ?? '')
  if (!raw) return 'A-000'
  const tail = raw.slice(-3).padStart(3, '0').toUpperCase()
  return `A-${tail}`
}

const statusLabelFor = (doc: any): string => {
  const s = doc?._status
  if (s === 'published') return 'Publié'
  if (s === 'draft') return 'Brouillon'
  return 'Brouillon'
}

type StatusKey = 'all' | 'published' | 'draft' | 'pending'

const ArticlesList: React.FC<ListViewServerProps> = async (props) => {
  const payload: any =
    (props as any).payload ??
    (props as any).req?.payload ??
    (props as any).initPageResult?.req?.payload ??
    null
  const searchParams: Record<string, any> =
    (props as any).searchParams ?? (props as any).req?.searchParams ?? {}

  const search = String(searchParams?.search ?? '').trim()
  const rawStatus = String(searchParams?.status ?? 'all')
  const status: StatusKey = (['all', 'published', 'draft', 'pending'] as const).includes(
    rawStatus as StatusKey,
  )
    ? (rawStatus as StatusKey)
    : 'all'
  const page = Math.max(1, Number(searchParams?.page) || 1)
  const limit = 20

  const where: any = {}
  if (search) {
    where.or = [
      { title: { contains: search } },
      { excerpt: { contains: search } },
    ]
  }
  if (status === 'published') where._status = { equals: 'published' }
  else if (status === 'draft') where._status = { equals: 'draft' }
  else if (status === 'pending') where.complianceStatus = { equals: 'pending' }

  let docs: any[] = []
  let totalDocs = 0
  let totalPages = 1
  let currentPage = page
  try {
    if (payload) {
      const result = await payload.find({
        collection: 'blogPosts',
        where,
        limit,
        page,
        sort: '-updatedAt',
        depth: 1,
        draft: true,
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

  // Drafts count — independent of current filters
  let draftCount = 0
  try {
    if (payload) {
      const res = await payload.count({
        collection: 'blogPosts',
        where: { _status: { equals: 'draft' } },
        overrideAccess: true,
      })
      draftCount = res?.totalDocs ?? 0
    }
  } catch {
    draftCount = 0
  }

  // Published count
  let publishedCount = 0
  try {
    if (payload) {
      const res = await payload.count({
        collection: 'blogPosts',
        where: { _status: { equals: 'published' } },
        overrideAccess: true,
      })
      publishedCount = res?.totalDocs ?? 0
    }
  } catch {
    publishedCount = 0
  }

  // Publiés sur 30 jours glissants — signal éditorial dérivé du champ
  // publishedAt. Remplace l'ancienne tuile "Lectures · 30j" qui dépendait
  // d'analytics externes non câblés.
  let published30dCount = 0
  try {
    if (payload) {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const res = await payload.count({
        collection: 'blogPosts',
        where: {
          and: [
            { _status: { equals: 'published' } },
            { publishedAt: { greater_than: since } },
          ],
        },
        overrideAccess: true,
      })
      published30dCount = res?.totalDocs ?? 0
    }
  } catch {
    published30dCount = 0
  }

  // Contributors — count distinct authors across all blogPosts.
  // Fallback: grand total if the query fails or yields nothing useful.
  let contributorsCount = 0
  try {
    if (payload) {
      const res = await payload.find({
        collection: 'blogPosts',
        limit: 0,
        pagination: false,
        depth: 0,
        overrideAccess: true,
      })
      const allDocs: any[] = Array.isArray(res?.docs) ? res.docs : []
      const ids = new Set<string>()
      for (const d of allDocs) {
        const a = d?.author
        const id = typeof a === 'object' && a ? a.id : a
        if (id !== undefined && id !== null && id !== '') ids.add(String(id))
      }
      contributorsCount = ids.size
    }
  } catch {
    contributorsCount = 0
  }

  // Grand total (for header sub and fallback) — independent of filters.
  let grandTotal = totalDocs
  try {
    if (payload) {
      const res = await payload.count({
        collection: 'blogPosts',
        overrideAccess: true,
      })
      grandTotal = res?.totalDocs ?? totalDocs
    }
  } catch {
    grandTotal = totalDocs
  }

  if (!contributorsCount) contributorsCount = grandTotal

  const rows: ArticleRow[] = docs.map((doc) => {
    const idStr = String(doc.id ?? '')
    const status = statusLabelFor(doc)
    const date = formatFrenchShortDate(doc?.publishedAt ?? doc?.updatedAt)
    const reading =
      typeof doc?.readingTime === 'number' && doc.readingTime > 0 ? `${doc.readingTime} min` : '—'
    return {
      id: idStr,
      refLabel: buildRef(doc.id),
      title: (doc?.title as string) || 'Sans titre',
      category: resolveCategory(doc?.category),
      authorName: resolveAuthor(doc?.author),
      statusLabel: status,
      dateLabel: date,
      readingLabel: reading,
      href: `/admin/collections/blogPosts/${idStr}`,
    }
  })

  return (
    <ArticlesListClient
      rows={rows}
      totalDocs={totalDocs}
      grandTotal={grandTotal}
      totalPages={totalPages}
      page={currentPage}
      limit={limit}
      draftCount={draftCount}
      publishedCount={publishedCount}
      published30dCount={published30dCount}
      contributorsCount={contributorsCount}
      initialSearch={search}
      initialStatus={status}
    />
  )
}

export default ArticlesList
