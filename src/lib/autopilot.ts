import 'server-only'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Payload } from 'payload'

import { getTodayAiSpendEur } from './ai-budget'
import { isAiAvailable } from './ai-settings'
import { produceContent } from './content-orchestrator'
import { generateEmbedding } from './embeddings'
import { semanticSearch } from './embeddings-db'
import { captureError } from './error-tracker'
import { notify } from './notify'
import { discoverBlogTopics, discoverPlantTopics, type TopicCandidate } from './trends-discovery'

/**
 * Autopilot — orchestrates autonomous wiki/blog production runs.
 *
 * Wired to a 30-min Vercel Cron tick (`/api/cron/autopilot/tick`). Each tick
 * decides — based on SiteSettings.autopilot — whether to actually launch a
 * production. Topic discovery uses Gemini grounded search; semantic dedup
 * filters out topics already covered.
 */

export type AutopilotKind = 'wiki' | 'blog'

export type AutopilotTickResult = {
  ok: boolean
  action: 'idle' | 'skipped' | 'launched' | 'failed'
  /** Human-readable explanation. */
  reason?: string
  runId?: string | number
  candidate?: { kind: AutopilotKind; seed: string }
  durationMs: number
}

type AutopilotSettings = {
  enabled: boolean
  cronTickMinutes: number
  hoursWindow: { start: number; end: number }
  daysOfWeek: string[]
  dailyMaxProductions: number
  contentMix: { wiki: number; blog: number }
  budgetCapDailyEur: number
  excludeKnownTopics: boolean
  locale: 'fr' | 'en'
  lastTickAt?: string | null
  lastSuccessAt?: string | null
  lastErrorAt?: string | null
  lastErrorMessage?: string | null
}

const DEFAULTS: AutopilotSettings = {
  enabled: false,
  cronTickMinutes: 30,
  hoursWindow: { start: 7, end: 19 },
  daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
  dailyMaxProductions: 3,
  contentMix: { wiki: 0.6, blog: 0.4 },
  budgetCapDailyEur: 0.2,
  excludeKnownTopics: true,
  locale: 'fr',
}

const DAY_KEYS: Record<number, string> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
}

const SIMILARITY_THRESHOLD = 0.85

// ─── Settings reader ────────────────────────────────────────────────────

function readAutopilotSettings(raw: unknown): AutopilotSettings {
  const ap = (raw as { autopilot?: Record<string, unknown> } | null)?.autopilot ?? {}
  const hoursWindowRaw = (ap.hoursWindow as Record<string, unknown> | undefined) ?? {}
  const contentMixRaw = (ap.contentMix as Record<string, unknown> | undefined) ?? {}
  const days = Array.isArray(ap.daysOfWeek)
    ? (ap.daysOfWeek as unknown[]).filter((d): d is string => typeof d === 'string')
    : DEFAULTS.daysOfWeek

  return {
    enabled: typeof ap.enabled === 'boolean' ? ap.enabled : DEFAULTS.enabled,
    cronTickMinutes:
      typeof ap.cronTickMinutes === 'number' && ap.cronTickMinutes > 0
        ? ap.cronTickMinutes
        : DEFAULTS.cronTickMinutes,
    hoursWindow: {
      start:
        typeof hoursWindowRaw.start === 'number'
          ? Math.max(0, Math.min(23, hoursWindowRaw.start))
          : DEFAULTS.hoursWindow.start,
      end:
        typeof hoursWindowRaw.end === 'number'
          ? Math.max(0, Math.min(23, hoursWindowRaw.end))
          : DEFAULTS.hoursWindow.end,
    },
    daysOfWeek: days.length > 0 ? days : DEFAULTS.daysOfWeek,
    dailyMaxProductions:
      typeof ap.dailyMaxProductions === 'number'
        ? Math.max(0, ap.dailyMaxProductions)
        : DEFAULTS.dailyMaxProductions,
    contentMix: {
      wiki:
        typeof contentMixRaw.wiki === 'number'
          ? Math.max(0, Math.min(1, contentMixRaw.wiki))
          : DEFAULTS.contentMix.wiki,
      blog:
        typeof contentMixRaw.blog === 'number'
          ? Math.max(0, Math.min(1, contentMixRaw.blog))
          : DEFAULTS.contentMix.blog,
    },
    budgetCapDailyEur:
      typeof ap.budgetCapDailyEur === 'number' && ap.budgetCapDailyEur >= 0
        ? ap.budgetCapDailyEur
        : DEFAULTS.budgetCapDailyEur,
    excludeKnownTopics:
      typeof ap.excludeKnownTopics === 'boolean'
        ? ap.excludeKnownTopics
        : DEFAULTS.excludeKnownTopics,
    locale: ap.locale === 'en' ? 'en' : 'fr',
    lastTickAt: typeof ap.lastTickAt === 'string' ? ap.lastTickAt : null,
    lastSuccessAt: typeof ap.lastSuccessAt === 'string' ? ap.lastSuccessAt : null,
    lastErrorAt: typeof ap.lastErrorAt === 'string' ? ap.lastErrorAt : null,
    lastErrorMessage:
      typeof ap.lastErrorMessage === 'string' ? ap.lastErrorMessage : null,
  }
}

// ─── Window checks ──────────────────────────────────────────────────────

function isInHoursWindow(now: Date, window: { start: number; end: number }): boolean {
  const h = now.getUTCHours()
  const { start, end } = window
  if (start === end) return true // 24/7
  if (start < end) return h >= start && h < end
  // wrap-around (e.g. 22..6)
  return h >= start || h < end
}

function isInDayList(now: Date, days: string[]): boolean {
  const key = DAY_KEYS[now.getUTCDay()]
  return days.includes(key)
}

function startOfUtcDayIso(now: Date = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  ).toISOString()
}

// ─── Selection helpers ──────────────────────────────────────────────────

function pickKindByMix(mix: { wiki: number; blog: number }): AutopilotKind {
  const wikiW = Math.max(0, mix.wiki)
  const blogW = Math.max(0, mix.blog)
  const total = wikiW + blogW
  if (total <= 0) return Math.random() < 0.5 ? 'wiki' : 'blog'
  const r = Math.random() * total
  return r < wikiW ? 'wiki' : 'blog'
}

function pickWeightedByTrendScore(candidates: TopicCandidate[]): TopicCandidate | null {
  if (candidates.length === 0) return null
  const weights = candidates.map((c) => Math.max(0.01, c.trendScore))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]
    if (r <= 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}

// ─── Counting today's autopilot runs ────────────────────────────────────

async function countTodayCronRuns(payload: Payload): Promise<number> {
  try {
    const since = startOfUtcDayIso()
    const result = await payload.find({
      collection: 'productionRun' as never,
      where: {
        and: [
          { initiatedBy: { equals: 'cron' } },
          { createdAt: { greater_than_equal: since } },
        ],
      },
      limit: 0,
      depth: 0,
      pagination: true,
      overrideAccess: true,
    } as never)
    const total = (result as { totalDocs?: number })?.totalDocs
    return typeof total === 'number' ? total : 0
  } catch (err) {
    console.warn('[autopilot] countTodayCronRuns failed', err)
    return 0
  }
}

// ─── Settings update helper ─────────────────────────────────────────────

async function updateAutopilotState(
  payload: Payload,
  patch: Partial<{
    lastTickAt: string
    lastSuccessAt: string
    lastErrorAt: string
    lastErrorMessage: string | null
  }>,
): Promise<void> {
  try {
    const current = (await payload.findGlobal({
      slug: 'siteSettings' as never,
      depth: 0,
    })) as Record<string, unknown>
    const ap = (current?.autopilot as Record<string, unknown> | undefined) ?? {}
    const merged = { ...ap, ...patch }
    await payload.updateGlobal({
      slug: 'siteSettings' as never,
      data: { autopilot: merged } as never,
    })
  } catch (err) {
    console.warn('[autopilot] updateAutopilotState failed', err)
  }
}

// ─── Dedup ──────────────────────────────────────────────────────────────

async function filterOutKnownTopics(
  candidates: TopicCandidate[],
  collectionSlug: 'wikiEntries' | 'blogPosts',
  locale: 'fr' | 'en',
): Promise<TopicCandidate[]> {
  const survivors: TopicCandidate[] = []
  for (const cand of candidates) {
    try {
      const { vector } = await generateEmbedding(cand.seed)
      const matches = await semanticSearch({
        queryVector: vector,
        collectionSlugs: [collectionSlug],
        locale,
        model: 'gemini-embedding-001',
        limit: 1,
        minScore: SIMILARITY_THRESHOLD,
      })
      if (matches.length === 0) {
        survivors.push(cand)
      }
    } catch (err) {
      // On embedding failure, keep the candidate (don't lose the queue) but warn.
      console.warn(
        `[autopilot] dedup embedding failed for "${cand.seed}"; keeping candidate`,
        err,
      )
      survivors.push(cand)
    }
  }
  return survivors
}

// ─── Public entrypoint ──────────────────────────────────────────────────

export async function runAutopilotTick(opts?: {
  force?: boolean
  onlyKind?: AutopilotKind
}): Promise<AutopilotTickResult> {
  const startedAt = Date.now()
  const force = Boolean(opts?.force)
  const onlyKind = opts?.onlyKind

  const payload = await getPayload({ config: configPromise })
  const now = new Date()
  const nowIso = now.toISOString()

  // Always try to record a tick attempt.
  await updateAutopilotState(payload, { lastTickAt: nowIso })

  let raw: unknown
  try {
    raw = await payload.findGlobal({ slug: 'siteSettings' as never, depth: 0 })
  } catch (err) {
    await captureError(err, {
      subsystem: 'content-orchestrator',
      level: 'error',
      context: { phase: 'autopilot-load-settings' },
    })
    return {
      ok: false,
      action: 'failed',
      reason: 'Settings load failed',
      durationMs: Date.now() - startedAt,
    }
  }
  const settings = readAutopilotSettings(raw)

  // 1. Enabled
  if (!settings.enabled && !force) {
    return { ok: true, action: 'idle', reason: 'autopilot_disabled', durationMs: Date.now() - startedAt }
  }

  // 2. Cooldown (cronTickMinutes since last *successful tick* — we use lastTickAt)
  if (!force && settings.lastTickAt) {
    const last = Date.parse(settings.lastTickAt)
    if (Number.isFinite(last)) {
      const elapsedMin = (now.getTime() - last) / 60_000
      if (elapsedMin < settings.cronTickMinutes) {
        return {
          ok: true,
          action: 'idle',
          reason: `cooldown (${Math.round(elapsedMin)}min < ${settings.cronTickMinutes}min)`,
          durationMs: Date.now() - startedAt,
        }
      }
    }
  }

  // 3. Hours window (UTC)
  if (!force && !isInHoursWindow(now, settings.hoursWindow)) {
    return {
      ok: true,
      action: 'idle',
      reason: `outside hours window (${settings.hoursWindow.start}..${settings.hoursWindow.end} UTC)`,
      durationMs: Date.now() - startedAt,
    }
  }

  // 4. Day of week
  if (!force && !isInDayList(now, settings.daysOfWeek)) {
    return {
      ok: true,
      action: 'idle',
      reason: 'outside active days',
      durationMs: Date.now() - startedAt,
    }
  }

  // 5. Daily max productions
  const todayCount = await countTodayCronRuns(payload)
  if (todayCount >= settings.dailyMaxProductions) {
    return {
      ok: true,
      action: 'idle',
      reason: `daily max reached (${todayCount}/${settings.dailyMaxProductions})`,
      durationMs: Date.now() - startedAt,
    }
  }

  // 6. Kill-switch global
  const availability = await isAiAvailable()
  if (!availability.ok) {
    return {
      ok: true,
      action: 'idle',
      reason: `ai_unavailable (${availability.reason})`,
      durationMs: Date.now() - startedAt,
    }
  }

  // 7. Autopilot daily budget
  const spent = await getTodayAiSpendEur(payload)
  if (spent >= settings.budgetCapDailyEur) {
    return {
      ok: true,
      action: 'idle',
      reason: `autopilot daily budget reached (${spent.toFixed(4)}€ / ${settings.budgetCapDailyEur.toFixed(2)}€)`,
      durationMs: Date.now() - startedAt,
    }
  }

  // 8. Pick kind
  const kind: AutopilotKind = onlyKind ?? pickKindByMix(settings.contentMix)

  // 9. Discover candidates
  let discovery: { candidates: TopicCandidate[]; totalCostEur: number }
  try {
    discovery =
      kind === 'wiki'
        ? await discoverPlantTopics({ limit: 15, locale: settings.locale })
        : await discoverBlogTopics({ limit: 15, locale: settings.locale })
  } catch (err) {
    await captureError(err, {
      subsystem: 'ai-research',
      level: 'error',
      context: { phase: 'autopilot-discovery', kind },
    })
    const message = err instanceof Error ? err.message : String(err)
    await updateAutopilotState(payload, {
      lastErrorAt: nowIso,
      lastErrorMessage: message,
    })
    await notify({
      type: 'error',
      subsystem: 'content',
      title: 'Autopilote : découverte de sujets en échec',
      body: message,
      source: 'autopilot',
      dedupKey: `autopilot-error-${nowIso.slice(0, 10)}`,
      dedupWindowMinutes: 60,
    }).catch(() => undefined)
    return {
      ok: false,
      action: 'failed',
      reason: `discovery_failed: ${message}`,
      durationMs: Date.now() - startedAt,
    }
  }

  let candidates = discovery.candidates
  if (candidates.length === 0) {
    return {
      ok: true,
      action: 'idle',
      reason: 'no candidates returned by discovery',
      durationMs: Date.now() - startedAt,
    }
  }

  // 10. Filter known topics via embeddings
  if (settings.excludeKnownTopics) {
    const collectionSlug = kind === 'wiki' ? 'wikiEntries' : 'blogPosts'
    candidates = await filterOutKnownTopics(candidates, collectionSlug, settings.locale)
  }

  if (candidates.length === 0) {
    console.warn('[autopilot] all candidates filtered out by dedup')
    return {
      ok: true,
      action: 'idle',
      reason: 'all candidates already covered (semantic dedup)',
      durationMs: Date.now() - startedAt,
    }
  }

  // 11. Pick one weighted by trendScore
  const chosen = pickWeightedByTrendScore(candidates)
  if (!chosen) {
    return {
      ok: true,
      action: 'idle',
      reason: 'no candidate selected',
      durationMs: Date.now() - startedAt,
    }
  }

  // 12. Launch production
  try {
    const result = await produceContent({
      kind,
      seed: chosen.seed,
      brief: chosen.brief,
      mode: 'autonomous',
      initiatedBy: 'cron',
      actorId: 'autopilot',
      locale: settings.locale,
    })

    if (result.status === 'failed') {
      const message = result.errorMessage || result.errorCode || 'unknown'
      await updateAutopilotState(payload, {
        lastErrorAt: nowIso,
        lastErrorMessage: message,
      })
      await notify({
        type: 'error',
        subsystem: 'content',
        title: `Autopilote : production ${kind} échouée`,
        body: `Sujet: "${chosen.seed}". Erreur: ${message}`,
        source: 'autopilot',
        meta: { runId: result.runId, kind, seed: chosen.seed, errorCode: result.errorCode },
        dedupKey: `autopilot-error-${nowIso.slice(0, 10)}`,
        dedupWindowMinutes: 60,
      }).catch(() => undefined)
      return {
        ok: false,
        action: 'failed',
        reason: message,
        runId: result.runId,
        candidate: { kind, seed: chosen.seed },
        durationMs: Date.now() - startedAt,
      }
    }

    await updateAutopilotState(payload, {
      lastSuccessAt: nowIso,
      lastErrorMessage: null,
    })
    return {
      ok: true,
      action: 'launched',
      reason: `produced ${kind}/${chosen.seed}`,
      runId: result.runId,
      candidate: { kind, seed: chosen.seed },
      durationMs: Date.now() - startedAt,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await captureError(err, {
      subsystem: 'content-orchestrator',
      level: 'error',
      context: { phase: 'autopilot-produce', kind, seed: chosen.seed },
    })
    await updateAutopilotState(payload, {
      lastErrorAt: nowIso,
      lastErrorMessage: message,
    })
    await notify({
      type: 'error',
      subsystem: 'content',
      title: `Autopilote : production ${kind} a levé une exception`,
      body: `Sujet: "${chosen.seed}". Erreur: ${message}`,
      source: 'autopilot',
      dedupKey: `autopilot-error-${nowIso.slice(0, 10)}`,
      dedupWindowMinutes: 60,
    }).catch(() => undefined)
    return {
      ok: false,
      action: 'failed',
      reason: message,
      candidate: { kind, seed: chosen.seed },
      durationMs: Date.now() - startedAt,
    }
  }
}
