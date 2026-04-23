import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { getSitePageBySlug } from '@/lib/queries/sitePage'
import ContactTemplate from '@/components/institutional/ContactTemplate'
import { siteMetadataBase } from '@/lib/metadata'

const SLUG = 'contact'

export const revalidate = 300

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const page = await getSitePageBySlug(SLUG, locale)
  return {
    metadataBase: siteMetadataBase(),
    title: page?.title || dict.contact.title,
    description:
      page?.intro ||
      dict.contact.subtitle ||
      'Question botanique, suggestion de plante, demande presse — réponse sous 48 h.',
    alternates: {
      canonical: `/${locale}/${SLUG}`,
      languages: { fr: `/fr/${SLUG}`, en: `/en/${SLUG}` },
    },
  }
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return <ContactTemplate locale={locale} homeLabel={dict.nav.home} />
}
