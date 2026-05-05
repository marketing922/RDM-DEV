import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { authenticateExternal } from '@/lib/external-auth'
import { ExternalIngestSchema, runExternalIngest } from '@/lib/external-ingest'
import { isAiAvailable } from '@/lib/ai-settings'
import { checkAiRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/external/v1/validate
 *
 * Dry-run version of /ingest : same body, runs Zod validation + slug-conflict
 * check + relation slug resolution + moderation, then returns the verdict
 * WITHOUT writing anything (no doc create, no media upload). Lets the
 * external factory iterate on a draft until it passes.
 */
export async function POST(req: NextRequest) {
  const auth = authenticateExternal(req)
  if (!auth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const availability = await isAiAvailable()
  if (!availability.ok) {
    return NextResponse.json(
      {
        error: availability.reason === 'kill-switch' ? 'ai_kill_switch' : 'ai_disabled',
        message: availability.message || 'IA indisponible (modération hors ligne).',
      },
      { status: 503 },
    )
  }

  const rl = await checkAiRateLimit({
    userId: `external:${auth.apiKeyHash}`,
    endpoint: 'ai-produce',
  })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limit_exceeded', scope: rl.scope, retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    )
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = ExternalIngestSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation_failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const payload = await getPayload({ config: configPromise })
  const result = await runExternalIngest({
    payload,
    input: parsed.data,
    dryRun: true,
    actorId: auth.actorId,
  })
  const status = result.ok
    ? 200
    : result.error === 'moderation_blocked' || result.error === 'unknown_relation_slug' || result.error === 'forbidden_claim'
      ? 422
      : 500
  return NextResponse.json(result, { status })
}
