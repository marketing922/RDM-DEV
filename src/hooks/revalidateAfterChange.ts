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

  try {
    revalidateTag(`${collectionSlug}:list`)
    if (slug) {
      revalidateTag(`${collectionSlug}:${slug}`)
      // Path-based revalidation en complément, indépendant des tags.
      revalidatePath(`/[locale]/${collectionSlug}/${slug}`, 'page')
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
