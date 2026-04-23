import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/server'
import { getPageBySlug } from '@/lib/queries'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 300

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const page = await getPageBySlug(slug, locale)
  if (!page) return { title: `Not Found | ${dict.meta.siteName}` }

  const p = page as any
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'

  return {
    metadataBase: siteMetadataBase(),
    title: `${p.title} | ${dict.meta.siteName}`,
    alternates: {
      // Canonical points to the new root-level URL — /p/{slug} stays as a
      // backward-compatible alias but search engines should index the pretty one.
      canonical: `${siteUrl}/${locale}/${slug}`,
      languages: {
        fr: `${siteUrl}/fr/${slug}`,
        en: `${siteUrl}/en/${slug}`,
      },
    },
  }
}

export default async function DynamicPage({ params }: Props) {
  const { locale, slug } = await params
  const [dict, page] = await Promise.all([
    getDictionary(locale as Locale),
    getPageBySlug(slug, locale),
  ])
  if (!page) notFound()

  const p = page as any
  const blocks = Array.isArray(p.layout) ? p.layout : []

  return (
    <main className="min-h-screen bg-[#FEF9E9]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: p.title },
          ]}
        />
        <div className="mt-6">
          <BlockRenderer blocks={blocks} locale={locale} />
        </div>
      </div>
    </main>
  )
}
