import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { FaqClient } from './FaqClient'
import { FAQJsonLd } from '@/components/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return {
    title: dict.faq.title,
    description: dict.faq.subtitle,
  }
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const faqItems = (dict.faq.items || []).map((item: any) => ({
    question: item.question,
    answer: item.answer,
  }))

  return (
    <>
      <FAQJsonLd items={faqItems} />
      <FaqClient dict={dict} locale={locale} />
    </>
  )
}
