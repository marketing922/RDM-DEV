import 'server-only'
import type { Payload } from 'payload'
import { slugify } from './slugify'

/**
 * Find or create the default editorial author used by the autonomous content
 * pipeline. Idempotent — caches the resolved id per Payload instance.
 *
 * Why a dedicated author : every published article must surface an author for
 * the GEO E-E-A-T signal and for the front-end byline. We use a single
 * "Rédaction Les Remèdes de Mamie" author for IA-produced content.
 *
 * Behaviour : the author is **created once** with the initial values and
 * never silently updated. The user owns the doc through the admin UI — any
 * edits (role wording, credentials, avatar) stay. To rename or repurpose the
 * IA author, edit the doc directly in `/admin/collections/authors`.
 */

const AUTHOR_NAME = 'Rédaction Les Remèdes de Mamie'
const AUTHOR_SLUG = 'redaction-les-remedes-de-mamie'
const AUTHOR_ROLE = 'Rédaction éditoriale'
const AUTHOR_CREDENTIALS =
  'Sources EMA/HMPC, ANSES, monographies officielles. Relecture éditoriale humaine.'

const cache = new WeakMap<Payload, string | number>()

export async function getDefaultAuthorId(payload: Payload): Promise<string | number | null> {
  const cached = cache.get(payload)
  if (cached !== undefined) return cached

  // 1. find by slug
  try {
    const found = await payload.find({
      collection: 'authors',
      where: { slug: { equals: AUTHOR_SLUG } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const docs = (found?.docs ?? []) as Array<{ id: string | number }>
    if (docs.length > 0) {
      cache.set(payload, docs[0].id)
      return docs[0].id
    }
  } catch {
    // fall through
  }

  // 2. fallback : find by name (in case slug was customized)
  try {
    const found = await payload.find({
      collection: 'authors',
      where: { name: { equals: AUTHOR_NAME } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const docs = (found?.docs ?? []) as Array<{ id: string | number }>
    if (docs.length > 0) {
      cache.set(payload, docs[0].id)
      return docs[0].id
    }
  } catch {
    // fall through
  }

  // 3. create the author
  try {
    const created = (await payload.create({
      collection: 'authors',
      overrideAccess: true,
      data: {
        name: AUTHOR_NAME,
        slug: slugify(AUTHOR_NAME) || AUTHOR_SLUG,
        role: AUTHOR_ROLE,
        credentials: AUTHOR_CREDENTIALS,
      } as never,
    })) as { id: string | number }
    cache.set(payload, created.id)
    return created.id
  } catch {
    return null
  }
}
