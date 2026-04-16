import { getPayloadClient, safeQuery, EMPTY_PAGINATED } from '@/lib/payload'

export async function getWikiEntries(options?: {
  limit?: number
  page?: number
  locale?: string
}) {
  const payload = await getPayloadClient()
  const { limit = 12, page = 1, locale = 'fr' } = options || {}

  return safeQuery(() => payload.find({
    collection: 'wikiEntries',
    where: { status: { equals: 'published' } },
    limit,
    page,
    locale,
    sort: 'name',
  }), EMPTY_PAGINATED as any)
}

export async function getWikiEntryBySlug(slug: string, locale = 'fr') {
  const payload = await getPayloadClient()
  return safeQuery(async () => {
    const result = await payload.find({
      collection: 'wikiEntries',
      where: { slug: { equals: slug }, status: { equals: 'published' } },
      limit: 1,
      locale,
      depth: 2, // populate relations (benefits, author)
    })
    return result.docs[0] || null
  }, null)
}
