import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublishedOrAdmin, isAdmin } from '@/access'
import { scanForbiddenClaims, gatePublishCompliance, createAuditLog } from '@/hooks'
import { backupAfterChange } from '@/hooks/backupAfterChange'
import { geoTab } from '@/fields/geoFields'

export const Benefits: CollectionConfig = {
  slug: 'benefits',
  labels: {
    singular: 'Bienfait',
    plural: 'Bienfaits',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'complianceStatus', 'updatedAt'],
    group: 'Contenu',
    description: 'G\u00e9rer les bienfaits sant\u00e9 associ\u00e9s aux plantes',
    components: {
      beforeList: ['@/components/admin/ListHero.tsx#default'],
    },
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
          label: 'Informations principales',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              localized: true,
              label: 'Nom du bienfait',
              admin: {
                placeholder: 'Ex : Digestion',
                description: 'Le nom du bienfait sant\u00e9',
              },
            },
            {
              name: 'slug',
              type: 'text',
              unique: true,
              label: 'Slug (URL)',
              admin: {
                placeholder: 'digestion',
                description: 'Identifiant unique pour l\u2019URL',
              },
            },
            {
              name: 'icon',
              type: 'text',
              label: 'Ic\u00f4ne',
              admin: {
                placeholder: 'Ex : stomach, leaf, heart',
                description: 'Nom de l\u2019ic\u00f4ne associ\u00e9e au bienfait',
              },
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              localized: true,
              label: 'Description courte',
              admin: {
                description: 'R\u00e9sum\u00e9 affich\u00e9 dans les listes et aper\u00e7us',
              },
            },
            {
              name: 'description',
              type: 'richText',
              localized: true,
              label: 'Description compl\u00e8te',
              admin: {
                description: 'Explication d\u00e9taill\u00e9e du bienfait avec mise en forme',
              },
            },
          ],
        },
        {
          label: 'Relations',
          fields: [
            {
              name: 'relatedPlants',
              type: 'relationship',
              relationTo: 'wikiEntries',
              hasMany: true,
              label: 'Plantes associ\u00e9es',
              admin: {
                description: 'Les fiches plantes li\u00e9es \u00e0 ce bienfait',
              },
            },
            {
              name: 'relatedProducts',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              label: 'Produits associ\u00e9s',
              admin: {
                description: 'Les produits li\u00e9s \u00e0 ce bienfait',
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
                description: 'Contr\u00f4le la visibilit\u00e9 du bienfait sur le site',
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
