import type { CollectionBeforeChangeHook } from 'payload'

export const gatePublishCompliance: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  // Only check when trying to publish.
  if (data?.status !== 'published') return data

  const complianceStatus = data?.complianceStatus || originalDoc?.complianceStatus

  // The `skipCompliance` flag only bypasses the user-revert step in
  // `scanForbiddenClaims`; it does NOT bypass this gate. The pipeline must
  // still arrive here with `complianceStatus === 'approved'` (i.e. the
  // forbidden-claim regex did not flag anything). This way pipeline-published
  // content is gated by the same rule as human-published content.
  if (complianceStatus === 'approved') return data

  // Block publication if not approved
  throw new Error(
    `Publication bloquée : complianceStatus doit être "approved" (actuel: "${complianceStatus}"). ` +
    `Le contenu doit passer la validation automatique des allégations EFSA avant publication.`
  )
}
