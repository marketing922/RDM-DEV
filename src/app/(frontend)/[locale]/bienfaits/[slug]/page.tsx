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
    <main className="bg-page min-h-screen">
      <div className="mx-auto max-w-7xl px-md py-md">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.benefits.title, href: `/${locale}/bienfaits` },
            { label: benefitName },
          ]}
        />

        {/* Header */}
        <div className="mt-lg mb-xl">
          <h1 className="font-heading text-heading-1 text-neutral-600">
            {benefitName}
          </h1>
          {b.shortDescription && (
            <p className="mt-sm text-body-lg text-neutral-400">
              {b.shortDescription}
            </p>
          )}
        </div>

        {/* Quick answer callout */}
        <section className="mb-2xl">
          <div className="bg-success-bg border border-success-border rounded-xl p-lg">
            <h2 className="font-heading text-heading-4 text-success-text mb-sm flex items-center gap-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
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
              <div className="prose prose-sm max-w-none text-success-text" dangerouslySetInnerHTML={{ __html: b.description }} />
            ) : (
              <div className="space-y-xs">
                <div className="bg-success-border/30 rounded h-4 w-full animate-pulse" />
                <div className="bg-success-border/30 rounded h-4 w-5/6 animate-pulse" />
                <div className="bg-success-border/30 rounded h-4 w-3/4 animate-pulse" />
              </div>
            )}
          </div>
        </section>

        {/* Related plants */}
        <section className="mb-2xl">
          <h2 className="font-heading text-heading-3 text-neutral-600 mb-lg">
            {dict.benefits.detail.relatedPlants}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-lg">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl h-[280px] animate-pulse" />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
