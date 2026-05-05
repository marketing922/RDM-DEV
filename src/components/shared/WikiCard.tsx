import Link from 'next/link'
import PlantImage from '@/components/plantes/PlantImage'

type WikiCardProps = {
  entry: {
    name: string
    slug: string
    latinName?: string
    shortDescription?: string
    referenceNumber?: string
    externalImageUrl?: string
    heroImage?: { url: string; alt?: string }
    images?: Array<{ image?: { url: string; alt?: string } }>
  }
  locale: string
}

export function WikiCard({ entry, locale }: WikiCardProps) {
  const {
    name,
    slug,
    latinName,
    shortDescription,
    externalImageUrl,
    heroImage,
    images,
    referenceNumber,
  } = entry
  const cmsImage = heroImage || (images?.[0] as any)?.image
  const imageSrc = externalImageUrl || cmsImage?.url || ''
  const imageAlt = cmsImage?.alt || name

  return (
    <Link
      href={`/${locale}/plantes/${slug}`}
      className="block rounded-2xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
    >
      {/* Square image (aligned with Nano Banana 1024x1024 output) */}
      <div className="relative aspect-square overflow-hidden bg-rm-cream">
        <PlantImage
          src={imageSrc}
          alt={imageAlt}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {referenceNumber && (
          <span className="absolute top-2 right-2 font-mono text-[10px] tracking-[0.2em] uppercase text-rm-burgundy bg-rm-cream/90 px-2 py-0.5 rounded">
            {referenceNumber}
          </span>
        )}
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
