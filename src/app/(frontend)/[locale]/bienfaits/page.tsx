import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getBenefits } from '@/lib/queries'
import { BenefitCard } from '@/components/shared/BenefitCard'

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
  const { docs: benefits } = await getBenefits({ locale })

  return (
    <main className="bg-[#FEF9E9] min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.benefits.title },
          ]}
        />

        {/* Header */}
        <div className="mt-8 mb-12 text-center">
          <h1 className="font-heading text-4xl font-bold text-[#054A57]">
            {dict.benefits.title}
          </h1>
          <p className="mt-4 text-lg text-[#712E2F]/70 max-w-2xl mx-auto">
            {dict.benefits.subtitle}
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {benefits.length > 0 ? (
            benefits.map((benefit: any) => (
              <BenefitCard key={benefit.id} benefit={benefit} locale={locale} />
            ))
          ) : (
            benefitPlaceholders.map((benefit) => (
              <a
                key={benefit.key}
                href={`/${locale}/bienfaits/${benefit.key}`}
                className="bg-[#FEF9E9] border border-[#DCD8C7] rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="text-[40px] mb-4">{benefit.emoji}</div>
                <div className="bg-[#FFF5D5] rounded h-5 w-3/4 mx-auto animate-pulse mb-3" />
                <div className="space-y-2">
                  <div className="bg-[#FFF5D5] rounded h-3 w-full animate-pulse" />
                  <div className="bg-[#FFF5D5] rounded h-3 w-5/6 mx-auto animate-pulse" />
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
