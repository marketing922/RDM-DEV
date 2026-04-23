import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'

/**
 * Custom endpoint to read / update the `siteSettings` global.
 *
 * Uses Payload Local API directly instead of the REST route
 * `/api/globals/:slug` which has inconsistent method support across
 * Payload versions. Requires an authenticated admin/editor session.
 *
 *   GET  /api/admin/site-settings  → returns the full global
 *   POST /api/admin/site-settings  → body = JSON patch, returns updated doc
 */

async function requireAuth() {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers: headers as any })
  return { payload, user }
}

export async function GET() {
  try {
    const { payload, user } = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const doc = await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
      overrideAccess: true,
    })
    return NextResponse.json(doc)
  } catch (e: any) {
    return NextResponse.json(
      { error: 'internal', detail: e?.message || String(e) },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  try {
    const { payload, user } = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    // Only admins/editors can write. Viewers are blocked.
    const role = (user as any).role
    if (role === 'viewer') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const updated = await payload.updateGlobal({
      slug: 'siteSettings',
      data: body as any,
      depth: 0,
      overrideAccess: true,
    })
    return NextResponse.json({ result: updated, message: 'Enregistré' })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'update_failed', detail: e?.message || String(e) },
      { status: 500 },
    )
  }
}
