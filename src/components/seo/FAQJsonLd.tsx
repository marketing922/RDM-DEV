import { JsonLd } from './JsonLd'

type FAQJsonLdProps = {
  items: Array<{ question: string; answer: string }>
}

export function FAQJsonLd({ items }: FAQJsonLdProps) {
  return (
    <JsonLd data={{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    }} />
  )
}
