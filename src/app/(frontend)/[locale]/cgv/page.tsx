import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import CGVTemplate from '@/components/institutional/CGVTemplate'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 3600
type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    metadataBase: siteMetadataBase(),
    title: 'CGV — Les Remèdes de Mamie',
    description:
      'Conditions générales de vente. En vigueur depuis le 1er mai 2026.',
    alternates: {
      canonical: `/${locale}/cgv`,
      languages: {
        fr: `/fr/cgv`,
        en: `/en/cgv`,
      },
    },
  }
}

export default async function CGVPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return <CGVTemplate locale={locale} homeLabel={dict.nav.home} />
}
