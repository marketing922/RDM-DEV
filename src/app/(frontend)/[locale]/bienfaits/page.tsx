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
  { emoji: '\uD83E\uDEC1', name: 'Digestion', key: 'digestion', description: 'Soulager les troubles digestifs naturellement' },
  { emoji: '\uD83D\uDE34', name: 'Sommeil', key: 'sommeil', description: 'Retrouver un sommeil réparateur' },
  { emoji: '\uD83D\uDEE1\uFE0F', name: 'Immunité', key: 'immunite', description: 'Renforcer vos défenses naturelles' },
  { emoji: '\uD83E\uDDD8', name: 'Stress', key: 'stress', description: 'Gérer le stress avec les plantes' },
  { emoji: '\uD83D\uDCAA', name: 'Énergie', key: 'energie', description: 'Booster votre énergie naturellement' },
  { emoji: '\uD83C\uDF38', name: 'Peau', key: 'peau', description: 'Prendre soin de votre peau' },
  { emoji: '\uD83D\uDDA4', name: 'Circulation', key: 'circulation', description: 'Améliorer la circulation sanguine' },
  { emoji: '\uD83D\uDD27', name: 'Articulations', key: 'articulations', description: 'Soulager les douleurs articulaires' },
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
            Les Bienfaits des Plantes
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            D&eacute;couvrez comment les plantes peuvent am&eacute;liorer votre bien-&ecirc;tre
          </p>
        </div>

        {/* Benefits grid - Desktop: 4 cols, Tablet: 2 cols, Mobile: horizontal scroll */}
        {benefits.length > 0 ? (
          <>
            {/* Desktop/Tablet grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit: any) => (
                <BenefitCard key={benefit.id} benefit={benefit} locale={locale} />
              ))}
            </div>
            {/* Mobile horizontal scroll */}
            <div className="flex sm:hidden gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory">
              {benefits.map((benefit: any) => (
                <div key={benefit.id} className="min-w-[260px] snap-start">
                  <BenefitCard benefit={benefit} locale={locale} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Desktop/Tablet grid - placeholders */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefitPlaceholders.map((item) => (
                <a
                  key={item.key}
                  href={`/${locale}/bienfaits/${item.key}`}
                  className="group flex flex-col items-center text-center bg-white rounded-xl border border-[#DCD8C7] p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <span className="text-[40px] mb-4">{item.emoji}</span>
                  <h3 className="font-bold text-lg text-[#054A57]">{item.name}</h3>
                  <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                  <span className="mt-4 text-sm font-medium text-[#A2211E] group-hover:underline">
                    D&eacute;couvrir &rarr;
                  </span>
                </a>
              ))}
            </div>
            {/* Mobile horizontal scroll - placeholders */}
            <div className="flex sm:hidden gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory">
              {benefitPlaceholders.map((item) => (
                <a
                  key={item.key}
                  href={`/${locale}/bienfaits/${item.key}`}
                  className="group min-w-[260px] snap-start flex flex-col items-center text-center bg-white rounded-xl border border-[#DCD8C7] p-6 hover:shadow-md transition-all duration-300"
                >
                  <span className="text-[40px] mb-4">{item.emoji}</span>
                  <h3 className="font-bold text-lg text-[#054A57]">{item.name}</h3>
                  <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                  <span className="mt-4 text-sm font-medium text-[#A2211E] group-hover:underline">
                    D&eacute;couvrir &rarr;
                  </span>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
