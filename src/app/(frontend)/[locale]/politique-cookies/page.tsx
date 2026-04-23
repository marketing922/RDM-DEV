import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import CookiesTemplate from '@/components/institutional/CookiesTemplate'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    metadataBase: siteMetadataBase(),
    title: 'Politique de cookies — Les Remèdes de Mamie',
    description:
      "Comment nous utilisons les cookies et traceurs sur www.remedes-mamie.com : catégories, finalités, gestion de vos préférences et cookies tiers.",
    alternates: {
      canonical: `/${locale}/politique-cookies`,
      languages: {
        fr: `/fr/politique-cookies`,
        en: `/en/politique-cookies`,
      },
    },
  }
}

export default async function PolitiqueCookiesPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return <CookiesTemplate locale={locale} homeLabel={dict.nav.home} />
}
