import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { authenticateExternalSigned } from '@/lib/external-auth'
import { ExternalIngestSchema, runExternalIngest } from '@/lib/external-ingest'
import { isAiAvailable } from '@/lib/ai-settings'
import { isWithinDailyBudget } from '@/lib/ai-budget'
import { checkAiRateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/error-tracker'
import { logIngest, fireWebhook } from '@/lib/external-ingest-log'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * POST /api/external/v1/ingest
 *
 * Ingests fully-formed wiki / blog content from the external content
 * factory. See `Documentation/api-access-partner.md` for the full contract.
 */
export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const authResult = await authenticateExternalSigned(req, rawBody)
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.reason }, { status: authResult.status })
  }
  const auth = authResult.auth

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
      {
        status: 503,
        headers: buildThrottlingHeaders({ budget }),
      },
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
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfterSec),
          ...buildThrottlingHeaders({ budget, rl }),
        },
      },
    )
  }

  // Parse + validate body.
  let raw: unknown
  try {
    raw = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = ExternalIngestSchema.safeParse(raw)
  if (!parsed.success) {
    const status = 400
    void logIngest(payload, {
      actorId: auth.actorId,
      apiKeyHash: auth.apiKeyHash,
      ipHash: auth.ipHash,
      kind: (raw as any)?.kind === 'wiki' ? 'wiki' : 'blog',
      locale: (raw as any)?.locale || 'fr',
      idempotencyKey: (raw as any)?.idempotencyKey,
      statusCode: status,
      result: 'validation_failed',
      errorCode: 'validation_failed',
      durationMs: Date.now() - startedAt,
      payloadSizeBytes: rawBody.length,
      webhookUrl: (raw as any)?.webhookUrl,
      webhookStatus: 'skipped',
    })
    return NextResponse.json(
      { ok: false, error: 'validation_failed', issues: parsed.error.issues },
      { status, headers: buildThrottlingHeaders({ budget, rl }) },
    )
  }

  try {
    const result = await runExternalIngest({
      payload,
      input: parsed.data,
      dryRun: false,
      actorId: auth.actorId,
    })

    // Status code mapping (identique à avant)
    let status: number
    if (!result.ok) {
      status =
        result.error === 'slug_conflict' ? 409 :
        result.error === 'moderation_blocked' ? 422 :
        result.error === 'unknown_relation_slug' ? 422 :
        result.error === 'forbidden_claim' ? 422 :
        result.error === 'image_failed' ? 422 :
        500
    } else {
      status = result.replayed ? 200 : 201
    }

    // Webhook callback (fire-and-forget, ne bloque pas la réponse).
    let webhookOutcome: { status: 'pending' | 'success' | 'failed' | 'skipped'; responseCode?: number } = {
      status: 'skipped',
    }
    if (parsed.data.webhookUrl && process.env.AI_PIPELINE_HMAC_SECRET) {
      const event =
        !result.ok ? 'ingest.failed' :
        result.replayed ? 'ingest.replayed' :
        'ingest.success'
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rdm-dev-test.vercel.app'
      const publicPath =
        result.ok && result.kind === 'wiki' ? `/${parsed.data.locale}/plantes/${result.slug}` :
        result.ok && result.kind === 'blog' ? `/${parsed.data.locale}/blog/${result.slug}` :
        undefined
      webhookOutcome = { status: 'pending' }
      // On NE attend PAS la fin du webhook avant de répondre au partenaire.
      // Le log sera mis à jour de manière asynchrone si on attend, mais ici
      // on log "pending" et on laisse le hook fire-and-forget terminer dans
      // le contexte de la fonction serverless (Vercel laisse le handler
      // tourner jusqu'à maxDuration).
      const callbackPromise = fireWebhook(parsed.data.webhookUrl, {
        event,
        kind: (result.ok ? result.kind : ((parsed.data as any).kind ?? 'wiki')) as 'wiki' | 'blog',
        slug: result.ok ? result.slug : (parsed.data.data as any).slug,
        id: result.ok ? result.docId : undefined,
        idempotencyKey: parsed.data.idempotencyKey,
        locale: parsed.data.locale,
        publishedAt: result.ok && parsed.data.publish ? new Date().toISOString() : undefined,
        url: publicPath ? `${siteUrl}${publicPath}` : undefined,
        error: !result.ok ? { code: result.error, message: (result as any).message } : undefined,
        timestamp: new Date().toISOString(),
      }, process.env.AI_PIPELINE_HMAC_SECRET)

      // Mise à jour du log avec le résultat réel du webhook une fois terminé.
      callbackPromise.then(async (outcome) => {
        try {
          const pool = (payload.db as any).pool
          if (pool) {
            await pool.query(
              `UPDATE rdm_audit.external_ingest_log
                 SET webhook_status = $1, webhook_response_code = $2
                 WHERE idempotency_key = $3
                 ORDER BY created_at DESC
                 LIMIT 1`,
              [outcome.status, outcome.responseCode ?? null, parsed.data.idempotencyKey],
            ).catch(() => {})
          }
        } catch {/* fail-soft */}
      })
    }

    // Log de l'ingest (status webhook = pending si callback en cours).
    void logIngest(payload, {
      actorId: auth.actorId,
      apiKeyHash: auth.apiKeyHash,
      ipHash: auth.ipHash,
      kind: result.ok ? result.kind : ((parsed.data as any).kind),
      locale: parsed.data.locale,
      slug: result.ok ? result.slug : (parsed.data.data as any).slug,
      docId: result.ok ? result.docId : undefined,
      idempotencyKey: parsed.data.idempotencyKey,
      statusCode: status,
      result: !result.ok ? 'rejected' : result.replayed ? 'replayed' : 'created',
      errorCode: !result.ok ? result.error : undefined,
      durationMs: Date.now() - startedAt,
      payloadSizeBytes: rawBody.length,
      complianceVerdict: (result as any).complianceVerdict,
      webhookUrl: parsed.data.webhookUrl,
      webhookStatus: webhookOutcome.status,
      webhookResponseCode: webhookOutcome.responseCode,
      replayed: result.ok && result.replayed,
    })

    return NextResponse.json(result, {
      status,
      headers: buildThrottlingHeaders({ budget, rl }),
    })
  } catch (err) {
    await captureError(err, {
      subsystem: 'content-orchestrator',
      level: 'error',
      route: 'POST /api/external/v1/ingest',
      userId: auth.actorId,
    })
    void logIngest(payload, {
      actorId: auth.actorId,
      apiKeyHash: auth.apiKeyHash,
      ipHash: auth.ipHash,
      kind: (parsed.data as any).kind,
      locale: parsed.data.locale,
      slug: (parsed.data.data as any).slug,
      idempotencyKey: parsed.data.idempotencyKey,
      statusCode: 500,
      result: 'error',
      errorCode: 'internal_error',
      durationMs: Date.now() - startedAt,
      payloadSizeBytes: rawBody.length,
      webhookUrl: parsed.data.webhookUrl,
      webhookStatus: 'skipped',
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

// ─── Throttling headers ─────────────────────────────────────────────────
// Donnent au partenaire un signal pour adapter sa vitesse d'émission.
// Idempotent / ne bloque rien : c'est juste de l'info en sortie.

type BudgetState = { ok: boolean; spentEur: number; budgetEur: number }
type RlState = any  // shape variable (ok|fail), on lit défensivement

function buildThrottlingHeaders(state: { budget?: BudgetState; rl?: RlState }): Record<string, string> {
  const headers: Record<string, string> = {}
  if (state.budget) {
    const remainingEur = Math.max(0, state.budget.budgetEur - state.budget.spentEur)
    headers['X-RDM-AI-Budget-Spent'] = state.budget.spentEur.toFixed(4)
    headers['X-RDM-AI-Budget-Limit'] = state.budget.budgetEur.toFixed(2)
    headers['X-RDM-AI-Budget-Remaining'] = remainingEur.toFixed(4)
  }
  if (state.rl?.ok && state.rl.remaining) {
    // ok=true → remaining: { hour, day, globalDay }
    headers['X-RDM-RateLimit-Remaining-Hour'] = String(state.rl.remaining.hour ?? '')
    headers['X-RDM-RateLimit-Remaining-Day'] = String(state.rl.remaining.day ?? '')
    headers['X-RDM-RateLimit-Remaining-Global-Day'] = String(state.rl.remaining.globalDay ?? '')
  }
  if (state.rl && state.rl.ok === false) {
    // ok=false → on est en cours de throttling
    if (state.rl.scope) headers['X-RDM-RateLimit-Scope-Exceeded'] = String(state.rl.scope)
    if (state.rl.retryAfterSec != null) {
      headers['X-RDM-RateLimit-Reset-In-Sec'] = String(state.rl.retryAfterSec)
    }
  }
  return headers
}
