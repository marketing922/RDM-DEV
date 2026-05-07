/**
 * Validators réutilisables sur les champs URL externes des collections
 * (externalImageUrl, galleryUrls[].url, etc.). On limite les hosts pour :
 *
 *   1. Empêcher Next/Image de crasher sur un hostname non whitelisté
 *      dans `next.config.mjs > images.remotePatterns`.
 *   2. Réduire le risque SSRF / lien malveillant collé en admin.
 *   3. Rendre explicite le contrat « les images viennent de Cloudinary ».
 *
 * Ajouter un host : modifier ALLOWED_IMAGE_HOSTS ci-dessous ET le mirror
 * dans `next.config.mjs > images.remotePatterns`.
 */

export const ALLOWED_IMAGE_HOSTS = [
  'res.cloudinary.com',
  'images.unsplash.com',
  'cdn.sanity.io',
] as const

export function validateImageUrl(value: unknown): true | string {
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string') return 'URL invalide (doit être une chaîne).'
  const trimmed = value.trim()
  if (!trimmed) return true
  let u: URL
  try {
    u = new URL(trimmed)
  } catch {
    return 'URL invalide (format non reconnu).'
  }
  if (u.protocol !== 'https:') {
    return 'HTTPS requis pour les URLs d’image (HTTP non autorisé).'
  }
  const isAllowed = ALLOWED_IMAGE_HOSTS.some(
    (h) => u.hostname === h || u.hostname.endsWith(`.${h}`),
  )
  if (!isAllowed) {
    return `Host non autorisé. Hosts acceptés : ${ALLOWED_IMAGE_HOSTS.join(', ')}.`
  }
  return true
}
