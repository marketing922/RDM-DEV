import 'server-only'
import { createHash } from 'node:crypto'
import type { Payload } from 'payload'
import { type AiModel, calcCostEur } from './ai-pricing'
import { getTodayAiSpendEur } from './ai-budget'
import { getAiSettings } from './ai-settings'
import { notify } from './notify'

export type AiAuditSubsystem =
  | 'ai-generate'
  | 'ai-geo'
  | 'ai-geo-extras'
  | 'ai-moderate'
  | 'ai-seo'
  | 'ai-pipeline'
  | 'ai-embedding'
  | 'ai-vision'
  | 'ai-research'
  | 'ai-relations'
  | 'ai-image-keywords'
  | 'other'

export type AiAuditContext = {
  subsystem: AiAuditSubsystem
  model: AiModel
  userId?: string
  ipHash?: string
  collectionTarget?: string
  fieldTarget?: string
  entryId?: string
}

export type AiCallResult = {
  text?: string
  promptTokens?: number
  completionTokens?: number
  promptExcerpt?: string
  responseExcerpt?: string
}

const EXCERPT_MAX = 500

const truncate = (value: string | undefined): string | undefined => {
  if (!value) return undefined
  return value.length > EXCERPT_MAX ? value.slice(0, EXCERPT_MAX) : value
}

export function hashIp(ip: string): string {
  const salt = process.env.AUDIT_IP_SALT || 'rdm-default'
  return createHash('sha256').update(`${ip}${salt}`).digest('hex').slice(0, 16)
}

export async function logAiCall(
  payload: Payload,
  ctx: AiAuditContext,
  startedAt: number,
  result: AiCallResult | null,
  error: { code?: string; message?: string } | null,
): Promise<void> {
  try {
    const durationMs = Date.now() - startedAt
    const ok = !error
    const promptTokens = result?.promptTokens
    const completionTokens = result?.completionTokens
    const costEur =
      promptTokens !== undefined || completionTokens !== undefined
        ? calcCostEur({ model: ctx.model, promptTokens, completionTokens })
        : undefined

    await payload.create({
      collection: 'auditLog' as any,
      data: {
        action: ok ? `${ctx.subsystem}:ok` : `${ctx.subsystem}:error`,
        subsystem: ctx.subsystem,
        model: ctx.model,
        collectionTarget: ctx.collectionTarget,
        fieldTarget: ctx.fieldTarget,
        entryId: ctx.entryId,
        promptTokens,
        completionTokens,
        costEur,
        durationMs,
        ok,
        errorCode: error?.code ?? (error ? 'unknown' : undefined),
        promptExcerpt: truncate(result?.promptExcerpt),
        responseExcerpt: truncate(result?.responseExcerpt),
        userId: ctx.userId,
        ipHash: ctx.ipHash,
        timestamp: new Date().toISOString(),
      },
    })

    // Fire budget watcher (non-blocking — errors swallowed inside).
    try {
      await maybeNotifyBudget(payload)
    } catch (err) {
      console.error('[ai-audit] budget watcher failed', err)
    }
  } catch (err) {
    console.error('[ai-audit] failed', err)
  }
}

function isoDayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Inspects today's AI spend vs configured daily budget and fires a
 * notification when crossing 50 / 80 / 100 percent thresholds. Dedup keys
 * ensure at most one notification per threshold per UTC day.
 */
async function maybeNotifyBudget(payload: Payload): Promise<void> {
  const [settings, spentEur] = await Promise.all([
    getAiSettings(),
    getTodayAiSpendEur(payload),
  ])
  const budgetEur = settings.dailyBudgetEur
  if (!Number.isFinite(budgetEur) || budgetEur <= 0) return

  const ratio = spentEur / budgetEur
  const day = isoDayKey()

  // Count calls today to enrich the notification body.
  let callCount = 0
  try {
    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)
    const res = await payload.count({
      collection: 'auditLog' as any,
      where: {
        and: [
          { subsystem: { like: 'ai-' } },
          { createdAt: { greater_than_equal: startOfDay.toISOString() } },
        ],
      },
    })
    callCount = res?.totalDocs ?? 0
  } catch {
    callCount = 0
  }

  const body = `${spentEur.toFixed(4)}€ / ${budgetEur.toFixed(2)}€ · ${callCount} appels aujourd'hui`

  if (ratio >= 1) {
    await notify({
      type: 'critical',
      subsystem: 'ai',
      title: 'Budget IA quotidien dépassé',
      body,
      link: '/admin/ai-usage',
      source: 'ai-budget-watcher',
      dedupKey: `budget-100:${day}`,
      dedupWindowMinutes: 60 * 24,
      meta: { spentEur, budgetEur, ratio, day },
    })
    return
  }
  if (ratio >= 0.8) {
    await notify({
      type: 'warning',
      subsystem: 'ai',
      title: 'Budget IA : 80% consommé',
      body,
      link: '/admin/ai-usage',
      source: 'ai-budget-watcher',
      dedupKey: `budget-80:${day}`,
      dedupWindowMinutes: 60 * 24,
      meta: { spentEur, budgetEur, ratio, day },
    })
    return
  }
  if (ratio >= 0.5) {
    await notify({
      type: 'info',
      subsystem: 'ai',
      title: 'Budget IA : 50% consommé',
      body,
      link: '/admin/ai-usage',
      source: 'ai-budget-watcher',
      dedupKey: `budget-50:${day}`,
      dedupWindowMinutes: 60 * 24,
      meta: { spentEur, budgetEur, ratio, day },
    })
  }
}
