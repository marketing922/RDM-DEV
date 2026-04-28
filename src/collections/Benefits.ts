import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublishedOrAdmin, isAdmin } from '@/access'
import { scanForbiddenClaims, gatePublishCompliance, createAuditLog, autoSlug } from '@/hooks'
import { backupAfterChange } from '@/hooks/backupAfterChange'
import { coerceUploadIds } from '@/hooks/coerceUploadIds'
import { makeEmbedHook } from '@/hooks/embedAfterChange'
import { benefitsExtractor } from '@/hooks/embedExtractors'
import { makeModerateContentHook } from '@/hooks/moderateContentHook'
import { suggestedRelationsField } from '@/components/admin/fields/suggestedRelationsField'
import { complianceCheckField } from '@/components/admin/fields/complianceCheckField'
import { seoGenerateField } from '@/components/admin/fields/seoGenerateField'
import { aiHistoryField } from '@/components/admin/fields/aiHistoryField'
import { geoTab } from '@/fields/geoFields'
import { slugify } from '@/lib/slugify'

export const Benefits: CollectionConfig = {
  slug: 'benefits',
  labels: {
    singular: 'Bienfait',
    plural: 'Bienfaits',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', '_status', 'complianceStatus', 'updatedAt'],
    group: 'Contenu',
    description: 'G\u00e9rer les bienfaits sant\u00e9 associ\u00e9s aux plantes',
    components: {
      beforeList: ['@/components/admin/ListHero.tsx#default'],
      views: {
        list: {
          Component: '@/components/admin/views/BenefitsList.tsx#default',
        },
      },
      edit: {
        beforeDocumentControls: ['@/components/admin/DocHeaderChip.tsx#default'],
      },
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
    beforeValidate: [coerceUploadIds, scanForbiddenClaims],
    beforeChange: [
      gatePublishCompliance,
      makeModerateContentHook({ collection: 'benefits', fields: ['shortDescription'] }),
    ],
    afterChange: [createAuditLog, backupAfterChange, makeEmbedHook('benefits', benefitsExtractor)],
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
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
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
                placeholder: 'digestion',
                description: 'Identifiant unique pour l\u2019URL. G\u00e9n\u00e9r\u00e9 automatiquement depuis le nom si vide.',
              },
            },
            {
              name: 'bodyRegion',
              type: 'select',
              label: 'Région du corps',
              admin: {
                description:
                  'Région anatomique associée, utilisée par l explorateur corporel sur la page d accueil.',
              },
              options: [
                { label: 'Tête (migraines, sommeil...)', value: 'tete' },
                { label: 'Gorge (toux, voix...)', value: 'gorge' },
                { label: 'Respiration (bronches, sinus...)', value: 'respiration' },
                { label: 'Digestion (estomac, foie...)', value: 'digestion' },
                { label: 'Féminin (cycle, ménopause...)', value: 'feminin' },
                { label: 'Circulation (jambes, veines...)', value: 'circulation' },
              ],
            },
            {
              name: 'icon',
              type: 'text',
              label: 'Ic\u00f4ne',
              admin: {
                placeholder: 'Ex : stomach, leaf, heart',
                description: 'Nom de l\u2019ic\u00f4ne associ\u00e9e au bienfait',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
              },
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              localized: true,
              label: 'Description courte',
              admin: {
                description: 'R\u00e9sum\u00e9 affich\u00e9 dans les listes et aper\u00e7us',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextareaField.tsx#default',
                },
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
              label: 'Workflow interne',
              admin: {
                description:
                  '\u26a0\ufe0f Ne contr\u00f4le PAS la visibilit\u00e9 sur le site. Pour publier/d\u00e9publier, utilisez les boutons Save Draft / Publish changes en haut de la page.',
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
            {
              name: 'complianceLLM',
              type: 'group',
              label: 'Vérification LLM (auto)',
              admin: {
                readOnly: true,
                description:
                  'Résultat de la modération automatique par IA (référence). Le statut humain prime.',
              },
              fields: [
                {
                  name: 'verdict',
                  type: 'select',
                  options: [
                    { label: 'OK', value: 'ok' },
                    { label: 'Risque', value: 'risk' },
                    { label: 'Bloqué', value: 'block' },
                  ],
                },
                { name: 'confidence', type: 'number', min: 0, max: 1 },
                {
                  name: 'matchedClaims',
                  type: 'array',
                  fields: [{ name: 'claim', type: 'text' }],
                },
                { name: 'reason', type: 'textarea' },
                { name: 'at', type: 'date' },
              ],
            },
          ],
        },
        geoTab,
      ],
    },
    suggestedRelationsField({ name: 'suggestedProducts', target: 'products', label: 'Produits suggérés', targetField: 'relatedProducts' }),
    complianceCheckField({ collection: 'benefits', fields: ['shortDescription'] }),
    seoGenerateField({ collection: 'benefits' }),
    aiHistoryField(),
  ],
}
