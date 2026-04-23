import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import PrivacyTemplate from '@/components/institutional/PrivacyTemplate'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 3600
type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    metadataBase: siteMetadataBase(),
    title: 'Politique de confidentialité — Les Remèdes de Mamie',
    description:
      'Politique de confidentialité et traitement des données personnelles conformément au RGPD.',
    alternates: { canonical: `/${locale}/politique-confidentialite` },
  }
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return <PrivacyTemplate locale={locale} homeLabel={dict.nav.home} />
}
