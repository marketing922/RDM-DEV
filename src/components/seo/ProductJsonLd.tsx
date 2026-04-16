import { JsonLd } from './JsonLd'

type ProductJsonLdProps = {
  product: {
    name: string
    slug: string
    description?: string
    price: number
    compareAtPrice?: number
    images?: Array<{ url?: string }>
    sku?: string
    inStock?: boolean
    category?: { name: string }
  }
  locale: string
}

export function ProductJsonLd({ product, locale }: ProductJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'
  const image = product.images?.[0]?.url || ''

  return (
    <JsonLd data={{
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description || '',
      image: image,
      sku: product.sku || product.slug,
      url: `${siteUrl}/${locale}/boutique/${product.slug}`,
      brand: {
        '@type': 'Brand',
        name: 'Les Remèdes de Mamie',
      },
      category: product.category?.name || 'Compléments alimentaires',
      offers: {
        '@type': 'Offer',
        url: `${siteUrl}/${locale}/boutique/${product.slug}`,
        priceCurrency: 'EUR',
        price: product.price?.toFixed(2),
        availability: product.inStock !== false
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'Les Remèdes de Mamie',
        },
      },
    }} />
  )
}
