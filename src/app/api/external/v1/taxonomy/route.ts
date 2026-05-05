import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { authenticateExternal } from '@/lib/external-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/external/v1/taxonomy
 *
 * Returns the full list of categories + tags (slugs + names) so the
 * external content factory can produce content with valid relations.
 * Cached 1h client-side.
 */
export async function GET(req: NextRequest) {
  const auth = authenticateExternal(req)
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const payload = await getPayload({ config: configPromise })

  const [cats, tags] = await Promise.all([
    payload.find({
      collection: 'categories',
      limit: 500,
      pagination: false,
      depth: 0,
      sort: 'name',
    }),
    payload.find({
      collection: 'tags',
      limit: 500,
      pagination: false,
      depth: 0,
      sort: 'name',
    }),
  ])

  const body = {
    categories: ((cats?.docs ?? []) as Array<{ slug?: string; name?: string }>)
      .filter((c) => c.slug && c.name)
      .map((c) => ({ slug: c.slug!, name: c.name! })),
    tags: ((tags?.docs ?? []) as Array<{ slug?: string; name?: string }>)
      .filter((t) => t.slug && t.name)
      .map((t) => ({ slug: t.slug!, name: t.name! })),
  }

  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
  })
}
