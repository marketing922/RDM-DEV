import type { CollectionConfig } from 'payload'
import { mediaAltTextHook } from '@/hooks/mediaAltTextHook'
import { coerceUploadIds } from '@/hooks/coerceUploadIds'

export const Media: CollectionConfig = {
  slug: 'media',
  hooks: {
    beforeValidate: [coerceUploadIds],
    afterChange: [mediaAltTextHook],
  },
  labels: {
    singular: 'Média',
    plural: 'Médiathèque',
  },
  admin: {
    defaultColumns: ['filename', 'alt', 'mimeType', 'updatedAt'],
    group: 'Médias',
    description: 'Gérer les images, photos et documents du site',
    // Custom MediaList — drawer-aware. When rendered inside Payload's
    // upload-picker drawer (e.g. picking an image from a wikiEntry hero
    // field), it short-circuits to a minimal grid that delegates clicks to
    // `useListDrawerContext().onSelect`, avoiding the 1.3s RSC refresh
    // freeze the original Phase 1 implementation triggered. On the full
    // page (`/admin/collections/media`), the rich UI (stat cards, grid,
    // sticky detail panel, filters) is rendered.
    components: {
      views: {
        list: {
          Component: '@/components/admin/views/MediaList.tsx#default',
        },
      },
    },
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
        description: 'Description de l’image pour l’accessibilité et le SEO (attribut alt)',
      },
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      label: 'Légende',
      admin: {
        placeholder: 'Ex : Camomille en fleur, juin 2024',
        description: 'Légende affichée sous l’image',
      },
    },
  ],
}
