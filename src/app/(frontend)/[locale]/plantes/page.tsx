import type { Metadata } from 'next'
import Link from 'next/link'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getWikiEntries } from '@/lib/queries'
import { WikiCard } from '@/components/shared/WikiCard'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import PlantesToolbar from '@/components/plantes/PlantesToolbar'
import Reveal from '@/components/ui/Reveal'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 60

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// Filter keys mapped to keywords used for server-side `like` matching.
// Heuristic — refined later once plants are categorized by bodyRegion/tags.
const FILTER_KEYWORDS: Record<string, string> = {
  digestive: 'digest',
  apaisante: 'apais',
  tonique: 'tonique',
  immunite: 'immun',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    metadataBase: siteMetadataBase(),
    title: `${dict.wiki.title} | ${dict.meta.siteName}`,
    description: dict.wiki.subtitle,
  }
}

export default async function PlantesPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = (await searchParams) || {}
  const dict = await getDictionary(locale as Locale)

  const q = String(sp.q ?? '').trim()
  const rawFilter = String(sp.filter ?? 'all')
  const page = Math.max(1, Number(sp.page) || 1)
  const limit = 12

  const filterKeys = Object.keys(dict.wiki.filters) as Array<
    keyof typeof dict.wiki.filters
  >
  const activeFilter = filterKeys.includes(rawFilter as any) ? rawFilter : 'all'

  // Build an extra where clause from the active filter (keyword on shortDescription).
  const kw = FILTER_KEYWORDS[activeFilter]
  const extraWhere = kw ? { shortDescription: { like: kw } } : undefined

  const { docs: entries, totalPages, page: currentPage, totalDocs } =
    await getWikiEntries({
      limit,
      page,
      locale,
      search: q,
      where: extraWhere,
    })

  const filters = filterKeys.map((k) => ({
    key: String(k),
    label: dict.wiki.filters[k],
  }))

  // Build pagination links preserving existing query params
  const buildPageHref = (p: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (activeFilter !== 'all') params.set('filter', activeFilter)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/${locale}/plantes?${qs}` : `/${locale}/plantes`
  }

  const pageNumbers: number[] = []
  if (totalPages && totalPages > 0) {
    const maxShown = 5
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - maxShown + 1))
    const end = Math.min(totalPages, start + maxShown - 1)
    for (let i = start; i <= end; i++) pageNumbers.push(i)
  }

  const isFiltered = Boolean(q) || activeFilter !== 'all'

  return (
    <main className="min-h-screen bg-[#FEF9E9]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.wiki.title },
          ]}
        />

        {/* Header almanach */}
        <Reveal>
          <header className="mt-8 sm:mt-10 md:mt-14 mb-8 sm:mb-10 md:mb-14 text-center max-w-3xl mx-auto">
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
            </p>
          </header>
        </Reveal>

        {/* Interactive toolbar (URL-driven) */}
        <PlantesToolbar
          initialSearch={q}
          initialFilter={activeFilter}
          filters={filters}
          searchPlaceholder={dict.wiki.searchPlaceholder}
        />

        {/* Results counter */}
        {totalDocs !== undefined && (
          <div className="mb-4 text-center font-mono text-xs tracking-wide uppercase text-[#712E2F]/60">
            {totalDocs === 0
              ? 'Aucun résultat'
              : `${totalDocs} ${totalDocs > 1 ? 'plantes trouvées' : 'plante trouvée'}`}
          </div>
        )}

        {/* Desktop grid / Mobile list */}
        {entries.length > 0 ? (
          <>
            {/* Desktop: 4-col grid, Tablet: 2-col grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
              {entries.map((entry, idx) => (
                <Reveal key={entry.id} delay={(idx % 4) * 80}>
                  <WikiCard entry={entry as any} locale={locale} />
                </Reveal>
              ))}
            </div>

            {/* Mobile: list layout */}
            <div className="sm:hidden divide-y divide-[#DCD8C7]">
              {entries.map((entry, idx) => {
                const e = entry as any
                const image = e.heroImage || e.images?.[0]
                const imageSrc = resolveMediaUrl(image, 'thumbnail')
                return (
                  <Reveal key={entry.id} delay={Math.min(idx, 5) * 60} y={16}>
                  <Link
                    href={`/${locale}/plantes/${e.slug}`}
                    className="flex items-center gap-4 py-4"
                  >
                    <div className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden bg-white border border-[#DCD8C7]">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={image?.alt || e.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#DCD8C7"
                            strokeWidth="1.5"
                          >
                            <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s2.5 3.5.5 9.2A7 7 0 0 1 11 20Z" />
                            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                          </svg>
                        </div>
                      )}
                    </div>
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
                    <div className="flex-shrink-0 text-[#A2211E]">
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
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </Link>
                  </Reveal>
                )
              })}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="py-16 text-center">
            <p className="font-serif italic text-[17px] text-[#712E2F]/70 mb-4">
              {isFiltered
                ? 'Aucune plante ne correspond à ces critères.'
                : 'Encyclopédie en cours d’enrichissement.'}
            </p>
            {isFiltered && (
              <Link
                href={`/${locale}/plantes`}
                className="inline-block font-sans text-sm font-semibold text-[#A2211E] underline underline-offset-4 hover:text-[#054A57] transition-colors"
              >
                Effacer les filtres →
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages && totalPages > 1 && (
          <nav className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-2">
            {/* Previous */}
            {currentPage > 1 ? (
              <Link
                href={buildPageHref(currentPage - 1)}
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-sm bg-white border border-[#DCD8C7] text-[#712E2F] hover:border-[#A2211E] hover:text-[#A2211E] transition-colors"
                aria-label="Page précédente"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </Link>
            ) : (
              <span
                aria-hidden="true"
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-sm bg-white border border-[#DCD8C7] text-[#712E2F]/30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </span>
            )}
            {/* Page numbers */}
            {pageNumbers.map((n) => {
              const isActive = n === currentPage
              return isActive ? (
                <span
                  key={n}
                  aria-current="page"
                  className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-sm font-medium bg-[#A2211E] text-white"
                >
                  {n}
                </span>
              ) : (
                <Link
                  key={n}
                  href={buildPageHref(n)}
                  className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-sm font-medium bg-white border border-[#DCD8C7] text-[#712E2F] hover:border-[#A2211E] hover:text-[#A2211E] transition-colors"
                >
                  {n}
                </Link>
              )
            })}
            {/* Next */}
            {currentPage < totalPages ? (
              <Link
                href={buildPageHref(currentPage + 1)}
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-sm bg-white border border-[#DCD8C7] text-[#712E2F] hover:border-[#A2211E] hover:text-[#A2211E] transition-colors"
                aria-label="Page suivante"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ) : (
              <span
                aria-hidden="true"
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-sm bg-white border border-[#DCD8C7] text-[#712E2F]/30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            )}
          </nav>
        )}
      </div>
    </main>
  )
}
