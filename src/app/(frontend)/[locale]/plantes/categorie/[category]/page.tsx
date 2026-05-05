import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getWikiEntries } from '@/lib/queries'
import { WikiCard } from '@/components/shared/WikiCard'
import Reveal from '@/components/ui/Reveal'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 60

const VALID_CATEGORIES = [
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

type CategoryKey = (typeof VALID_CATEGORIES)[number]

type Props = {
  params: Promise<{ locale: string; category: string }>
}

export async function generateStaticParams() {
  const params: Array<{ locale: string; category: string }> = []
  for (const cat of VALID_CATEGORIES) {
    params.push({ locale: 'fr', category: cat })
    params.push({ locale: 'en', category: cat })
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params
  const dict = await getDictionary(locale as Locale)
  if (!VALID_CATEGORIES.includes(category as CategoryKey)) {
    return { title: `Not Found | ${dict.meta.siteName}` }
  }
  const tWiki = dict.wiki as any
  const label = tWiki.categories?.[category] ?? category
  return {
    metadataBase: siteMetadataBase(),
    title: `${label} — ${dict.wiki.title} | ${dict.meta.siteName}`,
    description: `${tWiki.subtitle} — ${label}`,
  }
}

export default async function PlantsCategoryPage({ params }: Props) {
  const { locale, category } = await params
  if (!VALID_CATEGORIES.includes(category as CategoryKey)) notFound()

  const dict = await getDictionary(locale as Locale)
  const tWiki = dict.wiki as any
  const categoryLabels = tWiki.categories ?? {}
  const label = categoryLabels[category] ?? category

  const { docs: entries } = await getWikiEntries({
    limit: 200,
    locale,
    category,
  })

  const plants = (entries as any[]).sort((a, b) =>
    String(a.name).localeCompare(String(b.name), 'fr'),
  )

  return (
    <main className="min-h-screen bg-rm-cream">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-10 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.wiki.title, href: `/${locale}/plantes` },
            { label },
          ]}
        />

        <Reveal>
          <header className="mt-8 sm:mt-10 md:mt-14 mb-10 sm:mb-12 md:mb-16 text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-4 sm:mb-5">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                Encyclopédie · {dict.wiki.title}
              </span>
              <span className="block w-7 h-px bg-rm-burgundy" />
            </div>
            <h1 className="font-display font-normal text-rm-teal leading-[1.05] tracking-[-0.02em] text-[28px] sm:text-[40px] md:text-[48px] lg:text-[56px]">
              <em className="italic text-rm-burgundy">{label}</em>
            </h1>
            <p className="font-serif italic text-[15px] sm:text-[17px] md:text-[19px] leading-[1.55] text-rm-inkSoft mt-4 sm:mt-5">
              {plants.length}{' '}
              {plants.length > 1 ? tWiki.entries : tWiki.entry}
              .
            </p>
          </header>
        </Reveal>

        <div className="border-t border-dashed border-rm-rule mb-10 sm:mb-12 md:mb-14" />

        {plants.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
            {plants.map((plant, idx) => (
              <Reveal
                key={String(plant.id ?? plant.slug)}
                delay={(idx % 5) * 60}
              >
                <WikiCard entry={plant as any} locale={locale} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-rm-ruleStrong bg-rm-paper p-10 md:p-16 text-center max-w-2xl mx-auto">
            <h2 className="font-display text-[26px] md:text-[32px] text-rm-teal">
              <em className="italic">{tWiki.empty}</em>
            </h2>
            <p className="font-serif italic text-[16px] leading-[1.55] text-rm-inkSoft mt-4">
              {tWiki.emptyHint}
            </p>
          </div>
        )}

        <div className="mt-12 sm:mt-16 flex justify-center">
          <Link
            href={`/${locale}/plantes`}
            className="inline-flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-[0.14em] text-rm-teal hover:text-rm-burgundy transition-colors"
          >
            <span aria-hidden>←</span>
            {tWiki.detail?.backToList ?? 'Toutes les plantes'}
          </Link>
        </div>
      </div>
    </main>
  )
}
