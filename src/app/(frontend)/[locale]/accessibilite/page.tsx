import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import AccessibilityTemplate from '@/components/institutional/AccessibilityTemplate'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    metadataBase: siteMetadataBase(),
    title: "Déclaration d'accessibilité — Les Remèdes de Mamie",
    description:
      "Engagement d'accessibilité de www.remedes-mamie.com : conformité RGAA 4.1 / WCAG 2.2 niveau AA, technologies supportées, dérogations et voies de recours.",
    alternates: {
      canonical: `/${locale}/accessibilite`,
      languages: {
        fr: `/fr/accessibilite`,
        en: `/en/accessibilite`,
      },
    },
  }
}

export default async function AccessibilitePage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return <AccessibilityTemplate locale={locale} homeLabel={dict.nav.home} />
}
