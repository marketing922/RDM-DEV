import { getPayloadClient, safeQuery, EMPTY_PAGINATED } from '@/lib/payload'

export async function getBenefits(options?: {
  limit?: number
  locale?: string
}) {
  const payload = await getPayloadClient()
  const { limit = 20, locale = 'fr' } = options || {}

  return safeQuery(() => payload.find({
    collection: 'benefits',
    where: { status: { equals: 'published' } },
    limit,
    locale,
    sort: 'name',
  }), EMPTY_PAGINATED as any)
}

export async function getBenefitBySlug(slug: string, locale = 'fr') {
  const payload = await getPayloadClient()
  return safeQuery(async () => {
    const result = await payload.find({
      collection: 'benefits',
      where: { slug: { equals: slug }, status: { equals: 'published' } },
      limit: 1,
      locale,
      depth: 2,
    })
    return result.docs[0] || null
  }, null)
}
