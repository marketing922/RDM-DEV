import type { Payload } from 'payload'

// Type — re-exportable for UI consumers
export type SiteSettings = {
  general: {
    siteName: string
    baseline: string
    primaryLanguage: 'fr-FR' | 'en-US'
    timezone: string
    shortDescription: string
  }
  brand: {
    logo?: {
      id?: string
      url?: string
      filename?: string
      filesize?: number
      mimeType?: string
    } | null
  }
  seo: {
    defaultTitle: string
    defaultDescription: string
    canonicalHostname: string
  }
  newsletter: {
    provider: 'none' | 'brevo'
    listId?: string
  }
  boutique: {
    defaultCurrency: 'EUR' | 'USD' | 'GBP'
    stripeEnabled: boolean
  }
  integrations: {
    stripeConnected: boolean
    brevoConnected: boolean
    algoliaConnected: boolean
    googleAnalyticsId?: string
    instagramHandle?: string
  }
  developers: {
    webhookUrl?: string
  }
  backups: {
    retentionDays: number
  }
}

// Defaults used when the Global has never been saved yet
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  general: {
    siteName: 'Les Remèdes de Mamie',
    baseline: "L'almanach des plantes qui soignent",
    primaryLanguage: 'fr-FR',
    timezone: 'Europe/Paris',
    shortDescription:
      'Une encyclopédie botanique réunissant les savoirs de la pharmacopée française et de la médecine traditionnelle chinoise — rigoureusement sourcée, illustrée, et lisible par tous.',
  },
  brand: { logo: null },
  seo: {
    defaultTitle: 'Les Remèdes de Mamie',
    defaultDescription:
      'Une encyclopédie botanique réunissant les savoirs de la pharmacopée française et de la médecine traditionnelle chinoise — rigoureusement sourcée, illustrée, et lisible par tous.',
    canonicalHostname: 'https://lesremedesdmamie.fr',
  },
  newsletter: { provider: 'none', listId: '' },
  boutique: { defaultCurrency: 'EUR', stripeEnabled: false },
  integrations: {
    stripeConnected: false,
    brevoConnected: false,
    algoliaConnected: false,
    googleAnalyticsId: '',
    instagramHandle: '',
  },
  developers: { webhookUrl: '' },
  backups: { retentionDays: 30 },
}

// Merge a partial or null/undefined settings with defaults — used to hydrate UI state safely
export function withDefaults(
  settings: Partial<SiteSettings> | null | undefined,
): SiteSettings {
  if (!settings) return DEFAULT_SITE_SETTINGS
  return {
    general: { ...DEFAULT_SITE_SETTINGS.general, ...(settings.general || {}) },
    brand: { ...DEFAULT_SITE_SETTINGS.brand, ...(settings.brand || {}) },
    seo: { ...DEFAULT_SITE_SETTINGS.seo, ...(settings.seo || {}) },
    newsletter: {
      ...DEFAULT_SITE_SETTINGS.newsletter,
      ...(settings.newsletter || {}),
    },
    boutique: {
      ...DEFAULT_SITE_SETTINGS.boutique,
      ...(settings.boutique || {}),
    },
    integrations: {
      ...DEFAULT_SITE_SETTINGS.integrations,
      ...(settings.integrations || {}),
    },
    developers: {
      ...DEFAULT_SITE_SETTINGS.developers,
      ...(settings.developers || {}),
    },
    backups: {
      ...DEFAULT_SITE_SETTINGS.backups,
      ...(settings.backups || {}),
    },
  }
}

// Server-side fetch — use in server components
export async function loadSiteSettings(payload: Payload): Promise<SiteSettings> {
  try {
    const doc = await payload.findGlobal({
      slug: 'siteSettings' as never,
      depth: 1,
    })
    return withDefaults(doc as unknown as Partial<SiteSettings>)
  } catch {
    return DEFAULT_SITE_SETTINGS
  }
}

// Client-side fetch via REST — use in client components
export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch('/api/globals/siteSettings', {
      credentials: 'include',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    // Payload returns the global directly for Globals REST endpoint
    return withDefaults(data as Partial<SiteSettings>)
  } catch {
    return DEFAULT_SITE_SETTINGS
  }
}

// Client-side save via custom admin endpoint (wraps Payload Local API).
// Direct REST `/api/globals/:slug` has proven flaky across Payload 3.x versions;
// this custom route is stable and auth-gated.
export async function saveSiteSettings(
  patch: Partial<SiteSettings>,
): Promise<SiteSettings> {
  const res = await fetch('/api/admin/site-settings', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(errText || `Sauvegarde échouée (HTTP ${res.status})`)
  }
  const data = await res.json()
  // Payload wraps the saved global in { message, result }
  const saved = (data?.result ?? data) as Partial<SiteSettings>
  return withDefaults(saved)
}

// Utility: diff check for dirty state
export function isSettingsDirty(a: SiteSettings, b: SiteSettings): boolean {
  return JSON.stringify(a) !== JSON.stringify(b)
}
