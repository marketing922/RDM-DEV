import 'server-only'

/**
 * Extrait l'IP du client à partir des headers, en priorisant les sources
 * fiables (Vercel) avant de tomber sur `x-forwarded-for` qui peut être
 * spoofé. Sur Vercel, `x-real-ip` est posé par l'edge et est la valeur
 * canonique.
 *
 * Retourne `'unknown'` si aucune source ne donne d'IP — préférable à un
 * cast vide qui pourrait dégrader le rate-limit (clés dégénérées).
 */
export function getClientIp(req: { headers: Headers }): string {
  // Vercel : x-real-ip est posé par l'edge, fiable.
  const xRealIp = req.headers.get('x-real-ip')
  if (xRealIp && xRealIp.trim()) return xRealIp.trim()

  // Cloudflare (au cas où on passerait derrière) : aussi fiable.
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp && cfIp.trim()) return cfIp.trim()

  // Fallback : x-forwarded-for. Le PREMIER token est l'IP origine si on est
  // derrière des proxies de confiance ; en environnement non-trusted c'est
  // spoofable. À utiliser pour rate-limit, pas pour ban IP.
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }

  return 'unknown'
}
