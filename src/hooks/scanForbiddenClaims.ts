import type { CollectionBeforeValidateHook } from 'payload'
import { FORBIDDEN_CLAIM_PATTERNS } from '@/lib/claims-whitelist'

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
  data,
  req,
}) => {
  if (!data) return data

  // Collect all text content from rich text fields
  const textsToScan: string[] = []

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      textsToScan.push(value)
    } else if (value?.root) {
      // Lexical rich text
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

  if (violations.length > 0) {
    // Auto-flag: set complianceStatus to pending and log violations
    data.complianceStatus = 'pending'

    req.payload.logger.warn(
      `Allégations santé suspectes détectées: ${violations.join(', ')}`
    )

    // Log to AuditLog
    try {
      await req.payload.create({
        collection: 'auditLog',
        data: {
          action: 'compliance_flag',
          collection: 'unknown',
          documentId: data.id || 'new',
          user: req.user?.id,
          after: { violations, flaggedText: fullText.substring(0, 500) },
          timestamp: new Date().toISOString(),
        },
      })
    } catch (e) {
      // Don't block save if audit log fails
      req.payload.logger.error('Failed to create audit log entry')
    }
  } else if (data.complianceStatus === 'pending') {
    // Auto-approve if no violations detected
    data.complianceStatus = 'approved'
  }

  return data
}
