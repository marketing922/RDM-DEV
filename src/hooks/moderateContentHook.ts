import type { CollectionBeforeChangeHook } from 'payload'
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

export function makeModerateContentHook(opts: {
  fields: string[]
  collection: string
}): CollectionBeforeChangeHook {
  const { fields, collection } = opts

  return async ({ data, originalDoc, req, operation }) => {
    if (!data) return data

    const ctx = (req.context as any) || {}
    if (ctx.skipModeration) return data

    // Skip when regex hook already flagged pending — LLM is then redundant.
    const incomingStatus = (data as any)?.complianceStatus as string | undefined
    if (incomingStatus === 'pending') {
      return data
    }
    // Skip when content is human-approved.
    const reviewedBy =
      (data as any)?.reviewedBy ?? (originalDoc as any)?.reviewedBy
    if (incomingStatus === 'approved' && reviewedBy) {
      return data
    }

    // Compose text from configured fields.
    const parts: string[] = []
    for (const f of fields) {
      const v = pickFieldValue(data, f)
      if (v) parts.push(v)
    }
    const fullText = parts.join('\n\n').slice(0, MAX_CHARS)
    if (!fullText) return data

    // Pipeline: kill-switch / budget / rate-limit. Silent skip when off.
    try {
      const availability = await isAiAvailable()
      if (!availability.ok) return data

      const budget = await isWithinDailyBudget(req.payload)
      if (!budget.ok) return data

      const rl = await checkAiRateLimit({
        userId: 'system:moderate',
        endpoint: 'ai-moderate',
      })
      if (!rl.ok) return data
    } catch (preErr) {
      await captureError(preErr, {
        subsystem: 'ai-pipeline',
        level: 'warning',
        route: `hook:moderate:${collection}`,
      })
      return data
    }

    if (!process.env.GEMINI_API_KEY) return data

    const startedAt = Date.now()
    const userId = req.user?.id ? String(req.user.id) : 'system'
    const docId = (data as any)?.id || (originalDoc as any)?.id || 'new'
    const entryIdRaw = (data as any)?.id ?? (originalDoc as any)?.id
    const entryId =
      typeof entryIdRaw === 'string' || typeof entryIdRaw === 'number'
        ? String(entryIdRaw)
        : undefined

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

      ;(data as any).complianceLLM = llmRecord

      if (result.verdict === 'block') {
        ;(data as any).complianceStatus = 'pending'
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
          req.payload.logger.error?.(
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
          req.payload.logger.error?.(
            `[moderateContentHook] notify(risk) failed: ${(notifyErr as Error)?.message}`,
          )
        }
      }
      // verdict === 'ok' : record stored, no notification.

      return data
    } catch (modErr) {
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
      return data
    }
  }
}
