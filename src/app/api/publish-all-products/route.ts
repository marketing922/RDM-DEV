import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production.' }, { status: 403 })
  }
  if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({
      message: 'Add ?confirm=yes to publish all draft products.',
      warning:
        'This bypasses the EFSA compliance gate (skipCompliance context flag). Use only after reviewing product content.',
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
    const errors: Array<{ id: string | number; name?: string; message: string }> = []

    for (const d of docs) {
      try {
        await payload.update({
          collection: 'products',
          id: d.id,
          overrideAccess: true,
          context: { skipCompliance: true },
          data: {
            status: 'published',
            _status: 'published',
            complianceStatus: 'approved',
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
      failed: errors.length,
      errors,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Bulk publish failed', message: err?.message || String(err) },
      { status: 500 },
    )
  }
}
