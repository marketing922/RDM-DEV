import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import MentionsTemplate from '@/components/institutional/MentionsTemplate'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    metadataBase: siteMetadataBase(),
    title: 'Mentions légales — Les Remèdes de Mamie',
    description:
      "Mentions légales du site www.remedes-mamie.com : éditeur SAS CALEBASSE, hébergeur, propriété intellectuelle et droit applicable.",
    alternates: {
      canonical: `/${locale}/mentions-legales`,
      languages: {
        fr: `/fr/mentions-legales`,
        en: `/en/mentions-legales`,
      },
    },
  }
}

export default async function MentionsLegalesPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return <MentionsTemplate locale={locale} homeLabel={dict.nav.home} />
}
