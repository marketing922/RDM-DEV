/**
 * Central prompt registry for "Les Remèdes de Mamie".
 *
 * Goal: every prompt the application sends to the LLM lives here, versioned,
 * so we can audit which prompt produced what (via AuditLog) and roll back to
 * an older version without code surgery.
 *
 * STRUCTURE
 * ---------
 * The registry exposes four "kinds":
 *   - editorial : system instruction for `/api/admin/ai-generate` (ai.ts)
 *   - geo       : per-field instructions for `/api/geo/generate` (geoGenerator.ts)
 *                  + a system instruction shared by all GEO fields
 *   - moderate  : system instruction for ai-moderate.ts
 *   - vision    : prompt builder for alt-text (alt-text.ts)
 *
 * Each kind is keyed by locale ('fr' | 'en') and version ('v1', 'v2', …).
 * Field guides for editorial generation are keyed by `${collection}.${field}`
 * and exposed under `fieldGuides`.
 *
 * ADDING A v2
 * -----------
 * 1. Open the relevant module (e.g. `geo-prompts.ts`).
 * 2. Add a `v2` entry next to the existing `v1` keeping the same shape.
 * 3. Either:
 *    a) callers can keep using `getPrompt({ kind, locale })` — by default the
 *       helper resolves the highest version found (lexicographic on the
 *       version string, so v10 > v2 > v1 ; we recommend zero-padding past v9).
 *    b) callers can opt-in explicitly: `getPrompt({ kind, locale, version: 'v2' })`.
 *
 * RUNNING THE EVAL
 * ----------------
 *   npx tsx tests/ai/eval.ts
 *
 * The eval will skip silently if `GEMINI_API_KEY` is missing or if the daily
 * AI budget is exhausted, so it is safe to wire into CI.
 */

import {
  EDITORIAL_SYSTEM_INSTRUCTIONS,
  GEO_SYSTEM_INSTRUCTIONS,
  type Locale,
  type SystemInstructionEntry,
} from './system-instructions'
import { FIELD_GUIDES, type FieldGuideEntry } from './field-guides'
import {
  GEO_PROMPTS,
  type GeoFieldType,
  type GeoPromptEntry,
} from './geo-prompts'
import { MODERATE_PROMPTS, type ModeratePromptEntry } from './moderate-prompt'
import { VISION_PROMPTS, type VisionPromptEntry } from './vision-prompt'
import { SEO_PROMPTS, type SeoPromptEntry } from './seo-prompt'

export type { Locale, GeoFieldType }
export type {
  SystemInstructionEntry,
  FieldGuideEntry,
  GeoPromptEntry,
  ModeratePromptEntry,
  VisionPromptEntry,
  SeoPromptEntry,
}

// ─── Registry ───────────────────────────────────────────────────────────────
// `as const` would be too noisy across the deeply-nested record; we expose the
// underlying maps directly. Type-safety lives in the narrow helpers below.

export const PROMPTS_REGISTRY = {
  editorial: EDITORIAL_SYSTEM_INSTRUCTIONS,
  geoSystem: GEO_SYSTEM_INSTRUCTIONS,
  geo: GEO_PROMPTS,
  moderate: MODERATE_PROMPTS,
  vision: VISION_PROMPTS,
  fieldGuides: FIELD_GUIDES,
  seoPack: SEO_PROMPTS,
} as const

export type PromptKind =
  | 'editorial'
  | 'geoSystem'
  | 'geo'
  | 'moderate'
  | 'vision'
  | 'fieldGuides'
  | 'seoPack'

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Pick the "default" version of a versioned record: highest version string by
 * lexicographic order (v1 < v2 < v10 only if zero-padded — keep them v01/v02
 * past v9 if you ever go there).
 */
function pickDefaultVersion(versions: string[]): string {
  if (versions.length === 0) {
    throw new Error('No versions available')
  }
  return [...versions].sort().reverse()[0]!
}

function notFound(message: string): never {
  throw new Error(`[prompt-registry] ${message}`)
}

// Lookup options accepted by `getPrompt`. We keep this loose at the type level
// because the registry has heterogeneous shapes; runtime validation handles the
// rest.
export type GetPromptOptions = {
  kind: PromptKind
  locale?: Locale
  field?: string // GEO field type or `${collection}.${rootField}` for fieldGuides
  version?: string
  hint?: string // for `vision` only
}

/**
 * Resolve a prompt to its raw text (or built string for vision).
 *
 * - editorial / geoSystem / moderate : returns the system-instruction text.
 * - geo                              : returns "instruction\n\n--- OUTPUT ---\nschemaHint"
 * - vision                           : returns the built prompt (uses opts.hint)
 * - fieldGuides                      : returns the guide text
 *
 * Throws with an explicit message when the lookup fails.
 */
export function getPrompt(opts: GetPromptOptions): string {
  const locale: Locale = opts.locale ?? 'fr'

  switch (opts.kind) {
    case 'editorial': {
      const localeMap = EDITORIAL_SYSTEM_INSTRUCTIONS[locale]
      if (!localeMap) notFound(`editorial: locale '${locale}' missing`)
      const version = opts.version ?? pickDefaultVersion(Object.keys(localeMap))
      const entry = localeMap[version]
      if (!entry) notFound(`editorial: version '${version}' missing for ${locale}`)
      return entry.text
    }
    case 'geoSystem': {
      const localeMap = GEO_SYSTEM_INSTRUCTIONS[locale]
      if (!localeMap) notFound(`geoSystem: locale '${locale}' missing`)
      const version = opts.version ?? pickDefaultVersion(Object.keys(localeMap))
      const entry = localeMap[version]
      if (!entry) notFound(`geoSystem: version '${version}' missing for ${locale}`)
      return entry.text
    }
    case 'geo': {
      if (!opts.field) notFound(`geo: opts.field is required (directAnswer | definition | keyTakeaways | faq)`)
      const fieldKey = opts.field as GeoFieldType
      const fieldMap = GEO_PROMPTS[fieldKey]
      if (!fieldMap) notFound(`geo: unknown field '${opts.field}'`)
      const localeMap = fieldMap[locale]
      if (!localeMap) notFound(`geo.${opts.field}: locale '${locale}' missing`)
      const version = opts.version ?? pickDefaultVersion(Object.keys(localeMap))
      const entry = localeMap[version]
      if (!entry) notFound(`geo.${opts.field}: version '${version}' missing for ${locale}`)
      return `${entry.instruction}\n\n${entry.schemaHint}`
    }
    case 'moderate': {
      const localeMap = MODERATE_PROMPTS[locale]
      if (!localeMap) notFound(`moderate: locale '${locale}' missing`)
      const version = opts.version ?? pickDefaultVersion(Object.keys(localeMap))
      const entry = localeMap[version]
      if (!entry) notFound(`moderate: version '${version}' missing for ${locale}`)
      return entry.text
    }
    case 'vision': {
      const localeMap = VISION_PROMPTS[locale]
      if (!localeMap) notFound(`vision: locale '${locale}' missing`)
      const version = opts.version ?? pickDefaultVersion(Object.keys(localeMap))
      const entry = localeMap[version]
      if (!entry) notFound(`vision: version '${version}' missing for ${locale}`)
      return entry.build(opts.hint)
    }
    case 'fieldGuides': {
      if (!opts.field) notFound(`fieldGuides: opts.field is required ('${'<collection>.<field>'}')`)
      const guides = FIELD_GUIDES[opts.field]
      if (!guides) {
        // Soft fallback: callers ask for arbitrary `${collection}.${field}`
        // pairs; if no guide exists, return an empty string so they can use a
        // generic descriptor on their side.
        return ''
      }
      const version = opts.version ?? pickDefaultVersion(Object.keys(guides))
      const entry = guides[version]
      if (!entry) notFound(`fieldGuides.${opts.field}: version '${version}' missing`)
      return entry.text
    }
    case 'seoPack': {
      const localeMap = SEO_PROMPTS[locale]
      if (!localeMap) notFound(`seoPack: locale '${locale}' missing`)
      const version = opts.version ?? pickDefaultVersion(Object.keys(localeMap))
      const entry = localeMap[version]
      if (!entry) notFound(`seoPack: version '${version}' missing for ${locale}`)
      return entry.text
    }
  }
}

/**
 * Same as `getPrompt`, but additionally returns the resolved version string
 * so callers can stamp it on responses for audit trails.
 */
export function getPromptWithVersion(opts: GetPromptOptions): {
  text: string
  version: string
} {
  // Resolve version explicitly so we can return it.
  let version: string
  const locale: Locale = opts.locale ?? 'fr'
  switch (opts.kind) {
    case 'editorial':
      version = opts.version ?? pickDefaultVersion(Object.keys(EDITORIAL_SYSTEM_INSTRUCTIONS[locale] ?? {}))
      break
    case 'geoSystem':
      version = opts.version ?? pickDefaultVersion(Object.keys(GEO_SYSTEM_INSTRUCTIONS[locale] ?? {}))
      break
    case 'geo': {
      if (!opts.field) notFound('geo: opts.field is required')
      const f = opts.field as GeoFieldType
      version = opts.version ?? pickDefaultVersion(Object.keys(GEO_PROMPTS[f]?.[locale] ?? {}))
      break
    }
    case 'moderate':
      version = opts.version ?? pickDefaultVersion(Object.keys(MODERATE_PROMPTS[locale] ?? {}))
      break
    case 'vision':
      version = opts.version ?? pickDefaultVersion(Object.keys(VISION_PROMPTS[locale] ?? {}))
      break
    case 'fieldGuides': {
      if (!opts.field) notFound('fieldGuides: opts.field is required')
      const guides = FIELD_GUIDES[opts.field]
      version = guides ? (opts.version ?? pickDefaultVersion(Object.keys(guides))) : 'none'
      break
    }
    case 'seoPack':
      version = opts.version ?? pickDefaultVersion(Object.keys(SEO_PROMPTS[locale] ?? {}))
      break
  }
  return { text: getPrompt(opts), version }
}

/**
 * List the version strings registered for a given (kind, locale, field) triple.
 * Empty array if nothing is registered.
 */
export function listPromptVersions(
  kind: PromptKind,
  opts?: { locale?: Locale; field?: string },
): string[] {
  const locale: Locale = opts?.locale ?? 'fr'
  switch (kind) {
    case 'editorial':
      return Object.keys(EDITORIAL_SYSTEM_INSTRUCTIONS[locale] ?? {})
    case 'geoSystem':
      return Object.keys(GEO_SYSTEM_INSTRUCTIONS[locale] ?? {})
    case 'geo': {
      if (!opts?.field) return []
      const f = opts.field as GeoFieldType
      return Object.keys(GEO_PROMPTS[f]?.[locale] ?? {})
    }
    case 'moderate':
      return Object.keys(MODERATE_PROMPTS[locale] ?? {})
    case 'vision':
      return Object.keys(VISION_PROMPTS[locale] ?? {})
    case 'fieldGuides': {
      if (!opts?.field) return []
      return Object.keys(FIELD_GUIDES[opts.field] ?? {})
    }
    case 'seoPack':
      return Object.keys(SEO_PROMPTS[locale] ?? {})
  }
}

/**
 * Convenience accessor used by the GEO generator: return both pieces (the
 * GEO-only callers need them separately to assemble the final prompt around
 * an XML context block).
 */
export function getGeoFieldSpec(
  field: GeoFieldType,
  locale: Locale = 'fr',
  version?: string,
): { instruction: string; schemaHint: string; version: string } {
  const fieldMap = GEO_PROMPTS[field]
  if (!fieldMap) notFound(`geo: unknown field '${field}'`)
  const localeMap = fieldMap[locale]
  if (!localeMap) notFound(`geo.${field}: locale '${locale}' missing`)
  const resolvedVersion = version ?? pickDefaultVersion(Object.keys(localeMap))
  const entry = localeMap[resolvedVersion]
  if (!entry) notFound(`geo.${field}: version '${resolvedVersion}' missing`)
  return {
    instruction: entry.instruction,
    schemaHint: entry.schemaHint,
    version: resolvedVersion,
  }
}

/**
 * Convenience accessor for the SEO pack prompt.
 * Returns the resolved system instruction text + the resolved version string,
 * so callers can stamp it on their audit log entries.
 */
export function getSeoPrompt(
  locale: Locale = 'fr',
  version?: string,
): { text: string; version: string } {
  const localeMap = SEO_PROMPTS[locale]
  if (!localeMap) notFound(`seoPack: locale '${locale}' missing`)
  const resolvedVersion = version ?? pickDefaultVersion(Object.keys(localeMap))
  const entry = localeMap[resolvedVersion]
  if (!entry) notFound(`seoPack: version '${resolvedVersion}' missing`)
  return { text: entry.text, version: resolvedVersion }
}
