import type { Field } from 'payload'

export type SuggestedRelationsTarget =
  | 'wikiEntries'
  | 'blogPosts'
  | 'benefits'
  | 'products'

export type SuggestedRelationsFieldOptions = {
  /** Unique internal name, e.g. 'suggestedBenefits'. */
  name: string
  /** Target collection for suggestions. */
  target: SuggestedRelationsTarget
  /** Optional custom label; falls back to a target-specific default in the UI. */
  label?: string
  /**
   * Optional path of the relationship field (in the same form) where the
   * "Ajouter" button should push selected hit ids. If omitted, the button is
   * rendered disabled with a tooltip indicating no target field is configured.
   */
  targetField?: string
}

/**
 * Factory that returns a `type: 'ui'` Payload field wired to the
 * SuggestedRelations sidebar component. The `target`, `label` and
 * `targetField` are passed to the client component via `admin.custom`.
 *
 * Usage in a collection config:
 *
 *   suggestedRelationsField({
 *     name: 'suggestedBenefits',
 *     target: 'benefits',
 *     targetField: 'relatedBenefits',
 *   })
 */
export function suggestedRelationsField(
  opts: SuggestedRelationsFieldOptions,
): Field {
  const { name, target, label, targetField } = opts

  return {
    name,
    type: 'ui',
    admin: {
      position: 'sidebar',
      custom: {
        target,
        ...(label ? { label } : {}),
        ...(targetField ? { targetField } : {}),
      },
      components: {
        Field:
          '@/components/admin/fields/SuggestedRelations.tsx#default',
      },
    },
  }
}

export default suggestedRelationsField
