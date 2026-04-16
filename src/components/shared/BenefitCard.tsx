import Link from 'next/link'

type BenefitCardProps = {
  benefit: {
    name: string
    slug: string
    icon?: string
    shortDescription?: string
  }
  locale: string
}

export function BenefitCard({ benefit, locale }: BenefitCardProps) {
  const { name, slug, icon, shortDescription } = benefit

  return (
    <Link href={`/${locale}/bienfaits/${slug}`} className="block group">
      <div className="flex flex-col items-center text-center bg-white rounded-xl border border-[#DCD8C7] p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
        {/* Icon */}
        {icon && (
          <span className="text-[40px] mb-4" role="img" aria-label={name}>
            {icon}
          </span>
        )}

        {/* Name */}
        <h3 className="font-bold text-lg text-[#054A57]">{name}</h3>

        {/* Description */}
        {shortDescription && (
          <p className="text-sm text-gray-600 line-clamp-3 mt-2">
            {shortDescription}
          </p>
        )}

        {/* Link */}
        <span className="mt-4 text-sm font-medium text-[#A2211E] group-hover:underline">
          D&eacute;couvrir &rarr;
        </span>
      </div>
    </Link>
  )
}
