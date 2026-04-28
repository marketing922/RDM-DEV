import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { callAI, type AIGenerateRequest } from '@/lib/ai'
import { checkAiRateLimit } from '@/lib/rate-limit'
import { isAiAvailable } from '@/lib/ai-settings'
import { isWithinDailyBudget } from '@/lib/ai-budget'
import { logAiCall, hashIp } from '@/lib/ai-audit'
import { captureError } from '@/lib/error-tracker'

export async function POST(req: Request) {
  const startedAt = Date.now()
  try {
    const payload = await getPayload({ config: configPromise })
    const h = await getHeaders()

    const { user } = await payload.auth({ headers: h })
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const ipRaw = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || ''
    const ipHash = ipRaw ? hashIp(ipRaw) : undefined
    const userId = String((user as any).id ?? '')

    let body: AIGenerateRequest
    try {
      body = (await req.json()) as AIGenerateRequest
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    if (!body?.collection || !body?.field || !body?.fieldType) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 })
    }

    const entryIdRaw = (body.context as Record<string, unknown> | undefined)?.id
    const entryId =
      typeof entryIdRaw === 'string' || typeof entryIdRaw === 'number'
        ? String(entryIdRaw)
        : undefined

    const availability = await isAiAvailable()
    if (!availability.ok) {
      return NextResponse.json(
        {
          error: availability.reason === 'kill-switch' ? 'ai_kill_switch' : 'ai_disabled',
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

    const rl = await checkAiRateLimit({ userId: `user:${userId}`, endpoint: 'ai-generate' })
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'rate_limit_exceeded', scope: rl.scope, retryAfterSec: rl.retryAfterSec },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
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
      const result = await callAI(body)
      await logAiCall(
        payload,
        {
          subsystem: 'ai-generate',
          model: result.model as any,
          userId,
          ipHash,
          collectionTarget: body.collection,
          fieldTarget: body.field,
          entryId,
        },
        startedAt,
        {
          text: result.text,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          promptExcerpt: body.instructions || body.field,
          responseExcerpt: result.text,
        },
        null,
      )
      return NextResponse.json({
        text: result.text,
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
      })
    } catch (aiErr: any) {
      console.error('[AI route] callAI failed', {
        message: aiErr?.message,
        name: aiErr?.name,
        collection: body.collection,
        field: body.field,
      })
      await captureError(aiErr, {
        subsystem: 'ai-generate',
        level: 'error',
        route: 'POST /api/admin/ai-generate',
        userId,
        ipHash,
        context: { collection: body.collection, field: body.field },
      })
      await logAiCall(
        payload,
        {
          subsystem: 'ai-generate',
          model: 'gemini-2.5-flash-lite',
          userId,
          ipHash,
          collectionTarget: body.collection,
          fieldTarget: body.field,
          entryId,
        },
        startedAt,
        null,
        { code: aiErr?.name || 'generation_failed', message: aiErr?.message },
      )
      return NextResponse.json(
        { error: 'generation_failed', message: aiErr?.message || 'Erreur Gemini' },
        { status: 502 },
      )
    }
  } catch (outerErr: any) {
    console.error('[AI route] unexpected failure', outerErr)
    await captureError(outerErr, {
      subsystem: 'ai-generate',
      level: 'critical',
      route: 'POST /api/admin/ai-generate',
    })
    return NextResponse.json(
      { error: 'internal_error', message: outerErr?.message || 'Erreur interne' },
      { status: 500 },
    )
  }
}
