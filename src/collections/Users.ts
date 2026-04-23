import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  labels: {
    singular: 'Utilisateur',
    plural: 'Utilisateurs',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'role'],
    group: 'Syst\u00e8me',
    description: 'G\u00e9rer les comptes utilisateurs et leurs permissions',
    components: {
      views: {
        list: { Component: '@/components/admin/views/UsersList.tsx#default' },
      },
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      label: 'R\u00f4le',
      admin: {
        description: 'D\u00e9termine les permissions de l\u2019utilisateur dans le syst\u00e8me',
      },
      options: [
        { label: 'Administrateur', value: 'admin' },
        { label: '\u00c9diteur', value: 'editor' },
        { label: 'V\u00e9rificateur conformit\u00e9', value: 'compliance_reviewer' },
        { label: 'Publieur', value: 'publisher' },
      ],
    },
    {
      name: 'firstName',
      type: 'text',
      label: 'Pr\u00e9nom',
      admin: {
        placeholder: 'Ex : Marie',
      },
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Nom de famille',
      admin: {
        placeholder: 'Ex : Dupont',
      },
    },
    {
      name: 'credentials',
      type: 'text',
      label: 'Dipl\u00f4mes / Qualifications',
      admin: {
        placeholder: 'Ex : Herboriste certifi\u00e9',
        description: 'Qualifications professionnelles (utile pour les v\u00e9rificateurs)',
      },
    },
  ],
}
