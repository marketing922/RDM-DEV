import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 120

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production.' }, { status: 403 })
  }
  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })
  if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({
      message: 'Add ?confirm=yes to delete ALL products.',
      warning: 'This will permanently delete every product document (drafts and published).',
      usage: 'GET /api/wipe-products?confirm=yes',
    })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const { docs } = await payload.find({
      collection: 'products',
      limit: 1000,
      overrideAccess: true,
      depth: 0,
    })

    let deleted = 0
    const errors: Array<{ id: string | number; message: string }> = []

    for (const d of docs) {
      try {
        await payload.delete({
          collection: 'products',
          id: d.id,
          overrideAccess: true,
          context: { skipCompliance: true },
        })
        deleted++
      } catch (e: any) {
        errors.push({ id: d.id, message: e?.message || String(e) })
      }
    }

    return NextResponse.json({
      message: 'Wipe complete',
      found: docs.length,
      deleted,
      failed: errors.length,
      errors,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Wipe failed', message: err?.message || String(err) },
      { status: 500 },
    )
  }
}
