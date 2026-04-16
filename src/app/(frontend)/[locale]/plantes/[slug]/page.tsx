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
    description:
      (entry as any).shortDescription ||
      `${dict.wiki.detail.benefits} - ${entry.name}`,
  }
}

export default async function PlantDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const entry = await getWikiEntryBySlug(slug, locale)
  if (!entry) notFound()

  const plantName =
    entry.name ||
    slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  const e = entry as any

  const heroImage = e.heroImage || e.images?.[0]
  const tags: Array<{ id?: string; name?: string; label?: string }> =
    Array.isArray(e.tags) ? e.tags : []

  /* Info table rows */
  const infoRows = [
    { label: dict.wiki.detail.family || 'Famille', value: e.family },
    { label: dict.wiki.detail.partsUsed || 'Parties utilisées', value: e.partsUsed },
    { label: dict.wiki.detail.origin || 'Origine', value: e.origin },
    { label: 'Récolte', value: e.harvest },
    { label: 'Forme', value: e.form },
    { label: 'Conservation', value: e.conservation },
  ].filter((row) => row.value)

  /* Benefits list — try array first, fall back to rich text */
  const benefitsList: string[] = Array.isArray(e.benefitsList) ? e.benefitsList : []

  return (
    <main className="min-h-screen bg-[#FEF9E9]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile: back arrow */}
        <div className="sm:hidden mb-4">
          <a
            href={`/${locale}/plantes`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#054A57]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Retour
          </a>
        </div>

        {/* Desktop breadcrumb */}
        <div className="hidden sm:block">
          <Breadcrumb
            items={[
              { label: dict.nav.home, href: `/${locale}` },
              { label: dict.wiki.title, href: `/${locale}/plantes` },
              { label: plantName },
            ]}
          />
        </div>

        {/* Hero image — circular, centered */}
        <div className="mt-8 flex justify-center">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
            {heroImage?.url ? (
              <img
                src={heroImage.url}
                alt={heroImage.alt || plantName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-[#FFF5D5]">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DCD8C7" strokeWidth="1.5">
                  <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s2.5 3.5.5 9.2A7 7 0 0 1 11 20Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Name + Latin name */}
        <div className="mt-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#054A57]">
            {plantName}
          </h1>
          {e.latinName && (
            <p className="mt-2 text-lg italic text-[#D0802C]">
              {e.latinName}
            </p>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {tags.map((tag, idx) => (
              <span
                key={tag.id || idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#054A57] text-white"
              >
                {tag.name || tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Two-column layout: Benefits + Info table (desktop) */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT — Bienfaits principaux */}
          <div className="rounded-2xl p-6 bg-white border border-[#DCD8C7]">
            <h2 className="text-xl font-bold mb-4 text-[#054A57]">
              {dict.wiki.detail.benefits || 'Bienfaits principaux'}
            </h2>

            {benefitsList.length > 0 ? (
              <ul className="space-y-3">
                {benefitsList.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-0.5 text-lg font-bold text-[#054A57]">
                      &#10003;
                    </span>
                    <span className="text-base text-[#712E2F]">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            ) : e.benefits ? (
              <div
                className="prose max-w-none text-base text-[#712E2F]"
                dangerouslySetInnerHTML={{ __html: e.benefits }}
              />
            ) : (
              <p className="text-sm text-[#712E2F]/50">
                Aucune information disponible.
              </p>
            )}
          </div>

          {/* RIGHT — Informations clés */}
          <div className="rounded-2xl p-6 bg-white border border-[#DCD8C7]">
            <h2 className="text-xl font-bold mb-4 text-[#054A57]">
              Informations cl&eacute;s
            </h2>

            {infoRows.length > 0 ? (
              <table className="w-full text-sm">
                <tbody>
                  {infoRows.map((row, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? 'bg-[#FEF9E9]' : 'bg-white'}
                    >
                      <td className="py-3 px-4 font-medium text-[#054A57]">
                        {row.label}
                      </td>
                      <td className="py-3 px-4 text-[#712E2F]">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-[#712E2F]/50">
                Aucune information disponible.
              </p>
            )}
          </div>
        </div>

        {/* Description détaillée */}
        {e.description && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4 text-[#054A57]">
              Description d&eacute;taill&eacute;e
            </h2>
            <div
              className="rounded-2xl p-6 prose max-w-none text-base bg-white border border-[#DCD8C7] text-[#712E2F]"
              dangerouslySetInnerHTML={{ __html: e.description }}
            />
          </div>
        )}

        {/* Contre-indications warning box */}
        {(e.contraindications || e.precautions) && (
          <div className="mt-10 rounded-2xl p-6 bg-[#FFF5D5] border-2 border-[#D0802C]">
            <div className="flex items-start gap-3">
              {/* Warning icon */}
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#D0802C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2 text-[#A2211E]">
                  {dict.wiki.detail.contraindications || 'Contre-indications'}
                </h3>
                {e.contraindications && (
                  <div
                    className="prose max-w-none text-sm text-[#712E2F]"
                    dangerouslySetInnerHTML={{ __html: e.contraindications }}
                  />
                )}
                {e.precautions && (
                  <div className="mt-3">
                    <h4 className="text-sm font-bold mb-1 text-[#A2211E]">
                      {dict.wiki.detail.precautions || 'Précautions'}
                    </h4>
                    <div
                      className="prose max-w-none text-sm text-[#712E2F]"
                      dangerouslySetInnerHTML={{ __html: e.precautions }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NO Produits section — Phase 1 */}
      </div>
    </main>
  )
}
