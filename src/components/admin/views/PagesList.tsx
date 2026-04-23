import React from 'react'
import type { ListViewServerProps } from 'payload'

import PagesListClient, { type PageRow } from './PagesListClient'

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

// Strip a hint of readable content from a page's layout blocks.
// Pages don't have a top-level `excerpt` field, so we dig into the first
// block that has textual content (hero subheading/heading, content richText,
// or any block heading) and return a short plain-text string.
const extractHint = (doc: any): string => {
  if (!doc || typeof doc !== 'object') return ''
  if (typeof doc.excerpt === 'string' && doc.excerpt.trim()) {
    return doc.excerpt.trim().slice(0, 140)
  }
  const layout = Array.isArray(doc.layout) ? doc.layout : []
  for (const block of layout) {
    if (!block || typeof block !== 'object') continue
    // Plain text fields on common blocks
    const candidates = [
      block.subheading,
      block.heading,
      block.description,
      block.caption,
      block.label,
    ]
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) {
        return c.trim().slice(0, 140)
      }
    }
    // Lexical / richText root — walk children for first text node
    const rt = block.richText
    if (rt && typeof rt === 'object') {
      const stack: any[] = []
      if (rt.root) stack.push(rt.root)
      while (stack.length) {
        const node: any = stack.shift()
        if (!node) continue
        if (typeof node.text === 'string' && node.text.trim()) {
          return node.text.trim().slice(0, 140)
        }
        if (Array.isArray(node.children)) {
          for (const child of node.children) stack.push(child)
        }
      }
    }
  }
  return ''
}

type StatusKey = 'all' | 'published' | 'draft'

const PagesList: React.FC<ListViewServerProps> = async (props) => {
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
        collection: 'pages',
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

  // Published count
  let publishedCount = 0
  try {
    if (payload) {
      const res = await payload.count({
        collection: 'pages',
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
        collection: 'pages',
        where: { _status: { equals: 'draft' } },
        overrideAccess: true,
      })
      draftsCount = res?.totalDocs ?? 0
    }
  } catch {
    draftsCount = 0
  }

  // Updates in last 7 days
  let recentCount = 0
  try {
    if (payload) {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const res = await payload.count({
        collection: 'pages',
        where: { updatedAt: { greater_than: since } },
        overrideAccess: true,
      })
      recentCount = res?.totalDocs ?? 0
    }
  } catch {
    recentCount = 0
  }

  // Total (unfiltered)
  let totalAll = 0
  try {
    if (payload) {
      const res = await payload.count({
        collection: 'pages',
        overrideAccess: true,
      })
      totalAll = res?.totalDocs ?? 0
    } else {
      totalAll = totalDocs
    }
  } catch {
    totalAll = totalDocs
  }

  const rows: PageRow[] = docs.map((doc) => {
    const idStr = String(doc.id ?? '')
    const ref = idStr ? `P-${idStr.slice(-3).toUpperCase()}` : 'P-???'
    const statusLabel =
      doc._status === 'published' ? 'Publié' : doc._status === 'draft' ? 'Brouillon' : 'Publié'
    const updatedAt = doc.updatedAt || doc.createdAt || new Date().toISOString()
    return {
      id: idStr,
      ref,
      title: doc.title ? String(doc.title) : '(sans titre)',
      hint: extractHint(doc),
      slug: doc.slug ? String(doc.slug) : '',
      statusLabel,
      updatedLabel: formatRelative(updatedAt),
      href: `/admin/collections/pages/${idStr}`,
    }
  })

  return (
    <PagesListClient
      rows={rows}
      totalDocs={totalDocs}
      totalPages={totalPages}
      page={currentPage}
      limit={limit}
      publishedCount={publishedCount}
      draftsCount={draftsCount}
      recentCount={recentCount}
      totalAll={totalAll}
      initialSearch={search}
      initialStatus={status}
    />
  )
}

export default PagesList
