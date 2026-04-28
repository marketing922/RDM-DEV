import configPromise from '@payload-config'
import { getPayload } from 'payload'

export type AiSettings = {
  enabled: boolean
  dailyBudgetEur: number
  monthlyBudgetEur: number
  fallbackProvider: 'none' | 'claude-haiku'
  killSwitch: boolean
  maintenanceMessage: string
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: true,
  dailyBudgetEur: 0.5,
  monthlyBudgetEur: 15,
  fallbackProvider: 'none',
  killSwitch: false,
  maintenanceMessage: '',
}

export async function getAiSettings(): Promise<AiSettings> {
  try {
    const payload = await getPayload({ config: configPromise })
    const doc = (await payload.findGlobal({
      slug: 'siteSettings' as never,
      depth: 0,
    })) as any
    const ai = (doc?.ai ?? {}) as Partial<AiSettings>
    return {
      enabled: typeof ai.enabled === 'boolean' ? ai.enabled : DEFAULT_AI_SETTINGS.enabled,
      dailyBudgetEur:
        typeof ai.dailyBudgetEur === 'number'
          ? ai.dailyBudgetEur
          : DEFAULT_AI_SETTINGS.dailyBudgetEur,
      monthlyBudgetEur:
        typeof ai.monthlyBudgetEur === 'number'
          ? ai.monthlyBudgetEur
          : DEFAULT_AI_SETTINGS.monthlyBudgetEur,
      fallbackProvider:
        ai.fallbackProvider === 'claude-haiku' ? 'claude-haiku' : 'none',
      killSwitch:
        typeof ai.killSwitch === 'boolean'
          ? ai.killSwitch
          : DEFAULT_AI_SETTINGS.killSwitch,
      maintenanceMessage:
        typeof ai.maintenanceMessage === 'string'
          ? ai.maintenanceMessage
          : DEFAULT_AI_SETTINGS.maintenanceMessage,
    }
  } catch {
    return DEFAULT_AI_SETTINGS
  }
}

export type AiAvailability =
  | { ok: true }
  | { ok: false; reason: 'kill-switch' | 'disabled'; message?: string }

export async function isAiAvailable(): Promise<AiAvailability> {
  const settings = await getAiSettings()
  if (settings.killSwitch) {
    return {
      ok: false,
      reason: 'kill-switch',
      message: settings.maintenanceMessage || undefined,
    }
  }
  if (!settings.enabled) {
    return {
      ok: false,
      reason: 'disabled',
      message: settings.maintenanceMessage || undefined,
    }
  }
  return { ok: true }
}
