import type { Metadata } from 'next'
import Link from 'next/link'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getBenefits } from '@/lib/queries'
import BienfaitsToolbar from '@/components/bienfaits/BienfaitsToolbar'
import BenefitIcon from '@/components/bienfaits/BenefitIcon'
import Reveal from '@/components/ui/Reveal'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 60

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const REGION_KEYS = ['all', 'tete', 'gorge', 'respiration', 'digestion', 'feminin', 'circulation'] as const

const CATEGORY_ORDER = [
  'nervous',
  'digestive',
  'respiratory',
  'female',
  'male',
  'circulatory',
  'joints',
  'immunity',
  'skin',
  'metabolism',
] as const

type CategoryKey = (typeof CATEGORY_ORDER)[number]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    metadataBase: siteMetadataBase(),
    title: `${dict.benefits.title} | ${dict.meta.siteName}`,
    description: dict.benefits.subtitle,
    alternates: {
      canonical: `/${locale}/bienfaits`,
      languages: {
        fr: `/fr/bienfaits`,
        en: `/en/bienfaits`,
      },
    },
  }
}

type BenefitLike = {
  id?: string | number
  name: string
  slug: string
  icon?: string
  shortDescription?: string
  category?: string
  referenceNumber?: string
  relatedPlants?: Array<{ id?: string | number } | string | number>
}

function plantCount(b: BenefitLike): number {
  if (!b.relatedPlants) return 0
  if (Array.isArray(b.relatedPlants)) return b.relatedPlants.length
  return 0
}

function groupByCategory(list: BenefitLike[]) {
  const map = new Map<string, BenefitLike[]>()
  for (const b of list) {
    const key = (b.category as CategoryKey) || 'metabolism'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(b)
  }
  return CATEGORY_ORDER.filter((k) => map.has(k)).map((k) => ({
    key: k,
    items: map.get(k)!.sort((a, b2) => a.name.localeCompare(b2.name, 'fr')),
  }))
}

export default async function BienfaitsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = (await searchParams) || {}
  const dict = await getDictionary(locale as Locale)

  const q = String(sp.q ?? '').trim()
  const rawRegion = String(sp.region ?? '')
  const activeRegion = REGION_KEYS.includes(rawRegion as any) && rawRegion !== 'all'
    ? rawRegion
    : ''

  const { docs: dbBenefits } = await getBenefits({
    locale,
    limit: 200,
    search: q,
    bodyRegion: activeRegion,
  })

  const benefits: BenefitLike[] = dbBenefits as any[]
  const isFiltered = Boolean(q) || Boolean(activeRegion)
  const groups = groupByCategory(benefits)
  const totalCount = benefits.length

  const regionLabels = REGION_KEYS.map((key) => ({
    key,
    label: (dict.benefits as any).regions?.[key] ?? key,
  }))

  const categoryLabels = (dict.benefits as any).categories ?? {}
  const tBenefits = dict.benefits as any

  return (
    <main className="min-h-screen bg-rm-cream">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-10 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.benefits.title },
          ]}
        />

        <Reveal>
        <header className="mt-8 sm:mt-10 md:mt-14 mb-10 sm:mb-12 md:mb-16 text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2.5 mb-4 sm:mb-5">
            <span className="block w-7 h-px bg-rm-burgundy" />
            <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
              Encyclopédie
            </span>
            <span className="block w-7 h-px bg-rm-burgundy" />
          </div>
          <h1 className="font-display font-normal text-rm-teal leading-[1.05] tracking-[-0.02em] text-[32px] sm:text-[44px] md:text-[52px] lg:text-[60px]">
            Les <em className="italic text-rm-burgundy">Bienfaits</em>
          </h1>
          <p className="font-serif italic text-[15px] sm:text-[17px] md:text-[19px] leading-[1.55] text-rm-inkSoft mt-4 sm:mt-5">
            {dict.benefits.subtitle}
            {isFiltered && totalCount > 0
              ? ` — ${totalCount} ${totalCount > 1 ? tBenefits.results : tBenefits.result}`
              : totalCount > 0
                ? ` — ${totalCount} ${totalCount > 1 ? tBenefits.entries : tBenefits.entry}`
                : ''}
            .
          </p>

          <BienfaitsToolbar
            initialSearch={q}
            initialRegion={activeRegion}
            regions={regionLabels}
            searchPlaceholder={tBenefits.searchPlaceholder}
          />
        </header>
        </Reveal>

        <div className="border-t border-dashed border-rm-rule mb-10 sm:mb-12 md:mb-14" />

        {groups.length > 0 ? (
          <div className="space-y-12 sm:space-y-14 md:space-y-20">
            {groups.map((group) => (
              <section key={group.key}>
                <Reveal className="flex items-baseline gap-3 sm:gap-5 mb-5 sm:mb-6 md:mb-8">
                  <span className="font-display italic text-[22px] sm:text-[28px] md:text-[34px] text-rm-burgundy leading-tight">
                    {categoryLabels[group.key] ?? group.key}
                  </span>
                  <span className="flex-1 border-t border-dashed border-rm-rule" />
                  <span className="font-mono text-[10px] sm:text-[11px] tracking-wide uppercase text-rm-inkSoft/70">
                    {group.items.length}{' '}
                    {group.items.length > 1 ? tBenefits.entries : tBenefits.entry}
                  </span>
                </Reveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {group.items.map((b, idx) => {
                    const num = b.referenceNumber || `B-${String(idx + 1).padStart(3, '0')}`
                    const count = plantCount(b)
                    return (
                      <Reveal key={String(b.id ?? b.slug)} delay={(idx % 4) * 80}>
                      <Link
                        href={`/${locale}/bienfaits/${b.slug}`}
                        className="group flex flex-col bg-rm-paper border border-rm-rule p-5 md:p-6 hover:border-rm-ruleStrong transition-colors h-full"
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <span className="w-10 h-10 flex items-center justify-center border border-rm-rule bg-rm-cream text-rm-burgundy">
                            <BenefitIcon name={b.icon} className="h-5 w-5" ariaLabel={b.name} />
                          </span>
                          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rm-inkSoft/60">
                            {num}
                          </span>
                        </div>

                        <h3 className="font-display text-[22px] leading-[1.15] text-rm-teal group-hover:text-rm-burgundy transition-colors">
                          {b.name}
                        </h3>

                        {b.shortDescription && (
                          <p className="font-serif italic text-[14px] leading-[1.5] text-rm-inkSoft mt-2 line-clamp-2">
                            {b.shortDescription}
                          </p>
                        )}

                        <div className="mt-auto pt-4 border-t border-dashed border-rm-rule flex items-center justify-between">
                          <span className="font-mono text-[11px] tracking-wide uppercase text-rm-inkSoft/70">
                            {count > 0
                              ? `${count} ${count > 1 ? tBenefits.relatedPlantsCount : tBenefits.relatedPlantCount}`
                              : tBenefits.discover}
                          </span>
                          <span
                            aria-hidden="true"
                            className="font-sans text-sm font-semibold text-rm-burgundy"
                          >
                            →
                          </span>
                        </div>
                      </Link>
                      </Reveal>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-rm-ruleStrong bg-rm-paper p-10 md:p-16 text-center max-w-2xl mx-auto">
            <h2 className="font-display text-[26px] md:text-[32px] text-rm-teal">
              <em className="italic">
                {isFiltered ? tBenefits.noResults : tBenefits.empty}
              </em>
            </h2>
            <p className="font-serif italic text-[16px] leading-[1.55] text-rm-inkSoft mt-4">
              {isFiltered ? tBenefits.noResultsHint : tBenefits.emptyHint}
            </p>
            {isFiltered && (
              <Link
                href={`/${locale}/bienfaits`}
                className="inline-block mt-6 font-sans text-sm font-semibold text-rm-burgundy underline underline-offset-4 decoration-1 hover:text-rm-teal transition-colors"
              >
                {tBenefits.clearFilters} →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
