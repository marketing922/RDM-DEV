import type { CollectionBeforeValidateHook } from 'payload'
import { FORBIDDEN_CLAIM_PATTERNS } from '@/lib/claims-whitelist'
import { notify } from '@/lib/notify'

function extractTextFromLexical(content: any): string {
  if (!content?.root?.children) return ''

  function walkNodes(nodes: any[]): string {
    return nodes.map(node => {
      if (node.text) return node.text
      if (node.children) return walkNodes(node.children)
      return ''
    }).join(' ')
  }

  return walkNodes(content.root.children)
}

export const scanForbiddenClaims: CollectionBeforeValidateHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data

  const ctx = (req.context as any) || {}
  const userId = req.user?.id
  const userRole = (req.user as any)?.role as string | undefined
  const isPrivilegedUser = userRole === 'admin' || userRole === 'editor'

  // Escape hatch: bulk operations / seeds / migrations / IA pipeline can
  // opt out of the user-revert logic (which requires a privileged user
  // session that pipelines don't have), but the regex safety net stays
  // active so EFSA-flagged content is never silently auto-published. The
  // skip flag is logged for traceability.
  if (ctx.skipCompliance) {
    try {
      await req.payload.create({
        collection: 'auditLog',
        data: {
          action: 'compliance.skipped',
          collection: 'unknown',
          documentId: data.id || originalDoc?.id || 'new',
          user: userId,
          actorId: userId ? String(userId) : undefined,
          after: {
            reason: ctx.skipComplianceReason || 'unspecified',
          },
          timestamp: new Date().toISOString(),
        },
      })
    } catch {
      req.payload.logger.error('Failed to log compliance.skipped in audit log')
    }
    // NOTE: don't `return data` here — fall through to the regex scan so
    // pipeline-published content still gets flagged if it contains
    // forbidden patterns. The user-revert block at the bottom of the
    // function is gated separately on isPrivilegedUser.
  }

  // Safety / disclaimer fields are exempt from the forbidden-claim scan:
  // they are required by design to mention medical conditions, treatments
  // and pathologies (red flags, precautions, contraindications). The scan
  // targets marketing claims, not medical safety notices.
  const SAFETY_FIELDS = new Set([
    'precautions',
    'precautionsText',
    'redFlags',
    'contraindications',
  ])

  // Collect all text content from rich text fields
  const textsToScan: string[] = []

  for (const [key, value] of Object.entries(data)) {
    if (SAFETY_FIELDS.has(key)) continue
    if (typeof value === 'string') {
      textsToScan.push(value)
    } else if (value && typeof value === 'object' && (value as any).root) {
      textsToScan.push(extractTextFromLexical(value))
    }
  }

  const fullText = textsToScan.join(' ').toLowerCase()

  // Check for forbidden patterns
  const violations: string[] = []
  for (const pattern of FORBIDDEN_CLAIM_PATTERNS) {
    if (pattern.regex.test(fullText)) {
      violations.push(pattern.description)
    }
  }

  const previousStatus = (originalDoc as any)?.complianceStatus as string | undefined
  const incomingStatus = data.complianceStatus as string | undefined

  if (violations.length > 0) {
    // Force pending whenever a violation is detected — cannot be bypassed.
    data.complianceStatus = 'pending'

    req.payload.logger.warn(
      `Allégations santé suspectes détectées: ${violations.join(', ')}`
    )

    try {
      await req.payload.create({
        collection: 'auditLog',
        data: {
          action: 'compliance_flag',
          collection: 'unknown',
          documentId: data.id || originalDoc?.id || 'new',
          user: userId,
          actorId: userId ? String(userId) : undefined,
          after: { violations, flaggedText: fullText.substring(0, 500) },
          timestamp: new Date().toISOString(),
        },
      })
    } catch {
      req.payload.logger.error('Failed to create audit log entry')
    }

    // Fire internal notification (non-blocking — notify swallows errors).
    try {
      const collectionSlug = (collection as any)?.slug || 'unknown'
      const docId = data.id || originalDoc?.id || 'new'
      const docTitle =
        (data as any)?.title ||
        (data as any)?.name ||
        (originalDoc as any)?.title ||
        (originalDoc as any)?.name ||
        String(docId)
      await notify({
        type: 'warning',
        subsystem: 'compliance',
        title: `Contenu à valider : ${collectionSlug}/${docTitle}`,
        body: `Allégations détectées : ${violations.join(', ')}`,
        link: `/admin/collections/${collectionSlug}/${docId}`,
        source: 'compliance-hook',
        dedupKey: `compliance-${collectionSlug}-${docId}`,
        dedupWindowMinutes: 60,
        meta: {
          collection: collectionSlug,
          documentId: String(docId),
          violations,
        },
      })
    } catch (err) {
      req.payload.logger.error(
        `Failed to fire compliance notification: ${(err as Error)?.message}`,
      )
    }

    return data
  }

  // No violation detected. Crucial: never auto-promote 'pending' → 'approved'.
  // Only an explicit human action (privileged user setting approved in the
  // payload) — or an explicit pipeline opt-out via ctx.skipCompliance — can
  // lead to 'approved'.
  const becomesApproved =
    incomingStatus === 'approved' && previousStatus !== 'approved'

  if (becomesApproved && !ctx.skipCompliance) {
    if (isPrivilegedUser) {
      // Stamp reviewer identity on explicit approval.
      if (!data.reviewedBy && userId) {
        data.reviewedBy = userId
      }
      if ('reviewedAt' in data || (originalDoc && 'reviewedAt' in originalDoc)) {
        data.reviewedAt = new Date().toISOString()
      }

      try {
        await req.payload.create({
          collection: 'auditLog',
          data: {
            action: 'compliance.approved',
            collection: 'unknown',
            documentId: data.id || originalDoc?.id || 'new',
            user: userId,
            actorId: userId ? String(userId) : undefined,
            after: {
              previousStatus: previousStatus || null,
              approvedBy: userId || null,
            },
            timestamp: new Date().toISOString(),
          },
        })
      } catch {
        req.payload.logger.error('Failed to log compliance.approved in audit log')
      }
    } else {
      // Non-privileged user attempted to approve: revert to previous status
      // (or pending if previously unknown) and log the attempt.
      data.complianceStatus = previousStatus || 'pending'
      try {
        await req.payload.create({
          collection: 'auditLog',
          data: {
            action: 'compliance.approval_denied',
            collection: 'unknown',
            documentId: data.id || originalDoc?.id || 'new',
            user: userId,
            actorId: userId ? String(userId) : undefined,
            after: {
              attemptedStatus: 'approved',
              role: userRole || 'anonymous',
            },
            timestamp: new Date().toISOString(),
          },
        })
      } catch {
        req.payload.logger.error('Failed to log compliance.approval_denied in audit log')
      }
    }
  }

  // Otherwise: leave complianceStatus as submitted by the caller.
  // No automatic promotion from 'pending' → 'approved'.
  return data
}
