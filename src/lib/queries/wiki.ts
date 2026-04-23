import { getPayloadClient, safeQuery, EMPTY_PAGINATED } from '@/lib/payload'

export async function getWikiEntries(options?: {
  limit?: number
  page?: number
  locale?: string
  search?: string
  where?: Record<string, any>
}) {
  const payload = await getPayloadClient()
  const { limit = 12, page = 1, locale = 'fr', search = '', where: extraWhere } =
    options || {}

  // Compose base `_status: published` AND optional search + caller-provided
  // where clauses. Search matches name OR shortDescription OR latinName.
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
  if (extraWhere && Object.keys(extraWhere).length > 0) {
    andClauses.push(extraWhere)
  }
  const where = andClauses.length === 1 ? andClauses[0] : { and: andClauses }

  return safeQuery(() => payload.find({
    collection: 'wikiEntries',
    where,
    limit,
    page,
    locale,
    sort: 'name',
    depth: 1,
  }), EMPTY_PAGINATED as any)
}

export async function getWikiEntryBySlug(slug: string, locale = 'fr') {
  const payload = await getPayloadClient()
  return safeQuery(async () => {
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
