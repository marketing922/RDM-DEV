import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import BenefitIcon from '@/components/bienfaits/BenefitIcon'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { richTextToPlain } from '@/lib/utils'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { BreadcrumbJsonLd, GeoStructuredData } from '@/components/seo'
import {
  DirectAnswerBox,
  KeyTakeawaysBox,
  FaqAccordion,
  SourcesList,
} from '@/components/shared/GeoSections'
import {
  getBenefitBySlug,
  getBenefits,
  getProducts,
  getBlogPosts,
  getWikiEntries,
  QUERY_LIMITS,
} from '@/lib/queries'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { siteMetadataBase } from '@/lib/metadata'
import { DEFAULT_PLANT_IMAGE } from '@/lib/brand-assets'

export const revalidate = 3600
export const dynamicParams = true

const DEFAULT_PRODUCT_IMAGE = DEFAULT_PLANT_IMAGE

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  // Aucune page pré-générée au build — ISR à la demande via dynamicParams=true.
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const benefit = await getBenefitBySlug(slug, locale)

  if (!benefit) {
    return { title: `Not Found | ${dict.meta.siteName}` }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'
  const b = benefit as any

  return {
    metadataBase: siteMetadataBase(),
    title: `${b.name} | ${dict.benefits.title} | ${dict.meta.siteName}`,
    description:
      b.directAnswer || b.shortDescription || `${dict.benefits.subtitle}`,
    alternates: {
      canonical: `${siteUrl}/${locale}/bienfaits/${slug}`,
      languages: {
        fr: `${siteUrl}/fr/bienfaits/${slug}`,
        en: `${siteUrl}/en/bienfaits/${slug}`,
      },
    },
  }
}

/* ─── Page ─────────────────────────────────────────────────────────── */

export default async function BienfaitDetailPage({ params }: Props) {
  const { locale, slug } = await params

  const [dict, benefit] = await Promise.all([
    getDictionary(locale as Locale),
    getBenefitBySlug(slug, locale),
  ])

  if (!benefit) notFound()

  const b = benefit as any
  const benefitName =
    b.name ||
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  const benefitNumber: string = b.referenceNumber || ''
  const tDetail = (dict.benefits as any).detail ?? {}

  // Related plants — d'abord la relation explicite `b.relatedPlants`, puis
  // fallback inverse sur les plantes dont le champ `benefits` cite ce
  // bienfait. Sans ce fallback, un bienfait qui n'a pas été lié manuellement
  // côté admin affiche toujours « 00 plantes », alors que les plantes elles
  // pointent bien vers lui.
  type PlantLite = {
    id?: string | number
    name: string
    slug?: string
    latinName?: string
    shortDescription?: string
  }
  let relatedPlants: PlantLite[] = Array.isArray(b.relatedPlants)
    ? b.relatedPlants
        .filter((p: any) => p && typeof p === 'object' && p.name && p.slug)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          latinName: p.latinName,
          shortDescription: p.shortDescription,
        }))
    : []

  if (relatedPlants.length === 0 && b.id) {
    // Reverse query côté DB : `wikiEntries.benefits` contient l'id du bienfait.
    // `in: [b.id]` matche les rows où ce bienfait apparaît dans le hasMany,
    // bien plus efficient que findAll + filter JS (et scalable >100 plantes).
    try {
      const { docs } = await getWikiEntries({
        limit: QUERY_LIMITS.SIDEBAR,
        locale,
        where: { benefits: { in: [b.id] } },
      })
      relatedPlants = (docs as any[]).map((plant: any) => ({
        id: plant.id,
        name: plant.name,
        slug: plant.slug,
        latinName: plant.latinName,
        shortDescription: plant.shortDescription,
      }))
    } catch {
      relatedPlants = []
    }
  }

  // Related products — first try the explicit relatedProducts on the benefit,
  // then fall back to products that reference this benefit via their `benefits` field.
  let relatedProducts: any[] = Array.isArray(b.relatedProducts)
    ? b.relatedProducts.filter(
        (p: any) => p && typeof p === 'object' && p.slug && p.name,
      )
    : []

  if (relatedProducts.length === 0 && b.id) {
    // Reverse query : `getProducts` accepte déjà `benefitIds` qui se traduit
    // en `where.benefits = { in: [...] }` côté DB.
    try {
      const { docs } = await getProducts({
        limit: QUERY_LIMITS.SIDEBAR,
        locale,
        benefitIds: [b.id],
      })
      relatedProducts = docs as any[]
    } catch {
      relatedProducts = []
    }
  }
  relatedProducts = relatedProducts.slice(0, QUERY_LIMITS.SIDEBAR)

  // Related articles — d'abord la relation explicite, puis fallback inverse
  // sur les articles dont `relatedBenefits` cite ce bienfait. Le tag-matching
  // est conservé en dernier recours pour les articles legacy sans
  // `relatedBenefits` (rares).
  let relatedArticles: any[] = Array.isArray(b.relatedArticles)
    ? b.relatedArticles
        .filter((p: any) => p && typeof p === 'object' && p.slug && p.title)
    : []

  if (relatedArticles.length === 0 && b.id) {
    // Reverse query : `getBlogPosts` filtre désormais par `benefitIds` côté DB.
    try {
      const { docs } = await getBlogPosts({
        limit: QUERY_LIMITS.SIDEBAR,
        locale,
        benefitIds: [b.id],
      })
      relatedArticles = docs as any[]
    } catch {
      relatedArticles = []
    }
  }
  relatedArticles = relatedArticles.slice(0, QUERY_LIMITS.SIDEBAR)

  // Long description text (Lexical richText → plain, preserving paragraphs)
  const descriptionText = b.description ? richTextToPlain(b.description) : ''
  const descriptionParagraphs = descriptionText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  const precautionsParagraphs = b.precautions
    ? richTextToPlain(b.precautions).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : []

  const redFlagItems: string[] = (typeof b.redFlags === 'string' ? b.redFlags : '')
    .split(/\n+/)
    .map((s: string) => s.trim())
    .filter(Boolean)

  const regulatoryClaim: string = b.regulatoryClaim || ''

  return (
    <main className="min-h-screen bg-rm-cream">
      <BreadcrumbJsonLd
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: dict.benefits.title, href: `/${locale}/bienfaits` },
          { label: benefitName, href: `/${locale}/bienfaits/${slug}` },
        ]}
      />
      <GeoStructuredData
        kind="benefit"
        locale={locale}
        slug={slug}
        name={benefitName}
        publishedAt={b.publishedAt}
        updatedAt={b.updatedAt}
        geo={{
          directAnswer: b.directAnswer,
          definition: b.definition,
          keyTakeaways: b.keyTakeaways,
          quotableStatements: b.quotableStatements,
          dataPoints: b.dataPoints,
          faq: b.faq,
          authoritySignals: b.authoritySignals,
          sources: b.sources,
          lastFactCheckedAt: b.lastFactCheckedAt,
        }}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.benefits.title, href: `/${locale}/bienfaits` },
            { label: benefitName },
          ]}
        />
      </div>

      {/* ═══════════════ HEADER ÉDITORIAL ═══════════════ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-rm-burgundy">
          {benefitNumber && (
            <>
              <span className="font-mono">{benefitNumber}</span>
              <span className="mx-2 text-rm-ruleStrong">·</span>
            </>
          )}
          <span>{dict.benefits.title}</span>
        </p>

        <div className="mt-4 sm:mt-5 flex items-center gap-3 sm:gap-4">
          <span
            aria-hidden
            className="inline-flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-rm-creamSoft border border-rm-stone text-rm-ochre"
          >
            <BenefitIcon name={b.icon} className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={1.5} />
          </span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-rm-teal">
            {benefitName}
          </h1>
        </div>

        {b.shortDescription && (
          <p className="mt-5 sm:mt-6 font-serif italic text-lg sm:text-xl leading-relaxed text-rm-inkSoft">
            {b.shortDescription}
          </p>
        )}

      </section>

      {/* ═══════════════ CORPS + SIDEBARS GAUCHE/DROITE ═══════════════
        Container élargi à 1440px (vs 1280px) pour profiter des écrans
        larges, et grille rééquilibrée 3/6/3 — la colonne centrale double
        de largeur effective vs l'ancien 8/12 (avec marges) et reste
        confortable à lire (~720px). */}
      <section className="border-t border-rm-rule">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* ── Sidebar gauche : À retenir (sticky) ── */}
          {Array.isArray(b.keyTakeaways) && b.keyTakeaways.length > 0 && (
            <aside className="lg:col-span-3 lg:sticky lg:top-20 lg:self-start lg:order-1 order-2">
              <KeyTakeawaysBox items={b.keyTakeaways} />
            </aside>
          )}

          {/* ── Colonne centrale : éditorial ── */}
          <article className="lg:col-span-6 lg:order-2 order-1 min-w-0">
            <DirectAnswerBox text={b.directAnswer} />

            {descriptionParagraphs.length > 0 && (
              <div className="mt-8">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-rm-burgundy">
                  {tDetail.lecture}
                </p>
                <h2 className="mt-2 font-display text-xl sm:text-2xl md:text-3xl text-rm-teal border-l-4 border-rm-ochre pl-3 sm:pl-4">
                  {tDetail.traditionalUse} {benefitName.toLowerCase()}
                </h2>
                <div className="mt-5 sm:mt-6 space-y-4 sm:space-y-5 font-serif text-[16px] sm:text-[18px] leading-[1.7] sm:leading-[1.75] text-rm-inkSoft">
                  {descriptionParagraphs.map((paragraph, i) => (
                    <p
                      key={i}
                      className={
                        i === 0
                          ? "first-letter:float-left first-letter:font-display first-letter:text-[44px] sm:first-letter:text-[56px] first-letter:leading-[0.9] first-letter:text-rm-burgundy first-letter:mr-2 first-letter:mt-1"
                          : ''
                      }
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {precautionsParagraphs.length > 0 && (
              <aside className="mt-10 rounded-r-xl border-l-4 border-rm-burgundy bg-rm-creamSoft px-5 py-4">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-rm-burgundy">
                  {tDetail.precautions}
                </p>
                <div className="mt-2 space-y-2 font-serif text-[15px] leading-relaxed text-rm-ink">
                  {precautionsParagraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </aside>
            )}

            {redFlagItems.length > 0 && (
              <aside className="mt-6 border border-rm-burgundy/40 bg-rm-burgundy/5 px-5 py-4">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-rm-burgundy">
                  {tDetail.redFlags}
                </p>
                <ul className="mt-2 list-disc list-inside font-serif text-[15px] leading-relaxed text-rm-ink space-y-1">
                  {redFlagItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </aside>
            )}

            {/* FAQ — gardée dans la colonne centrale (lecture longue, accordéon
                volumineux qui n'a pas sa place en sidebar). */}
            {Array.isArray(b.faq) && b.faq.length > 0 && (
              <div className="mt-12">
                <FaqAccordion items={b.faq} />
              </div>
            )}
          </article>

          {/* ── Sidebar droite : plantes / produits / articles ── */}
          <aside className="lg:col-span-3 lg:order-3 order-3 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 space-y-6">
            {/* Plantes associées */}
            {relatedPlants.length > 0 && (
              <div className="rounded-xl border border-rm-stone bg-rm-cream p-5">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-rm-burgundy">
                  Plantes associées
                </p>
                <ul className="mt-3 divide-y divide-rm-rule">
                  {relatedPlants.map((plant) => (
                    <li key={plant.slug ?? plant.name} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        href={`/${locale}/plantes/${plant.slug}`}
                        className="group block"
                      >
                        <h3 className="font-display text-[17px] text-rm-teal group-hover:text-rm-burgundy transition-colors">
                          {plant.name}
                        </h3>
                        {plant.latinName && (
                          <p className="mt-0.5 font-serif italic text-[13px] text-rm-burgundy">
                            {plant.latinName}
                          </p>
                        )}
                        {plant.shortDescription && (
                          <p className="mt-1 font-serif text-[13px] leading-snug text-rm-inkSoft line-clamp-2">
                            {plant.shortDescription}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Produits associés */}
            {relatedProducts.length > 0 && (
              <div className="rounded-xl border border-rm-stone bg-rm-cream p-5">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-rm-burgundy">
                  Produits associés
                </p>
                <ul className="mt-3 space-y-3">
                  {relatedProducts.map((product: any) => {
                    const img =
                      resolveMediaUrl(
                        (product.images?.[0] as any)?.image,
                        'card',
                      ) ??
                      (product.externalImageUrl as string | undefined) ??
                      DEFAULT_PRODUCT_IMAGE
                    return (
                      <li key={product.slug}>
                        <Link
                          href={`/${locale}/produits/${product.slug}`}
                          className="group flex gap-3 items-start"
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-rm-creamSoft border border-rm-rule">
                            <Image
                              src={img}
                              alt={product.name}
                              fill
                              sizes="64px"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-[15px] leading-tight text-rm-teal group-hover:text-rm-burgundy transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Articles associés */}
            {relatedArticles.length > 0 && (
              <div className="rounded-xl border border-rm-stone bg-rm-cream p-5">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-rm-burgundy">
                  Articles associés
                </p>
                <ul className="mt-3 divide-y divide-rm-rule">
                  {relatedArticles.map((post: any) => (
                    <li key={post.slug} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        href={`/${locale}/blog/${post.slug}`}
                        className="group block"
                      >
                        <h3 className="font-display text-[15px] leading-tight text-rm-teal group-hover:text-rm-burgundy transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="mt-1 font-serif text-[13px] leading-snug text-rm-inkSoft line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* ═══════════════ DISCLAIMER + RETOUR ═══════════════ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-xl border border-rm-stone bg-rm-paper/60 px-5 py-4">
          <p className="font-serif text-[14px] leading-relaxed text-rm-inkSoft">
            <strong className="font-sans font-semibold text-rm-teal">
              Information.
            </strong>{' '}
            Ces informations sont données à titre informatif et ne remplacent
            pas un avis médical. Consultez un professionnel de santé avant
            tout usage.
          </p>
          <Link
            href={`/${locale}/avertissement-sante`}
            className="mt-2 inline-flex items-center gap-1 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-rm-burgundy hover:underline"
          >
            Avertissement santé
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href={`/${locale}/bienfaits`}
            className="inline-flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-[0.14em] text-rm-teal hover:text-rm-burgundy transition-colors"
          >
            <span aria-hidden>←</span>
            {tDetail.backToList}
          </Link>
        </div>
      </section>
    </main>
  )
}
