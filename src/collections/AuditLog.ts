import type { CollectionConfig } from 'payload'

export const AuditLog: CollectionConfig = {
  slug: 'auditLog',
  labels: {
    singular: 'Journal',
    plural: "Journal d'audit",
  },
  admin: {
    defaultColumns: ['action', 'collection', 'user', 'timestamp'],
    group: 'Syst\u00e8me',
    description: 'Historique de toutes les modifications effectu\u00e9es sur le contenu',
  },
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
        description: 'Le type d\u2019op\u00e9ration effectu\u00e9e',
      },
    },
    {
      name: 'collection',
      type: 'text',
      label: 'Collection',
      admin: {
        readOnly: true,
        description: 'La collection concern\u00e9e par l\u2019action',
      },
    },
    {
      name: 'documentId',
      type: 'text',
      label: 'ID du document',
      admin: {
        readOnly: true,
        description: 'L\u2019identifiant du document modifi\u00e9',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: 'Utilisateur',
      admin: {
        readOnly: true,
        description: 'L\u2019utilisateur qui a effectu\u00e9 l\u2019action',
      },
    },
    {
      name: 'before',
      type: 'json',
      label: '\u00c9tat avant',
      admin: {
        readOnly: true,
        description: 'Les donn\u00e9es du document avant la modification',
      },
    },
    {
      name: 'after',
      type: 'json',
      label: '\u00c9tat apr\u00e8s',
      admin: {
        readOnly: true,
        description: 'Les donn\u00e9es du document apr\u00e8s la modification',
      },
    },
    {
      name: 'timestamp',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      label: 'Date et heure',
      admin: {
        readOnly: true,
        description: 'Le moment exact de l\u2019action',
      },
    },
  ],
}
