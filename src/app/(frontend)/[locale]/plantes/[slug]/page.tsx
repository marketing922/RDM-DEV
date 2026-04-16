import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getWikiEntryBySlug } from '@/lib/queries'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const entry = await getWikiEntryBySlug(slug, locale)

  if (!entry) {
    return { title: `Not Found | ${dict.meta.siteName}` }
  }

  return {
    title: `${entry.name} | ${dict.wiki.title} | ${dict.meta.siteName}`,
    description: (entry as any).shortDescription || `${dict.wiki.detail.benefits} - ${entry.name}`,
  }
}

export default async function PlantDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const entry = await getWikiEntryBySlug(slug, locale)
  if (!entry) notFound()

  const plantName = entry.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const e = entry as any

  const tabs = [
    { key: 'description', label: dict.wiki.detail.description || 'Description' },
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

        {/* Main content */}
        <div className="mt-lg">
          {/* Hero image */}
          {e.images?.[0] ? (
            <div className="relative h-64 rounded-xl overflow-hidden">
              <img
                src={e.images[0].url}
                alt={e.images[0].alt || plantName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="bg-card h-64 rounded-xl animate-pulse" />
          )}

          {/* Name */}
          <div className="mt-lg">
            <h1 className="font-heading text-heading-1 text-neutral-600">
              {plantName}
            </h1>
            <p className="mt-xs text-body-lg text-neutral-300 italic">
              {e.latinName || ''}
            </p>
          </div>

          {/* Info row */}
          <div className="mt-md flex flex-wrap gap-lg text-body-sm text-neutral-400">
            <div>
              <span className="font-medium text-neutral-500">
                {dict.wiki.detail.family}:
              </span>{' '}
              {e.family || <span className="bg-card rounded px-xs py-[2px] animate-pulse inline-block w-24 h-4" />}
            </div>
            <div>
              <span className="font-medium text-neutral-500">
                {dict.wiki.detail.origin}:
              </span>{' '}
              {e.origin || <span className="bg-card rounded px-xs py-[2px] animate-pulse inline-block w-24 h-4" />}
            </div>
            <div>
              <span className="font-medium text-neutral-500">
                {dict.wiki.detail.partsUsed}:
              </span>{' '}
              {e.partsUsed || <span className="bg-card rounded px-xs py-[2px] animate-pulse inline-block w-24 h-4" />}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-xl border-b border-neutral-100">
            <div className="flex gap-md overflow-x-auto">
              {tabs.map((tab, i) => (
                <button
                  key={tab.key}
                  type="button"
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

          {/* Tab content */}
          <div className="mt-lg mb-2xl">
            {e.description ? (
              <div className="prose prose-neutral max-w-none text-body text-neutral-500" dangerouslySetInnerHTML={{ __html: e.description }} />
            ) : (
              <div className="space-y-md">
                <div className="bg-card rounded-lg h-4 w-full animate-pulse" />
                <div className="bg-card rounded-lg h-4 w-5/6 animate-pulse" />
                <div className="bg-card rounded-lg h-4 w-4/6 animate-pulse" />
                <div className="bg-card rounded-lg h-4 w-full animate-pulse" />
                <div className="bg-card rounded-lg h-4 w-3/4 animate-pulse" />
                <div className="bg-card rounded-lg h-4 w-5/6 animate-pulse" />
                <div className="bg-card rounded-lg h-4 w-2/3 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
