import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { authenticateExternal } from '@/lib/external-auth'
import { ExternalIngestSchema, runExternalIngest } from '@/lib/external-ingest'
import { isAiAvailable } from '@/lib/ai-settings'
import { isWithinDailyBudget } from '@/lib/ai-budget'
import { checkAiRateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/error-tracker'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * POST /api/external/v1/ingest
 *
 * Ingests fully-formed wiki / blog content from the external content
 * factory. See `Documentation/api-external.md` for the contract.
 */
export async function POST(req: NextRequest) {
  const auth = authenticateExternal(req)
  if (!auth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Kill-switch (modération a besoin de l'IA — si OFF, on rejette).
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

  const payload = await getPayload({ config: configPromise })
  const budget = await isWithinDailyBudget(payload)
  if (!budget.ok) {
    return NextResponse.json(
      {
        error: 'ai_budget_exceeded',
        message: `Budget IA quotidien atteint (${budget.spentEur.toFixed(4)}€ / ${budget.budgetEur}€).`,
      },
      { status: 503 },
    )
  }

  // Rate-limit per API key.
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

  // Parse + validate body.
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

  try {
    const result = await runExternalIngest({
      payload,
      input: parsed.data,
      dryRun: false,
      actorId: auth.actorId,
    })
    if (!result.ok) {
      const status =
        result.error === 'slug_conflict' ? 409 :
        result.error === 'moderation_blocked' ? 422 :
        result.error === 'unknown_relation_slug' ? 422 :
        result.error === 'forbidden_claim' ? 422 :
        result.error === 'image_failed' ? 422 :
        500
      return NextResponse.json(result, { status })
    }
    return NextResponse.json(result, { status: result.replayed ? 200 : 201 })
  } catch (err) {
    await captureError(err, {
      subsystem: 'content-orchestrator',
      level: 'error',
      route: 'POST /api/external/v1/ingest',
      userId: auth.actorId,
    })
    return NextResponse.json(
      {
        ok: false,
        error: 'internal_error',
        message: err instanceof Error ? err.message : 'Erreur interne',
      },
      { status: 500 },
    )
  }
}
