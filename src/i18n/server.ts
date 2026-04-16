import 'server-only'
import type { Locale } from './config'

const dictionaries: Record<Locale, () => Promise<Record<string, any>>> = {
  fr: () => import('./locales/fr.json').then(m => m.default),
  en: () => import('./locales/en.json').then(m => m.default),
}

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]()
}
