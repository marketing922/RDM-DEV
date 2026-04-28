// Field-level micro-prompts for `/api/admin/ai-generate` (ai.ts).
// Keyed by `${collection}.${rootField}`. Each entry is versioned.

export type FieldGuideEntry = {
  version: string
  locale: 'fr' | null // editorial guides are FR-only at v1
  role: 'editorial-field-guide'
  text: string
}

// Versioned guides. To bump: add a `v2` entry alongside `v1` and update
// FIELD_GUIDES_DEFAULT_VERSION (or use the registry helper).
export const FIELD_GUIDES: Record<string, Record<string, FieldGuideEntry>> = {
  'wikiEntries.shortDescription': {
    v1: {
      version: 'v1',
      locale: 'fr',
      role: 'editorial-field-guide',
      text: 'Résumé botanique en 1-2 phrases, factuel, auto-portant.',
    },
  },
  'wikiEntries.longDescription': {
    v1: {
      version: 'v1',
      locale: 'fr',
      role: 'editorial-field-guide',
      text: 'Paragraphe détaillé (origine, propriétés, usages traditionnels) en 4-6 phrases.',
    },
  },
  'wikiEntries.description': {
    v1: {
      version: 'v1',
      locale: 'fr',
      role: 'editorial-field-guide',
      text: 'Paragraphe détaillé sur la plante (origine, propriétés, usages traditionnels).',
    },
  },
  'wikiEntries.name': {
    v1: {
      version: 'v1',
      locale: 'fr',
      role: 'editorial-field-guide',
      text: 'Nom commun français de la plante (1-3 mots).',
    },
  },
  'blogPosts.excerpt': {
    v1: {
      version: 'v1',
      locale: 'fr',
      role: 'editorial-field-guide',
      text: "Chapô éditorial en 1-2 phrases qui donne envie de lire l'article.",
    },
  },
  'blogPosts.title': {
    v1: {
      version: 'v1',
      locale: 'fr',
      role: 'editorial-field-guide',
      text: 'Titre éditorial accrocheur, 50-70 caractères.',
    },
  },
  'benefits.shortDescription': {
    v1: {
      version: 'v1',
      locale: 'fr',
      role: 'editorial-field-guide',
      text: 'Description courte du bienfait en 1-2 phrases.',
    },
  },
  'benefits.description': {
    v1: {
      version: 'v1',
      locale: 'fr',
      role: 'editorial-field-guide',
      text: 'Explication du bienfait avec les plantes traditionnellement associées.',
    },
  },
  'benefits.name': {
    v1: {
      version: 'v1',
      locale: 'fr',
      role: 'editorial-field-guide',
      text: 'Nom du bienfait (1-3 mots).',
    },
  },
  'products.description': {
    v1: {
      version: 'v1',
      locale: 'fr',
      role: 'editorial-field-guide',
      text: 'Description produit en 2-3 phrases, ton éditorial mais clair.',
    },
  },
  'products.shortDescription': {
    v1: {
      version: 'v1',
      locale: 'fr',
      role: 'editorial-field-guide',
      text: 'Une phrase accroche produit.',
    },
  },
  'products.name': {
    v1: {
      version: 'v1',
      locale: 'fr',
      role: 'editorial-field-guide',
      text: 'Nom du produit (3-6 mots).',
    },
  },
}
