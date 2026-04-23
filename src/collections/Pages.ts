import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublishedOrAdmin, isAdmin } from '@/access'
import { createAuditLog, autoSlug } from '@/hooks'
import { slugify } from '@/lib/slugify'

const adminOnlyField = {
  create: ({ req }: any) => req.user?.role === 'admin',
  update: ({ req }: any) => req.user?.role === 'admin',
  read: () => true,
}

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
      views: {
        list: {
          Component: '@/components/admin/views/PagesList.tsx#default',
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
        placeholder: 'a-propos',
        description: 'Identifiant unique pour l\u2019URL de la page. G\u00e9n\u00e9r\u00e9 automatiquement depuis le titre si vide.',
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
        {
          slug: 'customCode',
          labels: {
            singular: 'Code personnalis\u00e9 (HTML/CSS/JS)',
            plural: 'Blocs code personnalis\u00e9',
          },
          admin: {
            description:
              '\u26a0 Bloc avanc\u00e9 admin uniquement. Le HTML/CSS/JS est injecte tel quel dans la page. Scope CSS automatique via un wrapper unique. Risque XSS: n\u2019injecter que du code que vous avez \u00e9crit.',
          } as any,
          fields: [
            {
              name: 'label',
              type: 'text',
              label: 'Nom interne (non affich\u00e9)',
              admin: {
                placeholder: 'Ex : Widget calculateur',
                description: 'Utile pour s\u2019y retrouver dans le builder',
              },
            },
            {
              name: 'html',
              type: 'code',
              access: adminOnlyField,
              label: 'HTML (body)',
              admin: {
                language: 'html',
                description:
                  'HTML du bloc (sans balises <html>/<body>). Auto-wrapp\u00e9 dans un <div> avec classe de scope.',
              },
            },
            {
              name: 'css',
              type: 'code',
              access: adminOnlyField,
              label: 'CSS',
              admin: {
                language: 'css',
                description:
                  'Auto-scop\u00e9 au bloc via un pr\u00e9fixe de classe unique. Vous pouvez \u00e9crire des s\u00e9lecteurs normaux (h1, .btn, etc.).',
              },
            },
            {
              name: 'js',
              type: 'code',
              access: adminOnlyField,
              label: 'JavaScript',
              admin: {
                language: 'javascript',
                description:
                  'S\u2019ex\u00e9cute une fois au chargement, dans une IIFE, avec `root` = \u00e9l\u00e9ment racine du bloc.',
              },
            },
          ],
        },
      ],
    },
  ],
}
