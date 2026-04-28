import type { CollectionConfig } from 'payload'

export const AuditLog: CollectionConfig = {
  slug: 'auditLog',
  labels: {
    singular: 'Journal',
    plural: "Journal d'audit",
  },
  admin: {
    defaultColumns: ['action', 'subsystem', 'model', 'collection', 'user', 'timestamp'],
    group: 'Système',
    description: 'Historique de toutes les modifications effectuées sur le contenu',
  },
  defaultSort: '-createdAt',
  access: {
    create: ({ req }) => req.user?.role === 'admin',
    read: ({ req }) => req.user?.role === 'admin',
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'action',
      type: 'text',
      required: true,
      label: 'Action',
      admin: {
        readOnly: true,
        description: 'Le type d’opération effectuée',
      },
    },
    {
      name: 'collection',
      type: 'text',
      label: 'Collection',
      admin: {
        readOnly: true,
        description: 'La collection concernée par l’action',
      },
    },
    {
      name: 'documentId',
      type: 'text',
      label: 'ID du document',
      admin: {
        readOnly: true,
        description: 'L’identifiant du document modifié',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: 'Utilisateur',
      admin: {
        readOnly: true,
        description: 'L’utilisateur qui a effectué l’action',
      },
    },
    {
      name: 'before',
      type: 'json',
      label: 'État avant',
      admin: {
        readOnly: true,
        description: 'Les données du document avant la modification',
      },
    },
    {
      name: 'after',
      type: 'json',
      label: 'État après',
      admin: {
        readOnly: true,
        description: 'Les données du document après la modification',
      },
    },
    {
      name: 'timestamp',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      label: 'Date et heure',
      admin: {
        readOnly: true,
        description: 'Le moment exact de l’action',
      },
    },
    {
      name: 'subsystem',
      type: 'select',
      label: 'Sous-système',
      defaultValue: 'other',
      index: true,
      options: [
        { label: 'AI Generate', value: 'ai-generate' },
        { label: 'AI GEO', value: 'ai-geo' },
        { label: 'AI Moderate', value: 'ai-moderate' },
        { label: 'AI SEO', value: 'ai-seo' },
        { label: 'AI Pipeline', value: 'ai-pipeline' },
        { label: 'AI Embedding', value: 'ai-embedding' },
        { label: 'AI Vision', value: 'ai-vision' },
        { label: 'AI Research', value: 'ai-research' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'model',
      type: 'text',
      label: 'Modèle IA',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'collectionTarget',
      type: 'text',
      label: 'Collection cible',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'fieldTarget',
      type: 'text',
      label: 'Champ cible',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'entryId',
      type: 'text',
      index: true,
      label: 'ID du document ciblé',
      admin: {
        readOnly: true,
        description: "ID du document Payload sur lequel l'action a été effectuée",
      },
    },
    {
      name: 'promptTokens',
      type: 'number',
      label: 'Tokens prompt',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'completionTokens',
      type: 'number',
      label: 'Tokens completion',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'costEur',
      type: 'number',
      label: 'Coût (EUR)',
      admin: {
        readOnly: true,
        step: 0.000001,
      },
    },
    {
      name: 'durationMs',
      type: 'number',
      label: 'Durée (ms)',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'ok',
      type: 'checkbox',
      label: 'Succès',
      defaultValue: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'errorCode',
      type: 'text',
      label: 'Code erreur',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'promptExcerpt',
      type: 'textarea',
      label: 'Extrait prompt',
      admin: {
        readOnly: true,
        description: 'Tronqué à 500 caractères',
      },
    },
    {
      name: 'responseExcerpt',
      type: 'textarea',
      label: 'Extrait réponse',
      admin: {
        readOnly: true,
        description: 'Tronqué à 500 caractères',
      },
    },
    {
      name: 'actorId',
      type: 'text',
      label: 'Identifiant acteur',
      index: true,
      admin: {
        readOnly: true,
        description: 'ID user Payload, "system:embed", "apikey:xxx" pour ai-pipeline, etc.',
      },
    },
    {
      name: 'ipHash',
      type: 'text',
      label: 'Hash IP',
      admin: {
        readOnly: true,
        description: 'sha256(IP + salt) tronqué',
      },
    },
  ],
  indexes: [
    { fields: ['createdAt'] },
    { fields: ['collectionTarget', 'entryId', 'createdAt'] },
  ],
}
