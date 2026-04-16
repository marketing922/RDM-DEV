import { JsonLd } from './JsonLd'

type ArticleJsonLdProps = {
  article: {
    title: string
    slug: string
    excerpt?: string
    content?: string
    featuredImage?: { url?: string }
    author?: { name: string }
    publishedAt?: string
    updatedAt?: string
    category?: { name: string }
  }
  locale: string
}

export function ArticleJsonLd({ article, locale }: ArticleJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'

  return (
    <JsonLd data={{
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.excerpt || '',
      image: article.featuredImage?.url || '',
      url: `${siteUrl}/${locale}/blog/${article.slug}`,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      author: {
        '@type': 'Person',
        name: article.author?.name || 'Les Remèdes de Mamie',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Les Remèdes de Mamie',
        logo: { '@type': 'ImageObject', url: `${siteUrl}/images/logo.png` },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${siteUrl}/${locale}/blog/${article.slug}`,
      },
      articleSection: article.category?.name,
    }} />
  )
}
