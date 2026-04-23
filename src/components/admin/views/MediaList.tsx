import React from 'react'
import type { ListViewServerProps } from 'payload'

import { resolveMediaUrl } from '@/lib/mediaUrl'
import MediaListClient, { type MediaRow, type KindKey } from './MediaListClient'

function formatBytes(bytes?: number | null): string {
  if (!bytes) return '—'
  const mb = bytes / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

function formatTotalSize(bytes: number): string {
  if (!bytes) return '—'
  const gb = bytes / 1024 / 1024 / 1024
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  const mb = bytes / 1024 / 1024
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

function mimeCategory(mime?: string): string {
  if (!mime) return 'Fichier'
  if (mime.startsWith('image/')) return 'Photo'
  if (mime.startsWith('video/')) return 'Vidéo'
  if (mime === 'application/pdf') return 'Document'
  if (mime.includes('zip') || mime.includes('compressed') || mime.includes('archive'))
    return 'Archive'
  return 'Fichier'
}

const KINDS: ReadonlyArray<KindKey> = ['all', 'photo', 'doc', 'video', 'archive']

const MediaList: React.FC<ListViewServerProps> = async (props) => {
  const payload: any =
    (props as any).payload ?? (props as any).req?.payload ?? null
  const searchParams: Record<string, any> =
    (props as any).searchParams ?? (props as any).req?.searchParams ?? {}

  const search = String(searchParams?.search ?? '').trim()
  const rawKind = String(searchParams?.kind ?? 'all')
  const kind: KindKey = (KINDS as readonly string[]).includes(rawKind)
    ? (rawKind as KindKey)
    : 'all'
  const page = Math.max(1, Number(searchParams?.page) || 1)
  const limit = 24

  // Build `where` clause — search across filename OR alt; kind maps to mimeType filter.
  const kindClause = (k: KindKey): any | null => {
    if (k === 'photo') return { mimeType: { like: 'image/' } }
    if (k === 'doc') return { mimeType: { equals: 'application/pdf' } }
    if (k === 'video') return { mimeType: { like: 'video/' } }
    if (k === 'archive') return { mimeType: { like: 'zip' } }
    return null
  }

  const where: any = {}
  const andClauses: any[] = []
  if (search) {
    andClauses.push({
      or: [{ filename: { like: search } }, { alt: { like: search } }],
    })
  }
  const kc = kindClause(kind)
  if (kc) andClauses.push(kc)
  if (andClauses.length === 1) Object.assign(where, andClauses[0])
  else if (andClauses.length > 1) where.and = andClauses

  let docs: any[] = []
  let totalDocs = 0
  let totalPages = 1
  let currentPage = page
  try {
    if (payload) {
      const result = await payload.find({
        collection: 'media',
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

  // Unfiltered stats — independent of current filters.
  let photoCount = 0
  let docCount = 0
  let unfilteredTotal = 0
  let totalSizeBytes = 0
  try {
    if (payload) {
      const [photoRes, docRes, allCountRes] = await Promise.all([
        payload.count({
          collection: 'media',
          where: { mimeType: { like: 'image/' } },
          overrideAccess: true,
        }),
        payload.count({
          collection: 'media',
          where: { mimeType: { equals: 'application/pdf' } },
          overrideAccess: true,
        }),
        payload.count({ collection: 'media', overrideAccess: true }),
      ])
      photoCount = photoRes?.totalDocs ?? 0
      docCount = docRes?.totalDocs ?? 0
      unfilteredTotal = allCountRes?.totalDocs ?? 0

      if (unfilteredTotal < 500) {
        try {
          const allRes = await payload.find({
            collection: 'media',
            depth: 0,
            limit: 500,
            overrideAccess: true,
            select: { filesize: true },
          })
          const allDocs: any[] = (allRes?.docs as any[]) ?? []
          totalSizeBytes = allDocs.reduce(
            (sum, d) => sum + (typeof d?.filesize === 'number' ? d.filesize : 0),
            0,
          )
        } catch {
          totalSizeBytes = 0
        }
      }
    }
  } catch {
    // ignore
  }

  const rows: MediaRow[] = docs.map((doc) => {
    const id = String(doc?.id ?? '')
    const filename = doc?.filename ? String(doc.filename) : '(sans nom)'
    const mimeType = doc?.mimeType ? String(doc.mimeType) : ''
    const filesize = typeof doc?.filesize === 'number' ? doc.filesize : null
    const width = typeof doc?.width === 'number' ? doc.width : null
    const height = typeof doc?.height === 'number' ? doc.height : null
    const url = resolveMediaUrl(doc, 'thumbnail') ?? resolveMediaUrl(doc) ?? ''
    const alt = doc?.alt ? String(doc.alt) : filename
    const isImage = mimeType.startsWith('image/')
    const badge = mimeCategory(mimeType).toUpperCase()
    const dims = width && height ? `${width}×${height}` : mimeType || '—'
    return {
      id,
      filename,
      alt,
      mimeType,
      url,
      isImage,
      badge,
      dims,
      sizeLabel: formatBytes(filesize),
      href: `/admin/collections/media/${id}`,
      usageCount: 0, // TODO: wire up usage tracking in Phase 2
    }
  })

  const totalSizeLabel = totalSizeBytes > 0 ? formatTotalSize(totalSizeBytes) : '—'

  return (
    <MediaListClient
      rows={rows}
      totalDocs={totalDocs}
      unfilteredTotal={unfilteredTotal}
      totalPages={totalPages}
      page={currentPage}
      limit={limit}
      photoCount={photoCount}
      docCount={docCount}
      totalSizeLabel={totalSizeLabel}
      initialSearch={search}
      initialKind={kind}
    />
  )
}

export default MediaList
