import type { CollectionConfig } from 'payload'
import { isAdmin, isPublic } from '@/access'

export const Tags: CollectionConfig = {
  slug: 'tags',
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
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
    },
  ],
}
