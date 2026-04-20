import type { Tab } from 'payload'

/**
 * Tab GEO (Generative Engine Optimization)
 *
 * Champs éditoriaux qui aident le contenu à être cité par ChatGPT,
 * Perplexity, Google AI Overviews, Claude, Gemini. Basé sur le framework
 * CORE-EEAT (items à plus fort impact : C02, C04, C09, O02, O03, R01, R02).
 *
 * Principe: on ne duplique pas la saisie — on capture des extraits
 * "prêts à être cités" par les LLM, structurés pour extraction machine.
 */
export const geoTab: Tab = {
  label: 'GEO',
  description:
    'Optimisation pour citation par les moteurs génératifs (ChatGPT, Perplexity, AI Overviews, Claude, Gemini).',
  fields: [
    {
      name: 'directAnswer',
      type: 'textarea',
      localized: true,
      label: 'Réponse directe (40-60 mots)',
      admin: {
        placeholder:
          'Ex : La camomille romaine est une plante médicinale aux propriétés calmantes, digestives et anti-inflammatoires, traditionnellement utilisée en infusion pour apaiser les troubles du sommeil et les tensions digestives.',
        description:
          'Paragraphe standalone répondant à la requête principale. C\u2019est la portion que les IA extraient pour leurs réponses (Google AI Overviews, ChatGPT). Idéal : 40-60 mots.',
        rows: 4,
      },
    },
    {
      name: 'definition',
      type: 'textarea',
      localized: true,
      label: 'Définition standalone (25-50 mots)',
      admin: {
        placeholder:
          'Ex : La camomille romaine (Chamaemelum nobile) est une plante vivace de la famille des Astéracées, utilisée depuis l\u2019Antiquité pour ses propriétés apaisantes et digestives.',
        description:
          'Définition auto-portante commençant par le terme. Utilisée par les IA pour les requêtes "Qu\u2019est-ce que X ?". 25-50 mots.',
        rows: 3,
      },
    },
    {
      name: 'keyTakeaways',
      type: 'array',
      localized: true,
      label: 'Points-clés (3-5)',
      minRows: 0,
      maxRows: 5,
      labels: { singular: 'Point-clé', plural: 'Points-clés' },
      admin: {
        description:
          'Bloc "À retenir" : 3 à 5 faits essentiels, chacun auto-portant. Premier choix pour les résumés IA.',
      },
      fields: [
        {
          name: 'takeaway',
          type: 'text',
          required: true,
          label: 'Point-clé',
        },
      ],
    },
    {
      name: 'quotableStatements',
      type: 'array',
      localized: true,
      label: 'Déclarations quotables',
      minRows: 0,
      maxRows: 5,
      labels: { singular: 'Déclaration', plural: 'Déclarations' },
      admin: {
        description:
          'Phrases factuelles courtes et vérifiables avec source. Conçues pour être citées verbatim par les IA.',
      },
      fields: [
        {
          name: 'statement',
          type: 'text',
          required: true,
          label: 'Déclaration',
          admin: {
            placeholder:
              'Ex : Une tasse de camomille contient des flavonoïdes qui se lient aux récepteurs GABA du cerveau.',
          },
        },
        {
          name: 'source',
          type: 'text',
          label: 'Source',
          admin: {
            placeholder: 'Ex : Journal of Ethnopharmacology, 2011',
            description: 'Publication, étude, ou organisation citée.',
          },
        },
      ],
    },
    {
      name: 'dataPoints',
      type: 'array',
      label: 'Points de données chiffrés',
      minRows: 0,
      maxRows: 10,
      labels: { singular: 'Donnée', plural: 'Données' },
      admin: {
        description:
          'Faits chiffrés précis (métrique, valeur, unité, source). ≥5 points de données augmentent significativement la citabilité IA.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'metric',
              type: 'text',
              required: true,
              label: 'Métrique',
              admin: { width: '40%', placeholder: 'Ex : Temps d\u2019endormissement' },
            },
            {
              name: 'value',
              type: 'text',
              required: true,
              label: 'Valeur',
              admin: { width: '20%', placeholder: 'Ex : 15' },
            },
            {
              name: 'unit',
              type: 'text',
              label: 'Unité',
              admin: { width: '20%', placeholder: 'Ex : minutes' },
            },
          ],
        },
        {
          name: 'source',
          type: 'text',
          label: 'Source',
          admin: {
            placeholder: 'Ex : Méta-analyse Cochrane 2023',
          },
        },
      ],
    },
    {
      name: 'faq',
      type: 'array',
      localized: true,
      label: 'FAQ (questions fréquentes IA)',
      minRows: 0,
      maxRows: 10,
      labels: { singular: 'Q/R', plural: 'Questions/Réponses' },
      admin: {
        description:
          'Paires Q/R alignées avec les requêtes de suivi posées aux IA. Génèrent le schema FAQPage JSON-LD côté frontend.',
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
          label: 'Question',
          admin: {
            placeholder: 'Ex : La camomille a-t-elle des effets secondaires ?',
          },
        },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
          label: 'Réponse',
          admin: {
            rows: 3,
            description: 'Réponse concise (2-4 phrases), auto-portante.',
          },
        },
      ],
    },
    {
      name: 'targetAIQueries',
      type: 'array',
      localized: true,
      label: 'Requêtes IA cibles',
      minRows: 0,
      maxRows: 10,
      labels: { singular: 'Requête', plural: 'Requêtes' },
      admin: {
        description:
          'Requêtes que ce contenu doit pouvoir satisfaire auprès des IA. Sert à l\u2019édition et au suivi de visibilité.',
      },
      fields: [
        {
          name: 'query',
          type: 'text',
          required: true,
          label: 'Requête',
          admin: {
            placeholder: 'Ex : Quelle plante pour mieux dormir ?',
          },
        },
      ],
    },
    {
      name: 'authoritySignals',
      type: 'textarea',
      localized: true,
      label: 'Signaux d\u2019autorité',
      admin: {
        description:
          'Credentials auteur, affiliations, certifications, organisations sources. Renforce la confiance des IA.',
        placeholder:
          'Ex : Rédigé par Dr. Marie Dubois, pharmacienne herboriste, 15 ans d\u2019expérience en phytothérapie. Références : Monographie EMA/HMPC 2015.',
        rows: 3,
      },
    },
    {
      name: 'sources',
      type: 'array',
      label: 'Sources citées',
      minRows: 0,
      maxRows: 20,
      labels: { singular: 'Source', plural: 'Sources' },
      admin: {
        description:
          'Sources primaires vérifiables. Cible : ≥1 citation par 500 mots. Les IA préfèrent les sources autoritatives.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Titre',
          admin: {
            placeholder: 'Ex : Community herbal monograph on Matricaria recutita L.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'publisher',
              type: 'text',
              label: 'Éditeur',
              admin: { width: '50%', placeholder: 'Ex : EMA/HMPC' },
            },
            {
              name: 'year',
              type: 'number',
              label: 'Année',
              admin: { width: '15%', placeholder: '2015' },
            },
            {
              name: 'url',
              type: 'text',
              label: 'URL',
              admin: { width: '35%', placeholder: 'https://…' },
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'lastFactCheckedAt',
          type: 'date',
          label: 'Dernière vérification factuelle',
          admin: {
            width: '50%',
            description:
              'Les IA privilégient les contenus récemment validés. À mettre à jour à chaque revue.',
          },
        },
        {
          name: 'geoReadinessScore',
          type: 'number',
          min: 0,
          max: 100,
          label: 'Score GEO (0-100)',
          admin: {
            width: '50%',
            description:
              'Auto-évaluation ou score issu d\u2019un audit GEO. Aide à prioriser les optimisations.',
          },
        },
      ],
    },
    {
      name: 'geoNotes',
      type: 'textarea',
      label: 'Notes GEO internes',
      admin: {
        description:
          'Notes éditoriales internes : angles testés, gaps identifiés, plateformes visées.',
        rows: 3,
      },
    },
  ],
}
