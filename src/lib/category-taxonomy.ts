/**
 * Centralised category taxonomy for Products, WikiEntries and Benefits.
 *
 * Source of truth for the 11 health-domain categories used across the site.
 * Every collection that stores or references a category MUST resolve to one
 * of the {@link CategoryKey} values defined here.
 *
 * - WikiEntries.category → enum stores `CategoryKey` directly.
 * - Benefits.category → enum stores `CategoryKey` directly (currently missing
 *   `multi`, kept aligned via this module).
 * - Products.category → relationship to the `categories` collection, whose
 *   slugs are the French-facing {@link CategoryDef.productSlug}. Use
 *   {@link categoryKeyFromProductSlug} / {@link productSlugFromCategoryKey}
 *   to bridge the two worlds.
 */

export type CategoryKey =
  | 'nervous'
  | 'digestive'
  | 'respiratory'
  | 'female'
  | 'male'
  | 'circulatory'
  | 'joints'
  | 'immunity'
  | 'skin'
  | 'metabolism'
  | 'multi'

export const CATEGORY_KEYS: CategoryKey[] = [
  'nervous',
  'digestive',
  'respiratory',
  'female',
  'male',
  'circulatory',
  'joints',
  'immunity',
  'skin',
  'metabolism',
  'multi',
]

export type CategoryDef = {
  /** Canonical English key — stored in WikiEntries / Benefits enums. */
  key: CategoryKey
  /** French slug used by the `categories` collection (Products relationship). */
  productSlug: string
  /** Human-readable French label (admin UI default). */
  labelFr: string
  /** Human-readable English label. */
  labelEn: string
}

export const CATEGORIES: Record<CategoryKey, CategoryDef> = {
  nervous: {
    key: 'nervous',
    productSlug: 'systeme-nerveux',
    labelFr: 'Système nerveux & Sens',
    labelEn: 'Nervous system & senses',
  },
  digestive: {
    key: 'digestive',
    productSlug: 'digestion',
    labelFr: 'Digestion',
    labelEn: 'Digestion',
  },
  respiratory: {
    key: 'respiratory',
    productSlug: 'respiration',
    labelFr: 'Respiration',
    labelEn: 'Respiration',
  },
  female: {
    key: 'female',
    productSlug: 'feminin',
    labelFr: 'Féminin',
    labelEn: 'Female',
  },
  male: {
    key: 'male',
    productSlug: 'masculin',
    labelFr: 'Masculin',
    labelEn: 'Male',
  },
  circulatory: {
    key: 'circulatory',
    productSlug: 'circulation',
    labelFr: 'Circulation',
    labelEn: 'Circulation',
  },
  joints: {
    key: 'joints',
    productSlug: 'articulations',
    labelFr: 'Articulations',
    labelEn: 'Joints',
  },
  immunity: {
    key: 'immunity',
    productSlug: 'immunite-tonus',
    labelFr: 'Immunité & Tonus',
    labelEn: 'Immunity & tonus',
  },
  skin: {
    key: 'skin',
    productSlug: 'peau-cheveux',
    labelFr: 'Peau & Cheveux',
    labelEn: 'Skin & hair',
  },
  metabolism: {
    key: 'metabolism',
    productSlug: 'detox-metabolisme',
    labelFr: 'Détox & Métabolisme',
    labelEn: 'Detox & metabolism',
  },
  multi: {
    key: 'multi',
    productSlug: 'multi',
    labelFr: 'Multi-action',
    labelEn: 'Multi-action',
  },
}

const PRODUCT_SLUG_TO_KEY: Record<string, CategoryKey> = CATEGORY_KEYS.reduce(
  (acc, k) => {
    acc[CATEGORIES[k].productSlug] = k
    return acc
  },
  {} as Record<string, CategoryKey>,
)

/** Resolve a product-side French slug back to its canonical CategoryKey. */
export function categoryKeyFromProductSlug(slug: string): CategoryKey | null {
  if (!slug) return null
  return PRODUCT_SLUG_TO_KEY[slug] ?? null
}

/** Resolve a CategoryKey to the French slug used by the `categories` collection. */
export function productSlugFromCategoryKey(key: CategoryKey): string {
  return CATEGORIES[key].productSlug
}

/** Ready-to-use Payload `select` field options (FR labels). */
export const PAYLOAD_SELECT_OPTIONS = CATEGORY_KEYS.map((k) => ({
  value: k,
  label: CATEGORIES[k].labelFr,
}))
