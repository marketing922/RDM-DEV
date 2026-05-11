import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { seedProducts } from '@/seed/products'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED_IN_PROD !== 'true') {
    return NextResponse.json({ error: 'Disabled in production.' }, { status: 403 })
  }
  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })
  if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({
      message: 'Add ?confirm=yes to run the products seed.',
      usage: 'GET /api/seed-products?confirm=yes',
    })
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await seedProducts(payload)
    return NextResponse.json({ message: 'Products seed complete', ...result })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Seed failed', message: err?.message || String(err) },
      { status: 500 },
    )
  }
}
