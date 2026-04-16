import { getPayloadClient, safeQuery, EMPTY_PAGINATED } from '@/lib/payload'

export async function getCategories(locale = 'fr') {
  const payload = await getPayloadClient()
  return safeQuery(() => payload.find({
    collection: 'categories',
    limit: 50,
    locale,
    sort: 'order',
  }), EMPTY_PAGINATED as any)
}
