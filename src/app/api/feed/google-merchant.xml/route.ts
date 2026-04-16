import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/queries'

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'
  const { docs: products } = await getProducts({ limit: 1000, locale: 'fr' })

  const items = products.map((product: any) => {
    const image = product.images?.[0]?.image?.url || product.images?.[0]?.url || ''
    const category = product.category?.name || 'Compléments alimentaires'
    const availability = product.inStock ? 'in_stock' : 'out_of_stock'
    const price = `${product.price?.toFixed(2) || '0.00'} EUR`

    return `
    <item>
      <g:id>${product.sku || product.id}</g:id>
      <title>${escapeXml(product.name || '')}</title>
      <description>${escapeXml(product.shortDescription || product.name || '')}</description>
      <link>${siteUrl}/fr/boutique/${product.slug}</link>
      <g:image_link>${image}</g:image_link>
      <g:price>${price}</g:price>
      ${product.compareAtPrice ? `<g:sale_price>${product.price?.toFixed(2)} EUR</g:sale_price>` : ''}
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Les Remèdes de Mamie</g:brand>
      <g:google_product_category>Health &gt; Nutrition &gt; Dietary Supplements</g:google_product_category>
      <g:product_type>${escapeXml(category)}</g:product_type>
      <g:shipping>
        <g:country>FR</g:country>
        <g:service>Standard</g:service>
        <g:price>${product.price >= 30 ? '0.00' : '4.90'} EUR</g:price>
      </g:shipping>
    </item>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Les Remèdes de Mamie</title>
    <link>${siteUrl}</link>
    <description>Compléments alimentaires naturels à base de plantes</description>
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
