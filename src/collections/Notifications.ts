import type { Access, CollectionConfig, CollectionBeforeChangeHook } from 'payload'

const isStaff: Access = ({ req }) => {
  const role = (req.user as any)?.role
  return role === 'admin' || role === 'editor'
}

const isAdmin: Access = ({ req }) => {
  return (req.user as any)?.role === 'admin'
}

const DEFAULT_EXPIRY_DAYS = 30

const setDefaultExpiry: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation === 'create') {
    if (!data.expiresAt) {
      const expiry = new Date()
      expiry.setUTCDate(expiry.getUTCDate() + DEFAULT_EXPIRY_DAYS)
      data.expiresAt = expiry.toISOString()
    }
  }
  return data
}

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  labels: {
    singular: 'Notification',
    plural: 'Notifications',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['type', 'subsystem', 'title', 'createdAt'],
    group: 'Système',
    description: 'Alertes internes — système, compliance, sécurité, événements métier',
  },
  defaultSort: '-createdAt',
  access: {
    read: isStaff,
    create: isStaff,
    update: isStaff,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [setDefaultExpiry],
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'info',
      index: true,
      label: 'Type',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Succès', value: 'success' },
        { label: 'Avertissement', value: 'warning' },
        { label: 'Erreur', value: 'error' },
        { label: 'Critique', value: 'critical' },
      ],
    },
    {
      name: 'subsystem',
      type: 'select',
      required: true,
      defaultValue: 'other',
      index: true,
      label: 'Sous-système',
      options: [
        { label: 'IA', value: 'ai' },
        { label: 'Compliance', value: 'compliance' },
        { label: 'Sécurité', value: 'security' },
        { label: 'Contenu', value: 'content' },
        { label: 'Système', value: 'system' },
        { label: 'Newsletter', value: 'newsletter' },
        { label: 'Contact', value: 'contact' },
        { label: 'Commande', value: 'order' },
        { label: 'Autre', value: 'other' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 200,
      label: 'Titre',
    },
    {
      name: 'body',
      type: 'textarea',
      maxLength: 1000,
      label: 'Message',
    },
    {
      name: 'link',
      type: 'text',
      label: 'Lien admin',
      admin: {
        description: "Chemin relatif, ex /admin/collections/wikiEntries/abc123",
      },
    },
    {
      name: 'targetRole',
      type: 'select',
      defaultValue: 'admin',
      label: 'Rôle destinataire',
      options: [
        { label: 'Tous', value: 'all' },
        { label: 'Admin', value: 'admin' },
        { label: 'Éditeur', value: 'editor' },
      ],
    },
    {
      name: 'source',
      type: 'text',
      label: 'Source',
      admin: {
        description: 'Identifiant du producteur, ex ai-budget-watcher',
      },
    },
    {
      name: 'meta',
      type: 'json',
      label: 'Métadonnées',
    },
    {
      name: 'readBy',
      type: 'array',
      label: 'Lu par',
      fields: [
        {
          name: 'userId',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'dismissedBy',
      type: 'array',
      label: 'Ignoré par',
      fields: [
        {
          name: 'userId',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: 'Expire le',
      admin: {
        description: 'Après cette date, la notification n’apparaît plus dans la cloche',
      },
    },
  ],
  indexes: [
    { fields: ['createdAt'] },
    { fields: ['type'] },
    { fields: ['subsystem'] },
  ],
}
