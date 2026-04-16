export const locales = ['fr', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'

export function getLocalizedPath(locale: Locale, path: string): string {
  if (locale === defaultLocale) return path
  return `/${locale}${path}`
}
