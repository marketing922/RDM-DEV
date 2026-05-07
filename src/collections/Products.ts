import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublishedOrAdmin, isAdmin } from '@/access'
import { scanForbiddenClaims, gatePublishCompliance, createAuditLog, autoSlug } from '@/hooks'
import { backupAfterChange } from '@/hooks/backupAfterChange'
import { revalidateAfterChange } from '@/hooks/revalidateAfterChange'
import { coerceUploadIds } from '@/hooks/coerceUploadIds'
import { makeEmbedHook } from '@/hooks/embedAfterChange'
import { productsExtractor } from '@/hooks/embedExtractors'
import { makeModerateContentAfterChangeHook } from '@/hooks/moderateContentHook'
import { suggestedRelationsField } from '@/components/admin/fields/suggestedRelationsField'
import { complianceCheckField } from '@/components/admin/fields/complianceCheckField'
import { seoGenerateField } from '@/components/admin/fields/seoGenerateField'
import { aiHistoryField } from '@/components/admin/fields/aiHistoryField'
import { slugify } from '@/lib/slugify'
import { validateImageUrl } from '@/lib/url-validators'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Produit',
    plural: 'Produits',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'sku', 'price', '_status', 'inStock'],
    group: 'Contenu',
    description: 'Catalogue produits affich\u00e9s sur la page /produits',
    components: {
      views: {
        list: {
          Component: '@/components/admin/views/ProductsList.tsx#default',
        },
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
    beforeChange: [gatePublishCompliance],
    afterChange: [
      makeModerateContentAfterChangeHook({ collection: 'products', fields: ['shortDescription', 'ingredients'] }),
      createAuditLog,
      backupAfterChange,
      makeEmbedHook('products', productsExtractor),
      revalidateAfterChange,
    ],
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
                placeholder: 'tisane-camomille-bio',
                description: 'Identifiant unique pour l\u2019URL du produit. G\u00e9n\u00e9r\u00e9 automatiquement depuis le nom si vide.',
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
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextareaField.tsx#default',
                },
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
              name: 'externalImageUrl',
              type: 'text',
              label: 'URL image externe (fallback)',
              validate: validateImageUrl as any,
              admin: {
                description:
                  'URL directe vers une image h\u00e9berg\u00e9e ailleurs (utilis\u00e9e si aucune image upload\u00e9e). Pour les produits import\u00e9s.',
              },
            },
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
            {
              name: 'relatedPlants',
              type: 'relationship',
              relationTo: 'wikiEntries',
              hasMany: true,
              label: 'Plantes li\u00e9es',
              admin: {
                description:
                  'Plantes wiki composant ce produit. Maintenu en miroir de wikiEntries.relatedProducts.',
              },
            },
          ],
        },
        {
          label: 'Liens marchands',
          description: 'URLs vers les pages produit sur les plateformes partenaires (Amazon, Temu).',
          fields: [
            {
              name: 'amazonUrl',
              type: 'text',
              label: 'URL Amazon',
              admin: {
                placeholder: 'https://www.amazon.fr/dp/...',
                description: 'Lien direct vers la fiche produit sur Amazon',
              },
            },
            {
              name: 'temuUrl',
              type: 'text',
              label: 'URL Temu',
              admin: {
                placeholder: 'https://www.temu.com/...',
                description: 'Lien direct vers la fiche produit sur Temu',
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
                  type: 'json',
                  admin: { description: 'Allégations détectées par le LLM (tableau JSON, audit trail IA).' },
                },
                { name: 'reason', type: 'textarea' },
                { name: 'at', type: 'date' },
              ],
            },
          ],
        },
      ],
    },
    suggestedRelationsField({ name: 'suggestedBenefits', target: 'benefits', label: 'Bienfaits suggérés', targetField: 'benefits' }),
    complianceCheckField({ collection: 'products', fields: ['shortDescription', 'ingredients'] }),
    seoGenerateField({ collection: 'products' }),
    aiHistoryField(),
  ],
}
