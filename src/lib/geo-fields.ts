/**
 * Liste centralisée des champs du tab GEO (cf. src/fields/geoFields.ts).
 *
 * Utilisée par :
 *   - /api/export-geo  → quels champs extraire en snapshot
 *   - /api/seed-geo    → quels champs patcher au repeuplement
 *
 * Tous ces champs sont localisés (FR + EN) sauf indication contraire.
 * Modifier cette liste si geoFields.ts ajoute/retire un champ.
 */
export const GEO_FIELDS = [
  'directAnswer',
  'definition',
  'keyTakeaways',
  'quotableStatements',
  'dataPoints',
  'faq',
  'targetAIQueries',
  'authoritySignals',
  'sources',
  'lastFactCheckedAt',
  'geoReadinessScore',
  'geoNotes',
] as const

export type GeoFieldName = (typeof GEO_FIELDS)[number]

/** Collections qui embarquent le tab GEO. */
export const GEO_COLLECTIONS = ['wikiEntries', 'benefits', 'blogPosts'] as const
export type GeoCollection = (typeof GEO_COLLECTIONS)[number]
