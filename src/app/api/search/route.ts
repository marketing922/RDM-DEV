import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query = searchParams.get('q')?.trim() ?? ''
  const locale = searchParams.get('locale') ?? 'fr'

  if (query.length < 2) {
    return NextResponse.json({ plants: [], articles: [], benefits: [] })
  }

  try {
    const payload = await getPayloadClient()

    const [plantsResult, articlesResult, benefitsResult] = await Promise.all([
      payload.find({
        collection: 'wikiEntries',
        where: {
          and: [
            { _status: { equals: 'published' } },
            {
              or: [
                { name: { like: query } },
                { latinName: { like: query } },
              ],
            },
          ],
        },
        limit: 5,
        locale: locale as any,
        depth: 0,
      }),
      payload.find({
        collection: 'blogPosts',
        where: {
          and: [
            { _status: { equals: 'published' } },
            {
              or: [
                { title: { like: query } },
                { excerpt: { like: query } },
              ],
            },
          ],
        },
        limit: 5,
        locale: locale as any,
        depth: 0,
      }),
      payload.find({
        collection: 'benefits',
        where: {
          and: [
            { _status: { equals: 'published' } },
            { name: { like: query } },
          ],
        },
        limit: 5,
        locale: locale as any,
        depth: 0,
      }),
    ])

    const plants = plantsResult.docs.map((doc: any) => ({
      title: doc.name,
      slug: doc.slug,
      type: 'plant' as const,
      excerpt: doc.latinName ?? undefined,
    }))

    const articles = articlesResult.docs.map((doc: any) => ({
      title: doc.title,
      slug: doc.slug,
      type: 'article' as const,
      excerpt: doc.excerpt ?? undefined,
    }))

    const benefits = benefitsResult.docs.map((doc: any) => ({
      title: doc.name,
      slug: doc.slug,
      type: 'benefit' as const,
      excerpt: doc.shortDescription ?? undefined,
    }))

    return NextResponse.json({ plants, articles, benefits })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { plants: [], articles: [], benefits: [], error: 'Search failed' },
      { status: 500 },
    )
  }
}
