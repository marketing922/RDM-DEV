import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { richTextToPlain } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { getProductBySlug, getProducts } from '@/lib/queries'
import ProductGallery from '@/components/produits/ProductGallery'
import Reveal from '@/components/ui/Reveal'
import { BreadcrumbJsonLd, ProductJsonLd } from '@/components/seo'
import { siteMetadataBase } from '@/lib/metadata'
import { DEFAULT_PLANT_IMAGE } from '@/lib/brand-assets'

export const revalidate = 3600
export const dynamicParams = true

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  // Aucune page pré-générée au build — ISR à la demande via dynamicParams=true.
  return []
}

function formatPrice(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return ''
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

function productImages(p: any): string[] {
  const urls: string[] = []
  if (Array.isArray(p?.images)) {
    for (const item of p.images) {
      const url = resolveMediaUrl(item?.image, 'card')
      if (url) urls.push(url)
    }
  }
  if (urls.length === 0 && p?.externalImageUrl) {
    urls.push(String(p.externalImageUrl))
  }
  return urls
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const p = (await getProductBySlug(slug, locale)) as any
  if (!p) return { title: `Not Found | ${dict.meta.siteName}` }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'
  const imgs = productImages(p)
  const image = imgs[0] || DEFAULT_PLANT_IMAGE
  const description =
    p.shortDescription ||
    (p.description ? richTextToPlain(p.description).slice(0, 160) : `${p.name}`)

  return {
    metadataBase: siteMetadataBase(),
    title: `${p.name} | Produits | ${dict.meta.siteName}`,
    description,
    openGraph: {
      images: [{ url: image, width: 800, height: 800, alt: p.name }],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/produits/${slug}`,
      languages: {
        fr: `${siteUrl}/fr/produits/${slug}`,
        en: `${siteUrl}/en/produits/${slug}`,
      },
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const [dict, productDoc, { docs: allProducts }] = await Promise.all([
    getDictionary(locale as Locale),
    getProductBySlug(slug, locale),
    getProducts({ limit: 12, locale }),
  ])
  if (!productDoc) notFound()

  const p = productDoc as any

  const images = productImages(p)
  if (images.length === 0) {
    images.push(DEFAULT_PLANT_IMAGE)
  }

  const price = formatPrice(p.price)
  const compareAtPrice = formatPrice(p.compareAtPrice)
  const hasPromo =
    typeof p.compareAtPrice === 'number' &&
    typeof p.price === 'number' &&
    p.compareAtPrice > p.price
  const discountPct = hasPromo
    ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
    : 0

  const benefits: Array<{ name: string; slug: string }> = Array.isArray(p.benefits)
    ? p.benefits.filter((b: any) => b && typeof b === 'object' && b.name && b.slug)
    : []

  const formatLabels: Record<string, string> = {
    tisane: 'Tisane',
    poudre: 'Poudre',
    gelule: 'Gélule',
    autre: 'Autre',
  }
  const formatLabel = p.format ? formatLabels[p.format] || p.format : ''

  const infoRows = [
    { label: 'Format', value: formatLabel },
    { label: 'Contenance', value: p.weight },
    { label: 'Référence', value: p.sku },
    {
      label: 'Catégorie',
      value:
        p.category && typeof p.category === 'object'
          ? p.category.name || p.category.slug
          : '',
    },
  ].filter((r) => r.value)

  const ingredientsText = p.ingredients || ''
  const usageText = p.usage ? richTextToPlain(p.usage) : ''
  const precautionsText = p.precautions ? richTextToPlain(p.precautions) : ''
  const descriptionText = p.description ? richTextToPlain(p.description) : ''

  const relatedProducts = (allProducts as any[])
    .filter((x) => x.slug !== slug)
    .slice(0, 4)

  return (
    <main className="min-h-screen bg-rm-cream">
      <BreadcrumbJsonLd
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: dict.nav.products || 'Produits', href: `/${locale}/produits` },
          { label: p.name, href: `/${locale}/produits/${slug}` },
        ]}
      />
      <ProductJsonLd
        product={{
          name: p.name,
          slug,
          description:
            p.shortDescription ||
            (p.description ? richTextToPlain(p.description).slice(0, 500) : ''),
          price: typeof p.price === 'number' ? p.price : 0,
          compareAtPrice:
            typeof p.compareAtPrice === 'number' ? p.compareAtPrice : undefined,
          images: images.map((url) => ({ url })),
          sku: p.sku,
          inStock: p.inStock !== false,
          category:
            p.category && typeof p.category === 'object'
              ? { name: p.category.name || p.category.slug }
              : undefined,
        }}
        locale={locale}
      />
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-10 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.nav.products || 'Produits', href: `/${locale}/produits` },
            { label: p.name },
          ]}
        />

        {/* ─── Main: gallery + summary ─── */}
        <section className="mt-6 sm:mt-8 md:mt-12 grid lg:grid-cols-[1.1fr_1fr] gap-8 sm:gap-10 lg:gap-14 items-start">
          {/* Gallery */}
          <Reveal>
            <ProductGallery images={images} alt={p.name} />
          </Reveal>

          {/* Summary */}
          <Reveal delay={120}>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="block w-6 h-px bg-rm-burgundy" />
              <span className="font-sans text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                {formatLabel || 'Produit'}
              </span>
            </div>

            <h1 className="font-display font-normal text-rm-teal leading-[1.05] tracking-[-0.01em] text-[28px] sm:text-[34px] md:text-[44px]">
              {p.name}
            </h1>

            {p.shortDescription && (
              <p className="font-serif italic text-[15px] sm:text-[17px] md:text-[18px] leading-[1.55] text-rm-inkSoft mt-3 sm:mt-4">
                {p.shortDescription}
              </p>
            )}

            {/* Price */}
            <div className="mt-5 sm:mt-6 flex items-baseline gap-3 flex-wrap">
              <span className="font-display text-[32px] sm:text-[36px] md:text-[40px] text-rm-burgundy leading-none">
                {price}
              </span>
              {hasPromo && (
                <>
                  <span className="font-serif italic text-[18px] text-rm-inkSoft line-through">
                    {compareAtPrice}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] uppercase bg-rm-burgundy text-white">
                    −{discountPct}%
                  </span>
                </>
              )}
            </div>

            {/* Stock badge */}
            <div className="mt-4 flex items-center gap-2">
              <span
                className={`block w-2 h-2 rounded-full ${
                  p.inStock === false ? 'bg-rm-inkSoft/40' : 'bg-rm-teal'
                }`}
              />
              <span className="font-sans text-[12px] tracking-[0.05em] text-rm-inkSoft">
                {p.inStock === false ? 'Rupture de stock' : 'En stock'}
              </span>
            </div>

            {/* External purchase links */}
            {(p.amazonUrl || p.temuUrl) && (
              <div className="mt-6 border-t border-dashed border-rm-rule pt-6 space-y-2.5">
                <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-rm-inkSoft/70">
                  Acheter chez
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  {p.amazonUrl && (
                    <a
                      href={p.amazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center sm:justify-start gap-2 bg-rm-burgundy text-white font-sans text-sm font-semibold px-5 py-3 hover:bg-rm-burgundy/90 transition-colors"
                    >
                      Amazon
                      <span aria-hidden="true">→</span>
                    </a>
                  )}
                  {p.temuUrl && (
                    <a
                      href={p.temuUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center sm:justify-start gap-2 bg-rm-teal text-white font-sans text-sm font-semibold px-5 py-3 hover:bg-rm-teal/90 transition-colors"
                    >
                      Temu
                      <span aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
                <p className="mt-4 font-serif italic text-[12px] leading-[1.55] text-rm-inkSoft/80">
                  Référez-vous toujours aux consignes d&apos;utilisation et précautions
                  indiquées sur l&apos;emballage du produit acheté ainsi qu&apos;à la notice
                  fournie par le vendeur.
                </p>
              </div>
            )}

            {/* Bienfaits chips */}
            {benefits.length > 0 && (
              <div className="mt-6 border-t border-dashed border-rm-rule pt-6">
                <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-rm-inkSoft/70 mb-3">
                  Bienfaits associés
                </p>
                <div className="flex flex-wrap gap-2">
                  {benefits.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/${locale}/bienfaits/${b.slug}`}
                      className="inline-flex items-center gap-1.5 bg-rm-paper border border-rm-rule px-3 py-1.5 font-sans text-[12px] text-rm-teal hover:border-rm-burgundy hover:text-rm-burgundy transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rm-ochre" />
                      {b.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Reveal>
        </section>

        {/* ─── Description + info sidebar ─── */}
        <section className="mt-12 sm:mt-16 md:mt-20 grid lg:grid-cols-[1fr_340px] gap-8 sm:gap-10 lg:gap-14">
          <Reveal className="space-y-10">
            {descriptionText && (
              <div>
                <h2 className="font-display text-[22px] sm:text-[26px] md:text-[32px] text-rm-teal leading-tight tracking-[-0.01em]">
                  À propos du produit
                </h2>
                <div className="mt-4 space-y-4 font-serif text-[15px] sm:text-[16px] md:text-[17px] leading-[1.7] text-rm-ink">
                  {descriptionText
                    .split('\n\n')
                    .filter(Boolean)
                    .map((para: string, i: number) => (
                      <p key={i}>{para}</p>
                    ))}
                </div>
              </div>
            )}

            {ingredientsText && (
              <div>
                <h2 className="font-display text-[20px] sm:text-[22px] md:text-[26px] text-rm-teal leading-tight tracking-[-0.01em]">
                  Ingrédients
                </h2>
                <p className="mt-3 font-serif italic text-[15px] leading-[1.6] text-rm-inkSoft">
                  {ingredientsText}
                </p>
              </div>
            )}

            {usageText && (
              <div>
                <h2 className="font-display text-[20px] sm:text-[22px] md:text-[26px] text-rm-teal leading-tight tracking-[-0.01em]">
                  Conseils d&apos;utilisation
                </h2>
                <div className="mt-3 space-y-3 font-serif text-[15px] leading-[1.6] text-rm-ink">
                  {usageText
                    .split('\n\n')
                    .filter(Boolean)
                    .map((para: string, i: number) => (
                      <p key={i}>{para}</p>
                    ))}
                </div>
              </div>
            )}
          </Reveal>

          {/* Sidebar */}
          <Reveal delay={150}>
          <aside className="space-y-5">
            {infoRows.length > 0 && (
              <div className="bg-rm-paper border border-rm-rule">
                <div className="px-5 py-3 bg-rm-creamSoft border-b border-rm-rule">
                  <h3 className="font-sans text-[11px] tracking-[0.2em] uppercase text-rm-teal font-semibold">
                    Fiche technique
                  </h3>
                </div>
                <dl className="divide-y divide-dashed divide-rm-rule text-sm">
                  {infoRows.map((row, i) => (
                    <div key={i} className="flex px-5 py-3">
                      <dt className="w-1/2 text-rm-inkSoft font-sans text-[12px]">
                        {row.label}
                      </dt>
                      <dd className="w-1/2 font-sans text-[13px] text-rm-teal font-semibold text-right">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {precautionsText && (
              <div className="border-2 border-rm-ochre bg-rm-creamSoft p-5">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-rm-ochre text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </span>
                  <div className="flex-1">
                    <h3 className="font-sans text-[12px] font-bold tracking-[0.1em] uppercase text-rm-burgundy">
                      Précautions
                    </h3>
                    <p className="mt-2 font-serif text-[13px] leading-[1.55] text-rm-ink">
                      {precautionsText}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border border-rm-rule bg-rm-paper p-5">
              <p className="font-serif text-[13px] leading-[1.55] text-rm-ink">
                <strong className="text-rm-teal">
                  Consultez votre médecin avant utilisation.
                </strong>{' '}
                Ces informations sont à titre indicatif et ne remplacent pas un avis
                médical professionnel.
              </p>
              <Link
                href={`/${locale}/avertissement-sante`}
                className="mt-3 inline-flex items-center gap-1 font-sans text-[12px] font-semibold text-rm-burgundy hover:underline"
              >
                Avertissement santé
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </aside>
          </Reveal>
        </section>

        {/* ─── Related products ─── */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 sm:mt-20 md:mt-24 border-t border-dashed border-rm-rule pt-10 sm:pt-14 md:pt-16 pb-10">
            <Reveal className="flex items-baseline justify-between mb-6 sm:mb-8 gap-4">
              <h2 className="font-display text-[22px] sm:text-[26px] md:text-[32px] text-rm-teal leading-tight tracking-[-0.01em]">
                Produits <em className="italic text-rm-burgundy">similaires</em>
              </h2>
              <Link
                href={`/${locale}/produits`}
                className="font-sans text-sm font-semibold text-rm-burgundy hover:underline"
              >
                Voir la gamme →
              </Link>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
              {relatedProducts.map((rp: any, rIdx: number) => {
                const rpImgs = productImages(rp)
                const rpImg = rpImgs[0] || DEFAULT_PLANT_IMAGE
                const rpPrice = formatPrice(rp.price)
                return (
                  <Reveal key={rp.id || rp.slug} delay={(rIdx % 4) * 80}>
                  <Link
                    href={`/${locale}/produits/${rp.slug}`}
                    className="group bg-rm-paper border border-rm-rule overflow-hidden flex flex-col h-full hover:border-rm-ruleStrong transition-colors"
                  >
                    <div className="relative aspect-square bg-rm-creamSoft overflow-hidden">
                      <Image
                        src={rpImg}
                        alt={rp.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-[17px] leading-[1.2] text-rm-teal group-hover:text-rm-burgundy transition-colors line-clamp-2">
                        {rp.name}
                      </h3>
                      {rpPrice && (
                        <p className="mt-2 font-display text-[18px] text-rm-burgundy">
                          {rpPrice}
                        </p>
                      )}
                    </div>
                  </Link>
                  </Reveal>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
