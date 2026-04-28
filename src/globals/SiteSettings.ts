import type { GlobalConfig } from 'payload'
import { coerceUploadIdsGlobal } from '@/hooks/coerceUploadIds'

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
  hooks: {
    beforeValidate: [coerceUploadIdsGlobal],
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
    {
      type: 'group',
      name: 'ai',
      label: 'IA',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Activer les fonctionnalités IA (éditeur admin)',
        },
        {
          name: 'dailyBudgetEur',
          type: 'number',
          defaultValue: 0.5,
          min: 0,
          admin: {
            step: 0.01,
            description:
              'Kill-switch automatique au-delà. Pour un budget 15€/mois ≈ 0.50€/jour.',
          },
          label: 'Budget IA quotidien (EUR)',
        },
        {
          name: 'monthlyBudgetEur',
          type: 'number',
          defaultValue: 15,
          min: 0,
          admin: {
            step: 1,
          },
          label: 'Budget IA mensuel (EUR)',
        },
        {
          name: 'fallbackProvider',
          type: 'select',
          options: [
            { label: 'Aucun', value: 'none' },
            { label: 'Claude Haiku 4.5', value: 'claude-haiku' },
          ],
          defaultValue: 'none',
          label: 'Fallback si Gemini échoue',
          admin: {
            description:
              'Claude Haiku 4.5 utilisé uniquement en cas d’erreur Gemini. Coût ~10× plus élevé.',
          },
        },
        {
          name: 'killSwitch',
          type: 'checkbox',
          defaultValue: false,
          label: 'Kill-switch manuel (désactive immédiatement tous les endpoints IA)',
        },
        {
          name: 'maintenanceMessage',
          type: 'textarea',
          defaultValue: '',
          label: 'Message affiché quand l’IA est désactivée/kill-switched',
          admin: {
            description:
              "Ex: 'Fonctionnalité IA temporairement indisponible — contactez un admin.'",
          },
          access: {
            read: ({ req }) => Boolean((req.user as any)?.role === 'admin'),
          },
        },
      ],
    },
    {
      type: 'group',
      name: 'autopilot',
      label: 'Pilote auto — production de contenu',
      admin: {
        description:
          "Programmation autonome de production wiki / blog. L'IA découvre des sujets en se basant sur les tendances web et lance des productions à intervalles aléatoires dans une plage configurée.",
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          label: "Activer l'autopilote",
        },
        {
          name: 'cronTickMinutes',
          type: 'number',
          defaultValue: 30,
          min: 5,
          max: 1440,
          label: 'Intervalle minimum entre 2 tentatives (minutes)',
          admin: {
            description:
              "Le tick cron est appelé toutes les 30 min ; il déclenche réellement une production avec une probabilité jitter pour étaler dans la journée.",
          },
        },
        {
          type: 'group',
          name: 'hoursWindow',
          label: 'Plage horaire active (UTC)',
          fields: [
            {
              name: 'start',
              type: 'number',
              defaultValue: 7,
              min: 0,
              max: 23,
              label: 'Heure de début (0-23)',
            },
            {
              name: 'end',
              type: 'number',
              defaultValue: 19,
              min: 0,
              max: 23,
              label: 'Heure de fin (0-23)',
            },
          ],
        },
        {
          name: 'daysOfWeek',
          type: 'select',
          hasMany: true,
          defaultValue: ['mon', 'tue', 'wed', 'thu', 'fri'],
          options: [
            { label: 'Lun', value: 'mon' },
            { label: 'Mar', value: 'tue' },
            { label: 'Mer', value: 'wed' },
            { label: 'Jeu', value: 'thu' },
            { label: 'Ven', value: 'fri' },
            { label: 'Sam', value: 'sat' },
            { label: 'Dim', value: 'sun' },
          ],
        },
        {
          name: 'dailyMaxProductions',
          type: 'number',
          defaultValue: 3,
          min: 0,
          max: 50,
          label: 'Maximum de productions par jour',
        },
        {
          type: 'group',
          name: 'contentMix',
          label: 'Mix de contenu (probabilités)',
          fields: [
            {
              name: 'wiki',
              type: 'number',
              defaultValue: 0.6,
              min: 0,
              max: 1,
              label: 'Probabilité wiki (0..1)',
            },
            {
              name: 'blog',
              type: 'number',
              defaultValue: 0.4,
              min: 0,
              max: 1,
              label: 'Probabilité blog (0..1)',
            },
          ],
        },
        {
          name: 'budgetCapDailyEur',
          type: 'number',
          defaultValue: 0.2,
          min: 0,
          max: 50,
          label: 'Plafond quotidien autopilote (€)',
          admin: {
            description:
              "Cap dédié à l'autopilote. Le pipeline interactif a son propre cap dans `ai.dailyBudgetEur`.",
          },
        },
        {
          name: 'excludeKnownTopics',
          type: 'checkbox',
          defaultValue: true,
          label: 'Éviter les sujets déjà couverts (similarité ≥ 0.85)',
        },
        {
          name: 'locale',
          type: 'select',
          defaultValue: 'fr',
          options: [
            { label: 'Français', value: 'fr' },
            { label: 'English', value: 'en' },
          ],
          label: 'Locale par défaut',
        },
        {
          name: 'lastTickAt',
          type: 'date',
          label: 'Dernier tick',
          admin: { readOnly: true },
        },
        {
          name: 'lastSuccessAt',
          type: 'date',
          label: 'Dernière prod réussie',
          admin: { readOnly: true },
        },
        {
          name: 'lastErrorAt',
          type: 'date',
          label: 'Dernière erreur',
          admin: { readOnly: true },
        },
        {
          name: 'lastErrorMessage',
          type: 'textarea',
          label: "Dernier message d'erreur",
          admin: { readOnly: true },
        },
      ],
    },
  ],
}
