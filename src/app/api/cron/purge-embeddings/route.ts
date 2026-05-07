import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { purgeOrphanEmbeddings } from '@/lib/embeddings-db'
import { captureError } from '@/lib/error-tracker'

export const dynamic = 'force-dynamic'
// Vercel Hobby cap les fonctions à 60s en pratique malgré maxDuration
// déclaré. La purge doit donc s'auto-borner — purgeOrphanEmbeddings travaille
// par chunks (cf. embeddings-db.ts) et retourne un flag `hasMore` ; le
// prochain tick reprend.
export const maxDuration = 60

/**
 * POST /api/cron/purge-embeddings
 *
 * Removes embeddings whose target document no longer exists in Payload.
 * Wired to a weekly Vercel cron (see vercel.json).
 *
 * Auth (any of):
 *  - Authorization: Bearer ${CRON_SECRET}
 *  - x-vercel-cron-signature header (Vercel managed cron)
 *  - admin cookie session (manual run)
 */

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') || ''
  const vercelSig = req.headers.get('x-vercel-cron-signature') || ''

  if (cronSecret && auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim()
    if (token && token === cronSecret) return true
  }
  if (vercelSig && cronSecret) return true

  // Admin cookie fallback
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: req.headers })
    if (user && (user as { role?: string }).role === 'admin') return true
  } catch {
    // ignore
  }
  return false
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const t0 = Date.now()
  try {
    const result = await purgeOrphanEmbeddings()
    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - t0,
      ...result,
    })
  } catch (err) {
    await captureError(err, {
      subsystem: 'ai-embedding',
      level: 'error',
      route: 'POST /api/cron/purge-embeddings',
    })
    // Erreur loggée via captureError ci-dessus, ne pas la renvoyer au client
    // (peut contenir un path SQL / connection string).
    return NextResponse.json({ ok: false, error: 'purge_failed' }, { status: 500 })
  }
}

// Convenience GET — same effect, easier to trigger from a browser admin tab.
export const GET = POST
