import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getBenefitBySlug } from '@/lib/queries'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const benefit = await getBenefitBySlug(slug, locale)

  if (!benefit) {
    return { title: `Not Found | ${dict.meta.siteName}` }
  }

  return {
    title: `${(benefit as any).name} | ${dict.benefits.title} | ${dict.meta.siteName}`,
    description: (benefit as any).shortDescription || `${dict.benefits.subtitle}`,
  }
}

export default async function BienfaitDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const benefit = await getBenefitBySlug(slug, locale)
  if (!benefit) notFound()

  const b = benefit as any
  const benefitName = b.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

  return (
    <main className="bg-[#FEF9E9] min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.benefits.title, href: `/${locale}/bienfaits` },
            { label: benefitName },
          ]}
        />

        {/* Header */}
        <div className="mt-8 mb-12">
          <h1 className="font-heading text-4xl font-bold text-[#054A57]">
            {benefitName}
          </h1>
          {b.shortDescription && (
            <p className="mt-4 text-lg text-[#712E2F]/70">
              {b.shortDescription}
            </p>
          )}
        </div>

        {/* Quick answer callout */}
        <section className="mb-16">
          <div className="bg-[#FFF5D5] border border-[#DCD8C7] rounded-xl p-6">
            <h2 className="font-heading text-xl font-semibold text-[#054A57] mb-3 flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D0802C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              {dict.benefits.detail.quickAnswer}
            </h2>
            {b.description ? (
              <div className="prose prose-sm max-w-none text-[#712E2F]" dangerouslySetInnerHTML={{ __html: b.description }} />
            ) : (
              <div className="space-y-2">
                <div className="bg-[#DCD8C7]/30 rounded h-4 w-full animate-pulse" />
                <div className="bg-[#DCD8C7]/30 rounded h-4 w-5/6 animate-pulse" />
                <div className="bg-[#DCD8C7]/30 rounded h-4 w-3/4 animate-pulse" />
              </div>
            )}
          </div>
        </section>

        {/* Related plants */}
        <section className="mb-16">
          <h2 className="font-heading text-2xl font-semibold text-[#054A57] mb-6">
            {dict.benefits.detail.relatedPlants}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#FFF5D5] border border-[#DCD8C7] rounded-2xl h-[280px] animate-pulse" />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
