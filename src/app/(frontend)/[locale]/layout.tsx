import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fontVariables } from '@/lib/fonts'
import { locales, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileNav } from '@/components/layout/MobileNav'
import { Disclaimer } from '@/components/shared/Disclaimer'
import { OrganizationJsonLd } from '@/components/seo'
import '@/styles/globals.css'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return {
    title: { template: `%s | ${dict.meta.siteName}`, default: dict.meta.siteName },
    description: dict.meta.siteDescription,
    metadataBase: new URL(dict.meta.siteUrl),
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!locales.includes(locale as Locale)) notFound()
  const dict = await getDictionary(locale as Locale)

  return (
    <html lang={locale} className={fontVariables}>
      <body className="bg-page text-neutral-600 font-body antialiased">
        <OrganizationJsonLd />
        <Navbar dict={dict} locale={locale} />
        <main className="min-h-screen">{children}</main>
        <Disclaimer variant="minimal" dict={dict} />
        <Footer dict={dict} />
        <MobileNav dict={dict} locale={locale} />
      </body>
    </html>
  )
}
