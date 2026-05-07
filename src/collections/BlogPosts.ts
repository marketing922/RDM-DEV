import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublishedOrAdmin, isAdmin } from '@/access'
import { scanForbiddenClaims, gatePublishCompliance, createAuditLog, autoSlug } from '@/hooks'
import { backupAfterChange } from '@/hooks/backupAfterChange'
import { revalidateAfterChange } from '@/hooks/revalidateAfterChange'
import { coerceUploadIds } from '@/hooks/coerceUploadIds'
import { makeEmbedHook } from '@/hooks/embedAfterChange'
import { blogPostsExtractor } from '@/hooks/embedExtractors'
import { makeModerateContentAfterChangeHook } from '@/hooks/moderateContentHook'
import { suggestedRelationsField } from '@/components/admin/fields/suggestedRelationsField'
import { complianceCheckField } from '@/components/admin/fields/complianceCheckField'
import { seoGenerateField } from '@/components/admin/fields/seoGenerateField'
import { aiHistoryField } from '@/components/admin/fields/aiHistoryField'
import { geoTab } from '@/fields/geoFields'
import { slugify } from '@/lib/slugify'
import { validateImageUrl } from '@/lib/url-validators'

export const BlogPosts: CollectionConfig = {
  slug: 'blogPosts',
  labels: {
    singular: 'Article',
    plural: 'Articles du Blog',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', '_status', 'publishedAt', 'updatedAt'],
    group: 'Contenu',
    description: 'R\u00e9diger et g\u00e9rer les articles du blog',
    components: {
      beforeList: ['@/components/admin/ListHero.tsx#default'],
      // Almanach-style banner at the top of the edit view (above the fields).
      // Uses the `Description` slot which renders in Payload 3.83's document view.
      Description: '@/components/admin/editor/ArticleHeader.tsx#default',
      edit: {
        beforeDocumentControls: ['@/components/admin/DocHeaderChip.tsx#default'],
      },
      views: {
        list: { Component: '@/components/admin/views/ArticlesList.tsx#default' },
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
      makeModerateContentAfterChangeHook({ collection: 'blogPosts', fields: ['excerpt'] }),
      createAuditLog,
      backupAfterChange,
      makeEmbedHook('blogPosts', blogPostsExtractor),
      revalidateAfterChange,
    ],
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
                beforeValidate: [autoSlug('title')],
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
                placeholder: 'les-bienfaits-de-la-camomille',
                description: 'Identifiant unique pour l\u2019URL de l\u2019article. G\u00e9n\u00e9r\u00e9 automatiquement depuis le titre si vide.',
              },
            },
            {
              name: 'excerpt',
              type: 'textarea',
              localized: true,
              label: 'Extrait',
              admin: {
                description: 'Court r\u00e9sum\u00e9 affich\u00e9 dans les listes d\u2019articles et le SEO',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextareaField.tsx#default',
                },
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
            {
              name: 'galleryUrls',
              type: 'array',
              label: 'Galerie additionnelle (URLs)',
              labels: { singular: 'Image', plural: 'Images' },
              admin: {
                description:
                  "URLs externes inject\u00e9es dans le corps de l'article. Hosts " +
                  'autoris\u00e9s : res.cloudinary.com, images.unsplash.com (URL ' +
                  "directe de l'image, pas la page Unsplash), cdn.sanity.io. " +
                  'Plusieurs images peuvent cibler la m\u00eame section. Laisser ' +
                  '\u00ab Section n\u00b0 \u00bb vide pour les afficher en fin d\u2019article.',
              },
              fields: [
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  label: 'URL',
                  validate: validateImageUrl as any,
                  admin: { placeholder: 'https://res.cloudinary.com/...' },
                },
                {
                  name: 'caption',
                  type: 'text',
                  label: 'L\u00e9gende',
                  admin: { placeholder: 'Ex : Lavande en pleine floraison' },
                },
                {
                  name: 'sectionIndex',
                  type: 'number',
                  min: 1,
                  label: 'Section n\u00b0',
                  admin: {
                    description:
                      'Num\u00e9ro de la section (1, 2, 3\u2026) apr\u00e8s laquelle ins\u00e9rer l\u2019image. ' +
                      'Vide = en fin d\u2019article.',
                  },
                },
              ],
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
              name: 'relatedPlants',
              type: 'relationship',
              relationTo: 'wikiEntries',
              hasMany: true,
              label: 'Plantes citées',
              admin: {
                description: 'Fiches plantes mentionnées dans cet article.',
              },
            },
            {
              name: 'relatedProducts',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              label: 'Produits associés',
              admin: {
                description: 'Produits à mettre en avant dans cet article.',
              },
            },
            {
              name: 'relatedBenefits',
              type: 'relationship',
              relationTo: 'benefits',
              hasMany: true,
              label: 'Bienfaits liés',
              admin: {
                description: 'Bienfaits qui concernent cet article.',
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
              index: true,
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
                  type: 'json',
                  admin: { description: 'Allégations détectées par le LLM (tableau JSON, audit trail IA).' },
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
    suggestedRelationsField({ name: 'suggestedPlants', target: 'wikiEntries', label: 'Plantes suggérées', targetField: 'relatedPlants' }),
    complianceCheckField({ collection: 'blogPosts', fields: ['excerpt'] }),
    seoGenerateField({ collection: 'blogPosts' }),
    aiHistoryField(),
  ],
  indexes: [
    { fields: ['complianceStatus'] },
    { fields: ['publishedAt'] },
  ],
}
