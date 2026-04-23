import type { CollectionAfterChangeHook } from 'payload'
import { writeWormBackup } from '@/lib/backup-worm'

export const backupAfterChange: CollectionAfterChangeHook = async ({
  doc,
  collection,
  operation,
}) => {
  // Only backup on create/update of published documents (Payload versioning)
  if (doc._status !== 'published') return doc

  try {
    const data = JSON.stringify(doc, null, 2)
    await writeWormBackup(collection.slug, doc.id, data, 'json')
  } catch (error) {
    console.error(`WORM backup failed for ${collection.slug}/${doc.id}:`, error)
    // Don't block the save operation
  }

  return doc
}
