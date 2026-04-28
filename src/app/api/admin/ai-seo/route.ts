import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import {
  generateSeoPack,
  type SeoCollection,
  type SeoGenerateContext,
  type SeoGenerateInput,
  type SeoLocale,
} from '@/lib/seo-generator'
import { checkAiRateLimit } from '@/lib/rate-limit'
import { isAiAvailable } from '@/lib/ai-settings'
import { isWithinDailyBudget } from '@/lib/ai-budget'
import { logAiCall, hashIp } from '@/lib/ai-audit'
import { captureError } from '@/lib/error-tracker'

const ALLOWED_COLLECTIONS: ReadonlySet<SeoCollection> = new Set([
  'wikiEntries',
  'blogPosts',
  'benefits',
  'products',
])

type IncomingBody = {
  collection?: unknown
  context?: unknown
  locale?: unknown
  hint?: unknown
}

const isString = (v: unknown): v is string => typeof v === 'string'

function readStringField(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key]
  return isString(v) && v.trim().length > 0 ? v.trim() : undefined
}

function readStringArrayField(
  obj: Record<string, unknown>,
  key: string,
): string[] | undefined {
  const v = obj[key]
  if (!Array.isArray(v)) return undefined
  const out = v.filter(isString).map((s) => s.trim()).filter(Boolean)
  return out.length ? out : undefined
}

function parseInput(body: IncomingBody):
  | { ok: true; input: SeoGenerateInput }
  | { ok: false; status: number; error: string; message: string } {
  if (!body || typeof body !== 'object') {
    return {
      ok: false,
      status: 400,
      error: 'invalid_body',
      message: 'Body must be a JSON object.',
    }
  }
  if (!isString(body.collection) || !ALLOWED_COLLECTIONS.has(body.collection as SeoCollection)) {
    return {
      ok: false,
      status: 400,
      error: 'invalid_collection',
      message: 'collection must be one of: wikiEntries, blogPosts, benefits, products.',
    }
  }
  const ctxRaw =
    body.context && typeof body.context === 'object'
      ? (body.context as Record<string, unknown>)
      : {}

  const context: SeoGenerateContext = {
    name: readStringField(ctxRaw, 'name'),
    title: readStringField(ctxRaw, 'title'),
    latinName: readStringField(ctxRaw, 'latinName'),
    shortDescription: readStringField(ctxRaw, 'shortDescription'),
    longDescription: readStringField(ctxRaw, 'longDescription'),
    excerpt: readStringField(ctxRaw, 'excerpt'),
    category: readStringField(ctxRaw, 'category'),
    bodyRegion: readStringField(ctxRaw, 'bodyRegion'),
    tags: readStringArrayField(ctxRaw, 'tags'),
  }

  const locale: SeoLocale = body.locale === 'en' ? 'en' : 'fr'
  const hint = isString(body.hint) && body.hint.trim().length > 0 ? body.hint.trim() : undefined

  return {
    ok: true,
    input: {
      collection: body.collection as SeoCollection,
      context,
      locale,
      hint,
    },
  }
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
    const role = (user as { role?: string }).role
    if (role !== 'admin' && role !== 'editor') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const ipRaw =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || ''
    const ipHash = ipRaw ? hashIp(ipRaw) : undefined
    const userId = String((user as { id?: string | number }).id ?? '')

    let body: IncomingBody
    try {
      body = (await req.json()) as IncomingBody
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    const parsed = parseInput(body)
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error, message: parsed.message },
        { status: parsed.status },
      )
    }
    const input = parsed.input

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
      endpoint: 'ai-seo',
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
      const result = await generateSeoPack(input)
      const promptExcerpt = JSON.stringify({
        collection: input.collection,
        locale: input.locale,
        hint: input.hint,
        ctxKeys: Object.keys(input.context).filter(
          (k) => (input.context as Record<string, unknown>)[k] != null,
        ),
      })
      const responseExcerpt = JSON.stringify({
        title: result.title,
        description: result.description,
        keywords: result.keywords,
      })
      await logAiCall(
        payload,
        {
          subsystem: 'ai-seo',
          model: result.model,
          userId,
          ipHash,
          collectionTarget: input.collection,
          fieldTarget: 'meta.title+meta.description',
        },
        startedAt,
        {
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          promptExcerpt,
          responseExcerpt,
        },
        null,
      )
      return NextResponse.json(
        {
          title: result.title,
          description: result.description,
          keywords: result.keywords,
          model: result.model,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          promptVersion: result.promptVersion,
        },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    } catch (aiErr) {
      const err = aiErr as { name?: string; message?: string }
      await captureError(aiErr, {
        subsystem: 'ai-seo',
        level: 'error',
        route: 'POST /api/admin/ai-seo',
        userId,
        ipHash,
        context: { collection: input.collection },
      })
      await logAiCall(
        payload,
        {
          subsystem: 'ai-seo',
          model: 'gemini-2.5-flash-lite',
          userId,
          ipHash,
          collectionTarget: input.collection,
          fieldTarget: 'meta.title+meta.description',
        },
        startedAt,
        null,
        {
          code: err?.name || 'seo_failed',
          message: err?.message,
        },
      )
      return NextResponse.json(
        {
          error: 'seo_failed',
          message: err?.message || 'Erreur Gemini',
        },
        { status: 502 },
      )
    }
  } catch (outerErr) {
    const err = outerErr as { message?: string }
    await captureError(outerErr, {
      subsystem: 'ai-seo',
      level: 'critical',
      route: 'POST /api/admin/ai-seo',
    })
    return NextResponse.json(
      {
        error: 'internal_error',
        message: err?.message || 'Erreur interne',
      },
      { status: 500 },
    )
  }
}
