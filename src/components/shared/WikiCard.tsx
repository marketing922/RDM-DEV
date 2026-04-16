import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'

type WikiCardProps = {
  entry: {
    name: string
    slug: string
    latinName?: string
    shortDescription?: string
    images?: Array<{ url: string; alt?: string }>
  }
  locale: string
}

export function WikiCard({ entry, locale }: WikiCardProps) {
  const { name, slug, latinName, shortDescription, images } = entry
  const image = images?.[0]

  return (
    <Card href={`/${locale}/plantes/${slug}`}>
      {/* Image zone */}
      <div className="relative flex items-center justify-center bg-page h-40">
        <div className="relative w-24 h-24 rounded-full bg-card overflow-hidden shadow-sm">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt || name}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-neutral-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-md text-center">
        <h3 className="font-ui font-medium text-neutral-600">{name}</h3>

        {latinName && (
          <p className="italic text-body-sm text-neutral-300 mt-xxs">
            {latinName}
          </p>
        )}

        {shortDescription && (
          <p className="text-body-sm text-neutral-400 line-clamp-2 mt-xs">
            {shortDescription}
          </p>
        )}

        <span className="inline-block mt-sm text-brand text-body-sm font-medium hover:underline">
          En savoir plus
        </span>
      </div>
    </Card>
  )
}
