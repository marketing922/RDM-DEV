export * from './wiki'
export * from './blog'
export * from './benefits'
export * from './categories'
export * from './pages'
export * from './products'
export * from './faqItems'

/**
 * Limites par défaut pour les requêtes de listing. À utiliser à la place de
 * littéraux 100/200/1000 disséminés dans les pages — facilite l'ajustement
 * global si la BD grossit. Toujours préférer un `where` spécifique avant
 * d'augmenter la limite.
 */
export const QUERY_LIMITS = {
  /** Listing public (page liste). */
  LIST_PUBLIC: 50,
  /** Listing admin / composants internes. */
  LIST_ADMIN: 200,
  /** Endpoint API externe — à paginer côté caller. */
  EXTERNAL_API: 100,
  /** Reverse-fallback (ex: bienfait → plantes via inverse). */
  REVERSE_FALLBACK: 50,
  /** Sidebar / cartes connexes. */
  SIDEBAR: 8,
} as const
