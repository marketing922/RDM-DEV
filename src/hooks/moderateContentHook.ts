import type { CollectionAfterChangeHook } from 'payload'
import { moderateClaims } from '@/lib/ai-moderate'
import { isAiAvailable } from '@/lib/ai-settings'
import { isWithinDailyBudget } from '@/lib/ai-budget'
import { checkAiRateLimit } from '@/lib/rate-limit'
import { logAiCall } from '@/lib/ai-audit'
import { captureError } from '@/lib/error-tracker'
import { notify } from '@/lib/notify'

const MAX_CHARS = 6000

function extractRichTextPlain(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return ''
  const stack: any[] = [value]
  const out: string[] = []
  while (stack.length) {
    const n = stack.pop()
    if (!n) continue
    if (typeof n === 'string') {
      out.push(n)
      continue
    }
    if (Array.isArray(n)) {
      for (let i = n.length - 1; i >= 0; i--) stack.push(n[i])
      continue
    }
    if (typeof n === 'object') {
      if (typeof n.text === 'string') out.push(n.text)
      if (n.children) stack.push(n.children)
      if (n.root) stack.push(n.root)
    }
  }
  return out.join(' ').replace(/\s+/g, ' ').trim()
}

function pickFieldValue(data: Record<string, any>, key: string): string {
  const raw = data?.[key]
  if (raw == null) return ''
  if (typeof raw === 'string') return raw.trim()
  if (typeof raw === 'object') return extractRichTextPlain(raw)
  return ''
}

/**
 * AfterChange, non-blocking moderation hook.
 *
 * The doc is saved immediately. The LLM call runs fire-and-forget and writes
 * the result back via `payload.update` with `req.context.skipModeration = true`
 * to avoid re-entrance.
 *
 * Note on serverless: on Vercel, background promises can be killed once the
 * HTTP response is flushed. For typical Gemini Flash calls (< 10s) this is
 * acceptable; longer LLM jobs would need a queue.
 */
export function makeModerateContentAfterChangeHook(opts: {
  fields: string[]
  collection: string
}): CollectionAfterChangeHook {
  const { fields, collection } = opts

  return async ({ doc, previousDoc, req, operation }) => {
    if (!doc) return doc
    if (operation !== 'create' && operation !== 'update') return doc

    const ctx = (req.context as any) || {}
    if (ctx.skipModeration) return doc

    // Skip when regex hook already flagged pending — LLM is then redundant.
    const incomingStatus = (doc as any)?.complianceStatus as string | undefined
    if (incomingStatus === 'pending') return doc

    // Skip when content is human-approved.
    const reviewedBy = (doc as any)?.reviewedBy
    if (incomingStatus === 'approved' && reviewedBy) return doc

    // Compose text from configured fields.
    const parts: string[] = []
    for (const f of fields) {
      const v = pickFieldValue(doc as Record<string, any>, f)
      if (v) parts.push(v)
    }
    const fullText = parts.join('\n\n').slice(0, MAX_CHARS)
    if (!fullText) return doc

    const docId = (doc as any)?.id
    if (docId == null) return doc

    const userId = req.user?.id ? String(req.user.id) : 'system'
    const entryId = typeof docId === 'string' || typeof docId === 'number' ? String(docId) : undefined

    // Fire-and-forget. The user receives the HTTP response immediately;
    // the LLM call resolves in the background and updates the doc.
    void (async () => {
      // Pipeline: kill-switch / budget / rate-limit. Silent abort when off.
      try {
        const availability = await isAiAvailable()
        if (!availability.ok) return

        const budget = await isWithinDailyBudget(req.payload)
        if (!budget.ok) return

        const rl = await checkAiRateLimit({
          userId: 'system:moderate',
          endpoint: 'ai-moderate',
        })
        if (!rl.ok) {
          req.payload.logger?.warn?.(
            `[moderate] rate-limit exceeded for ${collection}/${entryId}`,
          )
          return
        }
      } catch (preErr) {
        await captureError(preErr, {
          subsystem: 'ai-pipeline',
          level: 'warning',
          route: `hook:moderate:${collection}`,
        })
        return
      }

      if (!process.env.GEMINI_API_KEY) return

      const startedAt = Date.now()

      try {
        const result = await moderateClaims({
          text: fullText,
          locale: 'fr',
          context: { collection, field: fields.join(',') },
        })

        await logAiCall(
          req.payload,
          {
            subsystem: 'ai-moderate',
            model: result.model,
            userId,
            collectionTarget: collection,
            fieldTarget: fields.join(','),
            entryId,
          },
          startedAt,
          {
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            promptExcerpt: fullText.slice(0, 500),
            responseExcerpt: `${result.verdict}|${result.reason}`,
          },
          null,
        )

        const llmRecord = {
          verdict: result.verdict,
          confidence: result.confidence,
          matchedClaims: (result.matchedClaims || []).map((c) => ({ claim: c })),
          reason: result.reason,
          at: new Date().toISOString(),
        }

        const updateData: Record<string, any> = { complianceLLM: llmRecord }
        if (result.verdict === 'block') {
          updateData.complianceStatus = 'pending'
        }

        try {
          await req.payload.update({
            collection: collection as any,
            id: docId,
            data: updateData,
            context: {
              skipModeration: true,
              skipCompliance: true,
              skipEmbed: true,
            },
            overrideAccess: true,
            depth: 0,
          })
        } catch (updErr: any) {
          req.payload.logger?.error?.(
            `[moderate] update failed for ${collection}/${entryId}: ${updErr?.message || updErr}`,
          )
          return
        }

        if (result.verdict === 'block') {
          try {
            await notify({
              type: 'critical',
              subsystem: 'compliance',
              title: `Allégation bloquée par LLM : ${collection}`,
              body:
                `${result.reason}` +
                (result.matchedClaims.length
                  ? ' · ' + result.matchedClaims.join(' / ')
                  : ''),
              link: `/admin/collections/${collection}/${docId}`,
              source: 'ai-moderate',
              dedupKey: `moderate-block-${collection}-${docId}`,
              dedupWindowMinutes: 60,
              meta: {
                collection,
                documentId: String(docId),
                verdict: result.verdict,
                confidence: result.confidence,
                matchedClaims: result.matchedClaims,
                operation,
              },
            })
          } catch (notifyErr) {
            req.payload.logger?.error?.(
              `[moderateContentHook] notify(block) failed: ${(notifyErr as Error)?.message}`,
            )
          }
        } else if (result.verdict === 'risk') {
          try {
            await notify({
              type: 'warning',
              subsystem: 'compliance',
              title: `Contenu à relire : ${collection}`,
              body:
                `${result.reason}` +
                (result.matchedClaims.length
                  ? ' · ' + result.matchedClaims.join(' / ')
                  : ''),
              link: `/admin/collections/${collection}/${docId}`,
              source: 'ai-moderate',
              dedupKey: `moderate-risk-${collection}-${docId}`,
              dedupWindowMinutes: 60,
              meta: {
                collection,
                documentId: String(docId),
                verdict: result.verdict,
                confidence: result.confidence,
                matchedClaims: result.matchedClaims,
                operation,
              },
            })
          } catch (notifyErr) {
            req.payload.logger?.error?.(
              `[moderateContentHook] notify(risk) failed: ${(notifyErr as Error)?.message}`,
            )
          }
        }
        // verdict === 'ok' : record stored, no notification.
      } catch (modErr: any) {
        await captureError(modErr, {
          subsystem: 'ai-pipeline',
          level: 'warning',
          route: `hook:moderate:${collection}`,
          userId,
          context: { collection, fields },
        })
        try {
          await logAiCall(
            req.payload,
            {
              subsystem: 'ai-moderate',
              model: 'gemini-2.5-flash-lite',
              userId,
              collectionTarget: collection,
              fieldTarget: fields.join(','),
              entryId,
            },
            startedAt,
            null,
            {
              code: (modErr as any)?.name || 'moderation_failed',
              message: (modErr as any)?.message,
            },
          )
        } catch {
          /* swallow */
        }
        req.payload.logger?.error?.(
          `[moderate] background failure for ${collection}/${entryId}: ${modErr?.message || modErr}`,
        )
      }
    })()

    // previousDoc unused at this scope; suppress lint via void.
    void previousDoc
    return doc
  }
}
