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
    <Link href={`/${locale}/bienfaits/${slug}`} className="block">
      <div className="flex flex-col items-center text-center bg-white rounded-xl p-xl shadow hover:shadow-lg transition-all duration-slow hover:-translate-y-1">
        {/* Icon circle */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-brand-light mb-md">
          {icon ? (
            <span className="text-2xl" role="img" aria-label={name}>
              {icon}
            </span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-brand"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
          )}
        </div>

        {/* Name */}
        <h3 className="font-ui font-medium text-neutral-600">{name}</h3>

        {/* Description */}
        {shortDescription && (
          <p className="text-body-sm text-neutral-400 line-clamp-3 mt-xs">
            {shortDescription}
          </p>
        )}
      </div>
    </Link>
  )
}
