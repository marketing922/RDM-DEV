import type { CollectionBeforeChangeHook } from 'payload'

export const gatePublishCompliance: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  // Only check when trying to publish
  if (data?.status !== 'published') return data

  const complianceStatus = data?.complianceStatus || originalDoc?.complianceStatus

  // Auto-validation: if compliance check passed, allow publish
  if (complianceStatus === 'approved') return data

  // Block publication if not approved
  throw new Error(
    `Publication bloquée : complianceStatus doit être "approved" (actuel: "${complianceStatus}"). ` +
    `Le contenu doit passer la validation automatique des allégations EFSA avant publication.`
  )
}
