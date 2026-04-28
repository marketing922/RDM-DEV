import type { CollectionAfterChangeHook } from 'payload'
import { notify } from '@/lib/notify'

/**
 * Reusable afterChange hook for the `errorLog` collection. Fires an internal
 * critical notification whenever a new error document is created with
 * level === 'critical'. Wire this in ErrorLog.hooks.afterChange during final
 * collection wiring.
 *
 * Never blocks: notify() itself swallows errors. We still wrap in try/catch
 * defensively so the host write is never aborted.
 */
export const notifyOnCriticalError: CollectionAfterChangeHook = async ({
  doc,
  operation,
}) => {
  try {
    if (operation !== 'create') return doc
    if (!doc || doc.level !== 'critical') return doc

    const id = String((doc as any)?.id ?? '')
    const signature = (doc as any)?.signature ? String((doc as any).signature) : id
    const name = (doc as any)?.name || 'Error'
    const message = (doc as any)?.message || ''

    await notify({
      type: 'critical',
      subsystem: 'system',
      title: `Erreur critique : ${name}`,
      body: message,
      link: id ? `/admin/collections/errorLog/${id}` : '/admin/collections/errorLog',
      source: 'error-tracker',
      dedupKey: `error-${signature}`,
      dedupWindowMinutes: 15,
      meta: {
        errorId: id,
        signature,
        subsystem: (doc as any)?.subsystem,
      },
    })
  } catch (err) {
    console.error('[notifyOnCriticalError] failed', err)
  }
  return doc
}
