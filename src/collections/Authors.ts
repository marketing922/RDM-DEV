import type { CollectionConfig } from 'payload'
import { isAdmin, isPublic } from '@/access'

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: {
    singular: 'Auteur',
    plural: 'Auteurs',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'credentials'],
    group: 'Taxonomie',
    description: 'G\u00e9rer les auteurs et r\u00e9dacteurs du site',
  },
  access: {
    create: isAdmin,
    update: isAdmin,
    read: isPublic,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nom complet',
      admin: {
        placeholder: 'Ex : Dr. Marie Dupont',
        description: 'Le nom affich\u00e9 publiquement',
      },
    },
    {
      name: 'role',
      type: 'text',
      label: 'R\u00f4le / Sp\u00e9cialit\u00e9',
      admin: {
        placeholder: 'Ex : Herboriste, Naturopathe',
        description: 'Le r\u00f4le ou la sp\u00e9cialit\u00e9 de l\u2019auteur',
      },
    },
    {
      name: 'bio',
      type: 'richText',
      localized: true,
      label: 'Biographie',
      admin: {
        description: 'Pr\u00e9sentation d\u00e9taill\u00e9e de l\u2019auteur',
      },
    },
    {
      name: 'credentials',
      type: 'text',
      label: 'Dipl\u00f4mes / Certifications',
      admin: {
        placeholder: 'Ex : Dipl\u00f4me en phytoth\u00e9rapie',
        description: 'Qualifications et certifications professionnelles',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'Photo de profil',
      admin: {
        description: 'La photo affich\u00e9e \u00e0 c\u00f4t\u00e9 des articles',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      label: 'Slug (URL)',
      admin: {
        placeholder: 'dr-marie-dupont',
        description: 'Identifiant unique pour la page auteur',
      },
    },
  ],
}
