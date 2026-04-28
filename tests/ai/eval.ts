/**
 * AI prompt eval set — runs a small fixture of real-world cases against the
 * production lib functions and asserts shape/length/forbidden-claim invariants.
 *
 * Usage:
 *   npx tsx tests/ai/eval.ts
 *
 * Behavior:
 *   - Skips silently (exit 0) if GEMINI_API_KEY is not configured.
 *   - Skips silently (exit 0) if the daily AI budget has been exhausted.
 *   - Prints a per-case summary, exits 1 if any assertion fails.
 *
 * This is intentionally a plain imperative script — no jest/vitest. We want
 * it to be cheap to run, cheap to read, and easy to extend.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

import { callAI, type AIGenerateRequest } from '../../src/lib/ai'
import { generateGeoField, type GeoFieldType, type GeoContext, type GeoLocale } from '../../src/lib/geoGenerator'
import { moderateClaims, type ModerationVerdict } from '../../src/lib/ai-moderate'
import { FORBIDDEN_CLAIM_PATTERNS } from '../../src/lib/claims-whitelist'

type Case =
  | {
      id: string
      kind: 'ai-generate'
      input: AIGenerateRequest
      assertions: {
        lengthMin?: number
        lengthMax?: number
        noForbiddenClaims?: boolean
      }
    }
  | {
      id: string
      kind: 'ai-moderate'
      input: { text: string; locale?: 'fr' | 'en' }
      assertions: { verdict: ModerationVerdict }
    }
  | {
      id: string
      kind: 'geo-generate'
      input: { field: GeoFieldType; locale?: GeoLocale; ctx: GeoContext }
      assertions: {
        lengthMin?: number
        lengthMax?: number
        noForbiddenClaims?: boolean
      }
    }

type CaseFailure = { caseId: string; reason: string }

function loadCases(): Case[] {
  const filePath = path.resolve(__dirname, 'cases.json')
  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw) as Case[]
}

function detectForbiddenClaims(text: string): string[] {
  const lower = text.toLowerCase()
  const hits: string[] = []
  for (const p of FORBIDDEN_CLAIM_PATTERNS) {
    if (p.severity !== 'critical') continue
    if (p.regex.test(lower)) hits.push(p.description)
  }
  return hits
}

function withinTolerance(value: number, target: number): boolean {
  // ±20% tolerance per spec.
  const lower = target * 0.8
  const upper = target * 1.2
  return value >= lower && value <= upper
}

async function runAiGenerateCase(c: Extract<Case, { kind: 'ai-generate' }>): Promise<string | null> {
  const out = await callAI(c.input)
  if (!out.text || out.text.length === 0) return 'empty text'

  const length = out.text.length
  const { lengthMin, lengthMax, noForbiddenClaims } = c.assertions
  if (typeof lengthMin === 'number') {
    const tolMin = lengthMin * 0.8
    if (length < tolMin) return `length ${length} below tolerance min ${tolMin.toFixed(0)} (target ${lengthMin})`
  }
  if (typeof lengthMax === 'number') {
    const tolMax = lengthMax * 1.2
    if (length > tolMax) return `length ${length} above tolerance max ${tolMax.toFixed(0)} (target ${lengthMax})`
  }
  if (noForbiddenClaims) {
    const hits = detectForbiddenClaims(out.text)
    if (hits.length > 0) return `forbidden claims detected: ${hits.join(', ')}`
  }
  return null
}

async function runModerateCase(c: Extract<Case, { kind: 'ai-moderate' }>): Promise<string | null> {
  const out = await moderateClaims({ text: c.input.text, locale: c.input.locale })
  if (out.verdict !== c.assertions.verdict) {
    return `expected verdict '${c.assertions.verdict}', got '${out.verdict}' (reason: ${out.reason})`
  }
  return null
}

async function runGeoCase(c: Extract<Case, { kind: 'geo-generate' }>): Promise<string | null> {
  const out = await generateGeoField(c.input.field, c.input.ctx, c.input.locale ?? 'fr')

  // Compose a single string for length/claim assertions.
  let composed = ''
  if (out.field === 'directAnswer' || out.field === 'definition') composed = out.text
  else if (out.field === 'keyTakeaways') composed = out.items.join(' ')
  else if (out.field === 'faq') composed = out.items.map((it) => `${it.question} ${it.answer}`).join(' ')

  if (!composed.length) return 'empty composed output'

  const length = composed.length
  const { lengthMin, lengthMax, noForbiddenClaims } = c.assertions
  if (typeof lengthMin === 'number' && !withinTolerance(length, lengthMin)) {
    if (length < lengthMin * 0.8) return `composed length ${length} below tolerance min ${(lengthMin * 0.8).toFixed(0)}`
  }
  if (typeof lengthMax === 'number' && length > lengthMax * 1.2) {
    return `composed length ${length} above tolerance max ${(lengthMax * 1.2).toFixed(0)}`
  }
  if (noForbiddenClaims) {
    const hits = detectForbiddenClaims(composed)
    if (hits.length > 0) return `forbidden claims detected: ${hits.join(', ')}`
  }
  return null
}

async function checkBudget(): Promise<{ ok: boolean; reason?: string }> {
  // Budget check is best-effort. If we cannot resolve a Payload instance
  // (eval may run outside Next), we simply skip the check.
  try {
    const [{ default: configPromise }, { getPayload }, { isWithinDailyBudget }] = await Promise.all([
      import('../../src/payload.config'),
      import('payload'),
      import('../../src/lib/ai-budget'),
    ])
    const payload = await getPayload({ config: configPromise })
    const status = await isWithinDailyBudget(payload)
    if (!status.ok) {
      return { ok: false, reason: `daily budget exhausted (spent ${status.spentEur.toFixed(3)} / ${status.budgetEur} EUR)` }
    }
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // If Payload init fails (no DB url etc.), do not fail the eval.
    return { ok: true, reason: `budget check skipped: ${msg}` }
  }
}

async function main(): Promise<void> {
  if (!process.env.GEMINI_API_KEY) {
    console.log('[eval] GEMINI_API_KEY missing — skipping')
    process.exit(0)
  }

  const budget = await checkBudget()
  if (!budget.ok) {
    console.log(`[eval] ${budget.reason} — skipping`)
    process.exit(0)
  }
  if (budget.reason) {
    console.log(`[eval] note: ${budget.reason}`)
  }

  const cases = loadCases()
  console.log(`[eval] running ${cases.length} cases…`)

  const failures: CaseFailure[] = []
  let passed = 0

  for (const c of cases) {
    const startedAt = Date.now()
    try {
      let reason: string | null = null
      if (c.kind === 'ai-generate') reason = await runAiGenerateCase(c)
      else if (c.kind === 'ai-moderate') reason = await runModerateCase(c)
      else if (c.kind === 'geo-generate') reason = await runGeoCase(c)
      else {
        reason = `unknown kind '${(c as { kind?: string }).kind}'`
      }

      const dt = Date.now() - startedAt
      if (reason) {
        failures.push({ caseId: c.id, reason })
        console.log(`  FAIL  ${c.id}  (${dt}ms)  — ${reason}`)
      } else {
        passed += 1
        console.log(`  PASS  ${c.id}  (${dt}ms)`)
      }
    } catch (err) {
      const dt = Date.now() - startedAt
      const msg = err instanceof Error ? err.message : String(err)
      failures.push({ caseId: c.id, reason: `threw: ${msg}` })
      console.log(`  FAIL  ${c.id}  (${dt}ms)  — threw: ${msg}`)
    }
  }

  console.log('')
  console.log(`[eval] passed ${passed}/${cases.length}, failed ${failures.length}`)
  if (failures.length > 0) {
    console.log('[eval] failures:')
    for (const f of failures) console.log(`  - ${f.caseId}: ${f.reason}`)
    process.exit(1)
  }
  process.exit(0)
}

main().catch((err) => {
  const msg = err instanceof Error ? err.stack || err.message : String(err)
  console.error('[eval] fatal:', msg)
  process.exit(1)
})
