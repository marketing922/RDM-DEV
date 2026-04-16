import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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
      <div className="mx-auto max-w-3xl px-6 py-6">
        {/* Back arrow */}
        <Link
          href={`/${locale}/bienfaits`}
          className="inline-flex items-center gap-2 text-sm text-[#712E2F] hover:text-[#A2211E] transition-colors mb-6"
        >
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
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          {dict.benefits.title}
        </Link>

        {/* Header with emoji icon */}
        <div className="text-center mt-4 mb-8">
          {b.icon && (
            <span className="text-[56px] block mb-4" role="img" aria-label={benefitName}>
              {b.icon}
            </span>
          )}
          <h1 className="font-heading text-4xl font-bold text-[#054A57]">
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
            <h2 className="font-heading text-xl font-bold text-[#054A57] mb-4">
              Les plantes et {['a', 'e', 'i', 'o', 'u', 'é', 'è'].some(v => benefitNameLower.startsWith(v)) ? "l'" : 'la '}{benefitNameLower}
            </h2>
            {b.description ? (
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: b.description }}
              />
            ) : b.quickAnswer ? (
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: b.quickAnswer }}
              />
            ) : (
              <p className="text-gray-500 italic">Contenu en cours de r&eacute;daction...</p>
            )}
          </div>
        </section>

        {/* Related plants - with green checkmarks */}
        {relatedPlants.length > 0 && (
          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold text-[#054A57] mb-4">
              Plantes recommand&eacute;es
            </h2>
            <ul className="space-y-3">
              {relatedPlants.map((plant, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="text-green-600 font-bold text-lg">&#10003;</span>
                  {plant.slug ? (
                    <Link
                      href={`/${locale}/wiki/${plant.slug}`}
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
