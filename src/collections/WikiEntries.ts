import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublishedOrAdmin, isAdmin } from '@/access'
import { scanForbiddenClaims, gatePublishCompliance, createAuditLog, autoSlug } from '@/hooks'
import { backupAfterChange } from '@/hooks/backupAfterChange'
import { geoTab } from '@/fields/geoFields'
import { slugify } from '@/lib/slugify'

export const WikiEntries: CollectionConfig = {
  slug: 'wikiEntries',
  labels: {
    singular: 'Fiche Plante',
    plural: 'Encyclop\u00e9die des Plantes',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'latinName', '_status', 'complianceStatus', 'updatedAt'],
    group: 'Contenu',
    description: 'G\u00e9rer les fiches plantes de l\u2019encyclop\u00e9die des rem\u00e8des naturels',
    components: {
      beforeList: ['@/components/admin/ListHero.tsx#default'],
      // Almanach-style banner at the top of the edit view (above the fields).
      // Uses the `Description` slot which renders in Payload 3.83's document view.
      Description: '@/components/admin/editor/PlantHeader.tsx#default',
      views: {
        list: {
          Component: '@/components/admin/views/PlantsList.tsx#default',
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
    beforeValidate: [scanForbiddenClaims],
    beforeChange: [gatePublishCompliance],
    afterChange: [createAuditLog, backupAfterChange],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Informations g\u00e9n\u00e9rales',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              localized: true,
              label: 'Nom de la plante',
              admin: {
                placeholder: 'Ex : Camomille',
                description: 'Le nom commun en fran\u00e7ais',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
              },
            },
            {
              name: 'latinName',
              type: 'text',
              label: 'Nom latin',
              admin: {
                placeholder: 'Ex : Matricaria chamomilla',
                description: 'Le nom botanique officiel',
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
                placeholder: 'camomille',
                description: 'Identifiant unique utilis\u00e9 dans l\u2019URL. G\u00e9n\u00e9r\u00e9 automatiquement depuis le nom si vide.',
              },
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              localized: true,
              label: 'Description courte',
              admin: {
                description: 'R\u00e9sum\u00e9 de 1\u20132 phrases affich\u00e9 dans les listes et aper\u00e7us',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextareaField.tsx#default',
                },
              },
            },
          ],
        },
        {
          label: 'D\u00e9tails botaniques',
          fields: [
            {
              name: 'family',
              type: 'text',
              label: 'Famille botanique',
              admin: {
                placeholder: 'Ex : Ast\u00e9rac\u00e9es',
                description: 'La famille botanique \u00e0 laquelle appartient la plante',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
              },
            },
            {
              name: 'origin',
              type: 'text',
              localized: true,
              label: 'Origine g\u00e9ographique',
              admin: {
                placeholder: 'Ex : Europe, Asie occidentale',
                description: 'R\u00e9gions d\u2019origine de la plante',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
              },
            },
            {
              name: 'partsUsed',
              type: 'text',
              localized: true,
              label: 'Parties utilis\u00e9es',
              admin: {
                placeholder: 'Ex : Fleurs, feuilles',
                description: 'Les parties de la plante employ\u00e9es en phytoth\u00e9rapie',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
              },
            },
            {
              name: 'activeCompounds',
              type: 'textarea',
              localized: true,
              label: 'Principes actifs',
              admin: {
                description: 'Les mol\u00e9cules actives et compos\u00e9s chimiques de la plante',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextareaField.tsx#default',
                },
              },
            },
            {
              name: 'harvest',
              type: 'text',
              localized: true,
              label: 'R\u00e9colte',
              admin: {
                placeholder: 'Ex : Juin \u00e0 ao\u00fbt',
                description: 'P\u00e9riode et m\u00e9thode de r\u00e9colte',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
              },
            },
            {
              name: 'form',
              type: 'text',
              localized: true,
              label: 'Forme',
              admin: {
                placeholder: 'Ex : Tisane, huile essentielle',
                description: 'Formes galéniques disponibles',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
              },
            },
            {
              name: 'conservation',
              type: 'text',
              localized: true,
              label: 'Conservation',
              admin: {
                placeholder: 'Ex : Au sec, \u00e0 l\u2019abri de la lumi\u00e8re',
                description: 'Conditions de conservation recommand\u00e9es',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
              },
            },
          ],
        },
        {
          label: 'Contenu',
          fields: [
            {
              name: 'longDescription',
              type: 'textarea',
              localized: true,
              label: 'Description longue (texte brut)',
              admin: {
                description: 'Description d\u00e9taill\u00e9e en texte brut, utilis\u00e9e pour le SEO',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextareaField.tsx#default',
                },
              },
            },
            {
              name: 'description',
              type: 'richText',
              localized: true,
              label: 'Description compl\u00e8te (rich text)',
              admin: {
                description: 'Contenu principal de la fiche avec mise en forme',
              },
            },
            {
              name: 'precautionsText',
              type: 'textarea',
              localized: true,
              label: 'Pr\u00e9cautions (texte brut)',
              admin: {
                description: 'Pr\u00e9cautions d\u2019emploi en texte simple',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextareaField.tsx#default',
                },
              },
            },
            {
              name: 'precautions',
              type: 'richText',
              localized: true,
              label: 'Pr\u00e9cautions (rich text)',
              admin: {
                description: 'Pr\u00e9cautions d\u2019emploi d\u00e9taill\u00e9es avec mise en forme',
              },
            },
            {
              name: 'contraindications',
              type: 'richText',
              localized: true,
              label: 'Contre-indications',
              admin: {
                description: 'Situations o\u00f9 la plante ne doit pas \u00eatre utilis\u00e9e',
              },
            },
          ],
        },
        {
          label: 'Relations',
          fields: [
            {
              name: 'benefits',
              type: 'relationship',
              relationTo: 'benefits',
              hasMany: true,
              label: 'Bienfaits associ\u00e9s',
              admin: {
                description: 'Les bienfaits li\u00e9s \u00e0 cette plante',
              },
            },
            {
              name: 'images',
              type: 'array',
              label: 'Galerie d\u2019images',
              labels: {
                singular: 'Image',
                plural: 'Images',
              },
              admin: {
                description: 'Photos et illustrations de la plante',
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
              name: 'author',
              type: 'relationship',
              relationTo: 'authors',
              label: 'Auteur',
              admin: {
                description: 'L\u2019auteur ou r\u00e9dacteur de cette fiche',
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
          ],
        },
        geoTab,
      ],
    },
  ],
}
