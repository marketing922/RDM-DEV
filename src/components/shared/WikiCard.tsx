import Link from 'next/link'
import Image from 'next/image'

const DEFAULT_PLANT_IMAGE = 'https://res.cloudinary.com/laboratoire-calebasse/image/upload/v1761295312/Chat_GPT_Image_Oct_24_2025_10_38_36_AM_1_a78649daf4.png'

type WikiCardProps = {
  entry: {
    name: string
    slug: string
    latinName?: string
    shortDescription?: string
    heroImage?: { url: string; alt?: string }
    images?: Array<{ image?: { url: string; alt?: string } }>
  }
  locale: string
}

export function WikiCard({ entry, locale }: WikiCardProps) {
  const { name, slug, latinName, shortDescription, heroImage, images } = entry
  const cmsImage = heroImage || (images?.[0] as any)?.image
  const imageSrc = cmsImage?.url || DEFAULT_PLANT_IMAGE

  return (
    <Link
      href={`/${locale}/plantes/${slug}`}
      className="block rounded-2xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
    >
      {/* Rectangular image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageSrc}
          alt={cmsImage?.alt || name}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="px-3 py-3 sm:px-4 sm:py-4 text-center">
        <h3 className="font-bold text-[15px] sm:text-base text-[#054A57] leading-tight">
          {name}
        </h3>

        {latinName && (
          <p className="italic text-[12px] sm:text-sm mt-1 text-[#D0802C]">
            {latinName}
          </p>
        )}

        {shortDescription && (
          <p className="text-[12px] sm:text-sm mt-1.5 sm:mt-2 line-clamp-2 text-[#712E2F]/70 leading-snug">
            {shortDescription}
          </p>
        )}

        <span className="inline-block mt-2 sm:mt-3 text-[12px] sm:text-sm font-medium text-[#A2211E]">
          En savoir plus &rarr;
        </span>
      </div>
    </Link>
  )
}
