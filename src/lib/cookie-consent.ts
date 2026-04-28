/**
 * RGPD-compliant cookie consent helper for "Les Remedes de Mamie".
 *
 * Storage strategy (dual write):
 * - localStorage key `rdm_consent` holds the canonical JSON (read first).
 * - Cookie `rdm_consent` holds the same JSON URL-encoded, SameSite=Lax, 6 months.
 *   The cookie acts as a fallback when localStorage is unavailable (some
 *   privacy browsers, iframe contexts) and is also readable by server-side
 *   code if we ever need to gate scripts at the SSR layer.
 *
 * Public API for third-party scripts (mounted on `window` once the banner
 * is rendered):
 *
 *     if (window.rdmConsent?.has('analytics')) {
 *       // safe to load Plausible / equivalent
 *     }
 *
 * The banner exposes `window.rdmConsent.open()` so other UI (footer link,
 * legal page) can re-open the preferences modal, and `window.rdmConsent.reset()`
 * to clear the stored decision and force a re-prompt.
 *
 * Versioning / re-prompt: bump `CONSENT_VERSION` whenever the cookie policy
 * changes in a way that requires the user to re-consent. `readConsent`
 * returns null if a stored payload was written under a different version,
 * which makes the banner reappear on the next page load.
 *
 * Plausible integration (later): mount the script behind a check like
 *
 *     if (typeof window !== 'undefined' && window.rdmConsent?.has('analytics')) {
 *       // dynamically inject <script data-domain="..." src="https://plausible.io/js/script.js" />
 *     }
 *
 * See `CookieBanner.tsx` for the UI; see `useConsent.ts` for the React hook.
 */

export type ConsentCategory = 'essential' | 'analytics' | 'marketing'

export type ConsentCategories = Record<ConsentCategory, boolean>

export type Consent = {
  /** Bumped when the cookie policy changes; mismatch forces a re-prompt. */
  version: number
  /** ISO 8601 timestamp of the user's decision. */
  decidedAt: string
  /** Per-category booleans. `essential` is always true. */
  categories: ConsentCategories
}

export const CONSENT_VERSION = 1
export const CONSENT_STORAGE_KEY = 'rdm_consent'
export const CONSENT_COOKIE_NAME = 'rdm_consent'
/** 6 months — CNIL recommendation. */
export const CONSENT_COOKIE_MAX_AGE_DAYS = 180

const COOKIE_MAX_AGE_SECONDS = CONSENT_COOKIE_MAX_AGE_DAYS * 86400

const DEFAULT_CATEGORIES: ConsentCategories = {
  essential: true,
  analytics: false,
  marketing: false,
}

const ALL_CATEGORIES: ConsentCategory[] = ['essential', 'analytics', 'marketing']

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null
  const prefix = `${name}=`
  const parts = document.cookie ? document.cookie.split('; ') : []
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      try {
        return decodeURIComponent(part.slice(prefix.length))
      } catch {
        return null
      }
    }
  }
  return null
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!isBrowser()) return
  const encoded = encodeURIComponent(value)
  // SameSite=Lax — readable by client JS (no HttpOnly), restricted enough for first-party.
  // No Secure flag forced here; we let the deployment env (https) handle it via Set-Cookie reverse proxy if needed.
  document.cookie = `${name}=${encoded}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`
}

function deleteCookie(name: string): void {
  if (!isBrowser()) return
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

function parseConsent(raw: string | null): Consent | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<Consent> & { categories?: Partial<ConsentCategories> }
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.version !== CONSENT_VERSION) return null
    if (typeof parsed.decidedAt !== 'string') return null
    if (!parsed.categories || typeof parsed.categories !== 'object') return null
    const categories: ConsentCategories = {
      essential: true,
      analytics: Boolean(parsed.categories.analytics),
      marketing: Boolean(parsed.categories.marketing),
    }
    return {
      version: CONSENT_VERSION,
      decidedAt: parsed.decidedAt,
      categories,
    }
  } catch {
    return null
  }
}

/**
 * Reads the stored consent. Returns null if nothing is stored, the payload is
 * malformed, or the stored version differs from `CONSENT_VERSION` (re-prompt).
 *
 * Reads localStorage first, then falls back to the cookie copy.
 */
export function readConsent(): Consent | null {
  if (!isBrowser()) return null

  // localStorage first
  try {
    const fromStorage = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    const parsed = parseConsent(fromStorage)
    if (parsed) return parsed
  } catch {
    // localStorage may throw in private mode; fall through to cookie.
  }

  // Cookie fallback
  const fromCookie = readCookie(CONSENT_COOKIE_NAME)
  return parseConsent(fromCookie)
}

/**
 * Persists a decision. `essential` is always forced to `true`. Writes both
 * localStorage and the `rdm_consent` cookie. Dispatches a `rdm:consent-change`
 * window event so React hooks can react to it.
 */
export function writeConsent(categories: Partial<ConsentCategories>): Consent {
  const merged: ConsentCategories = {
    essential: true,
    analytics: Boolean(categories.analytics),
    marketing: Boolean(categories.marketing),
  }
  const payload: Consent = {
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    categories: merged,
  }
  const json = JSON.stringify(payload)

  if (isBrowser()) {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, json)
    } catch {
      // ignore localStorage failures; cookie still wins.
    }
    writeCookie(CONSENT_COOKIE_NAME, json, COOKIE_MAX_AGE_SECONDS)
    try {
      window.dispatchEvent(new CustomEvent<Consent>('rdm:consent-change', { detail: payload }))
    } catch {
      // CustomEvent unsupported is unlikely in modern browsers.
    }
  }

  return payload
}

/** Clears stored consent (localStorage + cookie) and notifies listeners. */
export function clearConsent(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch {
    // ignore
  }
  deleteCookie(CONSENT_COOKIE_NAME)
  try {
    window.dispatchEvent(new CustomEvent<null>('rdm:consent-change', { detail: null }))
  } catch {
    // ignore
  }
}

/**
 * Returns true if the user has accepted the given category. `essential` is
 * always true. Returns false on the server (treat absence of consent as "no").
 */
export function hasConsent(category: ConsentCategory): boolean {
  if (category === 'essential') return true
  const consent = readConsent()
  if (!consent) return false
  return Boolean(consent.categories[category])
}

/** Convenience: list of all categories, in display order. */
export const CONSENT_CATEGORIES: ConsentCategory[] = ALL_CATEGORIES

/** Convenience: default state used to seed the preferences modal. */
export const DEFAULT_CONSENT_CATEGORIES: ConsentCategories = { ...DEFAULT_CATEGORIES }

declare global {
  interface Window {
    rdmConsent?: {
      has: (cat: ConsentCategory) => boolean
      open: () => void
      reset: () => void
    }
  }

  interface WindowEventMap {
    'rdm:consent-change': CustomEvent<Consent | null>
  }
}
