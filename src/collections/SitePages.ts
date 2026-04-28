import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublishedOrAdmin, isAdmin } from '@/access'
import { createAuditLog } from '@/hooks'
import { coerceUploadIds } from '@/hooks/coerceUploadIds'

const adminOnlyField = {
  create: ({ req }: any) => req.user?.role === 'admin',
  update: ({ req }: any) => req.user?.role === 'admin',
  read: () => true,
}

export const SITE_PAGE_SLUGS = [
  { label: 'À propos', value: 'a-propos' },
  { label: 'Contact', value: 'contact' },
  { label: 'FAQ', value: 'faq' },
  { label: 'CGV', value: 'cgv' },
  { label: 'Mentions légales', value: 'mentions-legales' },
  { label: 'Politique de confidentialité', value: 'politique-confidentialite' },
  { label: 'Politique de cookies', value: 'politique-cookies' },
  { label: 'Avertissement santé', value: 'avertissement-sante' },
  { label: 'Accessibilité', value: 'accessibilite' },
] as const

export const SitePages: CollectionConfig = {
  slug: 'sitePages',
  labels: {
    singular: 'Page du site',
    plural: 'Pages du site',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: 'Pages du site',
    description:
      'Pages statiques du site (À propos, Contact, FAQ, mentions légales, etc.). Les slugs sont figés pour correspondre aux routes.',
    components: {
      views: {
        list: {
          Component: '@/components/admin/views/SitePagesList.tsx#default',
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
    beforeValidate: [coerceUploadIds],
    afterChange: [createAuditLog],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: 'Titre de la page',
      admin: { placeholder: 'Ex : À propos' },
    },
    {
      name: 'slug',
      type: 'select',
      required: true,
      unique: true,
      label: 'Slug (verrouillé)',
      options: [...SITE_PAGE_SLUGS],
      admin: {
        description:
          'Le slug ne peut pas être modifié librement — il doit correspondre à une route existante du site.',
      },
    },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      label: 'Introduction (optionnelle)',
      admin: { description: 'Courte intro affichée sous le titre de la page' },
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Sections de la page',
      labels: { singular: 'Section', plural: 'Sections' },
      admin: { description: 'Construisez la page section par section' },
      blocks: [
        {
          slug: 'hero',
          labels: {
            singular: 'Bannière Hero',
            plural: 'Bannières Hero',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              localized: true,
              label: 'Titre principal',
              admin: { placeholder: 'Ex : Découvrez les remèdes de grand-mère' },
            },
            {
              name: 'subheading',
              type: 'text',
              localized: true,
              label: 'Sous-titre',
              admin: { placeholder: 'Ex : Le savoir ancestral à portée de main' },
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
              admin: { placeholder: 'Ex : Découvrir' },
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
          slug: 'cta',
          labels: {
            singular: 'Appel à l’action',
            plural: 'Appels à l’action',
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
              label: 'Questions / Réponses',
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
                  admin: { placeholder: 'Ex : Comment préparer une tisane ?' },
                },
                {
                  name: 'answer',
                  type: 'richText',
                  localized: true,
                  label: 'Réponse',
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
              label: 'Légende',
            },
          ],
        },
        {
          slug: 'customCode',
          labels: {
            singular: 'Code personnalisé (HTML/CSS/JS)',
            plural: 'Blocs code personnalisé',
          },
          admin: {
            description:
              '⚠ Bloc avancé admin uniquement. Le HTML/CSS/JS est injecte tel quel dans la page. Scope CSS automatique via un wrapper unique. Risque XSS: n’injecter que du code que vous avez écrit.',
          } as any,
          fields: [
            {
              name: 'label',
              type: 'text',
              label: 'Nom interne (non affiché)',
              admin: {
                placeholder: 'Ex : Widget calculateur',
                description: 'Utile pour s’y retrouver dans le builder',
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
                  'HTML du bloc (sans balises <html>/<body>). Auto-wrappé dans un <div> avec classe de scope.',
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
                  'Auto-scopé au bloc via un préfixe de classe unique. Vous pouvez écrire des sélecteurs normaux (h1, .btn, etc.).',
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
                  'S’exécute une fois au chargement, dans une IIFE, avec `root` = élément racine du bloc.',
              },
            },
          ],
        },
        {
          slug: 'contactInfo',
          labels: {
            singular: 'Informations de contact',
            plural: 'Blocs d’informations de contact',
          },
          admin: {
            description:
              'Bloc dédié à la page Contact : adresse, email, téléphone, horaires.',
          } as any,
          fields: [
            {
              name: 'heading',
              type: 'text',
              localized: true,
              label: 'Titre',
              admin: { placeholder: 'Ex : Nous contacter' },
            },
            {
              name: 'address',
              type: 'textarea',
              localized: true,
              label: 'Adresse',
              admin: { placeholder: '123 rue de l’Herboriste, 75000 Paris' },
            },
            {
              name: 'email',
              type: 'text',
              label: 'Email',
              admin: { placeholder: 'contact@exemple.fr' },
            },
            {
              name: 'phone',
              type: 'text',
              label: 'Téléphone',
              admin: { placeholder: '+33 1 23 45 67 89' },
            },
            {
              name: 'openingHours',
              type: 'array',
              label: 'Horaires d’ouverture',
              labels: {
                singular: 'Créneau',
                plural: 'Créneaux',
              },
              fields: [
                {
                  name: 'day',
                  type: 'text',
                  localized: true,
                  label: 'Jour',
                  admin: { placeholder: 'Ex : Lundi' },
                },
                {
                  name: 'hours',
                  type: 'text',
                  localized: true,
                  label: 'Horaires',
                  admin: { placeholder: 'Ex : 9h - 18h' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
