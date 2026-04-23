import type { CollectionConfig } from 'payload'
import { isAdmin, isPublic } from '@/access'
import { autoSlug } from '@/hooks'
import { slugify } from '@/lib/slugify'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Cat\u00e9gorie',
    plural: 'Cat\u00e9gories',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'parent', 'order'],
    group: 'Taxonomie',
    description: 'Organiser le contenu par cat\u00e9gories th\u00e9matiques',
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
      label: 'Nom de la cat\u00e9gorie',
      admin: {
        placeholder: 'Ex : Plantes m\u00e9dicinales',
        description: 'Le nom affich\u00e9 de la cat\u00e9gorie',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: true,
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
        placeholder: 'plantes-medicinales',
        description: 'Identifiant unique utilis\u00e9 dans les URLs. G\u00e9n\u00e9r\u00e9 automatiquement depuis le nom si vide.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: 'Description',
      admin: {
        description: 'Br\u00e8ve description de la cat\u00e9gorie pour le SEO',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Cat\u00e9gorie parente',
      admin: {
        description: 'Cat\u00e9gorie parente pour cr\u00e9er une hi\u00e9rarchie',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Ordre d\u2019affichage',
      admin: {
        description: 'Num\u00e9ro pour le tri (plus petit = affich\u00e9 en premier)',
      },
    },
  ],
}
