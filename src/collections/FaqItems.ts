import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublic } from '@/access'
import { coerceUploadIds } from '@/hooks/coerceUploadIds'

export const FaqItems: CollectionConfig = {
  slug: 'faqItems',
  labels: {
    singular: 'Question FAQ',
    plural: 'Questions FAQ',
  },
  admin: {
    useAsTitle: 'question',
    group: 'Contenu',
    defaultColumns: ['question', 'category', 'order', 'updatedAt'],
    description: 'Questions fréquemment posées affichées sur la page FAQ',
  },
  access: {
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
    read: isPublic,
  },
  hooks: {
    beforeValidate: [coerceUploadIds],
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
      localized: true,
      label: 'Question',
      admin: {
        placeholder: 'Ex : Comment préparer une tisane ?',
      },
    },
    {
      name: 'answer',
      type: 'richText',
      required: true,
      localized: true,
      label: 'Réponse',
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: 'Catégorie',
      // Aligné sur dict.faq.categories (clés FR)
      options: [
        { label: 'Plantes', value: 'plantes' },
        { label: 'Utilisation', value: 'utilisation' },
        { label: 'Site', value: 'site' },
        { label: 'Santé', value: 'sante' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 100,
      label: 'Ordre d’affichage',
      admin: {
        description: 'Plus petit = affiché en premier',
      },
    },
  ],
}
