import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublishedOrAdmin, isAdmin } from '@/access'
import { scanForbiddenClaims, gatePublishCompliance, createAuditLog } from '@/hooks'
import { backupAfterChange } from '@/hooks/backupAfterChange'
import { geoTab } from '@/fields/geoFields'

export const BlogPosts: CollectionConfig = {
  slug: 'blogPosts',
  labels: {
    singular: 'Article',
    plural: 'Articles du Blog',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'publishedAt', 'updatedAt'],
    group: 'Contenu',
    description: 'R\u00e9diger et g\u00e9rer les articles du blog',
  },
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
    beforeValidate: [scanForbiddenClaims],
    beforeChange: [gatePublishCompliance],
    afterChange: [createAuditLog, backupAfterChange],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contenu',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
              label: 'Titre de l\u2019article',
              admin: {
                placeholder: 'Ex : Les bienfaits de la camomille',
                description: 'Le titre principal affich\u00e9 sur le blog',
              },
            },
            {
              name: 'slug',
              type: 'text',
              unique: true,
              label: 'Slug (URL)',
              admin: {
                placeholder: 'les-bienfaits-de-la-camomille',
                description: 'Identifiant unique pour l\u2019URL de l\u2019article',
              },
            },
            {
              name: 'excerpt',
              type: 'textarea',
              localized: true,
              label: 'Extrait',
              admin: {
                description: 'Court r\u00e9sum\u00e9 affich\u00e9 dans les listes d\u2019articles et le SEO',
              },
            },
            {
              name: 'content',
              type: 'richText',
              localized: true,
              label: 'Contenu de l\u2019article',
              admin: {
                description: 'Le corps principal de l\u2019article avec mise en forme',
              },
            },
            {
              name: 'featuredImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Image \u00e0 la une',
              admin: {
                description: 'Image principale affich\u00e9e en en-t\u00eate de l\u2019article',
              },
            },
          ],
        },
        {
          label: 'M\u00e9tadonn\u00e9es',
          fields: [
            {
              name: 'author',
              type: 'relationship',
              relationTo: 'authors',
              label: 'Auteur',
              admin: {
                description: 'L\u2019auteur de l\u2019article',
              },
            },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              label: 'Cat\u00e9gorie',
              admin: {
                description: 'La cat\u00e9gorie principale de l\u2019article',
              },
            },
            {
              name: 'tags',
              type: 'relationship',
              relationTo: 'tags',
              hasMany: true,
              label: 'Tags',
              admin: {
                description: 'Mots-cl\u00e9s pour le classement et la recherche',
              },
            },
            {
              name: 'publishedAt',
              type: 'date',
              label: 'Date de publication',
              admin: {
                description: 'Date \u00e0 laquelle l\u2019article est/sera publi\u00e9',
              },
            },
            {
              name: 'readingTime',
              type: 'number',
              label: 'Temps de lecture (min)',
              admin: {
                placeholder: 'Ex : 5',
                description: 'Dur\u00e9e estim\u00e9e de lecture en minutes',
              },
            },
          ],
        },
        {
          label: 'Publication',
          fields: [
            {
              name: 'status',
              type: 'select',
              defaultValue: 'draft',
              label: 'Statut de publication',
              admin: {
                description: 'Contr\u00f4le la visibilit\u00e9 de l\u2019article sur le site',
              },
              options: [
                { label: 'Brouillon', value: 'draft' },
                { label: 'Publi\u00e9', value: 'published' },
                { label: 'Archiv\u00e9', value: 'archived' },
              ],
            },
            {
              name: 'complianceStatus',
              type: 'select',
              defaultValue: 'pending',
              label: 'Statut de conformit\u00e9',
              admin: {
                description: '\u00c9tat de la v\u00e9rification r\u00e9glementaire du contenu',
              },
              options: [
                { label: 'En attente', value: 'pending' },
                { label: 'Soumis', value: 'submitted' },
                { label: 'Relu', value: 'reviewed' },
                { label: 'Approuv\u00e9', value: 'approved' },
              ],
            },
            {
              name: 'reviewedBy',
              type: 'relationship',
              relationTo: 'users',
              label: 'Relu par',
              admin: {
                readOnly: true,
                description: 'L\u2019utilisateur qui a effectu\u00e9 la v\u00e9rification de conformit\u00e9',
              },
            },
          ],
        },
        geoTab,
      ],
    },
  ],
}
