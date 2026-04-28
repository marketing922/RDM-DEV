import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { moderateClaims } from '@/lib/ai-moderate'
import { checkAiRateLimit } from '@/lib/rate-limit'
import { isAiAvailable } from '@/lib/ai-settings'
import { isWithinDailyBudget } from '@/lib/ai-budget'
import { logAiCall, hashIp } from '@/lib/ai-audit'
import { captureError } from '@/lib/error-tracker'

type Body = {
  text?: unknown
  locale?: unknown
  context?: unknown
}

export async function POST(req: Request) {
  const startedAt = Date.now()
  try {
    const payload = await getPayload({ config: configPromise })
    const h = await getHeaders()

    const { user } = await payload.auth({ headers: h })
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const role = (user as any)?.role as string | undefined
    if (role !== 'admin' && role !== 'editor') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const ipRaw =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || ''
    const ipHash = ipRaw ? hashIp(ipRaw) : undefined
    const userId = String((user as any).id ?? '')

    let body: Body
    try {
      body = (await req.json()) as Body
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    if (typeof body?.text !== 'string' || body.text.trim().length === 0) {
      return NextResponse.json(
        { error: 'missing_text', message: 'text is required' },
        { status: 400 },
      )
    }
    const locale: 'fr' | 'en' = body.locale === 'en' ? 'en' : 'fr'
    const ctxRaw = (body.context && typeof body.context === 'object'
      ? (body.context as Record<string, unknown>)
      : {}) as { collection?: unknown; field?: unknown; id?: unknown }
    const ctx = {
      collection:
        typeof ctxRaw.collection === 'string' ? ctxRaw.collection : undefined,
      field: typeof ctxRaw.field === 'string' ? ctxRaw.field : undefined,
    }
    const entryId =
      typeof ctxRaw.id === 'string' || typeof ctxRaw.id === 'number'
        ? String(ctxRaw.id)
        : undefined

    const availability = await isAiAvailable()
    if (!availability.ok) {
      return NextResponse.json(
        {
          error:
            availability.reason === 'kill-switch'
              ? 'ai_kill_switch'
              : 'ai_disabled',
          message: availability.message || 'Fonctionnalité IA indisponible.',
        },
        { status: 503 },
      )
    }

    const budget = await isWithinDailyBudget(payload)
    if (!budget.ok) {
      return NextResponse.json(
        {
          error: 'ai_budget_exceeded',
          message: `Budget IA quotidien atteint (${budget.spentEur.toFixed(4)}€ / ${budget.budgetEur}€).`,
          spentEur: budget.spentEur,
          budgetEur: budget.budgetEur,
        },
        { status: 503 },
      )
    }

    const rl = await checkAiRateLimit({
      userId: `user:${userId}`,
      endpoint: 'ai-moderate',
    })
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          scope: rl.scope,
          retryAfterSec: rl.retryAfterSec,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSec) },
        },
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: 'AI_NOT_CONFIGURED',
          message: 'Variable GEMINI_API_KEY manquante. Configurez-la dans .env.local.',
        },
        { status: 503 },
      )
    }

    try {
      const result = await moderateClaims({
        text: body.text,
        locale,
        context: ctx,
      })
      await logAiCall(
        payload,
        {
          subsystem: 'ai-moderate',
          model: result.model,
          userId,
          ipHash,
          collectionTarget: ctx.collection,
          fieldTarget: ctx.field,
          entryId,
        },
        startedAt,
        {
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          promptExcerpt: body.text,
          responseExcerpt: `${result.verdict}|${result.reason}`,
        },
        null,
      )
      return NextResponse.json(
        {
          verdict: result.verdict,
          confidence: result.confidence,
          matchedClaims: result.matchedClaims,
          reason: result.reason,
          suggestion: result.suggestion,
          model: result.model,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
        },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    } catch (aiErr: any) {
      await captureError(aiErr, {
        subsystem: 'ai-pipeline',
        level: 'error',
        route: 'POST /api/admin/ai-moderate',
        userId,
        ipHash,
        context: { collection: ctx.collection, field: ctx.field },
      })
      await logAiCall(
        payload,
        {
          subsystem: 'ai-moderate',
          model: 'gemini-2.5-flash-lite',
          userId,
          ipHash,
          collectionTarget: ctx.collection,
          fieldTarget: ctx.field,
          entryId,
        },
        startedAt,
        null,
        {
          code: aiErr?.name || 'moderation_failed',
          message: aiErr?.message,
        },
      )
      return NextResponse.json(
        {
          error: 'moderation_failed',
          message: aiErr?.message || 'Erreur Gemini',
        },
        { status: 502 },
      )
    }
  } catch (outerErr: any) {
    await captureError(outerErr, {
      subsystem: 'ai-pipeline',
      level: 'critical',
      route: 'POST /api/admin/ai-moderate',
    })
    return NextResponse.json(
      {
        error: 'internal_error',
        message: outerErr?.message || 'Erreur interne',
      },
      { status: 500 },
    )
  }
}
