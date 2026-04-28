import type { Field } from 'payload'

export type AiHistoryFieldOptions = {
  /**
   * Unique internal name. Defaults to `aiHistory`. Override when wiring the
   * factory more than once on the same collection.
   */
  name?: string
  /** Optional label override; the component renders its own header so this
   * is mainly used for Payload's tooltip / a11y. */
  label?: string
}

/**
 * Factory returning a `type: 'ui'` Payload field rendered in the document
 * sidebar, showing the AI activity history for the current document
 * (AI Act, art. 50 traceability).
 *
 * Usage in a collection config:
 *
 *   aiHistoryField()
 *
 * Or with explicit options:
 *
 *   aiHistoryField({ name: 'aiHistory', label: 'Historique IA' })
 */
export function aiHistoryField(opts: AiHistoryFieldOptions = {}): Field {
  const { name = 'aiHistory', label } = opts

  return {
    name,
    type: 'ui',
    ...(label ? { label } : {}),
    admin: {
      position: 'sidebar',
      components: {
        Field: '@/components/admin/AIGeneratedHistory.tsx#default',
      },
    },
  }
}

export default aiHistoryField
