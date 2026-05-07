import { getPayloadClient, safeQuery, EMPTY_PAGINATED } from '@/lib/payload'

export async function getBenefits(options?: {
  limit?: number
  locale?: string
  search?: string
  bodyRegion?: string
  category?: string
}) {
  const {
    limit = 20,
    locale = 'fr',
    search = '',
    bodyRegion = '',
    category = '',
  } = options || {}

  const andClauses: any[] = [{ _status: { equals: 'published' } }]
  if (search.trim()) {
    andClauses.push({
      or: [
        { name: { like: search.trim() } },
        { shortDescription: { like: search.trim() } },
      ],
    })
  }
  if (bodyRegion.trim()) {
    andClauses.push({ bodyRegion: { equals: bodyRegion.trim() } })
  }
  if (category.trim()) {
    andClauses.push({ category: { equals: category.trim() } })
  }
  const where = andClauses.length === 1 ? andClauses[0] : { and: andClauses }

  return safeQuery(async () => {
    const payload = await getPayloadClient()
    return payload.find({
      collection: 'benefits',
      where,
      limit,
      locale,
      sort: 'name',
      depth: 0,
    })
  }, EMPTY_PAGINATED as any)
}

export async function getBenefitBySlug(slug: string, locale = 'fr') {
  return safeQuery(async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'benefits',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      limit: 1,
      locale,
      depth: 2,
    })
    return result.docs[0] || null
  }, null)
}
