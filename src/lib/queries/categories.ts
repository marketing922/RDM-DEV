import { getPayloadClient, safeQuery, EMPTY_PAGINATED } from '@/lib/payload'

export async function getCategories(locale = 'fr') {
  return safeQuery(async () => {
    const payload = await getPayloadClient()
    return payload.find({
      collection: 'categories',
      limit: 50,
      locale,
      sort: 'order',
    })
  }, EMPTY_PAGINATED as any)
}
