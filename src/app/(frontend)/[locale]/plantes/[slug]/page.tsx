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
  SourcesList,
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
    description: e.directAnswer || e.shortDescription || `${entry.name} - ${e.latinName || ''}`,
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

  const detailedText =
    e.longDescription || (e.description ? richTextToPlain(e.description) : '')
  const precautionsText =
    e.precautionsText ||
    (e.contraindications ? richTextToPlain(e.contraindications) : '') ||
    (e.precautions ? richTextToPlain(e.precautions) : '')

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

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF5D5] via-[#FEF9E9] to-[#FEF9E9] pb-12 lg:pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 opacity-[0.07] rotate-[-20deg]"
        >
          <svg width="420" height="420" viewBox="0 0 24 24" fill="none" stroke="#054A57" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96a1 1 0 0 1 1.5.5c.87 2.58.58 5.04-.27 7.2-.79 2-2.03 3.76-3.64 4.82a9 9 0 0 1-5.79 4.52z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6" />
          </svg>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumb
            items={[
              { label: dict.nav.home, href: `/${locale}` },
              { label: dict.wiki.title, href: `/${locale}/plantes` },
              { label: plantName },
            ]}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 lg:mt-10">
          <div className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-center">
            {/* Left — title block */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#D0802C]">
                {dict.wiki.title}
              </p>
              <h1 className="mt-3 text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] text-[#054A57]">
                {plantName}
              </h1>
              {e.latinName && (
                <p className="mt-3 text-xl lg:text-2xl italic text-[#D0802C]">
                  {e.latinName}
                </p>
              )}
              {benefits.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {benefits.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/${locale}/bienfaits/${b.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#DCD8C7] px-3.5 py-1.5 text-sm font-medium text-[#054A57] hover:border-[#A2211E] hover:text-[#A2211E] transition-colors"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#A2211E]" />
                      {b.name}
                    </Link>
                  ))}
                </div>
              )}
              {e.activeCompounds && (
                <p className="mt-6 max-w-xl text-base lg:text-lg leading-relaxed text-[#374151]">
                  {typeof e.activeCompounds === 'string'
                    ? e.activeCompounds
                    : richTextToPlain(e.activeCompounds)}
                </p>
              )}
            </div>

            {/* Right — image */}
            <div className="relative aspect-square max-w-[420px] mx-auto lg:mx-0 w-full rounded-[32px] overflow-hidden shadow-[0_20px_48px_rgba(5,74,87,0.12),0_6px_16px_rgba(162,33,30,0.08)] border-4 border-white">
              <Image
                src={heroSrc}
                alt={plantName}
                fill
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ MAIN + SIDEBAR ═══════════════ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[1fr_340px] gap-10 lg:gap-14">
          {/* MAIN CONTENT */}
          <div className="min-w-0">
            <DirectAnswerBox text={e.directAnswer} />

            {detailedText && (
              <section className="mt-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-[#054A57] mb-5">
                  À propos de {plantName.toLowerCase()}
                </h2>
                <div className="space-y-4 text-[17px] leading-[1.8] text-[#374151]">
                  {detailedText.split('\n\n').map((paragraph: string, i: number) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </section>
            )}

            <KeyTakeawaysBox items={e.keyTakeaways} />
            <FaqAccordion items={e.faq} />
            <SourcesList items={e.sources} />
          </div>

          {/* SIDEBAR */}
          <aside className="lg:sticky lg:top-8 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto space-y-4 lg:pb-8">
            {infoRows.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#DCD8C7] overflow-hidden">
                <div className="px-5 py-3 bg-[#FFF5D5] border-b border-[#DCD8C7]">
                  <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#054A57]">
                    Fiche technique
                  </h3>
                </div>
                <dl className="divide-y divide-[#DCD8C7]/60 text-sm">
                  {infoRows.map((row, i) => (
                    <div key={i} className="flex px-5 py-3">
                      <dt className="w-1/2 text-[#6B7280] font-medium">{row.label}</dt>
                      <dd className="w-1/2 text-[#054A57] font-semibold text-right">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {precautionsText && (
              <div className="rounded-2xl border-2 border-[#D0802C] bg-[#FFF5D5] p-5">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#D0802C] text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-[#A2211E]">
                      Précautions
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[#1F2937]">
                      {precautionsText}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-[#DCD8C7] bg-white p-5">
              <p className="text-[13px] leading-relaxed text-[#374151]">
                <strong className="text-[#054A57]">
                  Consultez votre médecin avant utilisation.
                </strong>{' '}
                Ces informations sont à titre informatif et ne remplacent pas un avis
                médical.
              </p>
              <Link
                href={`/${locale}/avertissement-sante`}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#A2211E] hover:underline"
              >
                Avertissement santé
                <span>→</span>
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* ═══════════════ PLANTES ASSOCIÉES ═══════════════ */}
      {relatedPlants.length > 0 && (
        <section className="border-t border-[#DCD8C7] bg-white py-14 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-[#054A57]">
                {dict.wiki.detail.relatedPlants || 'Plantes associées'}
              </h2>
              <Link
                href={`/${locale}/plantes`}
                className="text-sm font-semibold text-[#A2211E] hover:underline"
              >
                Voir toutes les plantes →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {relatedPlants.map((plant: any) => {
                const imgSrc =
                  plant.heroImage?.url ||
                  (plant.images?.[0] as any)?.image?.url ||
                  DEFAULT_PLANT_IMAGE
                return (
                  <Link
                    key={plant.slug}
                    href={`/${locale}/plantes/${plant.slug}`}
                    className="group overflow-hidden rounded-2xl border border-[#DCD8C7] bg-white transition-all hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(5,74,87,0.08)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#FFF5D5]">
                      <Image
                        src={imgSrc}
                        alt={plant.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-[#054A57] group-hover:text-[#A2211E] transition-colors">
                        {plant.name}
                      </p>
                      {plant.latinName && (
                        <p className="mt-0.5 text-xs italic text-[#D0802C]">
                          {plant.latinName}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
