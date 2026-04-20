import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { unstable_cache } from 'next/cache'

let cachedPayload: any = null

export async function getPayloadClient() {
  if (cachedPayload) return cachedPayload
  cachedPayload = await getPayload({ config: configPromise })
  return cachedPayload
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
    if (error?.message?.includes('Failed query') || error?.code === '42P01') {
      console.warn('[Payload] DB not initialized yet, returning empty results')
      return fallback
    }
    throw error
  }
}

export { EMPTY_PAGINATED, unstable_cache }
