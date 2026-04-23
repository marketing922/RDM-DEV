import React from 'react'
import type { ListViewServerProps } from 'payload'

import PlantsListClient, { type PlantRow } from './PlantsListClient'

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

const resolveAuthorName = (a: any): { name: string; initials: string } => {
  if (!a || typeof a !== 'object') return { name: '—', initials: '' }
  const first = (a.firstName ?? '').toString().trim()
  const last = (a.lastName ?? '').toString().trim()
  const full = `${first} ${last}`.trim()
  const name = full || (a.name ? String(a.name) : a.email ? String(a.email).split('@')[0] : '—')
  const initials = (first[0] || name[0] || '').toUpperCase() + (last[0] || '').toUpperCase()
  return { name, initials: initials || '—' }
}

const resolveCategory = (doc: any): string => {
  // wikiEntries has no explicit `category` field at this time; if benefits are
  // populated, use the first benefit's name as a soft category hint.
  const benefits = doc.benefits
  if (Array.isArray(benefits) && benefits.length > 0) {
    const first = benefits[0]
    if (first && typeof first === 'object' && first.name) return String(first.name)
  }
  if (doc.family) return String(doc.family)
  return '—'
}

type StatusKey = 'all' | 'published' | 'draft' | 'pending'

const PlantsList: React.FC<ListViewServerProps> = async (props) => {
  const payload: any =
    (props as any).payload ?? (props as any).req?.payload ?? null
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
      { name: { contains: search } },
      { latinName: { contains: search } },
    ]
  }
  if (status === 'published') where._status = { equals: 'published' }
  else if (status === 'draft') where._status = { equals: 'draft' }
  else if (status === 'pending') where.complianceStatus = { equals: 'pending' }

  // Query the collection using the searchParams filters.
  let docs: any[] = []
  let totalDocs = 0
  let totalPages = 1
  let currentPage = page
  try {
    if (payload) {
      const result = await payload.find({
        collection: 'wikiEntries',
        where,
        limit,
        page,
        sort: '-updatedAt',
        depth: 1,
        overrideAccess: true,
      })
      docs = Array.isArray(result?.docs) ? result.docs : []
      totalDocs = typeof result?.totalDocs === 'number' ? result.totalDocs : docs.length
      totalPages =
        typeof result?.totalPages === 'number' && result.totalPages > 0 ? result.totalPages : 1
      currentPage = typeof result?.page === 'number' ? result.page : page
    } else {
      // Fallback: use the `data` prop already supplied by Payload's list view
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

  // Drafts count for the stat card — independent of current filters
  let draftsCount = 0
  try {
    if (payload) {
      const res = await payload.count({
        collection: 'wikiEntries',
        where: { _status: { equals: 'draft' } },
        overrideAccess: true,
      })
      draftsCount = res?.totalDocs ?? 0
    }
  } catch {
    draftsCount = 0
  }

  // Published count for stat card 1
  let publishedCount = 0
  try {
    if (payload) {
      const res = await payload.count({
        collection: 'wikiEntries',
        where: { _status: { equals: 'published' } },
        overrideAccess: true,
      })
      publishedCount = res?.totalDocs ?? 0
    }
  } catch {
    publishedCount = 0
  }

  const rows: PlantRow[] = docs.map((doc, i) => {
    const idStr = String(doc.id ?? '')
    const seq = String((currentPage - 1) * limit + i + 1).padStart(3, '0')
    const author = resolveAuthorName(doc.author)
    const statusLabel =
      doc._status === 'published'
        ? 'Publié'
        : doc._status === 'draft'
          ? 'Brouillon'
          : 'Révision'
    const updatedAt = doc.updatedAt || doc.createdAt || new Date().toISOString()
    return {
      id: idStr,
      seq: idStr ? idStr.slice(0, 3).toUpperCase() : seq,
      name: doc.name ? String(doc.name) : '(sans nom)',
      latinName: doc.latinName ? String(doc.latinName) : '',
      category: resolveCategory(doc),
      authorName: author.name,
      authorInitials: author.initials,
      statusLabel,
      updatedLabel: formatRelative(updatedAt),
      href: `/admin/collections/wikiEntries/${idStr}`,
    }
  })

  return (
    <PlantsListClient
      rows={rows}
      totalDocs={totalDocs}
      totalPages={totalPages}
      page={currentPage}
      limit={limit}
      draftsCount={draftsCount}
      publishedCount={publishedCount}
      initialSearch={search}
      initialStatus={status}
    />
  )
}

export default PlantsList
