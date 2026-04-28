import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { z } from 'zod'

import {
  produceContent,
  type ProduceKind,
  type ProduceMode,
} from '@/lib/content-orchestrator'
import { isAiAvailable } from '@/lib/ai-settings'
import { isWithinDailyBudget } from '@/lib/ai-budget'
import { checkAiRateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/error-tracker'
import { hashIp } from '@/lib/ai-audit'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // up to 5 min — production runs are long

const ProduceBodySchema = z.object({
  kind: z.enum(['wiki', 'blog']),
  seed: z.string().min(1).max(200).optional(),
  mode: z.enum(['autonomous', 'import-json']).optional().default('autonomous'),
  brief: z.string().max(2000).optional(),
  importedJson: z.record(z.string(), z.unknown()).optional(),
  locale: z.enum(['fr', 'en']).optional().default('fr'),
})

type AuthResult =
  | { kind: 'user'; userId: string; ipHash?: string }
  | { kind: 'apikey'; apiKeyHash: string; ipHash?: string }
  | null

async function authenticate(req: NextRequest): Promise<AuthResult> {
  const ipRaw =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    ''
  const ipHash = ipRaw ? hashIp(ipRaw) : undefined

  // 1) Cookie-based admin/editor (UI flow)
  try {
    const payload = await getPayload({ config: configPromise })
    const auth = await payload.auth({ headers: req.headers })
    const user = auth?.user as { id?: string | number; role?: string } | null
    const role = user?.role
    if (user && (role === 'admin' || role === 'editor')) {
      return { kind: 'user', userId: String(user.id ?? ''), ipHash }
    }
  } catch {
    // fall through
  }

  // 2) API key (header x-api-key) — must match AI_PIPELINE_API_KEYS env
  const apiKey = req.headers.get('x-api-key')
  if (apiKey) {
    let allowedKeys: string[] = []
    try {
      const raw = process.env.AI_PIPELINE_API_KEYS || '[]'
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) allowedKeys = parsed.filter((k) => typeof k === 'string')
    } catch {
      allowedKeys = []
    }
    if (allowedKeys.includes(apiKey)) {
      const apiKeyHash = hashIp(apiKey).slice(0, 8)
      return { kind: 'apikey', apiKeyHash, ipHash }
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req)
  if (!auth) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Auth admin/editor session ou API key requise.' },
      { status: 401 },
    )
  }

  // Kill-switch / budget / rate-limit
  const availability = await isAiAvailable()
  if (!availability.ok) {
    return NextResponse.json(
      {
        error: availability.reason === 'kill-switch' ? 'ai_kill_switch' : 'ai_disabled',
        message: availability.message || 'Pipeline IA indisponible.',
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
        spentEur: budget.spentEur,
        budgetEur: budget.budgetEur,
      },
      { status: 503 },
    )
  }

  // Rate-limit per identity (user or apikey)
  const rateKey =
    auth.kind === 'user' ? `produce:user:${auth.userId}` : `produce:apikey:${auth.apiKeyHash}`
  const rl = await checkAiRateLimit({ userId: rateKey, endpoint: 'ai-produce' })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limit_exceeded', scope: rl.scope, retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    )
  }

  // Parse + validate body
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = ProduceBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data

  // Mode-specific guards
  if (body.mode === 'import-json') {
    if (!body.importedJson) {
      return NextResponse.json(
        { error: 'missing_imported_json', message: 'Le mode import-json requiert un objet importedJson.' },
        { status: 400 },
      )
    }
  } else {
    if (!body.seed || body.seed.trim().length < 2) {
      return NextResponse.json(
        { error: 'missing_seed', message: 'Le mode autonome requiert un champ seed (>= 2 chars).' },
        { status: 400 },
      )
    }
  }

  const initiatedBy: 'admin-ui' | 'api-key' =
    auth.kind === 'apikey' ? 'api-key' : 'admin-ui'
  const actorId =
    auth.kind === 'user' ? auth.userId : `apikey:${auth.apiKeyHash}`

  try {
    // Derive a placeholder seed for import-json so the orchestrator can lock & slug.
    const effectiveSeed =
      body.seed?.trim() ||
      (body.kind === 'wiki'
        ? String((body.importedJson as Record<string, unknown> | undefined)?.name ?? 'import')
        : String((body.importedJson as Record<string, unknown> | undefined)?.title ?? 'import'))

    const result = await produceContent({
      kind: body.kind as ProduceKind,
      seed: effectiveSeed,
      mode: body.mode as ProduceMode,
      conflictPolicy: 'fail',
      brief: body.brief,
      importedJson: body.importedJson,
      initiatedBy,
      actorId,
      locale: body.locale,
    })

    const status = result.status === 'failed' ? 422 : 200
    return NextResponse.json(result, { status })
  } catch (err) {
    await captureError(err, {
      subsystem: 'content-orchestrator',
      level: 'error',
      route: 'POST /api/ai-pipeline/produce',
      userId: actorId,
      context: { kind: body.kind, mode: body.mode, seed: body.seed?.slice(0, 100) },
    })
    return NextResponse.json(
      {
        error: 'pipeline_error',
        message: err instanceof Error ? err.message : 'Erreur interne du pipeline',
      },
      { status: 500 },
    )
  }
}
