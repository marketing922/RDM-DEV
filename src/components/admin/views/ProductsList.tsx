import React from 'react'
import type { ListViewServerProps } from 'payload'

import { RM } from '@/components/admin/primitives'
import ProductsListClient, {
  type ProductRow,
  type ProductStatusKey,
} from './ProductsListClient'

const FORMAT_LABELS: Record<string, string> = {
  tisane: 'Tisane',
  poudre: 'Poudre',
  gelule: 'Gélule',
  autre: 'Autre',
}

function formatPrice(price: unknown): string {
  if (typeof price !== 'number' || Number.isNaN(price)) return '—'
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
  return `${formatted} €`
}

function statusLabel(status: unknown): string {
  switch (status) {
    case 'published':
      return 'Publié'
    case 'archived':
      return 'Archivé'
    case 'draft':
    default:
      return 'Brouillon'
  }
}

function categoryLabel(doc: any): string {
  const cat = doc?.category
  if (cat && typeof cat === 'object') {
    const title = cat.title || cat.name || cat.slug
    if (typeof title === 'string' && title.length > 0) return title
  }
  if (typeof cat === 'string' && cat.length > 0) return cat
  const fmt = doc?.format
  if (typeof fmt === 'string' && FORMAT_LABELS[fmt]) return FORMAT_LABELS[fmt]
  if (typeof fmt === 'string' && fmt.length > 0) return fmt
  return '—'
}

function skuLabel(doc: any): string {
  if (typeof doc?.sku === 'string' && doc.sku.length > 0) return doc.sku
  const id = doc?.id
  if (typeof id === 'string') return id.slice(0, 6)
  if (typeof id === 'number') return String(id).slice(0, 6)
  return '—'
}

const ProductsList: React.FC<ListViewServerProps> = async (props) => {
  const payload: any =
    (props as any).payload ?? (props as any).req?.payload ?? null
  const searchParams: Record<string, any> =
    (props as any).searchParams ?? (props as any).req?.searchParams ?? {}
  const collectionSlug = props.collectionConfig?.slug ?? 'products'

  const search = String(searchParams?.search ?? '').trim()
  const rawStatus = String(searchParams?.status ?? 'all')
  const status: ProductStatusKey = (
    ['all', 'published', 'low', 'archived'] as const
  ).includes(rawStatus as ProductStatusKey)
    ? (rawStatus as ProductStatusKey)
    : 'all'
  const page = Math.max(1, Number(searchParams?.page) || 1)
  const limit = 20

  const where: any = {}
  if (search) {
    where.or = [
      { name: { contains: search } },
      { sku: { contains: search } },
    ]
  }
  if (status === 'published') {
    where._status = { equals: 'published' }
  } else if (status === 'low') {
    where.inStock = { equals: false }
  } else if (status === 'archived') {
    // Products has a `status` select with value 'archived'; prefer it over _status.
    where.status = { equals: 'archived' }
  }

  let docs: any[] = []
  let totalDocs = 0
  let totalPages = 1
  let currentPage = page
  try {
    if (payload) {
      const result = await payload.find({
        collection: collectionSlug,
        where,
        limit,
        page,
        sort: '-updatedAt',
        depth: 1,
        overrideAccess: true,
        draft: true,
      })
      docs = Array.isArray(result?.docs) ? result.docs : []
      totalDocs = typeof result?.totalDocs === 'number' ? result.totalDocs : docs.length
      totalPages =
        typeof result?.totalPages === 'number' && result.totalPages > 0
          ? result.totalPages
          : 1
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

  let publishedCount = 0
  try {
    if (payload) {
      const res = await payload.count({
        collection: collectionSlug,
        where: { _status: { equals: 'published' } },
        overrideAccess: true,
      })
      publishedCount = res?.totalDocs ?? 0
    }
  } catch {
    publishedCount = 0
  }

  let outOfStockCount = 0
  try {
    if (payload) {
      const res = await payload.count({
        collection: collectionSlug,
        where: { inStock: { equals: false } },
        overrideAccess: true,
      })
      outOfStockCount = res?.totalDocs ?? 0
    }
  } catch {
    outOfStockCount = 0
  }

  // Prix moyen + nombre de liens marchands — calculés en mémoire sur le
  // catalogue (borné). Remplacent les tuiles "CA · 30j" et "Commandes en
  // attente" qui exigeaient une boutique transactionnelle non câblée
  // (vente via Amazon/Temu en affiliation).
  let avgPrice = 0
  let merchantLinksCount = 0
  try {
    if (payload) {
      const res = await payload.find({
        collection: collectionSlug,
        limit: 0,
        pagination: false,
        depth: 0,
        overrideAccess: true,
      })
      const all: any[] = Array.isArray(res?.docs) ? res.docs : []
      const prices = all
        .map((d) => (typeof d?.price === 'number' ? d.price : null))
        .filter((p): p is number => p !== null && !Number.isNaN(p))
      avgPrice = prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : 0
      merchantLinksCount = all.filter(
        (d) => (typeof d?.amazonUrl === 'string' && d.amazonUrl.trim()) ||
               (typeof d?.temuUrl === 'string' && d.temuUrl.trim()),
      ).length
    }
  } catch {
    avgPrice = 0
    merchantLinksCount = 0
  }
  const avgPriceLabel = avgPrice > 0 ? formatPrice(avgPrice) : '—'

  const rows: ProductRow[] = docs.map((doc) => {
    const idStr = String(doc?.id ?? '')
    const inStock = doc?.inStock !== false
    const stockLabel = inStock ? 'En stock' : 'Rupture ●'
    const stockColor = inStock ? RM.teal : RM.burgundy
    const rawStatus = doc?._status ?? doc?.status
    return {
      id: idStr,
      sku: skuLabel(doc),
      name: doc?.name ? String(doc.name) : '(sans nom)',
      category: categoryLabel(doc),
      priceLabel: formatPrice(doc?.price),
      stockLabel,
      stockColor,
      statusLabel: statusLabel(rawStatus),
      href: `/admin/collections/products/${idStr}`,
    }
  })

  return (
    <ProductsListClient
      rows={rows}
      totalDocs={totalDocs}
      totalPages={totalPages}
      page={currentPage}
      limit={limit}
      publishedCount={publishedCount}
      outOfStockCount={outOfStockCount}
      avgPriceLabel={avgPriceLabel}
      merchantLinksCount={merchantLinksCount}
      initialSearch={search}
      initialStatus={status}
    />
  )
}

export default ProductsList
