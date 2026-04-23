import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })
    // Auth guard: require a logged-in user
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const collections = [
      'wikiEntries',
      'blogPosts',
      'benefits',
      'products',
      'pages',
      'sitePages',
      'media',
      'users',
      'authors',
      'auditLog',
    ]
    const results = await Promise.all(
      collections.map(async (c) => {
        try {
          const { totalDocs } = await payload.count({ collection: c as any })
          return [c, totalDocs] as const
        } catch {
          return [c, 0] as const
        }
      }),
    )
    const counts = Object.fromEntries(results)
    return NextResponse.json(counts, { headers: { 'Cache-Control': 'private, max-age=60' } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}
