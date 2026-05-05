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
} from '@/lib/queries'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { siteMetadataBase } from '@/lib/metadata'
import { DEFAULT_PLANT_IMAGE } from '@/lib/brand-assets'

export const revalidate = 3600

const DEFAULT_PRODUCT_IMAGE = DEFAULT_PLANT_IMAGE

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  try {
    const { docs: benefits } = await getBenefits({ limit: 999 })
    const params: Array<{ locale: string; slug: string }> = []
    for (const benefit of benefits) {
      const slug = (benefit as any).slug
      if (slug) {
        params.push({ locale: 'fr', slug })
        params.push({ locale: 'en', slug })
      }
    }
    return params
  } catch {
    return []
  }
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

  // Related plants (from benefit.relatedPlants relationship, depth:2)
  const relatedPlants: Array<{
    id?: string | number
    name: string
    slug?: string
    latinName?: string
    shortDescription?: string
  }> = Array.isArray(b.relatedPlants)
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

  // Related products — first try the explicit relatedProducts on the benefit,
  // then fall back to products that reference this benefit via their `benefits` field.
  let relatedProducts: any[] = Array.isArray(b.relatedProducts)
    ? b.relatedProducts.filter(
        (p: any) => p && typeof p === 'object' && p.slug && p.name,
      )
    : []

  if (relatedProducts.length === 0 && b.id) {
    try {
      const { docs } = await getProducts({ limit: 4, locale })
      relatedProducts = (docs as any[]).filter((p) => {
        const bs = p.benefits
        if (!Array.isArray(bs)) return false
        return bs.some((x: any) => {
          if (typeof x === 'string' || typeof x === 'number') return x === b.id
          return x?.id === b.id || x?.slug === slug
        })
      })
    } catch {
      relatedProducts = []
    }
  }
  relatedProducts = relatedProducts.slice(0, 4)

  // Related articles — explicit relation on the benefit (preferred), with a
  // best-effort tag-matching fallback when the editor hasn't linked any.
  let relatedArticles: any[] = Array.isArray(b.relatedArticles)
    ? b.relatedArticles
        .filter((p: any) => p && typeof p === 'object' && p.slug && p.title)
    : []

  if (relatedArticles.length === 0) {
    try {
      const { docs: allPosts } = await getBlogPosts({ limit: 12, locale })
      relatedArticles = (allPosts as any[])
        .filter((post) => {
          const tags = Array.isArray(post.tags) ? post.tags : []
          return tags.some((t: any) => {
            const tSlug = typeof t === 'object' ? t?.slug : null
            const tName = typeof t === 'object' ? t?.name : null
            return tSlug === slug || tName?.toLowerCase() === benefitName.toLowerCase()
          })
        })
        .slice(0, 3)
    } catch {
      relatedArticles = []
    }
  }
  relatedArticles = relatedArticles.slice(0, 3)

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

        {/* Filet pointillé */}
        <div
          aria-hidden
          className="mt-8 h-px w-full border-t border-dotted border-rm-ruleStrong"
        />

        {/* Meta stats */}
        <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm text-rm-inkSoft">
          <div className="flex items-baseline gap-1.5">
            <dt className="font-mono text-rm-burgundy">
              {String(relatedPlants.length).padStart(2, '0')}
            </dt>
            <dd>
              {relatedPlants.length > 1
                ? 'plantes associées'
                : 'plante associée'}
            </dd>
          </div>
          {relatedArticles.length > 0 && (
            <div className="flex items-baseline gap-1.5">
              <dt className="font-mono text-rm-burgundy">
                {String(relatedArticles.length).padStart(2, '0')}
              </dt>
              <dd>
                {relatedArticles.length > 1 ? 'articles' : 'article'}
              </dd>
            </div>
          )}
          {relatedProducts.length > 0 && (
            <div className="flex items-baseline gap-1.5">
              <dt className="font-mono text-rm-burgundy">
                {String(relatedProducts.length).padStart(2, '0')}
              </dt>
              <dd>
                {relatedProducts.length > 1 ? 'produits' : 'produit'}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* ═══════════════ CORPS ÉDITORIAL ═══════════════ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-12">
        <DirectAnswerBox text={b.directAnswer} />

        {descriptionParagraphs.length > 0 && (
          <article className="mt-8">
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
          </article>
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

        <KeyTakeawaysBox items={b.keyTakeaways} />
      </section>

      {/* ═══════════════ PLANTES + PRODUITS (côte à côte) ═══════════════ */}
      {(relatedPlants.length > 0 || relatedProducts.length > 0) && (
        <section className="border-t border-rm-rule bg-rm-paper/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">

              {/* ── Plantes (colonne gauche) ── */}
              {relatedPlants.length > 0 && (
                <div className={relatedProducts.length > 0 ? 'lg:col-span-5' : 'lg:col-span-12'}>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-rm-burgundy">
                    Plantes traditionnellement utilisées
                  </p>
                  <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl text-rm-teal">
                    Les plantes de l’almanach
                  </h2>
                  <div
                    aria-hidden
                    className="mt-4 h-px w-full border-t border-dotted border-rm-ruleStrong"
                  />

                  <ul className={`mt-8 grid gap-4 sm:gap-5 ${
                    relatedProducts.length > 0
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}>
                    {relatedPlants.map((plant) => (
                      <li key={plant.slug ?? plant.name}>
                        <Link
                          href={`/${locale}/plantes/${plant.slug}`}
                          className="group block h-full rounded-xl bg-rm-cream border border-rm-stone p-5 transition-all hover:-translate-y-0.5 hover:border-rm-burgundy hover:shadow-[0_10px_24px_rgba(5,74,87,0.08)]"
                        >
                          <h3 className="font-display text-xl text-rm-teal group-hover:text-rm-burgundy transition-colors">
                            {plant.name}
                          </h3>
                          {plant.latinName && (
                            <p className="mt-1 font-serif italic text-sm text-rm-burgundy">
                              {plant.latinName}
                            </p>
                          )}
                          {plant.shortDescription && (
                            <p className="mt-3 font-serif text-[15px] leading-snug text-rm-inkSoft line-clamp-2">
                              {plant.shortDescription}
                            </p>
                          )}
                          <span className="mt-4 inline-flex items-center gap-1 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-rm-burgundy">
                            Découvrir la fiche
                            <span aria-hidden>→</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Produits (colonne droite) ── */}
              {relatedProducts.length > 0 && (
                <div className={relatedPlants.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'}>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-rm-burgundy">
                    Dans notre boutique
                  </p>
                  <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl text-rm-teal">
                    Produits recommandés
                  </h2>
                  <div
                    aria-hidden
                    className="mt-4 h-px w-full border-t border-dotted border-rm-ruleStrong"
                  />

                  <div className={`mt-8 grid gap-4 sm:gap-5 ${
                    relatedPlants.length > 0
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                  }`}>
                    {relatedProducts.map((product: any) => {
                      const img =
                        resolveMediaUrl(
                          (product.images?.[0] as any)?.image,
                          'card',
                        ) ??
                        (product.externalImageUrl as string | undefined) ??
                        DEFAULT_PRODUCT_IMAGE
                      return (
                        <Link
                          key={product.slug}
                          href={`/${locale}/produits/${product.slug}`}
                          className="group flex flex-col overflow-hidden rounded-xl border border-rm-stone bg-rm-cream transition-all hover:-translate-y-0.5 hover:border-rm-burgundy hover:shadow-[0_10px_24px_rgba(5,74,87,0.08)]"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-rm-creamSoft">
                            <Image
                              src={img}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="flex flex-1 flex-col p-4">
                            <h3 className="font-display text-lg text-rm-teal group-hover:text-rm-burgundy transition-colors">
                              {product.name}
                            </h3>
                            {product.shortDescription && (
                              <p className="mt-1 font-serif text-sm text-rm-inkSoft line-clamp-2">
                                {product.shortDescription}
                              </p>
                            )}
                            <div className="mt-auto pt-3 flex items-baseline justify-between">
                              {typeof product.price === 'number' && (
                                <span className="font-mono text-base font-semibold text-rm-teal">
                                  {product.price.toFixed(2).replace('.', ',')} €
                                </span>
                              )}
                              <span className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-rm-burgundy">
                                Voir
                              </span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ ARTICLES LIÉS ═══════════════ */}
      {relatedArticles.length > 0 && (
        <section className="border-t border-rm-rule">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-rm-burgundy">
              En savoir plus
            </p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl text-rm-teal">
              Articles liés
            </h2>
            <div
              aria-hidden
              className="mt-4 h-px w-full border-t border-dotted border-rm-ruleStrong"
            />

            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {relatedArticles.map((post: any) => (
                <li key={post.slug}>
                  <Link
                    href={`/${locale}/blog/${post.slug}`}
                    className="group block h-full rounded-xl bg-rm-cream border border-rm-stone p-5 transition-all hover:-translate-y-0.5 hover:border-rm-burgundy hover:shadow-[0_10px_24px_rgba(5,74,87,0.08)]"
                  >
                    <h3 className="font-display text-lg text-rm-teal group-hover:text-rm-burgundy transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 font-serif text-[15px] leading-snug text-rm-inkSoft line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-rm-burgundy">
                      Lire l’article
                      <span aria-hidden>→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ═══════════════ GEO SECTIONS ═══════════════ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <FaqAccordion items={b.faq} />
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
