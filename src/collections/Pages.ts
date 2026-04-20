import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublishedOrAdmin, isAdmin } from '@/access'
import { createAuditLog } from '@/hooks'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Contenu',
    description: 'G\u00e9rer les pages statiques du site (accueil, \u00e0 propos, etc.)',
    components: {
      beforeList: ['@/components/admin/ListHero.tsx#default'],
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
    afterChange: [createAuditLog],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: 'Titre de la page',
      admin: {
        placeholder: 'Ex : Accueil, \u00c0 propos',
        description: 'Le titre principal de la page',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      label: 'Slug (URL)',
      admin: {
        placeholder: 'a-propos',
        description: 'Identifiant unique pour l\u2019URL de la page',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Mise en page',
      labels: {
        singular: 'Bloc',
        plural: 'Blocs',
      },
      admin: {
        description: 'Construisez la page en ajoutant des blocs de contenu',
      },
      blocks: [
        {
          slug: 'hero',
          labels: {
            singular: 'Banni\u00e8re Hero',
            plural: 'Banni\u00e8res Hero',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              localized: true,
              label: 'Titre principal',
              admin: { placeholder: 'Ex : D\u00e9couvrez les rem\u00e8des de grand-m\u00e8re' },
            },
            {
              name: 'subheading',
              type: 'text',
              localized: true,
              label: 'Sous-titre',
              admin: { placeholder: 'Ex : Le savoir ancestral \u00e0 port\u00e9e de main' },
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: 'Image de fond',
            },
            {
              name: 'ctaLabel',
              type: 'text',
              localized: true,
              label: 'Texte du bouton',
              admin: { placeholder: 'Ex : D\u00e9couvrir' },
            },
            {
              name: 'ctaLink',
              type: 'text',
              label: 'Lien du bouton',
              admin: { placeholder: 'Ex : /encyclopedie' },
            },
          ],
        },
        {
          slug: 'content',
          labels: {
            singular: 'Contenu texte',
            plural: 'Blocs de contenu texte',
          },
          fields: [
            {
              name: 'richText',
              type: 'richText',
              localized: true,
              label: 'Contenu',
              admin: { description: 'Bloc de texte riche avec mise en forme' },
            },
          ],
        },
        {
          slug: 'productGrid',
          labels: {
            singular: 'Grille de produits',
            plural: 'Grilles de produits',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              localized: true,
              label: 'Titre de la section',
            },
            {
              name: 'products',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              label: 'Produits \u00e0 afficher',
              admin: { description: 'S\u00e9lectionnez les produits \u00e0 mettre en avant' },
            },
          ],
        },
        {
          slug: 'wikiGrid',
          labels: {
            singular: 'Grille de plantes',
            plural: 'Grilles de plantes',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              localized: true,
              label: 'Titre de la section',
            },
            {
              name: 'entries',
              type: 'relationship',
              relationTo: 'wikiEntries',
              hasMany: true,
              label: 'Fiches plantes \u00e0 afficher',
              admin: { description: 'S\u00e9lectionnez les fiches plantes \u00e0 mettre en avant' },
            },
          ],
        },
        {
          slug: 'cta',
          labels: {
            singular: 'Appel \u00e0 l\u2019action',
            plural: 'Appels \u00e0 l\u2019action',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              localized: true,
              label: 'Titre',
            },
            {
              name: 'description',
              type: 'textarea',
              localized: true,
              label: 'Description',
            },
            {
              name: 'buttonLabel',
              type: 'text',
              localized: true,
              label: 'Texte du bouton',
              admin: { placeholder: 'Ex : En savoir plus' },
            },
            {
              name: 'buttonLink',
              type: 'text',
              label: 'Lien du bouton',
              admin: { placeholder: 'Ex : /blog' },
            },
          ],
        },
        {
          slug: 'faq',
          labels: {
            singular: 'FAQ',
            plural: 'Sections FAQ',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              localized: true,
              label: 'Titre de la section FAQ',
            },
            {
              name: 'items',
              type: 'array',
              label: 'Questions / R\u00e9ponses',
              labels: {
                singular: 'Question',
                plural: 'Questions',
              },
              fields: [
                {
                  name: 'question',
                  type: 'text',
                  localized: true,
                  label: 'Question',
                  admin: { placeholder: 'Ex : Comment pr\u00e9parer une tisane ?' },
                },
                {
                  name: 'answer',
                  type: 'richText',
                  localized: true,
                  label: 'R\u00e9ponse',
                },
              ],
            },
          ],
        },
        {
          slug: 'image',
          labels: {
            singular: 'Image',
            plural: 'Images',
          },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: 'Image',
            },
            {
              name: 'caption',
              type: 'text',
              localized: true,
              label: 'L\u00e9gende',
            },
          ],
        },
      ],
    },
  ],
}
