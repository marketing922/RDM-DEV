import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { authenticateExternal } from '@/lib/external-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/external/v1/plants
 *
 * Returns published wiki plants (slug + name + latinName) for relation
 * discovery. Cached 1h.
 */
export async function GET(req: NextRequest) {
  const auth = authenticateExternal(req)
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const payload = await getPayload({ config: configPromise })

  const res = await payload.find({
    collection: 'wikiEntries',
    limit: 1000,
    pagination: false,
    depth: 0,
    sort: 'name',
    where: { _status: { equals: 'published' } } as never,
  })

  const docs = (res?.docs ?? []) as Array<{
    slug?: string
    name?: string
    latinName?: string
  }>

  return NextResponse.json(
    {
      plants: docs
        .filter((d) => d.slug && d.name)
        .map((d) => ({ slug: d.slug!, name: d.name!, latinName: d.latinName ?? null })),
    },
    { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } },
  )
}
