import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { getSitePageBySlug } from '@/lib/queries/sitePage'
import AProposTemplate from '@/components/institutional/AProposTemplate'
import { getWikiEntries, getBenefits, getBlogPosts } from '@/lib/queries'
import { siteMetadataBase } from '@/lib/metadata'

const SLUG = 'a-propos'

export const revalidate = 300

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const page = await getSitePageBySlug(SLUG, locale)
  return {
    metadataBase: siteMetadataBase(),
    title: page?.title || dict.about.title,
    description:
      page?.intro ||
      dict.about.subtitle ||
      'La maison d\'édition derrière Les Remèdes de Mamie — SAS CALEBASSE, Paris.',
    alternates: {
      canonical: `/${locale}/${SLUG}`,
      languages: { fr: `/fr/${SLUG}`, en: `/en/${SLUG}` },
    },
  }
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  const [dict, wikiResult, benefitsResult, blogResult] = await Promise.all([
    getDictionary(locale as Locale),
    getWikiEntries({ limit: 1, locale }),
    getBenefits({ limit: 1, locale }),
    getBlogPosts({ limit: 1, locale }),
  ])

  return (
    <AProposTemplate
      locale={locale}
      homeLabel={dict.nav.home}
      plantsCount={wikiResult.totalDocs ?? 0}
      benefitsCount={benefitsResult.totalDocs ?? 0}
      articlesCount={blogResult.totalDocs ?? 0}
    />
  )
}
