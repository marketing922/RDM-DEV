/**
 * Backfill embeddings for already-published content.
 *
 * Usage :
 *   npx tsx src/scripts/backfill-embeddings.ts [options]
 *
 * Options :
 *   --collection=<slug>   Limit to a single collection
 *                         (wikiEntries | blogPosts | benefits | products)
 *   --limit=<n>           Cap the number of docs processed per collection
 *   --locale=<fr|en>      Locale flag passed to embedAndStore (default: fr)
 *   --dry-run             Do not call Gemini nor write to DB; just report
 *
 * Behaviour :
 *   - Idempotent : embed-orchestrator skips rows whose source_hash matches.
 *   - Resilient  : per-doc errors are logged and the loop continues; only
 *                  kill-switch / budget aborts the whole run.
 *   - Cheap      : ~500 docs ≈ 0.05 € (Gemini text-embedding-004 pricing).
 *
 * Exit code :
 *   0 = success or only skips
 *   1 = at least one error, or aborted by kill-switch / budget
 */

import type { Pool } from 'pg'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import {
  embedAndStore,
  type EmbedCollectionSlug,
  type EmbedOutcome,
} from '@/lib/embed-orchestrator'
import {
  benefitsExtractor,
  blogPostsExtractor,
  productsExtractor,
  wikiEntriesExtractor,
} from '@/hooks/embedExtractors'
import type { ExtractorFn } from '@/hooks/embedAfterChange'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Locale = 'fr' | 'en'

type CliArgs = {
  collection?: EmbedCollectionSlug
  limit?: number
  locale?: Locale
  dryRun: boolean
}

type CollectionStats = {
  ok: number
  skipped: number
  errors: number
}

type RunStats = Record<EmbedCollectionSlug, CollectionStats>

const ALL_COLLECTIONS: readonly EmbedCollectionSlug[] = [
  'wikiEntries',
  'blogPosts',
  'benefits',
  'products',
] as const

const PER_DOC_PAUSE_MS = 50
const RATE_LIMIT_PAUSE_MS = 60_000

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isEmbedCollectionSlug(value: string): value is EmbedCollectionSlug {
  return (ALL_COLLECTIONS as readonly string[]).includes(value)
}

function isLocale(value: string): value is Locale {
  return value === 'fr' || value === 'en'
}

function parseArgs(): CliArgs {
  const args: CliArgs = { dryRun: false }
  for (const raw of process.argv.slice(2)) {
    if (raw === '--dry-run') {
      args.dryRun = true
      continue
    }
    if (raw.startsWith('--collection=')) {
      const value = raw.slice('--collection='.length)
      if (!isEmbedCollectionSlug(value)) {
        throw new Error(
          `Invalid --collection value "${value}". Expected one of: ${ALL_COLLECTIONS.join(', ')}`,
        )
      }
      args.collection = value
      continue
    }
    if (raw.startsWith('--limit=')) {
      const value = Number.parseInt(raw.slice('--limit='.length), 10)
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`Invalid --limit value "${raw}". Expected a positive integer.`)
      }
      args.limit = value
      continue
    }
    if (raw.startsWith('--locale=')) {
      const value = raw.slice('--locale='.length)
      if (!isLocale(value)) {
        throw new Error(`Invalid --locale value "${value}". Expected fr or en.`)
      }
      args.locale = value
      continue
    }
    throw new Error(`Unknown argument: ${raw}`)
  }
  return args
}

function mapSlugToExtractor(slug: EmbedCollectionSlug): ExtractorFn | null {
  switch (slug) {
    case 'wikiEntries':
      return wikiEntriesExtractor
    case 'blogPosts':
      return blogPostsExtractor
    case 'benefits':
      return benefitsExtractor
    case 'products':
      return productsExtractor
    default:
      return null
  }
}

function formatEur(n: number): string {
  return n.toFixed(4)
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

function emptyStats(): RunStats {
  return {
    wikiEntries: { ok: 0, skipped: 0, errors: 0 },
    blogPosts: { ok: 0, skipped: 0, errors: 0 },
    benefits: { ok: 0, skipped: 0, errors: 0 },
    products: { ok: 0, skipped: 0, errors: 0 },
  }
}

function printHeader(args: CliArgs, collections: readonly EmbedCollectionSlug[]): void {
  const mode = args.dryRun ? 'dry-run' : 'live'
  const locale = args.locale ?? 'fr'
  console.log('+- RDM . Backfill embeddings ---------------------+')
  console.log('| Modele      : text-embedding-004 (768 dim)')
  console.log(`| Collections : ${collections.join(', ')}`)
  console.log(`| Locale      : ${locale}`)
  console.log(`| Mode        : ${mode}`)
  console.log('+-------------------------------------------------+')
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-collection worker
// ─────────────────────────────────────────────────────────────────────────────

type ProcessOutcome =
  | { kind: 'continue' }
  | { kind: 'abort'; reason: string }

async function processCollection(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: EmbedCollectionSlug,
  args: CliArgs,
  stats: RunStats,
  totalCost: { value: number },
): Promise<ProcessOutcome> {
  const extractor = mapSlugToExtractor(slug)
  if (!extractor) {
    console.log(`[!] ${slug} : no extractor mapped, skipping`)
    return { kind: 'continue' }
  }

  const locale: Locale = args.locale ?? 'fr'
  const findArgs: Parameters<typeof payload.find>[0] = {
    collection: slug,
    where: { _status: { equals: 'published' } },
    depth: 1,
    pagination: false,
  }
  if (typeof args.limit === 'number') {
    findArgs.limit = args.limit
  } else {
    findArgs.limit = 0 // pagination disabled, but Payload still expects a limit hint
  }

  let result: { docs: Array<Record<string, unknown>> }
  try {
    const raw = await payload.find(findArgs)
    result = { docs: (raw.docs as Array<Record<string, unknown>>) ?? [] }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log(`[X] ${slug} : query failed - ${message}`)
    stats[slug].errors += 1
    return { kind: 'continue' }
  }

  console.log(`\n--- ${slug} (${result.docs.length} published) ---`)

  for (const doc of result.docs) {
    const idValue = (doc as { id?: string | number }).id
    const id = idValue === undefined || idValue === null ? '?' : String(idValue)

    let extracted: ReturnType<ExtractorFn>
    try {
      extracted = extractor(doc)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.log(`[X] ${slug}:${id} . extractor failed - ${message}`)
      stats[slug].errors += 1
      continue
    }

    const text = (extracted.text ?? '').trim()
    if (!text) {
      console.log(`[=] ${slug}:${id} . skipped (empty text)`)
      stats[slug].skipped += 1
      continue
    }

    if (args.dryRun) {
      console.log(`[~] ${slug}:${id} . dry-run . text length ${text.length}`)
      stats[slug].skipped += 1
      continue
    }

    let outcome = await embedAndStore(payload, {
      collectionSlug: slug,
      entryId: id,
      locale: extracted.locale ?? locale,
      text,
      meta: extracted.meta,
    })

    // Single retry on rate-limit.
    if (outcome.status === 'skipped-ratelimit') {
      console.log(`[!] ${slug}:${id} . rate-limit . pause 60s`)
      await sleep(RATE_LIMIT_PAUSE_MS)
      outcome = await embedAndStore(payload, {
        collectionSlug: slug,
        entryId: id,
        locale: extracted.locale ?? locale,
        text,
        meta: extracted.meta,
      })
    }

    const abortReason = handleOutcome(slug, id, outcome, stats, totalCost)
    if (abortReason) {
      return { kind: 'abort', reason: abortReason }
    }

    await sleep(PER_DOC_PAUSE_MS)
  }

  return { kind: 'continue' }
}

function handleOutcome(
  slug: EmbedCollectionSlug,
  id: string,
  outcome: EmbedOutcome,
  stats: RunStats,
  totalCost: { value: number },
): string | null {
  switch (outcome.status) {
    case 'success':
      console.log(
        `[OK] ${slug}:${id} . ${outcome.vectorLength}d . ${formatEur(outcome.costEur)} EUR`,
      )
      stats[slug].ok += 1
      totalCost.value += outcome.costEur
      return null
    case 'skipped-unchanged':
      console.log(`[=] ${slug}:${id} . hash inchange`)
      stats[slug].skipped += 1
      return null
    case 'skipped-disabled':
      console.log(`[!] ${slug}:${id} . IA desactivee (${outcome.reason})`)
      stats[slug].skipped += 1
      return `IA desactivee (${outcome.reason})`
    case 'skipped-budget':
      console.log(`[!] ${slug}:${id} . budget depasse`)
      stats[slug].skipped += 1
      return 'budget depasse'
    case 'skipped-ratelimit':
      console.log(`[!] ${slug}:${id} . rate-limit (apres retry) . skip`)
      stats[slug].skipped += 1
      return null
    case 'error':
      console.log(`[X] ${slug}:${id} . ${outcome.message}`)
      stats[slug].errors += 1
      return null
    default: {
      // Exhaustive guard
      const _exhaustive: never = outcome
      void _exhaustive
      return null
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function printSummary(
  stats: RunStats,
  collections: readonly EmbedCollectionSlug[],
  totalCost: number,
  durationMs: number,
): void {
  console.log('\n-- Resume --------------------------------------')
  for (const slug of collections) {
    const s = stats[slug]
    const label = slug.padEnd(12, ' ')
    console.log(` ${label} : ${s.ok} OK . ${s.skipped} skipped . ${s.errors} errors`)
  }
  console.log(`Total cout IA estime : ${formatEur(totalCost)} EUR`)
  console.log(`Duree totale         : ${formatDuration(durationMs)}`)
}

async function main(): Promise<void> {
  let args: CliArgs
  try {
    args = parseArgs()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[backfill-embeddings] ${message}`)
    process.exitCode = 1
    return
  }

  const collections: readonly EmbedCollectionSlug[] = args.collection
    ? [args.collection]
    : ALL_COLLECTIONS

  printHeader(args, collections)

  const payload = await getPayload({ config: configPromise })
  const stats = emptyStats()
  const totalCost = { value: 0 }
  const startedAt = Date.now()
  let aborted = false
  let abortReason = ''

  try {
    for (const slug of collections) {
      const outcome = await processCollection(payload, slug, args, stats, totalCost)
      if (outcome.kind === 'abort') {
        aborted = true
        abortReason = outcome.reason
        console.log(`\n[ABORT] ${outcome.reason} - stopping the run.`)
        break
      }
    }
  } finally {
    const durationMs = Date.now() - startedAt
    printSummary(stats, collections, totalCost.value, durationMs)

    // Clean up the pg pool so tsx can exit.
    const pool = (payload.db as unknown as { pool?: Pool }).pool
    if (pool) {
      try {
        await pool.end()
      } catch {
        /* noop */
      }
    }
  }

  const totalErrors = collections.reduce((acc, slug) => acc + stats[slug].errors, 0)
  if (aborted || totalErrors > 0) {
    if (aborted) {
      console.error(`[backfill-embeddings] aborted: ${abortReason}`)
    }
    process.exitCode = 1
  } else {
    process.exitCode = 0
  }
}

main().catch((err) => {
  console.error('[backfill-embeddings] fatal:', err)
  process.exitCode = 1
})
