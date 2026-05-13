import type { Metadata } from 'next'
import Link from 'next/link'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getWikiEntries } from '@/lib/queries'
import { WikiCard } from '@/components/shared/WikiCard'
import PlantesToolbar from '@/components/plantes/PlantesToolbar'
import Reveal from '@/components/ui/Reveal'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 60

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

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
  'multi',
] as const

type CategoryKey = (typeof CATEGORY_ORDER)[number]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    metadataBase: siteMetadataBase(),
    title: `${dict.wiki.title} | ${dict.meta.siteName}`,
    description: dict.wiki.subtitle,
    alternates: {
      canonical: `/${locale}/plantes`,
      languages: {
        fr: `/fr/plantes`,
        en: `/en/plantes`,
      },
    },
  }
}

type PlantLike = {
  id?: string | number
  name: string
  slug: string
  latinName?: string
  shortDescription?: string
  category?: string
  referenceNumber?: string
  externalImageUrl?: string
}

function groupByCategory(list: PlantLike[]) {
  const map = new Map<string, PlantLike[]>()
  for (const p of list) {
    const key = (p.category as CategoryKey) || 'multi'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return CATEGORY_ORDER.filter((k) => map.has(k)).map((k) => ({
    key: k,
    items: map.get(k)!.sort((a, b) => a.name.localeCompare(b.name, 'fr')),
  }))
}

export default async function PlantesPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = (await searchParams) || {}
  const dict = await getDictionary(locale as Locale)

  const q = String(sp.q ?? '').trim()
  const rawCategory = String(sp.category ?? '')
  const activeCategory =
    CATEGORY_ORDER.includes(rawCategory as CategoryKey) ? rawCategory : ''

  const { docs: entries } = await getWikiEntries({
    limit: 200,
    locale,
    search: q,
    category: activeCategory,
  })

  const isFiltered = Boolean(q) || Boolean(activeCategory)
  const plants = entries as PlantLike[]
  const groups = groupByCategory(plants)
  const totalCount = plants.length

  const tWiki = dict.wiki as any
  const categoryLabels = tWiki.categories ?? {}

  // Toolbar filters: 'all' + 10 categories
  const filters = [
    { key: 'all', label: categoryLabels.all ?? 'Toutes' },
    ...CATEGORY_ORDER.map((k) => ({ key: k, label: categoryLabels[k] ?? k })),
  ]

  return (
    <main className="min-h-screen bg-rm-cream">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-10 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.wiki.title },
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
              L&apos;encyclopédie des{' '}
              <em className="italic text-rm-burgundy">plantes</em>
            </h1>
            <p className="font-serif italic text-[15px] sm:text-[17px] md:text-[19px] leading-[1.55] text-rm-inkSoft mt-4 sm:mt-5">
              {dict.wiki.subtitle}
              {isFiltered && totalCount > 0
                ? ` — ${totalCount} ${totalCount > 1 ? tWiki.results : tWiki.result}`
                : totalCount > 0
                  ? ` — ${totalCount} ${totalCount > 1 ? tWiki.entries : tWiki.entry}`
                  : ''}
              .
            </p>
          </header>
        </Reveal>

        {/* Toolbar (search + categories) */}
        <PlantesToolbar
          initialSearch={q}
          initialFilter={activeCategory || 'all'}
          filters={filters}
          searchPlaceholder={tWiki.searchPlaceholder}
          paramName="category"
        />

        <div className="border-t border-dashed border-rm-rule mt-8 mb-10 sm:mb-12 md:mb-14" />

        {groups.length > 0 ? (
          <div className="space-y-12 sm:space-y-14 md:space-y-20">
            {groups.map((group) => {
              // 2 rows on xl (5 cols × 2) = 10 cards. Slice server-side.
              const PREVIEW_LIMIT = 10
              const visible = group.items.slice(0, PREVIEW_LIMIT)
              const hasMore = group.items.length > PREVIEW_LIMIT
              return (
                <section key={group.key}>
                  <Reveal className="flex items-baseline gap-3 sm:gap-5 mb-5 sm:mb-6 md:mb-8">
                    <span className="font-display italic text-[22px] sm:text-[28px] md:text-[34px] text-rm-burgundy leading-tight">
                      {categoryLabels[group.key] ?? group.key}
                    </span>
                    <span className="flex-1 border-t border-dashed border-rm-rule" />
                    <span className="font-mono text-[10px] sm:text-[11px] tracking-wide uppercase text-rm-inkSoft/70">
                      {group.items.length}{' '}
                      {group.items.length > 1 ? tWiki.entries : tWiki.entry}
                    </span>
                  </Reveal>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
                    {visible.map((plant, idx) => (
                      <Reveal
                        key={String(plant.id ?? plant.slug)}
                        delay={(idx % 5) * 60}
                      >
                        <WikiCard entry={plant as any} locale={locale} />
                      </Reveal>
                    ))}
                  </div>

                  {hasMore && (
                    <div className="mt-6 sm:mt-8 flex justify-center">
                      <Link
                        href={`/${locale}/plantes/categorie/${group.key}`}
                        className="inline-flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-[0.14em] text-rm-burgundy hover:text-rm-teal transition-colors border border-rm-burgundy hover:border-rm-teal px-5 py-2.5 rounded-full"
                      >
                        {tWiki.viewAllInCategory ?? tWiki.viewMore} ({group.items.length})
                        <span aria-hidden>→</span>
                      </Link>
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        ) : (
          <div className="border border-dashed border-rm-ruleStrong bg-rm-paper p-10 md:p-16 text-center max-w-2xl mx-auto">
            <h2 className="font-display text-[26px] md:text-[32px] text-rm-teal">
              <em className="italic">
                {isFiltered ? tWiki.noResults : tWiki.empty}
              </em>
            </h2>
            <p className="font-serif italic text-[16px] leading-[1.55] text-rm-inkSoft mt-4">
              {isFiltered ? tWiki.noResultsHint : tWiki.emptyHint}
            </p>
            {isFiltered && (
              <Link
                href={`/${locale}/plantes`}
                className="inline-block mt-6 font-sans text-sm font-semibold text-rm-burgundy underline underline-offset-4 decoration-1 hover:text-rm-teal transition-colors"
              >
                {tWiki.clearFilters} →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
