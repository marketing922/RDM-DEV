import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { richTextToPlain } from '@/lib/utils'
import { GeoStructuredData } from '@/components/seo'
import {
  DirectAnswerBox,
  KeyTakeawaysBox,
  FaqAccordion,
} from '@/components/shared/GeoSections'
import { getWikiEntryBySlug, getWikiEntries } from '@/lib/queries'

export const revalidate = 3600

const DEFAULT_PLANT_IMAGE = 'https://res.cloudinary.com/laboratoire-calebasse/image/upload/v1761295312/Chat_GPT_Image_Oct_24_2025_10_38_36_AM_1_a78649daf4.png'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  try {
    const { docs: plants } = await getWikiEntries({ limit: 999 })
    const params: Array<{ locale: string; slug: string }> = []
    for (const plant of plants) {
      const slug = (plant as any).slug
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
  const entry = await getWikiEntryBySlug(slug, locale)
  if (!entry) return { title: `Not Found | ${dict.meta.siteName}` }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'
  const e = entry as any
  const imageUrl = e.heroImage?.url || (e.images?.[0] as any)?.image?.url || DEFAULT_PLANT_IMAGE

  return {
    title: `${entry.name} | ${dict.wiki.title} | ${dict.meta.siteName}`,
    description: e.shortDescription || `${entry.name} - ${e.latinName || ''}`,
    openGraph: {
      images: [{ url: imageUrl, width: 800, height: 600, alt: entry.name }],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/plantes/${slug}`,
      languages: {
        fr: `${siteUrl}/fr/plantes/${slug}`,
        en: `${siteUrl}/en/plantes/${slug}`,
      },
    },
  }
}

export default async function PlantDetailPage({ params }: Props) {
  const { locale, slug } = await params
  // Fetch all data in parallel
  const [dict, entry, { docs: allPlants }] = await Promise.all([
    getDictionary(locale as Locale),
    getWikiEntryBySlug(slug, locale),
    getWikiEntries({ limit: 12, locale }),
  ])
  if (!entry) notFound()

  const e = entry as any
  const plantName = e.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  const heroSrc = e.heroImage?.url || (e.images?.[0] as any)?.image?.url || DEFAULT_PLANT_IMAGE

  const benefits: Array<{ name: string; slug: string }> = Array.isArray(e.benefits)
    ? e.benefits.filter((b: any) => b && typeof b === 'object' && b.name)
    : []

  const infoRows = [
    { label: 'Famille', value: e.family },
    { label: 'Parties utilis\u00e9es', value: e.partsUsed },
    { label: 'Origine', value: e.origin },
    { label: 'R\u00e9colte', value: e.harvest },
    { label: 'Forme', value: e.form },
    { label: 'Conservation', value: e.conservation },
    { label: 'Principes actifs', value: e.activeCompounds },
  ].filter((r) => r.value)

  const relatedPlants = allPlants.filter((p: any) => p.slug !== slug).slice(0, 4)

  return (
    <main className="min-h-screen bg-[#FEF9E9]">
      <GeoStructuredData
        kind="plant"
        locale={locale}
        slug={slug}
        name={plantName}
        image={heroSrc}
        publishedAt={e.publishedAt}
        updatedAt={e.updatedAt}
        geo={{
          directAnswer: e.directAnswer,
          definition: e.definition,
          keyTakeaways: e.keyTakeaways,
          quotableStatements: e.quotableStatements,
          dataPoints: e.dataPoints,
          faq: e.faq,
          authoritySignals: e.authoritySignals,
          sources: e.sources,
          lastFactCheckedAt: e.lastFactCheckedAt,
        }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.wiki.title, href: `/${locale}/plantes` },
            { label: plantName },
          ]}
        />

        {/* Hero: Image left + Info right */}
        <div className="mt-8 bg-white rounded-2xl border border-[#DCD8C7] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center sm:items-start">
            {/* Circular image */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0 rounded-full overflow-hidden border-4 border-[#FEF9E9] shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
              <Image
                src={heroSrc}
                alt={plantName}
                fill
                sizes="176px"
                className="object-cover"
              />
            </div>

            {/* Name, latin, tags, description */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#054A57]">
                {plantName}
              </h1>
              {e.latinName && (
                <p className="mt-1 text-lg italic text-[#D0802C]">{e.latinName}</p>
              )}

              {/* Tags from benefits — now clickable links */}
              {benefits.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#054A57] text-white">
                    Plante
                  </span>
                  {benefits.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/${locale}/bienfaits/${b.slug}`}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-[#054A57]/80 text-white hover:bg-[#A2211E] transition-colors"
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Short description */}
              {e.activeCompounds && (
                <p className="mt-4 text-sm text-[#712E2F]/70 leading-relaxed">
                  {typeof e.activeCompounds === 'string' ? e.activeCompounds : richTextToPlain(e.activeCompounds)}
                </p>
              )}
            </div>
          </div>
        </div>

        <DirectAnswerBox text={e.directAnswer} />

        {/* Two columns: Bienfaits + Infos clés */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT — Bienfaits principaux — now clickable links */}
          <div className="bg-white rounded-2xl border border-[#DCD8C7] p-6">
            <h2 className="text-xl font-bold mb-5 text-[#054A57]">
              Bienfaits principaux
            </h2>
            {benefits.length > 0 ? (
              <ul className="space-y-3">
                {benefits.map((b) => (
                  <li key={b.slug} className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#054A57" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <Link
                      href={`/${locale}/bienfaits/${b.slug}`}
                      className="text-[#712E2F] hover:text-[#A2211E] hover:underline transition-colors"
                    >
                      {b.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#712E2F]/50 italic">
                Aucune information disponible.
              </p>
            )}
          </div>

          {/* RIGHT — Informations clés */}
          <div className="bg-white rounded-2xl border border-[#DCD8C7] p-6">
            <h2 className="text-xl font-bold mb-5 text-[#054A57]">
              Informations clés
            </h2>
            {infoRows.length > 0 ? (
              <table className="w-full text-sm">
                <tbody>
                  {infoRows.map((row, i) => (
                    <tr key={i} className="border-b border-[#DCD8C7]/50 last:border-0">
                      <td className="py-3 pr-4 font-medium text-[#712E2F]/60 whitespace-nowrap">
                        {row.label}
                      </td>
                      <td className="py-3 font-semibold text-[#054A57]">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-[#712E2F]/50 italic">
                Aucune information disponible.
              </p>
            )}
          </div>
        </div>

        {/* Description détaillée */}
        {(e.longDescription || (e.description && richTextToPlain(e.description))) && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-[#054A57]">
              Description détaillée
            </h2>
            <div className="bg-white rounded-2xl border border-[#DCD8C7] p-6 text-[#712E2F] leading-relaxed">
              {(e.longDescription || richTextToPlain(e.description)).split('\n\n').map((paragraph: string, i: number) => (
                <p key={i} className={i > 0 ? 'mt-4' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        <KeyTakeawaysBox items={e.keyTakeaways} />

        <FaqAccordion items={e.faq} />

        {/* Contre-indications */}
        {(e.precautionsText || e.contraindications || e.precautions) && (
          <div className="mt-8 rounded-2xl p-6 bg-[#FFF5D5] border-2 border-[#D0802C]">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D0802C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2 text-[#A2211E]">
                  Contre-indications &amp; Précautions
                </h3>
                <p className="text-sm text-[#712E2F]">
                  {e.precautionsText || richTextToPlain(e.contraindications) || richTextToPlain(e.precautions)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer médical */}
        <div className="mt-8 rounded-2xl p-5 bg-[#FFF5D5] border border-[#D0802C]/30">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D0802C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="text-sm text-[#712E2F]">
              <strong>Consultez votre médecin avant utilisation.</strong> Les informations présentes sur ce site sont à titre informatif et ne remplacent pas un avis médical.{' '}
              <Link href={`/${locale}/avertissement-sante`} className="text-[#A2211E] hover:underline font-medium">
                En savoir plus
              </Link>
            </p>
          </div>
        </div>

        {/* Plantes associées */}
        {relatedPlants.length > 0 && (
          <div className="mt-12 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-[#054A57]">
              {dict.wiki.detail.relatedPlants || 'Plantes associées'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedPlants.map((plant: any) => {
                const imgSrc = plant.heroImage?.url || (plant.images?.[0] as any)?.image?.url || DEFAULT_PLANT_IMAGE
                return (
                  <Link
                    key={plant.slug}
                    href={`/${locale}/plantes/${plant.slug}`}
                    className="group bg-white rounded-xl border border-[#DCD8C7] overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={imgSrc}
                        alt={plant.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 text-center">
                      <p className="font-bold text-sm text-[#054A57]">{plant.name}</p>
                      {plant.latinName && (
                        <p className="text-xs italic text-[#D0802C] mt-0.5">{plant.latinName}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
