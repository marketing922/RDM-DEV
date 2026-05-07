import type { MetadataRoute } from 'next'
import { getWikiEntries, getBlogPosts, getBenefits, getProducts } from '@/lib/queries'
import { getPayloadClient, safeQuery, EMPTY_PAGINATED } from '@/lib/payload'

// ISR : sitemap régénéré max 1×/24h. Si la BD est down/quota dépassé au
// build, on retombe juste sur les pages statiques (safeQuery → []) plutôt
// que d'échouer le build entier.
export const revalidate = 86400

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'

const LOCALES = ['fr', 'en'] as const
type Locale = (typeof LOCALES)[number]

// Catégories de l'enum WikiEntries.category (cf. src/collections/WikiEntries.ts).
// `multi` est exclu : il n'a pas de page de catégorie dédiée.
const WIKI_CATEGORIES = [
  'nervous',
  'digestive',
  'respiratory',
  'female',
  'male',
  'circulatory',
  'joints',
  'immunity',
  'skin',
  'metabolism',
] as const

function buildLanguageAlternates(path: string): Record<string, string> {
  return LOCALES.reduce<Record<string, string>>((acc, loc) => {
    acc[loc] = `${siteUrl}/${loc}${path}`
    return acc
  }, {})
}

async function getPagesList(locale: Locale) {
  return safeQuery(async () => {
    const payload = await getPayloadClient()
    return payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      limit: 500,
      locale,
      depth: 0,
    })
  }, EMPTY_PAGINATED)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    '', '/plantes', '/blog', '/bienfaits', '/produits',
    '/contact', '/faq', '/a-propos',
    '/mentions-legales', '/cgv', '/politique-confidentialite',
    '/politique-cookies', '/avertissement-sante', '/accessibilite',
  ]

  const staticEntries = LOCALES.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${siteUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'daily' as const : 'weekly' as const,
      priority: page === '' ? 1.0 : 0.7,
      alternates: { languages: buildLanguageAlternates(page) },
    })),
  )

  // Dynamic pages from Payload
  const [wiki, blog, benefits, products, pages] = await Promise.all([
    getWikiEntries({ limit: 500, locale: 'fr' }),
    getBlogPosts({ limit: 500, locale: 'fr' }),
    getBenefits({ limit: 500, locale: 'fr' }),
    getProducts({ limit: 500, locale: 'fr' }),
    getPagesList('fr'),
  ])

  const productEntries = LOCALES.flatMap((locale) =>
    products.docs.map((p: any) => ({
      url: `${siteUrl}/${locale}/produits/${p.slug}`,
      lastModified: new Date(p.updatedAt || p.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: { languages: buildLanguageAlternates(`/produits/${p.slug}`) },
    })),
  )

  const wikiEntries = LOCALES.flatMap((locale) =>
    wiki.docs.map((w: any) => ({
      url: `${siteUrl}/${locale}/plantes/${w.slug}`,
      lastModified: new Date(w.updatedAt || w.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      alternates: { languages: buildLanguageAlternates(`/plantes/${w.slug}`) },
    })),
  )

  const blogEntries = LOCALES.flatMap((locale) =>
    blog.docs.map((b: any) => ({
      url: `${siteUrl}/${locale}/blog/${b.slug}`,
      lastModified: new Date(b.updatedAt || b.publishedAt || b.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: { languages: buildLanguageAlternates(`/blog/${b.slug}`) },
    })),
  )

  const benefitEntries = LOCALES.flatMap((locale) =>
    benefits.docs.map((b: any) => ({
      url: `${siteUrl}/${locale}/bienfaits/${b.slug}`,
      lastModified: new Date(b.updatedAt || b.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      alternates: { languages: buildLanguageAlternates(`/bienfaits/${b.slug}`) },
    })),
  )

  // Pages CMS — exposées à la racine /{locale}/{slug} (canonical),
  // /p/{slug} reste un alias historique non exposé dans le sitemap pour éviter
  // les doublons signalés à Google.
  const cmsPageEntries = LOCALES.flatMap((locale) =>
    pages.docs.map((p: any) => ({
      url: `${siteUrl}/${locale}/${p.slug}`,
      lastModified: new Date(p.updatedAt || p.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
      alternates: { languages: buildLanguageAlternates(`/${p.slug}`) },
    })),
  )

  // Pages de catégorie de l'encyclopédie : /plantes/categorie/{category}
  const wikiCategoryEntries = LOCALES.flatMap((locale) =>
    WIKI_CATEGORIES.map((category) => ({
      url: `${siteUrl}/${locale}/plantes/categorie/${category}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      alternates: { languages: buildLanguageAlternates(`/plantes/categorie/${category}`) },
    })),
  )

  return [
    ...staticEntries,
    ...wikiEntries,
    ...wikiCategoryEntries,
    ...blogEntries,
    ...benefitEntries,
    ...productEntries,
    ...cmsPageEntries,
  ]
}
