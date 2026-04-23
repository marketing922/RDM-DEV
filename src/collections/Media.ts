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
    // NOTE: custom MediaList disabled — it intercepts clicks when rendered
    // inside Payload's upload-picker drawer and calls router.replace() instead
    // of the drawer's onSelect, which freezes the edit page. Restore once
    // drawer-aware (detect context, defer to onSelect).
  },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: 'public/images',
    disableLocalStorage: false,
    mimeTypes: ['image/*', 'application/pdf'],
    // Admin thumbnails served directly from Next.js public folder
    // (files live at public/images/<filename>, served at /images/<filename>).
    adminThumbnail: ({ doc }) => {
      const filename = (doc as { filename?: string } | undefined)?.filename
      if (!filename || typeof filename !== 'string') return null
      return `/images/${filename}`
    },
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 800, height: 800, position: 'centre' },
    ],
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
