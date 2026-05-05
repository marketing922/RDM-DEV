import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Neon keep-alive endpoint.
 *
 * Ping this every 2-4 minutes to prevent Neon's auto-suspend from kicking in.
 * Authentication: either
 *   - Authorization: Bearer ${CRON_SECRET}    (external cron / manual curl)
 *   - x-vercel-cron-signature header set + CRON_SECRET configured
 *     (Vercel's managed cron requests carry this header)
 *
 * Very cheap: single SELECT 1 via a tiny find with limit 1.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authz = req.headers.get('authorization') || ''
  const vercelSig = req.headers.get('x-vercel-cron-signature') || ''

  let authorized = false
  if (cronSecret && authz.startsWith('Bearer ')) {
    const token = authz.slice('Bearer '.length).trim()
    if (token && token === cronSecret) authorized = true
  }
  if (!authorized && vercelSig && cronSecret) {
    authorized = true
  }
  if (!authorized) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'CRON_SECRET bearer or Vercel cron signature required.' },
      { status: 401 },
    )
  }

  const t0 = Date.now()
  try {
    const payload = await getPayload({ config: configPromise })
    await payload.find({
      collection: 'users',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    return NextResponse.json({ ok: true, latencyMs: Date.now() - t0 })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, latencyMs: Date.now() - t0, error: err?.message || String(err) },
      { status: 500 },
    )
  }
}
