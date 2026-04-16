import { getPayloadClient, safeQuery, EMPTY_PAGINATED } from '@/lib/payload'

export async function getPageBySlug(slug: string, locale = 'fr') {
  const payload = await getPayloadClient()
  return safeQuery(async () => {
    const result = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      limit: 1,
      locale,
      depth: 2,
    })
    return result.docs[0] || null
  }, null)
}
