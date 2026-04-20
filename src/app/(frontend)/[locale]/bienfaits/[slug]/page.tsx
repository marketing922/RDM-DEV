import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { richTextToPlain } from '@/lib/utils'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { GeoStructuredData } from '@/components/seo'
import { getBenefitBySlug, getBenefits } from '@/lib/queries'

export const revalidate = 3600

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  try {
    const { docs: benefits } = await getBenefits({ limit: 999 })
    const params: Array<{ locale: string; slug: string }> = []
    for (const benefit of benefits) {
      const slug = (benefit as any).slug
      if (slug) {
        params.push({ locale: 'fr', slug })
        params.push({ locale: 'en', slug })
      }
    }
    return params
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const benefit = await getBenefitBySlug(slug, locale)

  if (!benefit) {
    return { title: `Not Found | ${dict.meta.siteName}` }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'

  return {
    title: `${(benefit as any).name} | ${dict.benefits.title} | ${dict.meta.siteName}`,
    description: (benefit as any).shortDescription || `${dict.benefits.subtitle}`,
    alternates: {
      canonical: `${siteUrl}/${locale}/bienfaits/${slug}`,
      languages: {
        fr: `${siteUrl}/fr/bienfaits/${slug}`,
        en: `${siteUrl}/en/bienfaits/${slug}`,
      },
    },
  }
}

export default async function BienfaitDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const benefit = await getBenefitBySlug(slug, locale)
  if (!benefit) notFound()

  const b = benefit as any
  const benefitName = b.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  const benefitNameLower = benefitName.toLowerCase()

  // Extract related plants from the benefit data
  const relatedPlants: { name: string; slug?: string }[] = []
  if (Array.isArray(b.relatedPlants)) {
    for (const plant of b.relatedPlants) {
      if (typeof plant === 'object' && plant?.name) {
        relatedPlants.push({ name: plant.name, slug: plant.slug })
      }
    }
  }

  return (
    <main className="bg-[#FEF9E9] min-h-screen">
      <GeoStructuredData
        kind="benefit"
        locale={locale}
        slug={slug}
        name={benefitName}
        publishedAt={b.publishedAt}
        updatedAt={b.updatedAt}
        geo={{
          directAnswer: b.directAnswer,
          definition: b.definition,
          keyTakeaways: b.keyTakeaways,
          quotableStatements: b.quotableStatements,
          dataPoints: b.dataPoints,
          faq: b.faq,
          authoritySignals: b.authoritySignals,
          sources: b.sources,
          lastFactCheckedAt: b.lastFactCheckedAt,
        }}
      />
      <div className="mx-auto max-w-3xl px-6 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.benefits.title, href: `/${locale}/bienfaits` },
            { label: benefitName },
          ]}
        />

        {/* Header with emoji icon */}
        <div className="text-center mt-8 mb-8">
          {b.icon && (
            <span className="text-[56px] block mb-4" role="img" aria-label={benefitName}>
              {b.icon}
            </span>
          )}
          <h1 className="text-4xl font-bold text-[#054A57]">
            {benefitName}
          </h1>
          {b.shortDescription && (
            <p className="mt-3 text-lg text-gray-500">
              {b.shortDescription}
            </p>
          )}
        </div>

        {/* Content card */}
        <section className="mb-8">
          <div className="bg-white border border-[#DCD8C7] rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#054A57] mb-4">
              Les plantes et {['a', 'e', 'i', 'o', 'u', 'é', 'è'].some(v => benefitNameLower.startsWith(v)) ? "l'" : 'la '}{benefitNameLower}
            </h2>
            {b.description ? (
              <div className="prose prose-sm max-w-none text-gray-700">
                <p>{richTextToPlain(b.description)}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">Contenu en cours de rédaction...</p>
            )}
          </div>
        </section>

        {/* Related plants - with green checkmarks */}
        {relatedPlants.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-[#054A57] mb-4">
              Plantes recommandées
            </h2>
            <ul className="space-y-3">
              {relatedPlants.map((plant, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="text-green-600 font-bold text-lg">&#10003;</span>
                  {plant.slug ? (
                    <Link
                      href={`/${locale}/plantes/${plant.slug}`}
                      className="text-[#054A57] hover:text-[#A2211E] hover:underline transition-colors"
                    >
                      {plant.name}
                    </Link>
                  ) : (
                    <span className="text-[#054A57]">{plant.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* NO "Produits recommandés" section - Phase 1 */}
      </div>
    </main>
  )
}
