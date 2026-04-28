import type { CollectionConfig } from 'payload'
import { notifyOnCriticalError } from '@/hooks/notifyOnCriticalError'

export const ErrorLog: CollectionConfig = {
  slug: 'errorLog',
  hooks: {
    afterChange: [notifyOnCriticalError],
  },
  labels: {
    singular: 'Erreur système',
    plural: 'Erreurs système',
  },
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['level', 'subsystem', 'message', 'count', 'lastSeenAt', 'resolved'],
    group: 'Système',
    description: 'Erreurs serveur dédupliquées par signature',
  },
  defaultSort: '-lastSeenAt',
  access: {
    read: ({ req }) => {
      const role = (req.user as { role?: string } | null | undefined)?.role
      return role === 'admin' || role === 'editor'
    },
    create: ({ req }) => {
      const role = (req.user as { role?: string } | null | undefined)?.role
      return role === 'admin' || role === 'editor'
    },
    update: ({ req }) => {
      const role = (req.user as { role?: string } | null | undefined)?.role
      return role === 'admin' || role === 'editor'
    },
    delete: ({ req }) => {
      const role = (req.user as { role?: string } | null | undefined)?.role
      return role === 'admin'
    },
  },
  fields: [
    {
      name: 'signature',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Signature',
      admin: {
        readOnly: true,
        description: 'Hash sha256 utilisé pour le dédoublonnage',
      },
    },
    {
      name: 'level',
      type: 'select',
      required: true,
      defaultValue: 'error',
      index: true,
      label: 'Niveau',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warning' },
        { label: 'Error', value: 'error' },
        { label: 'Critical', value: 'critical' },
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
        { label: 'AI Generate', value: 'ai-generate' },
        { label: 'AI GEO', value: 'ai-geo' },
        { label: 'AI SEO', value: 'ai-seo' },
        { label: 'AI Pipeline', value: 'ai-pipeline' },
        { label: 'AI Embedding', value: 'ai-embedding' },
        { label: 'AI Vision', value: 'ai-vision' },
        { label: 'AI Research', value: 'ai-research' },
        { label: 'Content Orchestrator', value: 'content-orchestrator' },
        { label: 'Auth', value: 'auth' },
        { label: 'Payload', value: 'payload' },
        { label: 'API', value: 'api' },
        { label: 'Frontend', value: 'frontend' },
        { label: 'Hook', value: 'hook' },
        { label: 'Webhook', value: 'webhook' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'name',
      type: 'text',
      label: 'Nom',
      admin: { readOnly: true },
    },
    {
      name: 'message',
      type: 'text',
      label: 'Message',
      admin: {
        readOnly: true,
        description: 'Tronqué à 500 caractères',
      },
    },
    {
      name: 'stack',
      type: 'textarea',
      label: 'Stack trace',
      admin: {
        readOnly: true,
        description: 'Tronqué à 3000 caractères',
      },
    },
    {
      name: 'route',
      type: 'text',
      label: 'Route',
      admin: { readOnly: true },
    },
    {
      name: 'userId',
      type: 'text',
      label: 'Identifiant utilisateur',
      admin: { readOnly: true },
    },
    {
      name: 'ipHash',
      type: 'text',
      label: 'Hash IP',
      admin: { readOnly: true },
    },
    {
      name: 'context',
      type: 'json',
      label: 'Contexte',
      admin: { readOnly: true },
    },
    {
      name: 'count',
      type: 'number',
      defaultValue: 1,
      label: 'Occurrences',
      admin: { readOnly: true },
    },
    {
      name: 'firstSeenAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      label: 'Première occurrence',
      admin: { readOnly: true },
    },
    {
      name: 'lastSeenAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      index: true,
      label: 'Dernière occurrence',
      admin: { readOnly: true },
    },
    {
      name: 'resolved',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      label: 'Résolue',
    },
    {
      name: 'resolvedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Résolue par',
    },
    {
      name: 'resolvedAt',
      type: 'date',
      label: 'Date de résolution',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes de résolution',
    },
  ],
  indexes: [
    { fields: ['signature'], unique: true },
    { fields: ['level'] },
    { fields: ['subsystem'] },
    { fields: ['resolved'] },
    { fields: ['lastSeenAt'] },
  ],
}
