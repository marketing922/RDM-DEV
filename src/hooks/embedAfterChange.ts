import type { CollectionAfterChangeHook } from 'payload'
import { embedAndStore, type EmbedCollectionSlug } from '@/lib/embed-orchestrator'
import { captureError } from '@/lib/error-tracker'

/**
 * Factory that builds an `afterChange` hook wiring a specific collection to
 * the embedding orchestrator. The hook:
 *
 *   - ignores `delete` operations (Payload triggers afterChange on create/update),
 *   - respects an explicit `req.context.skipEmbed` escape hatch for batch imports,
 *   - skips unpublished drafts (we only embed the public-facing content),
 *   - runs synchronously/awaited because Vercel serverless kills dangling promises,
 *   - swallows any error and logs it via captureError — never throws.
 */

export type ExtractorFn = (doc: Record<string, unknown>) => {
  text: string
  locale?: string
  meta?: Record<string, unknown>
}

function isTruthyFlag(value: unknown): boolean {
  return Boolean(value)
}

export function makeEmbedHook(
  collectionSlug: EmbedCollectionSlug,
  extractor: ExtractorFn,
): CollectionAfterChangeHook {
  return async ({ doc, req, operation }) => {
    if (operation !== 'create' && operation !== 'update') {
      return doc
    }

    const ctx = (req?.context ?? {}) as Record<string, unknown>
    if (isTruthyFlag(ctx.skipEmbed)) {
      return doc
    }

    // Only embed published content. `_status` comes from Payload drafts feature.
    const status =
      typeof (doc as { _status?: unknown })._status === 'string'
        ? ((doc as { _status?: string })._status as string)
        : undefined
    if (status && status !== 'published') {
      return doc
    }

    const id = (doc as { id?: string | number }).id
    if (id === undefined || id === null) {
      return doc
    }

    try {
      const extracted = extractor(doc as Record<string, unknown>)
      const text = (extracted?.text ?? '').trim()
      if (!text) {
        return doc
      }

      await embedAndStore(req.payload, {
        collectionSlug,
        entryId: String(id),
        locale: extracted.locale,
        text,
        meta: extracted.meta,
      })
    } catch (err) {
      // Defensive net: embedAndStore already catches its own errors, but an
      // extractor could throw on malformed docs and we must not break the save.
      try {
        await captureError(err, {
          subsystem: 'ai-embedding',
          level: 'error',
          context: {
            stage: 'afterChange-hook',
            collection: collectionSlug,
            entryId: String(id),
          },
        })
      } catch (logErr) {
        console.error('[embedAfterChange] captureError failed', logErr)
      }
    }

    return doc
  }
}
