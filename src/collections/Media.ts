import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'M\u00e9dia',
    plural: 'M\u00e9diath\u00e8que',
  },
  admin: {
    defaultColumns: ['filename', 'alt', 'mimeType', 'updatedAt'],
    group: 'M\u00e9dias',
    description: 'G\u00e9rer les images, photos et documents du site',
  },
  upload: {
    staticDir: 'public/images',
    mimeTypes: ['image/*', 'application/pdf'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      label: 'Texte alternatif',
      admin: {
        placeholder: 'Ex : Photo de fleurs de camomille',
        description: 'Description de l\u2019image pour l\u2019accessibilit\u00e9 et le SEO (attribut alt)',
      },
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      label: 'L\u00e9gende',
      admin: {
        placeholder: 'Ex : Camomille en fleur, juin 2024',
        description: 'L\u00e9gende affich\u00e9e sous l\u2019image',
      },
    },
  ],
}
