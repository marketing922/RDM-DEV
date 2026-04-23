import type { CollectionConfig } from 'payload'
import { isAdmin, isPublic } from '@/access'
import { autoSlug } from '@/hooks'
import { slugify } from '@/lib/slugify'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: {
    singular: 'Tag',
    plural: 'Tags',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
    group: 'Taxonomie',
    description: 'G\u00e9rer les mots-cl\u00e9s pour le classement du contenu',
  },
  access: {
    create: isAdmin,
    update: isAdmin,
    read: isPublic,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      label: 'Nom du tag',
      admin: {
        placeholder: 'Ex : Anti-inflammatoire',
        description: 'Le libell\u00e9 du tag',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      label: 'Slug (URL)',
      hooks: {
        beforeValidate: [autoSlug('name')],
        beforeChange: [
          ({ value, data, originalDoc }) => {
            if (value && typeof value === 'string' && value.trim()) {
              return slugify(value)
            }
            const source = data?.name || data?.title || originalDoc?.name || originalDoc?.title
            return source ? slugify(String(source)) : value
          },
        ],
      },
      admin: {
        placeholder: 'anti-inflammatoire',
        description: 'Identifiant unique utilis\u00e9 dans les URLs et filtres. G\u00e9n\u00e9r\u00e9 automatiquement depuis le nom si vide.',
      },
    },
  ],
}
