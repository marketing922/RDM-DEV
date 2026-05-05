import type { Metadata } from 'next'
import Image from 'next/image'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getProducts } from '@/lib/queries'
import { ProductsCatalog } from '@/components/shared/ProductsCatalog'
import { BRAND } from '@/lib/brand-assets'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 60

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    metadataBase: siteMetadataBase(),
    title: `Nos Produits | ${dict.meta.siteName}`,
    description:
      'D\u00e9couvrez notre gamme de tisanes, poudres et g\u00e9lules naturelles fabriqu\u00e9es en France.',
    alternates: {
      canonical: `/${locale}/produits`,
      languages: {
        fr: `/fr/produits`,
        en: `/en/produits`,
      },
    },
  }
}

function LeafIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  )
}

export default async function ProduitsPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const { docs: products } = await getProducts({ locale, limit: 100 })

  return (
    <main className="min-h-screen bg-[#FEF9E9]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-6 pt-4">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.nav.products || 'Produits' },
          ]}
        />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-10 pt-6 text-center sm:pb-12 sm:pt-8 md:pb-16 md:pt-12">
          <Image
            src={BRAND.icons.natural}
            alt="100% Naturel et Pur"
            width={80}
            height={80}
            className="mx-auto h-16 w-16 sm:h-20 sm:w-20"
            unoptimized
            priority
          />
          <h1 className="mt-4 text-3xl font-bold text-[#054A57] sm:text-4xl md:text-5xl">
            Nos Produits
          </h1>
          <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-sm text-[#712E2F]/80 sm:text-base md:text-lg">
            Des plantes s&eacute;lectionn&eacute;es en qualit&eacute; pharmacop&eacute;e,
            cultiv&eacute;es en bio et con&ccedil;ues pour accompagner votre bien-&ecirc;tre au
            quotidien.
          </p>

          <div className="mx-auto mt-6 sm:mt-8 grid max-w-2xl grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-10">
            {[
              { src: BRAND.certifications.bio, label: 'Agriculture Bio' },
              { src: BRAND.certifications.pharmacopee, label: 'Qualit\u00e9 Pharmacop\u00e9e' },
              { src: BRAND.certifications.vegan, label: 'Vegan' },
              { src: BRAND.certifications.sansMetauxLourds, label: 'Sans m\u00e9taux lourds' },
            ].map((cert) => (
              <div key={cert.label} className="flex flex-col items-center gap-1.5">
                <Image
                  src={cert.src}
                  alt={cert.label}
                  width={56}
                  height={56}
                  className="h-12 w-12 sm:h-14 sm:w-14"
                  unoptimized
                />
                <span className="text-[10px] sm:text-[11px] font-medium text-[#712E2F]/70 text-center">{cert.label}</span>
              </div>
            ))}
          </div>
        </div>

        <LeafIcon className="pointer-events-none absolute -left-6 top-8 hidden h-28 w-28 rotate-[-20deg] text-[#A2211E]/10 lg:block" />
        <LeafIcon className="pointer-events-none absolute -right-10 bottom-0 hidden h-36 w-36 rotate-[30deg] text-[#A2211E]/10 lg:block" />
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-12 sm:pb-16">
        {products.length > 0 ? (
          <ProductsCatalog products={products as any} />
        ) : (
          <div className="mx-auto max-w-md rounded-2xl bg-[#FFF5D5] p-8 sm:p-12 text-center shadow-sm ring-1 ring-[#DCD8C7]/60">
            <p className="text-base sm:text-lg font-medium text-[#712E2F]">
              Nos produits arrivent bient&ocirc;t
            </p>
            <p className="mt-2 text-sm text-[#712E2F]/70">
              Revenez prochainement pour d&eacute;couvrir notre gamme compl&egrave;te.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
