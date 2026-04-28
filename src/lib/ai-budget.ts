import type { Payload } from 'payload'
import { getAiSettings } from './ai-settings'

function startOfUtcDay(d: Date = new Date()): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  )
}

export async function getTodayAiSpendEur(payload: Payload): Promise<number> {
  try {
    const since = startOfUtcDay().toISOString()
    const result = await payload.find({
      collection: 'auditLog' as any,
      where: {
        and: [
          { subsystem: { like: 'ai-' } },
          { createdAt: { greater_than_equal: since } },
        ],
      },
      limit: 1000,
      depth: 0,
      pagination: false,
    })
    const docs = (result?.docs ?? []) as Array<Record<string, any>>
    let total = 0
    for (const doc of docs) {
      const cost = doc?.costEur
      if (typeof cost === 'number' && Number.isFinite(cost)) {
        total += cost
      }
    }
    return total
  } catch {
    return 0
  }
}

export type DailyBudgetStatus = {
  ok: boolean
  spentEur: number
  budgetEur: number
  remainingEur: number
}

export async function isWithinDailyBudget(
  payload: Payload,
): Promise<DailyBudgetStatus> {
  const [settings, spentEur] = await Promise.all([
    getAiSettings(),
    getTodayAiSpendEur(payload),
  ])
  const budgetEur = settings.dailyBudgetEur
  const remainingEur = Math.max(0, budgetEur - spentEur)
  return {
    ok: spentEur < budgetEur,
    spentEur,
    budgetEur,
    remainingEur,
  }
}
