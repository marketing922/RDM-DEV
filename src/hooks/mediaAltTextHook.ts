import type { CollectionAfterChangeHook } from 'payload'
import { generateAltText, ALT_TEXT_MODEL } from '@/lib/alt-text'
import { isAiAvailable } from '@/lib/ai-settings'
import { isWithinDailyBudget } from '@/lib/ai-budget'
import { checkAiRateLimit } from '@/lib/rate-limit'
import { logAiCall } from '@/lib/ai-audit'
import { captureError } from '@/lib/error-tracker'

// afterChange hook for the `media` collection. On create, if the uploaded
// document is an image without alt text, call Gemini Vision (gemini-2.5-flash-lite)
// to generate an accessible alt + caption and update the document.
//
// Wiring is performed by the caller inside src/collections/Media.ts.
//
// Safety rails:
//   - Only fires on `create` (update would loop).
//   - Skipped when req.context.skipAltText is truthy (re-entry from our own update).
//   - Skipped when AI is disabled, kill-switched, rate-limited or over budget.
//   - Never throws: the media document was already created successfully.

type MediaLike = {
  id: string | number
  url?: string | null
  filename?: string | null
  mimeType?: string | null
  alt?: string | null
  caption?: string | null
}

const SYSTEM_USER_ID = 'system:alt-text'
const RATE_LIMIT_ENDPOINT = 'ai-vision'

export const mediaAltTextHook: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  try {
    if (operation !== 'create') return doc

    const mediaDoc = doc as MediaLike
    const reqContext = (req.context ?? {}) as Record<string, unknown>

    if (reqContext.skipAltText) return doc
    if (!mediaDoc) return doc

    const existingAlt = typeof mediaDoc.alt === 'string' ? mediaDoc.alt.trim() : ''
    if (existingAlt) return doc

    const mimeType = mediaDoc.mimeType ?? ''
    if (!mimeType.startsWith('image/')) return doc

    const imageUrl = mediaDoc.url
    if (!imageUrl) return doc

    // Kill-switch / disabled → silent skip.
    const availability = await isAiAvailable()
    if (!availability.ok) return doc

    // Daily budget check.
    const budget = await isWithinDailyBudget(req.payload)
    if (!budget.ok) return doc

    // Rate-limit under the synthetic system user id.
    const rl = await checkAiRateLimit({
      userId: SYSTEM_USER_ID,
      endpoint: RATE_LIMIT_ENDPOINT,
    })
    if (!rl.ok) return doc

    const startedAt = Date.now()
    try {
      const result = await generateAltText({
        imageUrl,
        mimeType: mimeType || undefined,
        context: {
          collection: 'media',
          filename: mediaDoc.filename ?? undefined,
        },
      })

      // Log successful AI call for budget/audit visibility.
      await logAiCall(
        req.payload,
        {
          subsystem: 'ai-vision',
          model: ALT_TEXT_MODEL,
          userId: SYSTEM_USER_ID,
          collectionTarget: 'media',
          fieldTarget: 'alt',
          entryId: mediaDoc.id != null ? String(mediaDoc.id) : undefined,
        },
        startedAt,
        {
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          promptExcerpt: mediaDoc.filename ?? undefined,
          responseExcerpt: result.alt,
        },
        null,
      )

      const existingCaption =
        typeof mediaDoc.caption === 'string' ? mediaDoc.caption.trim() : ''
      const nextCaption = existingCaption || result.caption || undefined

      await req.payload.update({
        collection: 'media',
        id: mediaDoc.id,
        data: {
          alt: result.alt,
          ...(nextCaption ? { caption: nextCaption } : {}),
        },
        context: { skipAltText: true },
      })
    } catch (err) {
      // Log the failed AI call for budget/audit visibility.
      const errMessage = err instanceof Error ? err.message : String(err)
      const errName = err instanceof Error ? err.name : 'AltTextError'
      try {
        await logAiCall(
          req.payload,
          {
            subsystem: 'ai-vision',
            model: ALT_TEXT_MODEL,
            userId: SYSTEM_USER_ID,
            collectionTarget: 'media',
            fieldTarget: 'alt',
            entryId: mediaDoc.id != null ? String(mediaDoc.id) : undefined,
          },
          startedAt,
          null,
          { code: errName, message: errMessage },
        )
      } catch {
        // swallowed — audit logging must not bubble up
      }
      await captureError(err, {
        subsystem: 'ai-vision',
        level: 'warning',
        route: 'hook:media.afterChange:mediaAltTextHook',
        context: {
          mediaId: mediaDoc.id,
          filename: mediaDoc.filename,
          mimeType: mediaDoc.mimeType,
        },
      })
    }
  } catch (outer) {
    // Defensive outer guard — never let the hook throw.
    try {
      await captureError(outer, {
        subsystem: 'ai-vision',
        level: 'warning',
        route: 'hook:media.afterChange:mediaAltTextHook:outer',
      })
    } catch {
      // swallowed
    }
  }
  return doc
}
