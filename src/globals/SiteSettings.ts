import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Paramètres du site',
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean((user as any)?.role === 'admin'),
  },
  admin: {
    group: 'Maison',
    hidden: false,
  },
  fields: [
    {
      type: 'group',
      name: 'general',
      label: 'Général',
      fields: [
        {
          name: 'siteName',
          type: 'text',
          required: true,
          defaultValue: 'Les Remèdes de Mamie',
        },
        {
          name: 'baseline',
          type: 'text',
          defaultValue: "L'almanach des plantes qui soignent",
        },
        {
          name: 'primaryLanguage',
          type: 'select',
          options: [
            { label: 'Français (France)', value: 'fr-FR' },
            { label: 'English (US)', value: 'en-US' },
          ],
          defaultValue: 'fr-FR',
        },
        {
          name: 'timezone',
          type: 'text',
          defaultValue: 'Europe/Paris',
        },
        {
          name: 'shortDescription',
          type: 'textarea',
          defaultValue:
            'Une encyclopédie botanique réunissant les savoirs de la pharmacopée française et de la médecine traditionnelle chinoise — rigoureusement sourcée, illustrée, et lisible par tous.',
        },
      ],
    },
    {
      type: 'group',
      name: 'brand',
      label: 'Marque',
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          required: false,
        },
      ],
    },
    {
      type: 'group',
      name: 'seo',
      label: 'SEO',
      fields: [
        {
          name: 'defaultTitle',
          type: 'text',
          defaultValue: 'Les Remèdes de Mamie',
        },
        {
          name: 'defaultDescription',
          type: 'textarea',
          defaultValue:
            'Une encyclopédie botanique réunissant les savoirs de la pharmacopée française et de la médecine traditionnelle chinoise — rigoureusement sourcée, illustrée, et lisible par tous.',
        },
        {
          name: 'canonicalHostname',
          type: 'text',
          defaultValue: 'https://lesremedesdmamie.fr',
        },
      ],
    },
    {
      type: 'group',
      name: 'newsletter',
      label: 'Newsletter',
      fields: [
        {
          name: 'provider',
          type: 'select',
          options: [
            { label: 'Aucun', value: 'none' },
            { label: 'Brevo', value: 'brevo' },
          ],
          defaultValue: 'none',
        },
        {
          name: 'listId',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      type: 'group',
      name: 'boutique',
      label: 'Boutique',
      fields: [
        {
          name: 'defaultCurrency',
          type: 'select',
          options: [
            { label: 'Euro (EUR)', value: 'EUR' },
            { label: 'US Dollar (USD)', value: 'USD' },
            { label: 'British Pound (GBP)', value: 'GBP' },
          ],
          defaultValue: 'EUR',
        },
        {
          name: 'stripeEnabled',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      type: 'group',
      name: 'integrations',
      label: 'Intégrations',
      fields: [
        {
          name: 'stripeConnected',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'brevoConnected',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'algoliaConnected',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'googleAnalyticsId',
          type: 'text',
          required: false,
        },
        {
          name: 'instagramHandle',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      type: 'group',
      name: 'developers',
      label: 'Développeurs',
      fields: [
        {
          name: 'webhookUrl',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      type: 'group',
      name: 'backups',
      label: 'Sauvegardes',
      fields: [
        {
          name: 'retentionDays',
          type: 'number',
          defaultValue: 30,
          min: 1,
          max: 365,
        },
      ],
    },
  ],
}
