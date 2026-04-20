import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

type ProductCardProps = {
  product: {
    name: string
    slug: string
    price: number
    compareAtPrice?: number
    shortDescription?: string
    images?: Array<{ url: string; alt?: string }>
    category?: { name: string }
    format?: string
    featured?: boolean
    inStock?: boolean
  }
  locale: string
}

const formatBadgeVariant = (format: string): 'tisane' | 'poudre' | 'gelule' => {
  const normalized = format.toLowerCase()
  if (normalized === 'poudre') return 'poudre'
  if (normalized === 'gélule' || normalized === 'gelule') return 'gelule'
  return 'tisane'
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const {
    name,
    slug,
    price,
    compareAtPrice,
    shortDescription,
    images,
    format,
    inStock = true,
  } = product

  const image = images?.[0]
  const hasPromo = compareAtPrice && compareAtPrice > price

  return (
    <Card className="flex flex-col">
      {/* Image */}
      <Link href={`/${locale}/boutique/${slug}`} className="block relative">
        <div className="relative aspect-square overflow-hidden bg-[#DCD8C7]">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt || name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-neutral-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {format && (
              <Badge variant={formatBadgeVariant(format)}>{format}</Badge>
            )}
            {hasPromo && <Badge variant="promo">Promo</Badge>}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <Link href={`/${locale}/boutique/${slug}`}>
          <h3 className="font-sans font-medium text-gray-700 line-clamp-1">
            {name}
          </h3>
        </Link>

        {shortDescription && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {shortDescription}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-auto pt-3">
          <span className="text-xl text-[#A2211E] font-medium">
            {formatPrice(price)}
          </span>
          {hasPromo && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <Button
          variant="primary"
          size="sm"
          className="w-full mt-3"
          disabled={!inStock}
        >
          {inStock ? 'Ajouter au panier' : 'Rupture de stock'}
        </Button>
      </div>
    </Card>
  )
}
