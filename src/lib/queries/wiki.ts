import { getPayloadClient, safeQuery, EMPTY_PAGINATED } from '@/lib/payload'

export async function getWikiEntries(options?: {
  limit?: number
  page?: number
  locale?: string
  search?: string
  category?: string
  family?: string
  sort?: string
  depth?: number
  where?: Record<string, any>
}) {
  const {
    limit = 12,
    page = 1,
    locale = 'fr',
    search = '',
    category = '',
    family = '',
    sort = 'name',
    depth = 1,
    where: extraWhere,
  } = options || {}

  const andClauses: any[] = [{ _status: { equals: 'published' } }]
  if (search.trim()) {
    andClauses.push({
      or: [
        { name: { like: search.trim() } },
        { shortDescription: { like: search.trim() } },
        { latinName: { like: search.trim() } },
      ],
    })
  }
  if (category.trim()) {
    andClauses.push({ category: { equals: category.trim() } })
  }
  if (family.trim()) {
    andClauses.push({ family: { equals: family.trim() } })
  }
  if (extraWhere && Object.keys(extraWhere).length > 0) {
    andClauses.push(extraWhere)
  }
  const where = andClauses.length === 1 ? andClauses[0] : { and: andClauses }

  return safeQuery(async () => {
    const payload = await getPayloadClient()
    return payload.find({
      collection: 'wikiEntries',
      where,
      limit,
      page,
      locale,
      sort,
      depth,
    })
  }, EMPTY_PAGINATED as any)
}

export async function getWikiEntryBySlug(slug: string, locale = 'fr') {
  return safeQuery(async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'wikiEntries',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      limit: 1,
      locale,
      depth: 2, // populate relations (benefits, author)
    })
    return result.docs[0] || null
  }, null)
}
