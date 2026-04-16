import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fontVariables } from '@/lib/fonts'
import { locales, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileNav } from '@/components/layout/MobileNav'

import { OrganizationJsonLd } from '@/components/seo'
import '@/styles/globals.css'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'

  return {
    title: { template: `%s | ${dict.meta.siteName}`, default: dict.meta.siteName },
    description: dict.meta.siteDescription,
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: 'website',
      siteName: dict.meta.siteName,
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      images: [{ url: '/images/og-default.jpg', width: 1200, height: 630, alt: dict.meta.siteName }],
    },
    twitter: {
      card: 'summary_large_image',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        'fr': `${siteUrl}/fr`,
        'en': `${siteUrl}/en`,
      },
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!locales.includes(locale as Locale)) notFound()
  const dict = await getDictionary(locale as Locale)

  return (
    <html lang={locale} className={fontVariables}>
      <body className="bg-page text-neutral-600 font-body antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-brand font-ui">
          Aller au contenu principal
        </a>
        <OrganizationJsonLd />
        <Navbar dict={dict} locale={locale} />
        <main id="main-content" className="min-h-screen">{children}</main>
        <Footer dict={dict} locale={locale} />
        <MobileNav dict={dict} locale={locale} />
      </body>
    </html>
  )
}
