import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublishedOrAdmin, isAdmin } from '@/access'
import { createAuditLog } from '@/hooks'

export const Pages: CollectionConfig = {
  slug: 'pages',
  versions: {
    drafts: true,
  },
  access: {
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    read: isPublishedOrAdmin,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [createAuditLog],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        {
          slug: 'hero',
          fields: [
            { name: 'heading', type: 'text', localized: true },
            { name: 'subheading', type: 'text', localized: true },
            { name: 'image', type: 'upload', relationTo: 'media' },
            { name: 'ctaLabel', type: 'text', localized: true },
            { name: 'ctaLink', type: 'text' },
          ],
        },
        {
          slug: 'content',
          fields: [
            { name: 'richText', type: 'richText', localized: true },
          ],
        },
        {
          slug: 'productGrid',
          fields: [
            { name: 'heading', type: 'text', localized: true },
            {
              name: 'products',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
            },
          ],
        },
        {
          slug: 'wikiGrid',
          fields: [
            { name: 'heading', type: 'text', localized: true },
            {
              name: 'entries',
              type: 'relationship',
              relationTo: 'wikiEntries',
              hasMany: true,
            },
          ],
        },
        {
          slug: 'cta',
          fields: [
            { name: 'heading', type: 'text', localized: true },
            { name: 'description', type: 'textarea', localized: true },
            { name: 'buttonLabel', type: 'text', localized: true },
            { name: 'buttonLink', type: 'text' },
          ],
        },
        {
          slug: 'faq',
          fields: [
            { name: 'heading', type: 'text', localized: true },
            {
              name: 'items',
              type: 'array',
              fields: [
                { name: 'question', type: 'text', localized: true },
                { name: 'answer', type: 'richText', localized: true },
              ],
            },
          ],
        },
        {
          slug: 'image',
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media' },
            { name: 'caption', type: 'text', localized: true },
          ],
        },
      ],
    },
  ],
}
