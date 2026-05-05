import { getPayloadClient, safeQuery } from '@/lib/payload'

export type FaqItemDoc = {
  id: string | number
  question: string
  answer: unknown
  category: 'plantes' | 'utilisation' | 'site' | 'sante'
  order?: number | null
}

export async function getFaqItems(options?: {
  locale?: string
  category?: string
  limit?: number
}): Promise<FaqItemDoc[]> {
  const payload = await getPayloadClient()
  const { locale = 'fr', category = '', limit = 200 } = options || {}

  const where: Record<string, any> = {}
  if (category.trim()) {
    where.category = { equals: category.trim() }
  }

  const result = await safeQuery(
    () =>
      payload.find({
        collection: 'faqItems' as any,
        where,
        limit,
        locale: locale as any,
        sort: 'order',
        depth: 0,
      }),
    { docs: [] } as any,
  )

  // Tri secondaire par question pour ordre stable
  const docs = ((result?.docs as FaqItemDoc[]) || []).slice()
  docs.sort((a, b) => {
    const oa = typeof a.order === 'number' ? a.order : 9999
    const ob = typeof b.order === 'number' ? b.order : 9999
    if (oa !== ob) return oa - ob
    return String(a.question || '').localeCompare(String(b.question || ''))
  })
  return docs
}
