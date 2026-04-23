import type { GlobalConfig } from 'payload'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation principale',
  access: {
    read: () => true,
    update: ({ req: { user } }) =>
      Boolean((user as any)?.role === 'admin' || (user as any)?.role === 'editor'),
  },
  admin: {
    group: 'Pages du site',
    description: 'Contenu de la barre de navigation : liens principaux, bouton CTA.',
  },
  fields: [
    {
      type: 'group',
      name: 'brand',
      label: 'Identité de marque',
      fields: [
        {
          name: 'wordmark',
          type: 'text',
          localized: true,
          defaultValue: 'Les Remèdes de Mamie',
          label: 'Nom de marque',
          admin: { description: 'Affiché uniquement si le logo image ne charge pas.' },
        },
        {
          name: 'tagline',
          type: 'text',
          localized: true,
          defaultValue: 'Est. Paris · 2024',
          label: 'Baseline',
          admin: { description: 'Petit tag à droite du logo (ex : "Est. Paris · 2024").' },
        },
      ],
    },
    {
      name: 'links',
      type: 'array',
      label: 'Liens de navigation',
      labels: { singular: 'Lien', plural: 'Liens' },
      admin: {
        description: "Ordre d'affichage de gauche à droite. Glisser-déposer pour réorganiser.",
      },
      defaultValue: [
        { label: 'Plantes', href: '/plantes', openInNewTab: false },
        { label: 'Bienfaits', href: '/bienfaits', openInNewTab: false },
        { label: 'Produits', href: '/produits', openInNewTab: false },
        { label: 'Journal', href: '/blog', openInNewTab: false },
        { label: 'À propos', href: '/a-propos', openInNewTab: false },
      ],
      fields: [
        { name: 'label', type: 'text', required: true, localized: true, label: 'Libellé' },
        {
          name: 'href',
          type: 'text',
          required: true,
          label: 'Lien',
          admin: { placeholder: '/plantes' },
        },
        {
          name: 'openInNewTab',
          type: 'checkbox',
          defaultValue: false,
          label: 'Ouvrir dans un nouvel onglet',
        },
      ],
    },
    {
      type: 'group',
      name: 'ctaButton',
      label: "Bouton d'action",
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Afficher le bouton',
        },
        {
          name: 'label',
          type: 'text',
          localized: true,
          defaultValue: 'Boutique',
          label: 'Libellé',
        },
        { name: 'href', type: 'text', defaultValue: '/produits', label: 'Lien' },
        {
          name: 'style',
          type: 'select',
          defaultValue: 'primary',
          options: [
            { label: 'Principal (burgundy)', value: 'primary' },
            { label: 'Léger (ghost)', value: 'ghost' },
          ],
          label: 'Style',
        },
      ],
    },
  ],
}
