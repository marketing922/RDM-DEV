import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)

  const plantName = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return {
    title: `${plantName} | ${dict.wiki.title} | ${dict.meta.siteName}`,
    description: `${dict.wiki.detail.benefits} - ${plantName}`,
  }
}

export default async function PlantDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)

  const plantName = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  const tabs = [
    { key: 'description', label: dict.products.detail.description },
    { key: 'activeCompounds', label: dict.wiki.detail.activeCompounds },
    { key: 'benefits', label: dict.wiki.detail.benefits },
    { key: 'precautions', label: dict.wiki.detail.precautions },
    { key: 'contraindications', label: dict.wiki.detail.contraindications },
  ]

  return (
    <main className="bg-page min-h-screen">
      <div className="mx-auto max-w-7xl px-md py-md">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.wiki.title, href: `/${locale}/plantes` },
            { label: plantName },
          ]}
        />

        {/* 2-column layout */}
        <div className="mt-lg flex flex-col lg:flex-row gap-xl">
          {/* Main content (left 2/3) */}
          <div className="w-full lg:w-2/3">
            {/* Hero image placeholder */}
            <div className="bg-card h-64 rounded-xl animate-pulse" />

            {/* Name */}
            <div className="mt-lg">
              <h1 className="font-heading text-heading-1 text-neutral-600">
                {plantName}
              </h1>
              <p className="mt-xs text-body-lg text-neutral-300 italic">
                Plantus latinus placeholder
              </p>
            </div>

            {/* Info row */}
            <div className="mt-md flex flex-wrap gap-lg text-body-sm text-neutral-400">
              <div>
                <span className="font-medium text-neutral-500">
                  {dict.wiki.detail.family}:
                </span>{' '}
                <span className="bg-card rounded px-xs py-[2px] animate-pulse inline-block w-24 h-4" />
              </div>
              <div>
                <span className="font-medium text-neutral-500">
                  {dict.wiki.detail.origin}:
                </span>{' '}
                <span className="bg-card rounded px-xs py-[2px] animate-pulse inline-block w-24 h-4" />
              </div>
              <div>
                <span className="font-medium text-neutral-500">
                  {dict.wiki.detail.partsUsed}:
                </span>{' '}
                <span className="bg-card rounded px-xs py-[2px] animate-pulse inline-block w-24 h-4" />
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-xl border-b border-neutral-100">
              <div className="flex gap-md overflow-x-auto">
                {tabs.map((tab, i) => (
                  <button
                    key={tab.key}
                    className={`pb-sm px-xs text-body-sm font-ui font-medium whitespace-nowrap transition-colors duration-fast border-b-2 ${
                      i === 0
                        ? 'border-brand text-brand'
                        : 'border-transparent text-neutral-300 hover:text-neutral-500'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content placeholder */}
            <div className="mt-lg space-y-md">
              <div className="bg-card rounded-lg h-4 w-full animate-pulse" />
              <div className="bg-card rounded-lg h-4 w-5/6 animate-pulse" />
              <div className="bg-card rounded-lg h-4 w-4/6 animate-pulse" />
              <div className="bg-card rounded-lg h-4 w-full animate-pulse" />
              <div className="bg-card rounded-lg h-4 w-3/4 animate-pulse" />
              <div className="bg-card rounded-lg h-4 w-5/6 animate-pulse" />
              <div className="bg-card rounded-lg h-4 w-2/3 animate-pulse" />
            </div>
          </div>

          {/* Sidebar (right 1/3) */}
          <aside className="w-full lg:w-1/3">
            <div className="lg:sticky lg:top-[100px]">
              <div className="bg-white rounded-xl shadow p-lg">
                <h2 className="font-heading text-heading-4 text-neutral-600 mb-md">
                  {dict.wiki.detail.relatedProducts}
                </h2>

                <div className="space-y-md">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-sm">
                      <div className="w-16 h-16 bg-card rounded-lg animate-pulse shrink-0" />
                      <div className="flex-1 space-y-xs">
                        <div className="bg-card rounded h-4 w-3/4 animate-pulse" />
                        <div className="bg-card rounded h-4 w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
