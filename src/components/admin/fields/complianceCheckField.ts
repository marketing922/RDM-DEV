import type { Field } from 'payload'

export type ComplianceCheckTarget =
  | 'wikiEntries'
  | 'blogPosts'
  | 'benefits'
  | 'products'

export type ComplianceCheckFieldOptions = {
  /** Target collection slug — controls labels and context sent to the API. */
  collection: ComplianceCheckTarget
  /** Top-level field paths to concatenate before moderation. */
  fields: string[]
  /** Optional override for the internal field name. */
  name?: string
}

/**
 * Factory that returns a `type: 'ui'` Payload field wired to the
 * ComplianceCheckButton client component. The `collection` and `fields`
 * are passed to the client component via `admin.custom`.
 *
 * Usage in a collection config:
 *
 *   complianceCheckField({
 *     collection: 'wikiEntries',
 *     fields: ['shortDescription', 'longDescription'],
 *   })
 */
export function complianceCheckField(
  opts: ComplianceCheckFieldOptions,
): Field {
  const { collection, fields, name = 'aiComplianceCheck' } = opts
  return {
    name,
    type: 'ui',
    admin: {
      position: 'sidebar',
      custom: {
        collection,
        fields,
      },
      components: {
        Field:
          '@/components/admin/ComplianceCheckButton.tsx#default',
      },
    },
  }
}

export default complianceCheckField
