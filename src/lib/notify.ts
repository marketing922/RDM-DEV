import 'server-only'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export type NotifyType = 'info' | 'success' | 'warning' | 'error' | 'critical'

export type NotifySubsystem =
  | 'ai'
  | 'compliance'
  | 'security'
  | 'content'
  | 'system'
  | 'newsletter'
  | 'contact'
  | 'order'
  | 'other'

export type NotifyTargetRole = 'all' | 'admin' | 'editor'

export type NotifyParams = {
  type?: NotifyType
  subsystem: NotifySubsystem
  title: string
  body?: string
  link?: string
  targetRole?: NotifyTargetRole
  source?: string
  meta?: Record<string, unknown>
  expiresInDays?: number
  /**
   * If provided, any notification with the same dedupKey (stored in meta.dedupKey)
   * created within `dedupWindowMinutes` will suppress creation of a new doc —
   * its id is returned instead. Prevents alert flood.
   */
  dedupKey?: string
  /** Default: 60 minutes */
  dedupWindowMinutes?: number
}

const DEFAULT_DEDUP_WINDOW_MINUTES = 60

/**
 * Creates an internal admin notification. Never throws — failures are logged
 * and the function returns null, so callers can safely fire-and-forget.
 *
 * Returns the created doc id (or the existing id if dedup matched), or null
 * if creation failed silently.
 */
export async function notify(params: NotifyParams): Promise<string | null> {
  try {
    const payload = await getPayload({ config: configPromise })

    const {
      type = 'info',
      subsystem,
      title,
      body,
      link,
      targetRole = 'admin',
      source,
      meta,
      expiresInDays,
      dedupKey,
      dedupWindowMinutes = DEFAULT_DEDUP_WINDOW_MINUTES,
    } = params

    // Dedup path
    if (dedupKey) {
      const since = new Date(Date.now() - dedupWindowMinutes * 60_000).toISOString()
      try {
        const existing = await payload.find({
          collection: 'notifications' as any,
          where: {
            and: [
              { 'meta.dedupKey': { equals: dedupKey } },
              { createdAt: { greater_than_equal: since } },
            ],
          },
          limit: 1,
          depth: 0,
          sort: '-createdAt',
        })
        const docs = (existing?.docs ?? []) as Array<{ id: string | number }>
        if (docs.length > 0) {
          return String(docs[0].id)
        }
      } catch (err) {
        // Dedup lookup failure should not block notification creation.
        console.error('[notify] dedup lookup failed', err)
      }
    }

    // Compute expiry
    let expiresAt: string | undefined
    if (typeof expiresInDays === 'number' && Number.isFinite(expiresInDays)) {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() + expiresInDays)
      expiresAt = d.toISOString()
    }

    // Merge dedupKey into meta so the query above can find us next time.
    const mergedMeta: Record<string, unknown> | undefined =
      dedupKey || meta
        ? { ...(meta || {}), ...(dedupKey ? { dedupKey } : {}) }
        : undefined

    const created = (await payload.create({
      collection: 'notifications' as any,
      data: {
        type,
        subsystem,
        title: title.slice(0, 200),
        body: body ? body.slice(0, 1000) : undefined,
        link,
        targetRole,
        source,
        meta: mergedMeta,
        expiresAt,
      },
    })) as { id: string | number }

    return String(created?.id ?? '') || null
  } catch (err) {
    console.error('[notify] failed', err)
    return null
  }
}
