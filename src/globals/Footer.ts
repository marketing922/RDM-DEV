import type { GlobalConfig } from 'payload'

const PLATFORMS = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Pinterest', value: 'pinterest' },
  { label: 'LinkedIn', value: 'linkedin' },
] as const

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Pied de page',
  access: {
    read: () => true,
    update: ({ req: { user } }) =>
      Boolean((user as any)?.role === 'admin' || (user as any)?.role === 'editor'),
  },
  admin: {
    group: 'Pages du site',
    description:
      'Contenu du pied de page : colonnes de liens, réseaux sociaux, mentions légales, newsletter.',
  },
  fields: [
    {
      name: 'columns',
      type: 'array',
      label: 'Colonnes thématiques',
      minRows: 1,
      maxRows: 5,
      defaultValue: [
        {
          title: 'Encyclopédie',
          links: [
            { label: 'Plantes', href: '/plantes' },
            { label: 'Bienfaits', href: '/bienfaits' },
            { label: 'Journal', href: '/blog' },
          ],
        },
        {
          title: 'Boutique',
          links: [
            { label: 'Tous les produits', href: '/produits' },
            { label: 'Tisanes', href: '/produits?filter=tisanes' },
            { label: 'Gélules', href: '/produits?filter=gelules' },
          ],
        },
        {
          title: 'La maison',
          links: [
            { label: 'À propos', href: '/a-propos' },
            { label: 'Contact', href: '/contact' },
            { label: 'FAQ', href: '/faq' },
          ],
        },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          label: 'Titre de colonne',
        },
        {
          name: 'links',
          type: 'array',
          label: 'Liens',
          minRows: 1,
          fields: [
            { name: 'label', type: 'text', required: true, localized: true, label: 'Libellé' },
            { name: 'href', type: 'text', required: true, label: 'Lien' },
            {
              name: 'openInNewTab',
              type: 'checkbox',
              defaultValue: false,
              label: 'Nouvel onglet',
            },
          ],
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Réseaux sociaux',
      defaultValue: [
        { platform: 'instagram', url: 'https://instagram.com/lesremedesdemamie' },
      ],
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [...PLATFORMS],
          label: 'Plateforme',
        },
        { name: 'url', type: 'text', required: true, label: 'URL complète' },
      ],
    },
    {
      name: 'legalLinks',
      type: 'array',
      label: 'Liens légaux (en bas du footer)',
      defaultValue: [
        { label: 'Mentions légales', href: '/mentions-legales' },
        { label: 'CGV', href: '/cgv' },
        { label: 'Confidentialité', href: '/politique-confidentialite' },
        { label: 'Cookies', href: '/politique-cookies' },
        { label: 'Accessibilité', href: '/accessibilite' },
      ],
      fields: [
        { name: 'label', type: 'text', required: true, localized: true, label: 'Libellé' },
        { name: 'href', type: 'text', required: true, label: 'Lien' },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      localized: true,
      defaultValue: '© 2026 Les Remèdes de Mamie. Tous droits réservés.',
      label: 'Copyright',
    },
    {
      type: 'group',
      name: 'newsletter',
      label: 'Bloc newsletter',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Afficher le bloc newsletter',
        },
        {
          name: 'heading',
          type: 'text',
          localized: true,
          defaultValue: 'Recevez nos remèdes',
          label: 'Titre',
        },
        {
          name: 'subheading',
          type: 'textarea',
          localized: true,
          defaultValue:
            'Un e-mail mensuel avec des conseils, de nouvelles fiches et des recettes.',
          label: 'Sous-titre',
        },
        {
          name: 'ctaLabel',
          type: 'text',
          localized: true,
          defaultValue: "S'inscrire",
          label: 'Bouton',
        },
        {
          name: 'placeholder',
          type: 'text',
          localized: true,
          defaultValue: 'Votre adresse e-mail',
          label: 'Placeholder champ email',
        },
      ],
    },
  ],
}
