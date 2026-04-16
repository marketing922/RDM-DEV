import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getWikiEntries } from '@/lib/queries'
import { WikiCard } from '@/components/shared/WikiCard'

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
  const { docs: entries } = await getWikiEntries({ limit: 12, locale })

  const filterKeys = Object.keys(dict.wiki.filters) as Array<
    keyof typeof dict.wiki.filters
  >

  return (
    <main className="min-h-screen bg-[#FEF9E9]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.wiki.title },
          ]}
        />

        {/* Header with leaf icon */}
        <div className="mt-10 mb-10 text-center">
          {/* Leaf / plant icon */}
          <div className="flex justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#054A57"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s2.5 3.5.5 9.2A7 7 0 0 1 11 20Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#054A57]">
            {dict.wiki.title}
          </h1>
          <p className="mt-3 text-lg max-w-2xl mx-auto text-[#712E2F]/70">
            {dict.wiki.subtitle}
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DCD8C7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-4 top-1/2 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder={dict.wiki.searchPlaceholder}
              className="w-full h-12 pl-12 pr-5 rounded-full text-base bg-white border border-[#DCD8C7] text-[#054A57] placeholder:text-[#DCD8C7] focus:outline-none focus:ring-2 focus:ring-[#A2211E]/30 focus:border-[#A2211E] transition-all duration-200"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-10 flex flex-wrap justify-center gap-2 overflow-x-auto">
          {filterKeys.map((key) => (
            <button
              key={String(key)}
              type="button"
              className={`inline-flex items-center h-9 px-5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                key === 'all'
                  ? 'bg-[#A2211E] text-white shadow-sm'
                  : 'bg-white text-[#712E2F] border border-[#DCD8C7] hover:bg-[#FFF5D5] hover:text-[#A2211E] hover:border-[#A2211E]'
              }`}
            >
              {dict.wiki.filters[key]}
            </button>
          ))}
        </div>

        {/* Desktop grid / Mobile list */}
        {entries.length > 0 ? (
          <>
            {/* Desktop: 4-col grid, Tablet: 2-col grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {entries.map((entry) => (
                <WikiCard key={entry.id} entry={entry as any} locale={locale} />
              ))}
            </div>

            {/* Mobile: list layout */}
            <div className="sm:hidden divide-y divide-[#DCD8C7]">
              {entries.map((entry) => {
                const e = entry as any
                const image = e.heroImage || e.images?.[0]
                return (
                  <a
                    key={entry.id}
                    href={`/${locale}/plantes/${e.slug}`}
                    className="flex items-center gap-4 py-4"
                  >
                    {/* Circular thumbnail */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden bg-white border border-[#DCD8C7]">
                      {image?.url ? (
                        <img
                          src={image.url}
                          alt={image.alt || e.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DCD8C7" strokeWidth="1.5">
                            <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s2.5 3.5.5 9.2A7 7 0 0 1 11 20Z" />
                            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base truncate text-[#054A57]">
                        {e.name}
                      </p>
                      {e.latinName && (
                        <p className="text-sm italic truncate text-[#D0802C]">
                          {e.latinName}
                        </p>
                      )}
                      {e.shortDescription && (
                        <p className="text-sm truncate text-[#712E2F]/60">
                          {e.shortDescription}
                        </p>
                      )}
                    </div>
                    {/* Arrow */}
                    <div className="flex-shrink-0 text-[#A2211E]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </a>
                )
              })}
            </div>
          </>
        ) : (
          /* Skeleton placeholders */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl h-80 animate-pulse bg-white border border-[#DCD8C7]"
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <nav className="mt-12 flex items-center justify-center gap-2">
          {/* Previous arrow */}
          <button
            type="button"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm bg-white border border-[#DCD8C7] text-[#712E2F]"
            aria-label="Page précédente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          {/* Page numbers */}
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium ${
                n === 1
                  ? 'bg-[#A2211E] text-white'
                  : 'bg-white border border-[#DCD8C7] text-[#712E2F]'
              }`}
            >
              {n}
            </button>
          ))}
          {/* Next arrow */}
          <button
            type="button"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm bg-white border border-[#DCD8C7] text-[#712E2F]"
            aria-label="Page suivante"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </nav>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-10 px-4 text-center bg-[#1F2937]">
        <p className="text-sm text-[#9CA3AF]">
          &copy; {new Date().getFullYear()} Remèdes de Mamie. Tous droits réservés.
        </p>
      </footer>
    </main>
  )
}
