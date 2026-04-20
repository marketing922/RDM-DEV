import { JsonLd } from './JsonLd'

type Source = {
  title?: string
  publisher?: string
  year?: number
  url?: string
}

type FaqItem = {
  question: string
  answer: string
}

type QuotableStatement = {
  statement: string
  source?: string
}

type DataPoint = {
  metric: string
  value: string
  unit?: string
  source?: string
}

export type GeoFieldsInput = {
  directAnswer?: string
  definition?: string
  keyTakeaways?: Array<{ takeaway: string }>
  quotableStatements?: QuotableStatement[]
  dataPoints?: DataPoint[]
  faq?: FaqItem[]
  authoritySignals?: string
  sources?: Source[]
  lastFactCheckedAt?: string
}

type GeoStructuredDataProps = {
  kind: 'plant' | 'benefit' | 'article'
  locale: string
  slug: string
  name: string
  image?: string
  author?: string
  publishedAt?: string
  updatedAt?: string
  category?: string
  geo?: GeoFieldsInput | null
}

/**
 * Émet le bundle JSON-LD enrichi GEO pour une page détail.
 *
 * - Schema principal (Article / MedicalWebPage) enrichi avec les champs GEO :
 *   description = directAnswer, abstract = definition, citation = sources
 * - FAQPage séparé si la FAQ est présente (meilleur rendu Google AI Overviews)
 * - ItemList pour les points-clés et points de données (structure extractable)
 */
export function GeoStructuredData({
  kind,
  locale,
  slug,
  name,
  image,
  author,
  publishedAt,
  updatedAt,
  category,
  geo,
}: GeoStructuredDataProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'
  const pathByKind = { plant: 'plantes', benefit: 'bienfaits', article: 'blog' } as const
  const pageUrl = `${siteUrl}/${locale}/${pathByKind[kind]}/${slug}`

  const mainType = kind === 'article' ? 'Article' : 'MedicalWebPage'

  const citations = (geo?.sources ?? [])
    .filter((s) => s.title || s.url)
    .map((s) => ({
      '@type': 'CreativeWork',
      name: s.title,
      url: s.url,
      publisher: s.publisher ? { '@type': 'Organization', name: s.publisher } : undefined,
      datePublished: s.year ? String(s.year) : undefined,
    }))

  const quotes = (geo?.quotableStatements ?? [])
    .filter((q) => q.statement)
    .map((q) => ({
      '@type': 'Quotation',
      text: q.statement,
      ...(q.source ? { citation: q.source } : {}),
    }))

  const takeaways = (geo?.keyTakeaways ?? [])
    .filter((t) => t?.takeaway)
    .map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.takeaway,
    }))

  const dataPoints = (geo?.dataPoints ?? [])
    .filter((d) => d?.metric)
    .map((d) => ({
      '@type': 'PropertyValue',
      name: d.metric,
      value: [d.value, d.unit].filter(Boolean).join(' '),
      ...(d.source ? { citation: d.source } : {}),
    }))

  const mainSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': mainType,
    headline: name,
    name,
    url: pageUrl,
    description: geo?.directAnswer || undefined,
    abstract: geo?.definition || undefined,
    image: image || undefined,
    inLanguage: locale,
    datePublished: publishedAt || undefined,
    dateModified: geo?.lastFactCheckedAt || updatedAt || publishedAt || undefined,
    author: {
      '@type': 'Person',
      name: author || 'Les Remèdes de Mamie',
      ...(geo?.authoritySignals ? { description: geo.authoritySignals } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Les Remèdes de Mamie',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/images/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    ...(category ? { articleSection: category } : {}),
    ...(citations.length ? { citation: citations } : {}),
    ...(quotes.length ? { mentions: quotes } : {}),
    ...(dataPoints.length
      ? {
          additionalProperty: dataPoints,
        }
      : {}),
  }

  if (takeaways.length) {
    mainSchema.hasPart = {
      '@type': 'ItemList',
      name: 'Points-clés',
      itemListElement: takeaways,
    }
  }

  if (kind === 'plant' || kind === 'benefit') {
    mainSchema['@type'] = 'MedicalWebPage'
    ;(mainSchema as any).about = {
      '@type': kind === 'plant' ? 'Substance' : 'MedicalCondition',
      name,
      ...(geo?.definition ? { description: geo.definition } : {}),
    }
  }

  const faqItems = (geo?.faq ?? []).filter((f) => f?.question && f?.answer)
  const faqSchema = faqItems.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null

  return (
    <>
      <JsonLd data={mainSchema} />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
    </>
  )
}
