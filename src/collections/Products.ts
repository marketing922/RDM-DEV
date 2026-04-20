import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublishedOrAdmin, isAdmin } from '@/access'
import { scanForbiddenClaims, gatePublishCompliance, createAuditLog } from '@/hooks'
import { backupAfterChange } from '@/hooks/backupAfterChange'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Produit',
    plural: 'Produits',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'sku', 'price', 'status', 'inStock'],
    group: 'Syst\u00e8me',
    description: 'Catalogue produits (Phase 2 \u2014 e-commerce)',
    hidden: true,
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
          label: 'Informations produit',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              localized: true,
              label: 'Nom du produit',
              admin: {
                placeholder: 'Ex : Tisane Camomille Bio',
                description: 'Le nom commercial du produit',
              },
            },
            {
              name: 'slug',
              type: 'text',
              unique: true,
              label: 'Slug (URL)',
              admin: {
                placeholder: 'tisane-camomille-bio',
                description: 'Identifiant unique pour l\u2019URL du produit',
              },
            },
            {
              name: 'sku',
              type: 'text',
              unique: true,
              required: true,
              label: 'R\u00e9f\u00e9rence (SKU)',
              admin: {
                placeholder: 'Ex : CAM-TIS-001',
                description: 'Code de r\u00e9f\u00e9rence unique du produit',
              },
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              localized: true,
              label: 'Description courte',
              admin: {
                description: 'R\u00e9sum\u00e9 affich\u00e9 dans les listes de produits',
              },
            },
            {
              name: 'description',
              type: 'richText',
              localized: true,
              label: 'Description compl\u00e8te',
              admin: {
                description: 'Description d\u00e9taill\u00e9e du produit avec mise en forme',
              },
            },
          ],
        },
        {
          label: 'Tarification et stock',
          fields: [
            {
              name: 'price',
              type: 'number',
              required: true,
              label: 'Prix (\u20ac)',
              admin: {
                placeholder: 'Ex : 12.90',
                description: 'Prix de vente en euros TTC',
              },
            },
            {
              name: 'compareAtPrice',
              type: 'number',
              label: 'Prix barr\u00e9 (\u20ac)',
              admin: {
                placeholder: 'Ex : 15.90',
                description: 'Ancien prix affich\u00e9 barr\u00e9 (promotions)',
              },
            },
            {
              name: 'inStock',
              type: 'checkbox',
              defaultValue: true,
              label: 'En stock',
              admin: {
                description: 'D\u00e9cochez si le produit est en rupture de stock',
              },
            },
            {
              name: 'featured',
              type: 'checkbox',
              label: 'Produit vedette',
              admin: {
                description: 'Mettre en avant ce produit sur la page d\u2019accueil',
              },
            },
          ],
        },
        {
          label: 'D\u00e9tails et composition',
          fields: [
            {
              name: 'format',
              type: 'select',
              label: 'Format',
              admin: {
                description: 'Le type de produit',
              },
              options: [
                { label: 'Tisane', value: 'tisane' },
                { label: 'Poudre', value: 'poudre' },
                { label: 'G\u00e9lule', value: 'gelule' },
                { label: 'Autre', value: 'autre' },
              ],
            },
            {
              name: 'weight',
              type: 'text',
              label: 'Poids / Contenance',
              admin: {
                placeholder: 'Ex : 100g, 60 g\u00e9lules',
                description: 'Le poids net ou la contenance du produit',
              },
            },
            {
              name: 'ingredients',
              type: 'textarea',
              localized: true,
              label: 'Ingr\u00e9dients',
              admin: {
                description: 'Liste compl\u00e8te des ingr\u00e9dients (INCI ou communs)',
              },
            },
            {
              name: 'usage',
              type: 'richText',
              localized: true,
              label: 'Conseils d\u2019utilisation',
              admin: {
                description: 'Mode d\u2019emploi et posologie recommand\u00e9e',
              },
            },
            {
              name: 'precautions',
              type: 'richText',
              localized: true,
              label: 'Pr\u00e9cautions d\u2019emploi',
              admin: {
                description: 'Avertissements et pr\u00e9cautions pour le consommateur',
              },
            },
          ],
        },
        {
          label: 'M\u00e9dias et classement',
          fields: [
            {
              name: 'images',
              type: 'array',
              label: 'Images du produit',
              labels: {
                singular: 'Image',
                plural: 'Images',
              },
              admin: {
                description: 'Photos du produit (la premi\u00e8re sera l\u2019image principale)',
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Image',
                },
              ],
            },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              label: 'Cat\u00e9gorie',
              admin: {
                description: 'La cat\u00e9gorie principale du produit',
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
              name: 'benefits',
              type: 'relationship',
              relationTo: 'benefits',
              hasMany: true,
              label: 'Bienfaits associ\u00e9s',
              admin: {
                description: 'Les bienfaits sant\u00e9 li\u00e9s \u00e0 ce produit',
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
                description: 'Contr\u00f4le la visibilit\u00e9 du produit sur le site',
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
                description: '\u00c9tat de la v\u00e9rification r\u00e9glementaire',
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
                description: 'L\u2019utilisateur qui a effectu\u00e9 la v\u00e9rification',
              },
            },
          ],
        },
      ],
    },
  ],
}
