import { getPayloadClient, safeQuery, EMPTY_PAGINATED } from '@/lib/payload'

export async function getBlogPosts(options?: {
  limit?: number
  page?: number
  category?: string
  search?: string
  locale?: string
}) {
  const payload = await getPayloadClient()
  const { limit = 9, page = 1, locale = 'fr', category = '', search = '' } =
    options || {}

  const andClauses: any[] = [{ _status: { equals: 'published' } }]
  if (category && category !== 'all') {
    andClauses.push({ 'category.slug': { equals: category } })
  }
  if (search.trim()) {
    andClauses.push({
      or: [
        { title: { like: search.trim() } },
        { excerpt: { like: search.trim() } },
      ],
    })
  }
  const where = andClauses.length === 1 ? andClauses[0] : { and: andClauses }

  return safeQuery(() => payload.find({
    collection: 'blogPosts',
    where,
    limit,
    page,
    locale,
    sort: '-publishedAt',
    depth: 1, // populate author, category
  }), EMPTY_PAGINATED as any)
}

export async function getBlogPostBySlug(slug: string, locale = 'fr') {
  const payload = await getPayloadClient()
  return safeQuery(async () => {
    const result = await payload.find({
      collection: 'blogPosts',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      limit: 1,
      locale,
      depth: 2,
    })
    return result.docs[0] || null
  }, null)
}

export async function getFeaturedBlogPost(locale = 'fr') {
  const payload = await getPayloadClient()
  return safeQuery(async () => {
    const result = await payload.find({
      collection: 'blogPosts',
      where: { _status: { equals: 'published' } },
      limit: 1,
      locale,
      sort: '-publishedAt',
      depth: 1,
    })
    return result.docs[0] || null
  }, null)
}
