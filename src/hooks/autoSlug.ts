import type { FieldHook } from 'payload'

export const slugify = (input: string): string =>
  input
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Auto-fills the slug from a source field (e.g. 'name' or 'title') when the
 * user hasn't entered one. Runs on create and on update (only if slug empty).
 * User can always override manually — we never overwrite a non-empty value.
 */
export const autoSlug = (sourceField: string): FieldHook =>
  ({ data, value }) => {
    if (typeof value === 'string' && value.trim().length > 0) return value
    const source = data?.[sourceField]
    if (typeof source === 'string' && source.trim().length > 0) {
      return slugify(source)
    }
    return value
  }
