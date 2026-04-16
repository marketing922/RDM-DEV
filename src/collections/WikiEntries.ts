import type { CollectionConfig } from 'payload'

export const WikiEntries: CollectionConfig = {
  slug: 'wikiEntries',
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'latinName',
      type: 'text',
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
    },
    {
      name: 'family',
      type: 'text',
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'origin',
      type: 'text',
      localized: true,
    },
    {
      name: 'partsUsed',
      type: 'text',
      localized: true,
    },
    {
      name: 'activeCompounds',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'benefits',
      type: 'relationship',
      relationTo: 'benefits',
      hasMany: true,
    },
    {
      name: 'precautions',
      type: 'richText',
      localized: true,
    },
    {
      name: 'contraindications',
      type: 'richText',
      localized: true,
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
    },
    // Compliance / RBAC fields
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'complianceStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Reviewed', value: 'reviewed' },
        { label: 'Approved', value: 'approved' },
      ],
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
  ],
}
