import { getPayloadClient, safeQuery, EMPTY_PAGINATED } from '@/lib/payload'

export async function getProducts(options?: {
  limit?: number
  page?: number
  category?: string
  featured?: boolean
  benefitIds?: Array<string | number>
  locale?: string
}) {
  const { limit = 12, page = 1, locale = 'fr' } = options || {}

  const where: any = { _status: { equals: 'published' } }
  if (options?.category) where['category.slug'] = { equals: options.category }
  if (options?.featured) where.featured = { equals: true }
  if (options?.benefitIds && options.benefitIds.length > 0) {
    where.benefits = { in: options.benefitIds }
  }

  return safeQuery(async () => {
    const payload = await getPayloadClient()
    return payload.find({
      collection: 'products',
      where,
      limit,
      page,
      locale,
      sort: '-createdAt',
      depth: 1,
    })
  }, EMPTY_PAGINATED as any)
}

export async function getProductBySlug(slug: string, locale = 'fr') {
  return safeQuery(async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      limit: 1,
      locale,
      depth: 2,
    })
    return result.docs[0] || null
  }, null)
}

export async function getFeaturedProducts(limit = 4, locale = 'fr') {
  return getProducts({ limit, featured: true, locale })
}
