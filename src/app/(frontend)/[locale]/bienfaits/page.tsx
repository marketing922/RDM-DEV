import type { Metadata } from 'next'
import Link from 'next/link'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getBenefits } from '@/lib/queries'
import BienfaitsToolbar from '@/components/bienfaits/BienfaitsToolbar'
import Reveal from '@/components/ui/Reveal'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 60

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const REGION_LABELS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'Toutes les régions' },
  { key: 'tete', label: 'Tête' },
  { key: 'gorge', label: 'Gorge' },
  { key: 'respiration', label: 'Respiration' },
  { key: 'digestion', label: 'Digestion' },
  { key: 'feminin', label: 'Féminin' },
  { key: 'circulation', label: 'Circulation' },
]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    metadataBase: siteMetadataBase(),
    title: `${dict.benefits.title} | ${dict.meta.siteName}`,
    description: dict.benefits.subtitle,
  }
}

/* ─── Fallback placeholders when DB is empty ──────────────────────── */

type BenefitLike = {
  id?: string | number
  name: string
  slug: string
  icon?: string
  shortDescription?: string
  relatedPlants?: Array<{ id?: string | number } | string | number>
}

const benefitPlaceholders: BenefitLike[] = [
  { name: 'Digestion', slug: 'digestion', icon: '\uD83E\uDEC1', shortDescription: 'Soulager les troubles digestifs naturellement' },
  { name: 'Sommeil', slug: 'sommeil', icon: '\uD83D\uDE34', shortDescription: 'Retrouver un sommeil réparateur' },
  { name: 'Immunité', slug: 'immunite', icon: '\uD83D\uDEE1\uFE0F', shortDescription: 'Renforcer vos défenses naturelles' },
  { name: 'Stress', slug: 'stress', icon: '\uD83E\uDDD8', shortDescription: 'Gérer le stress avec les plantes' },
  { name: 'Énergie', slug: 'energie', icon: '\uD83D\uDCAA', shortDescription: 'Booster votre énergie naturellement' },
  { name: 'Peau', slug: 'peau', icon: '\uD83C\uDF38', shortDescription: 'Prendre soin de votre peau' },
  { name: 'Circulation', slug: 'circulation', icon: '\uD83D\uDDA4', shortDescription: 'Améliorer la circulation sanguine' },
  { name: 'Articulations', slug: 'articulations', icon: '\uD83D\uDD27', shortDescription: 'Soulager les douleurs articulaires' },
]

/* ─── Alphabetical buckets (almanach-style) ───────────────────────── */

const BUCKETS: Array<{ label: string; test: (letter: string) => boolean }> = [
  { label: 'A – F', test: (l) => l >= 'A' && l <= 'F' },
  { label: 'G – L', test: (l) => l >= 'G' && l <= 'L' },
  { label: 'M – R', test: (l) => l >= 'M' && l <= 'R' },
  { label: 'S – Z', test: (l) => l >= 'S' && l <= 'Z' },
]

function firstLetter(name: string) {
  if (!name) return 'Z'
  const l = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .charAt(0)
    .toUpperCase()
  return l.match(/[A-Z]/) ? l : 'Z'
}

function groupByBucket(list: BenefitLike[]) {
  return BUCKETS.map((b) => ({
    label: b.label,
    items: list
      .filter((x) => b.test(firstLetter(x.name)))
      .sort((a, b2) => a.name.localeCompare(b2.name, 'fr')),
  })).filter((g) => g.items.length > 0)
}

function plantCount(b: BenefitLike): number {
  if (!b.relatedPlants) return 0
  if (Array.isArray(b.relatedPlants)) return b.relatedPlants.length
  return 0
}

export default async function BienfaitsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = (await searchParams) || {}
  const dict = await getDictionary(locale as Locale)

  const q = String(sp.q ?? '').trim()
  const rawRegion = String(sp.region ?? '')
  const activeRegion = REGION_LABELS.some((r) => r.key === rawRegion && r.key !== 'all')
    ? rawRegion
    : ''

  const { docs: dbBenefits } = await getBenefits({
    locale,
    limit: 100,
    search: q,
    bodyRegion: activeRegion,
  })

  // Fallback placeholders only when no filter is active AND the DB is truly empty.
  const usingPlaceholders =
    dbBenefits.length === 0 && !q && !activeRegion
  const benefits: BenefitLike[] = usingPlaceholders
    ? benefitPlaceholders
    : (dbBenefits as any[])
  const isFiltered = Boolean(q) || Boolean(activeRegion)
  const groups = groupByBucket(benefits)
  const totalCount = benefits.length

  return (
    <main className="min-h-screen bg-rm-cream">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.benefits.title },
          ]}
        />

        {/* ─── Header almanach ─── */}
        <Reveal>
        <header className="mt-10 md:mt-14 mb-12 md:mb-16 text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <span className="block w-7 h-px bg-rm-burgundy" />
            <span className="font-sans text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
              Encyclopédie
            </span>
            <span className="block w-7 h-px bg-rm-burgundy" />
          </div>
          <h1 className="font-display font-normal text-rm-teal leading-[1.05] tracking-[-0.02em] text-[40px] sm:text-[52px] md:text-[60px]">
            Les <em className="italic text-rm-burgundy">Bienfaits</em>
          </h1>
          <p className="font-serif italic text-[17px] md:text-[19px] leading-[1.55] text-rm-inkSoft mt-5">
            Traditions d&apos;usage par affection
            {isFiltered && totalCount > 0
              ? ` — ${totalCount} ${totalCount > 1 ? 'résultats' : 'résultat'}`
              : totalCount > 0
                ? ` — ${totalCount} ${totalCount > 1 ? 'entrées répertoriées' : 'entrée répertoriée'}`
                : ''}
            .
          </p>

          <BienfaitsToolbar
            initialSearch={q}
            initialRegion={activeRegion}
            regions={REGION_LABELS}
          />
        </header>
        </Reveal>

        {/* ─── Dotted separator ─── */}
        <div className="border-t border-dashed border-rm-rule mb-12 md:mb-14" />

        {/* ─── Groups (alphabetical buckets) ─── */}
        {groups.length > 0 ? (
          <div className="space-y-14 md:space-y-20">
            {groups.map((group) => (
              <section key={group.label}>
                {/* Bucket header */}
                <Reveal className="flex items-baseline gap-5 mb-6 md:mb-8">
                  <span className="font-display italic text-[32px] md:text-[40px] text-rm-burgundy leading-none">
                    {group.label}
                  </span>
                  <span className="flex-1 border-t border-dashed border-rm-rule" />
                  <span className="font-mono text-[11px] tracking-wide uppercase text-rm-inkSoft/70">
                    {group.items.length}{' '}
                    {group.items.length > 1 ? 'entrées' : 'entrée'}
                  </span>
                </Reveal>

                {/* Bucket grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                  {group.items.map((b, idx) => {
                    const num = String(idx + 1).padStart(3, '0')
                    const count = plantCount(b)
                    return (
                      <Reveal key={String(b.id ?? b.slug)} delay={(idx % 4) * 80}>
                      <Link
                        href={`/${locale}/bienfaits/${b.slug}`}
                        className="group flex flex-col bg-rm-paper border border-rm-rule p-5 md:p-6 hover:border-rm-ruleStrong transition-colors h-full"
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          {b.icon && /\p{Emoji}/u.test(b.icon) ? (
                            <span
                              className="text-[32px] leading-none"
                              role="img"
                              aria-label={b.name}
                            >
                              {b.icon}
                            </span>
                          ) : (
                            <span className="w-10 h-10 flex items-center justify-center border border-rm-rule bg-rm-cream">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-rm-burgundy"
                              >
                                <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s2.5 3.5.5 9.2A7 7 0 0 1 11 20Z" />
                                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                              </svg>
                            </span>
                          )}
                          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rm-inkSoft/60">
                            N° {num}
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
                              ? `${count} ${count > 1 ? 'plantes associées' : 'plante associée'}`
                              : 'À découvrir'}
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
              {isFiltered ? (
                <>
                  <em className="italic">Aucun résultat</em> pour ces critères
                </>
              ) : (
                <>
                  <em className="italic">Aucun bienfait</em> encore répertorié
                </>
              )}
            </h2>
            <p className="font-serif italic text-[16px] leading-[1.55] text-rm-inkSoft mt-4">
              {isFiltered
                ? 'Essayez d’autres mots-clés ou une autre région.'
                : 'La table des bienfaits s’enrichira prochainement.'}
            </p>
            {isFiltered && (
              <Link
                href={`/${locale}/bienfaits`}
                className="inline-block mt-6 font-sans text-sm font-semibold text-rm-burgundy underline underline-offset-4 decoration-1 hover:text-rm-teal transition-colors"
              >
                Effacer les filtres →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
