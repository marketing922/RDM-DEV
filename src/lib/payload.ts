import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'

/**
 * Payload instance is cached on globalThis so it survives HMR reloads in dev.
 * Without this, every file save re-initializes Payload (DB connection, schema
 * build, plugins) — multi-second cold start on every request.
 */
const globalForPayload = globalThis as unknown as {
  __rdmPayload?: Awaited<ReturnType<typeof getPayload>>
}

export async function getPayloadClient() {
  if (globalForPayload.__rdmPayload) return globalForPayload.__rdmPayload
  const instance = await getPayload({ config: configPromise })
  globalForPayload.__rdmPayload = instance
  return instance
}

const EMPTY_PAGINATED = { docs: [], totalDocs: 0, totalPages: 0, page: 1, limit: 10, hasNextPage: false, hasPrevPage: false, pagingCounter: 1, nextPage: null, prevPage: null }

/**
 * Safe query wrapper — returns empty results if DB tables don't exist yet
 * (before first Payload migration). Prevents build failures on fresh deploys.
 */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (error: any) {
    // Case 1: DB tables don't exist yet (fresh deploy)
    if (error?.message?.includes('Failed query') || error?.code === '42P01') {
      console.warn('[Payload] DB not initialized yet, returning empty results')
      return fallback
    }
    // Case 2: TypeError from Payload internal population (dangling relation
    // reference or schema drift). Log loudly and fall back so the page still
    // renders instead of crashing the whole route.
    if (error instanceof TypeError) {
      console.error(
        '[Payload] Query returned TypeError — likely a broken relation or schema drift:',
        error.message,
        '\n→ Check for wikiEntries/blogPosts with benefits/author IDs pointing to deleted docs,',
        '\n→ or restart pnpm dev so Drizzle can push pending schema changes.',
      )
      return fallback
    }
    // Case 3: DB unreachable (Neon quota/sleep, network, pool exhaustion).
    // En build, on doit pouvoir échouer gracieusement — sitemap, listes,
    // generateStaticParams ne doivent pas tuer le deploy si la BD est ko.
    const msg = error?.message || ''
    if (
      msg.includes('cannot connect') ||
      msg.includes('exceeded the data transfer') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('timeout') ||
      error?.code === 'XX000' ||
      error?.payloadInitError === true
    ) {
      console.warn('[Payload] DB unreachable, returning empty fallback:', msg)
      return fallback
    }
    throw error
  }
}

export { EMPTY_PAGINATED, unstable_cache }
