import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { z } from 'zod'

import { runAutopilotTick } from '@/lib/autopilot'
import { captureError } from '@/lib/error-tracker'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/cron/autopilot/tick
 *
 * Wired to Vercel Cron (see vercel.json) every 30 minutes. The autopilot
 * itself decides — based on SiteSettings — whether to launch a real production
 * during this tick.
 *
 * Authentication: either
 *   - Authorization: Bearer ${CRON_SECRET}    (external cron / manual curl)
 *   - x-vercel-cron-signature header set + CRON_SECRET configured
 *     (Vercel's managed cron requests carry this header)
 *
 * Optional body: { force?: boolean, onlyKind?: 'wiki' | 'blog' }
 * `force` is only honored when the request is authenticated as an admin user
 * (cookie-based session) — a pure CRON_SECRET ping cannot bypass guards.
 */

const BodySchema = z
  .object({
    force: z.boolean().optional(),
    onlyKind: z.enum(['wiki', 'blog']).optional(),
  })
  .optional()

type AuthChannel = 'cron-secret' | 'vercel-cron' | 'admin-user' | null

async function authenticate(req: NextRequest): Promise<{
  channel: AuthChannel
  isAdmin: boolean
}> {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') || ''
  const vercelSig = req.headers.get('x-vercel-cron-signature') || ''

  // 1) Bearer token (external cron / manual)
  if (cronSecret && auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim()
    if (token && token === cronSecret) {
      // Admin check is independent — try cookie session below.
      const isAdmin = await isAdminFromSession(req)
      return { channel: 'cron-secret', isAdmin }
    }
  }

  // 2) Vercel cron signature: Vercel's managed cron sets this header on every
  //    invocation. We require CRON_SECRET to be configured to ensure the
  //    project has explicitly opted in to scheduled execution.
  if (vercelSig && cronSecret) {
    const isAdmin = await isAdminFromSession(req)
    return { channel: 'vercel-cron', isAdmin }
  }

  // 3) Admin cookie session (manual trigger from admin UI)
  const isAdmin = await isAdminFromSession(req)
  if (isAdmin) {
    return { channel: 'admin-user', isAdmin: true }
  }

  return { channel: null, isAdmin: false }
}

async function isAdminFromSession(req: NextRequest): Promise<boolean> {
  try {
    const payload = await getPayload({ config: configPromise })
    const auth = await payload.auth({ headers: req.headers })
    const user = auth?.user as { role?: string } | null
    return user?.role === 'admin'
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const { channel, isAdmin } = await authenticate(req)
  if (!channel) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'CRON_SECRET bearer or Vercel cron signature required.' },
      { status: 401 },
    )
  }

  // Parse optional body
  let parsedBody: { force?: boolean; onlyKind?: 'wiki' | 'blog' } = {}
  try {
    const text = await req.text()
    if (text && text.trim().length > 0) {
      const raw = JSON.parse(text)
      const result = BodySchema.safeParse(raw)
      if (!result.success) {
        return NextResponse.json(
          { error: 'invalid_body', issues: result.error.issues },
          { status: 400 },
        )
      }
      parsedBody = result.data ?? {}
    }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // `force` is only honored for admin users (not raw cron pings)
  const force = Boolean(parsedBody.force) && isAdmin
  const onlyKind = parsedBody.onlyKind

  try {
    const result = await runAutopilotTick({ force, onlyKind })
    const status = result.action === 'failed' ? 500 : 200
    return NextResponse.json(
      {
        ok: result.ok,
        action: result.action,
        reason: result.reason,
        runId: result.runId,
        candidate: result.candidate,
        durationMs: result.durationMs,
        channel,
        forceApplied: force,
      },
      { status },
    )
  } catch (err) {
    await captureError(err, {
      subsystem: 'content-orchestrator',
      level: 'error',
      route: 'POST /api/cron/autopilot/tick',
      context: { channel, force, onlyKind },
    })
    return NextResponse.json(
      {
        error: 'autopilot_tick_failed',
        message: err instanceof Error ? err.message : 'Unknown autopilot error',
      },
      { status: 500 },
    )
  }
}
