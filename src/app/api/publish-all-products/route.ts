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
      message: 'Add ?confirm=yes to publish all draft products.',
      warning:
        'Compliance gate (gatePublishCompliance) is enforced. Products with complianceStatus !== "approved" are skipped.',
      usage: 'GET /api/publish-all-products?confirm=yes',
    })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const { docs } = await payload.find({
      collection: 'products',
      where: { _status: { equals: 'draft' } },
      limit: 1000,
      overrideAccess: true,
    })

    let published = 0
    const skipped: Array<{ id: string | number; name?: string; reason: string }> = []
    const errors: Array<{ id: string | number; name?: string; message: string }> = []

    for (const d of docs) {
      try {
        if ((d as any).complianceStatus !== 'approved') {
          skipped.push({
            id: d.id,
            name: (d as any).name,
            reason: `complianceStatus=${(d as any).complianceStatus || 'unset'}`,
          })
          continue
        }
        await payload.update({
          collection: 'products',
          id: d.id,
          overrideAccess: true,
          data: {
            status: 'published',
            _status: 'published',
          } as any,
        })
        published++
      } catch (e: any) {
        errors.push({ id: d.id, name: (d as any).name, message: e?.message || String(e) })
      }
    }

    return NextResponse.json({
      message: 'Bulk publish complete',
      found: docs.length,
      published,
      skipped: skipped.length,
      failed: errors.length,
      skippedDetails: skipped,
      errors,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Bulk publish failed', message: err?.message || String(err) },
      { status: 500 },
    )
  }
}
