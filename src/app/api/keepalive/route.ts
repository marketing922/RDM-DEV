import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

/**
 * Neon keep-alive endpoint.
 *
 * Ping this every 2-4 minutes to prevent Neon's auto-suspend from kicking in.
 * External cron (Vercel Cron, GitHub Actions, UptimeRobot, etc.) hits this URL.
 *
 * Very cheap: single SELECT 1 via a tiny find with limit 0.
 */
export async function GET() {
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
