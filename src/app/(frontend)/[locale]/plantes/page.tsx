import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: `${dict.wiki.title} | ${dict.meta.siteName}`,
    description: dict.wiki.subtitle,
  }
}

export default async function PlantesPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const filterKeys = Object.keys(dict.wiki.filters) as Array<
    keyof typeof dict.wiki.filters
  >

  return (
    <main className="bg-page min-h-screen">
      <div className="mx-auto max-w-7xl px-md py-md">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.wiki.title },
          ]}
        />

        {/* Header */}
        <div className="mt-lg mb-xl text-center">
          <h1 className="font-heading text-heading-1 text-neutral-600">
            {dict.wiki.title}
          </h1>
          <p className="mt-sm text-body-lg text-neutral-400 max-w-2xl mx-auto">
            {dict.wiki.subtitle}
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-lg flex justify-center">
          <div className="relative w-full max-w-xl">
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
              className="absolute left-md top-1/2 -translate-y-1/2 text-neutral-300"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder={dict.wiki.searchPlaceholder}
              className="w-full h-[48px] pl-[48px] pr-lg bg-white rounded-pill border border-neutral-100 text-body text-neutral-600 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all duration-fast"
            />
          </div>
        </div>

        {/* Filter pills */}
        <div className="mb-xl flex flex-wrap justify-center gap-sm">
          {filterKeys.map((key) => (
            <button
              key={String(key)}
              className={`inline-flex items-center h-[36px] px-lg rounded-pill text-body-sm font-ui font-medium transition-all duration-fast ${
                key === 'all'
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-white text-neutral-400 border border-neutral-100 hover:bg-brand-light hover:text-brand hover:border-brand'
              }`}
            >
              {dict.wiki.filters[key]}
            </button>
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl h-[320px] animate-pulse"
            />
          ))}
        </div>

        {/* Pagination placeholder */}
        <div className="mt-2xl flex items-center justify-center gap-sm">
          <div className="w-[36px] h-[36px] rounded-xl bg-card animate-pulse" />
          <div className="w-[36px] h-[36px] rounded-xl bg-brand text-white flex items-center justify-center text-body-sm font-medium">
            1
          </div>
          <div className="w-[36px] h-[36px] rounded-xl bg-card animate-pulse" />
          <div className="w-[36px] h-[36px] rounded-xl bg-card animate-pulse" />
          <div className="w-[36px] h-[36px] rounded-xl bg-card animate-pulse" />
        </div>
      </div>
    </main>
  )
}
