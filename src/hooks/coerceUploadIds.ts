import type { CollectionBeforeValidateHook, GlobalBeforeValidateHook } from 'payload'

/**
 * WHY: Payload 3.83 admin UI sometimes sends upload-relation ids as numeric
 * strings ("54") instead of numbers, even though `payload.db.defaultIDType` is
 * `'number'`. The internal validator then rejects the payload with
 * "invalid relationships". This hook normalizes the few well-known upload /
 * media-relation paths back to integers before validation runs.
 *
 * Kept narrow on purpose — coercing arbitrary numeric strings everywhere
 * would risk turning legitimate text values into numbers.
 */

const coerceId = (v: unknown): unknown => {
  if (typeof v === 'string' && /^\d+$/.test(v)) {
    const n = Number.parseInt(v, 10)
    return Number.isFinite(n) ? n : v
  }
  return v
}

const coerceIdArray = (v: unknown): unknown => {
  if (!Array.isArray(v)) return v
  return v.map((item) => coerceId(item))
}

async function coerceImpl(input: unknown): Promise<unknown> {
  if (!input || typeof input !== 'object') return input
  const d = input as Record<string, unknown>

  // Single upload / single relationship (numeric id) at root
  for (const key of [
    'featuredImage',
    'heroImage',
    'cover',
    'thumbnail',
    'image',
    'media',
    'author',
    'category',
    'reviewedBy',
  ]) {
    if (key in d) d[key] = coerceId(d[key])
  }

  // hasMany relationships (arrays of numeric ids)
  for (const key of [
    'tags',
    'benefits',
    'relatedPlants',
    'relatedProducts',
    'relatedBenefits',
  ]) {
    if (key in d) d[key] = coerceIdArray(d[key])
  }

  // Array of objects with an `image` upload (galleries)
  for (const key of ['images']) {
    const arr = d[key]
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (item && typeof item === 'object' && 'image' in (item as Record<string, unknown>)) {
          ;(item as Record<string, unknown>).image = coerceId(
            (item as Record<string, unknown>).image,
          )
        }
      }
    }
  }

  // SEO plugin nested meta.image
  const meta = d.meta as Record<string, unknown> | undefined
  if (meta && typeof meta === 'object' && 'image' in meta) {
    meta.image = coerceId(meta.image)
  }

  return input
}

export const coerceUploadIds: CollectionBeforeValidateHook = async ({ data }) => {
  return (await coerceImpl(data)) as typeof data
}

export const coerceUploadIdsGlobal: GlobalBeforeValidateHook = async ({ data }) => {
  return (await coerceImpl(data)) as typeof data
}
