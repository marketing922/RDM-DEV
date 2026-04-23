import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import AvertissementSanteTemplate from '@/components/institutional/AvertissementSanteTemplate'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    metadataBase: siteMetadataBase(),
    title: 'Avertissement santé — Les Remèdes de Mamie',
    description:
      "Avertissement santé : les informations de ce site sont fournies à titre informatif et éducatif et ne se substituent pas à un avis médical.",
    alternates: {
      canonical: `/${locale}/avertissement-sante`,
      languages: {
        fr: `/fr/avertissement-sante`,
        en: `/en/avertissement-sante`,
      },
    },
  }
}

export default async function AvertissementSantePage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return <AvertissementSanteTemplate locale={locale} homeLabel={dict.nav.home} />
}
