import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import {
  generateGeoField,
  type GeoContext,
  type GeoFieldType,
  type GeoLocale,
} from '@/lib/geoGenerator'
import { checkAiRateLimit } from '@/lib/rate-limit'
import { isAiAvailable } from '@/lib/ai-settings'
import { isWithinDailyBudget } from '@/lib/ai-budget'
import { logAiCall, hashIp } from '@/lib/ai-audit'
import { captureError } from '@/lib/error-tracker'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Body = {
  field: GeoFieldType
  context: GeoContext
  locale?: GeoLocale
}

const VALID_FIELDS: GeoFieldType[] = ['directAnswer', 'definition', 'keyTakeaways', 'faq']

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  try {
    const payload = await getPayload({ config: configPromise })

    let user: any = null
    try {
      const auth = await payload.auth({ headers: req.headers })
      user = auth?.user
    } catch {
      user = null
    }

    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const role = user.role
    if (role && !['admin', 'editor'].includes(role)) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    const ipRaw =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      ''
    const ipHash = ipRaw ? hashIp(ipRaw) : undefined
    const userId = String(user.id ?? '')

    let body: Body
    try {
      body = (await req.json()) as Body
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
    }

    const { field, context } = body
    const locale: GeoLocale = body.locale === 'en' ? 'en' : 'fr'
    if (!field || !VALID_FIELDS.includes(field)) {
      return NextResponse.json({ error: 'Champ invalide' }, { status: 400 })
    }
    if (!context || typeof context !== 'object' || !context.kind) {
      return NextResponse.json({ error: 'Contexte manquant' }, { status: 400 })
    }
    if (!context.name) {
      return NextResponse.json(
        { error: 'Le nom/titre du document est requis pour générer du contenu' },
        { status: 400 },
      )
    }

    const entryId =
      typeof context.id === 'string' || typeof context.id === 'number'
        ? String(context.id)
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
        },
        { status: 503 },
      )
    }

    const rl = await checkAiRateLimit({ userId: `user:${userId}`, endpoint: 'ai-geo' })
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'rate_limit_exceeded', scope: rl.scope, retryAfterSec: rl.retryAfterSec },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      )
    }

    try {
      const result = await generateGeoField(field, context, locale)
      await logAiCall(
        payload,
        {
          subsystem: 'ai-geo',
          model: result.model as any,
          userId,
          ipHash,
          collectionTarget: context.kind,
          fieldTarget: field,
          entryId,
        },
        startedAt,
        {
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          promptExcerpt: `${context.kind}:${field}:${context.name}`,
          responseExcerpt: JSON.stringify(result).slice(0, 500),
        },
        null,
      )
      return NextResponse.json(result)
    } catch (err: any) {
      const msg = err?.message || 'Erreur de génération'
      const status = msg.includes('GEMINI_API_KEY') ? 503 : 500
      await captureError(err, {
        subsystem: 'ai-geo',
        level: 'error',
        route: 'POST /api/geo/generate',
        userId,
        ipHash,
        context: { collection: context.kind, field },
      })
      await logAiCall(
        payload,
        {
          subsystem: 'ai-geo',
          model: 'gemini-2.5-flash-lite',
          userId,
          ipHash,
          collectionTarget: context.kind,
          fieldTarget: field,
          entryId,
        },
        startedAt,
        null,
        { code: err?.name || 'geo_generation_failed', message: msg },
      )
      return NextResponse.json({ error: msg }, { status })
    }
  } catch (outerErr: any) {
    console.error('[geo route] unexpected failure', outerErr)
    await captureError(outerErr, {
      subsystem: 'ai-geo',
      level: 'critical',
      route: 'POST /api/geo/generate',
    })
    return NextResponse.json(
      { error: outerErr?.message || 'Erreur interne' },
      { status: 500 },
    )
  }
}
