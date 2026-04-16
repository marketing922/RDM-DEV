import Link from 'next/link'
import Image from 'next/image'

type WikiCardProps = {
  entry: {
    name: string
    slug: string
    latinName?: string
    shortDescription?: string
    heroImage?: { url: string; alt?: string }
    images?: Array<{ url: string; alt?: string }>
  }
  locale: string
}

export function WikiCard({ entry, locale }: WikiCardProps) {
  const { name, slug, latinName, shortDescription, heroImage, images } = entry
  const image = heroImage || images?.[0]

  return (
    <Link
      href={`/${locale}/plantes/${slug}`}
      className="block rounded-2xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Circular image zone */}
      <div className="flex items-center justify-center pt-8 pb-4 bg-[#FEF9E9]">
        <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt || name}
              fill
              sizes="112px"
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-[#FFF5D5]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#DCD8C7"
                strokeWidth="1.5"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s2.5 3.5.5 9.2A7 7 0 0 1 11 20Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6 text-center">
        <h3 className="font-bold text-base text-[#054A57]">
          {name}
        </h3>

        {latinName && (
          <p className="italic text-sm mt-1 text-[#D0802C]">
            {latinName}
          </p>
        )}

        {shortDescription && (
          <p className="text-sm mt-2 line-clamp-2 text-[#712E2F]/70">
            {shortDescription}
          </p>
        )}

        <span className="inline-block mt-3 text-sm font-medium text-[#A2211E]">
          En savoir plus &rarr;
        </span>
      </div>
    </Link>
  )
}
