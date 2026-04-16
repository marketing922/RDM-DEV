import type { MetadataRoute } from 'next'
import { getProducts, getWikiEntries, getBlogPosts, getBenefits } from '@/lib/queries'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['fr', 'en']

  // Static pages
  const staticPages = [
    '', '/plantes', '/blog', '/bienfaits', '/boutique',
    '/contact', '/faq', '/a-propos', '/recherche',
    '/mentions-legales', '/cgv', '/politique-confidentialite',
    '/politique-cookies', '/avertissement-sante', '/accessibilite',
  ]

  const staticEntries = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${siteUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'daily' as const : 'weekly' as const,
      priority: page === '' ? 1.0 : page === '/boutique' ? 0.9 : 0.7,
    }))
  )

  // Dynamic pages from Payload
  const [products, wiki, blog, benefits] = await Promise.all([
    getProducts({ limit: 500, locale: 'fr' }),
    getWikiEntries({ limit: 500, locale: 'fr' }),
    getBlogPosts({ limit: 500, locale: 'fr' }),
    getBenefits({ limit: 500, locale: 'fr' }),
  ])

  const productEntries = locales.flatMap((locale) =>
    products.docs.map((p: any) => ({
      url: `${siteUrl}/${locale}/boutique/${p.slug}`,
      lastModified: new Date(p.updatedAt || p.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  )

  const wikiEntries = locales.flatMap((locale) =>
    wiki.docs.map((w: any) => ({
      url: `${siteUrl}/${locale}/plantes/${w.slug}`,
      lastModified: new Date(w.updatedAt || w.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))
  )

  const blogEntries = locales.flatMap((locale) =>
    blog.docs.map((b: any) => ({
      url: `${siteUrl}/${locale}/blog/${b.slug}`,
      lastModified: new Date(b.updatedAt || b.publishedAt || b.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  )

  const benefitEntries = locales.flatMap((locale) =>
    benefits.docs.map((b: any) => ({
      url: `${siteUrl}/${locale}/bienfaits/${b.slug}`,
      lastModified: new Date(b.updatedAt || b.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  )

  return [
    ...staticEntries,
    ...productEntries,
    ...wikiEntries,
    ...blogEntries,
    ...benefitEntries,
  ]
}
