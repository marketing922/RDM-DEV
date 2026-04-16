import type { CollectionAfterChangeHook } from 'payload'

export const createAuditLog: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
  collection,
}) => {
  try {
    await req.payload.create({
      collection: 'auditLog',
      data: {
        action: operation,
        collection: collection.slug,
        documentId: doc.id,
        user: req.user?.id || null,
        before: previousDoc ? JSON.parse(JSON.stringify(previousDoc)) : null,
        after: JSON.parse(JSON.stringify(doc)),
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    req.payload.logger.error(`AuditLog error: ${error}`)
  }

  return doc
}
