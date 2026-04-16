import type { CollectionConfig } from 'payload'

export const AuditLog: CollectionConfig = {
  slug: 'auditLog',
  admin: {
    hidden: false,
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
    },
    {
      name: 'collection',
      type: 'text',
    },
    {
      name: 'documentId',
      type: 'text',
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'before',
      type: 'json',
    },
    {
      name: 'after',
      type: 'json',
    },
    {
      name: 'timestamp',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
    },
  ],
}
