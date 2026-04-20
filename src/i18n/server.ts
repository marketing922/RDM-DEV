import 'server-only'
import { defaultLocale, locales, type Locale } from './config'

const dictionaries: Record<Locale, () => Promise<Record<string, any>>> = {
  fr: () => import('./locales/fr.json').then((m) => m.default),
  en: () => import('./locales/en.json').then((m) => m.default),
}

export async function getDictionary(locale: Locale | string | undefined) {
  const resolved: Locale = (locales as readonly string[]).includes(locale as string)
    ? (locale as Locale)
    : defaultLocale
  return dictionaries[resolved]()
}
