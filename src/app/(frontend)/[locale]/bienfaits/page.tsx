import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: `${dict.benefits.title} | ${dict.meta.siteName}`,
    description: dict.benefits.subtitle,
  }
}

const benefitPlaceholders = [
  { emoji: '\u{1F33F}', key: 'digestion' },
  { emoji: '\u{1F4AA}', key: 'energie' },
  { emoji: '\u{1F6E1}\uFE0F', key: 'immunite' },
  { emoji: '\u{1F9D8}', key: 'relaxation' },
  { emoji: '\u{1F31F}', key: 'peau' },
  { emoji: '\u{2764}\uFE0F', key: 'cardiovasculaire' },
  { emoji: '\u{1F9E0}', key: 'concentration' },
  { emoji: '\u{1F31C}', key: 'sommeil' },
]

export default async function BienfaitsPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <main className="bg-page min-h-screen">
      <div className="mx-auto max-w-7xl px-md py-md">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.benefits.title },
          ]}
        />

        {/* Header */}
        <div className="mt-lg mb-xl text-center">
          <h1 className="font-heading text-heading-1 text-neutral-600">
            {dict.benefits.title}
          </h1>
          <p className="mt-sm text-body-lg text-neutral-400 max-w-2xl mx-auto">
            {dict.benefits.subtitle}
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-lg">
          {benefitPlaceholders.map((benefit) => (
            <a
              key={benefit.key}
              href={`/${locale}/bienfaits/${benefit.key}`}
              className="bg-white rounded-xl p-lg text-center shadow hover:shadow-lg transition-all duration-slow hover:-translate-y-1 group"
            >
              <div className="text-[40px] mb-md">{benefit.emoji}</div>
              <div className="bg-card rounded h-5 w-3/4 mx-auto animate-pulse mb-sm" />
              <div className="space-y-xs">
                <div className="bg-card rounded h-3 w-full animate-pulse" />
                <div className="bg-card rounded h-3 w-5/6 mx-auto animate-pulse" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
