import type { Field } from 'payload'

export type SeoGenerateCollection =
  | 'wikiEntries'
  | 'blogPosts'
  | 'benefits'
  | 'products'

export type SeoGenerateFieldOptions = {
  /** Target collection slug — passed to the SEO API as `collection`. */
  collection: SeoGenerateCollection
  /** Optional override for the internal field name. */
  name?: string
}

/**
 * Factory that returns a `type: 'ui'` Payload field wired to the
 * SeoGenerateButton client component, rendered in the document sidebar.
 *
 * Usage in a collection config:
 *
 *   seoGenerateField({ collection: 'wikiEntries' })
 */
export function seoGenerateField(opts: SeoGenerateFieldOptions): Field {
  const { collection, name = 'aiSeoGenerate' } = opts
  return {
    name,
    type: 'ui',
    admin: {
      position: 'sidebar',
      custom: {
        collection,
      },
      components: {
        Field: '@/components/admin/SeoGenerateButton.tsx#default',
      },
    },
  }
}

export default seoGenerateField
