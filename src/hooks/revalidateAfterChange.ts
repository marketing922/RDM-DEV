import type { CollectionAfterChangeHook } from 'payload'
import { revalidateTag, revalidatePath } from 'next/cache'

/**
 * Hook afterChange générique : invalide le cache Next.js (ISR + unstable_cache)
 * pour le doc modifié + ses listes parentes. Permet aux pages détail en
 * `dynamicParams=true` de refléter immédiatement un update admin sans
 * attendre le `revalidate: 3600`.
 *
 * Conventions de tags utilisées par les queries :
 *   - `<collection>:<slug>` — page détail
 *   - `<collection>:list`   — page liste
 *   - `nav-counts`          — compteurs admin sidebar
 *
 * Pour qu'un fetch soit invalidable, il doit être tagué côté query :
 *   payload.find({ ... }, { next: { tags: ['benefits:sommeil'] } })
 *
 * Le hook reste safe même si aucun consumer n'a posé de tag — revalidateTag
 * est silencieux pour les tags non utilisés.
 */
/**
 * Mapping entre slug de collection Payload et segment d'URL public.
 * Sans ce mapping, `revalidatePath` cible un path inexistant
 * (ex. /[locale]/blogPosts/... au lieu de /[locale]/blog/...).
 */
const COLLECTION_TO_ROUTE: Record<string, string> = {
  blogPosts: 'blog',
  wikiEntries: 'plantes',
  benefits: 'bienfaits',
  products: 'produits',
}

export const revalidateAfterChange: CollectionAfterChangeHook = async ({
  doc,
  req,
  collection,
}) => {
  // Pas de revalidation pour les cascades de hooks internes (sinon
  // multiple invalidations par save).
  if ((req.context as any)?.fromHook) return doc

  const slug = (doc as any)?.slug
  const collectionSlug = collection.slug
  const routeSegment = COLLECTION_TO_ROUTE[collectionSlug] ?? collectionSlug

  try {
    revalidateTag(`${collectionSlug}:list`)
    if (slug) {
      revalidateTag(`${collectionSlug}:${slug}`)
      // Path-based revalidation : cible la route publique réelle, pour les
      // 2 locales. `revalidatePath` avec `page` invalide la route paramétrée.
      revalidatePath(`/fr/${routeSegment}/${slug}`, 'page')
      revalidatePath(`/en/${routeSegment}/${slug}`, 'page')
      revalidatePath(`/fr/${routeSegment}`, 'page')
      revalidatePath(`/en/${routeSegment}`, 'page')
    }
    revalidateTag('nav-counts')
  } catch (err) {
    // Ne pas casser le save si Next n'a pas le runtime côté serveur (cas rare).
    req.payload?.logger?.warn?.(
      `[revalidate] failed for ${collectionSlug}/${slug}: ${(err as Error)?.message}`,
    )
  }

  return doc
}
