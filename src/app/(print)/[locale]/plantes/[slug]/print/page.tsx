import { notFound } from 'next/navigation'
import { getWikiEntryBySlug } from '@/lib/queries'
import PrintPage from '@/components/plantes/PrintPage'
import AutoPrint from '@/components/plantes/AutoPrint'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export default async function PlantPrintRoute({ params }: Props) {
  const { locale, slug } = await params
  const entry = (await getWikiEntryBySlug(slug, locale).catch(() => null)) as any
  if (!entry) notFound()

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://lesremedesdmamie.fr'
  const canonicalUrl = `${baseUrl}/${locale}/plantes/${slug}`

  const benefits = Array.isArray(entry.benefits)
    ? entry.benefits
        .filter((b: any) => b && typeof b === 'object' && b.name)
        .map((b: any) => ({ name: b.name as string, slug: b.slug as string | undefined }))
    : []

  const keyTakeaways: string[] = Array.isArray(entry.keyTakeaways)
    ? entry.keyTakeaways
        .map((k: any) => (typeof k === 'string' ? k : k?.takeaway || k?.text || ''))
        .filter(Boolean)
    : []

  const sources = Array.isArray(entry.sources) ? entry.sources : []

  const faq: Array<{ question: string; answer: string }> = Array.isArray(entry.faq)
    ? entry.faq.filter((q: any) => q && q.question && q.answer)
    : []

  // Hero image: prefer first gallery image, fallback to seo.image, then null.
  const hero =
    (entry.images?.[0] as any)?.image ||
    (entry as any)?.meta?.image ||
    null

  return (
    <>
      <PrintPage
        locale={locale}
        name={entry.name}
        latinName={entry.latinName}
        shortDescription={entry.shortDescription}
        longDescription={entry.longDescription}
        family={entry.family}
        origin={entry.origin}
        partsUsed={entry.partsUsed}
        activeCompounds={entry.activeCompounds}
        harvest={entry.harvest}
        form={entry.form}
        conservation={entry.conservation}
        precautionsText={entry.precautionsText}
        precautions={entry.precautions}
        contraindications={entry.contraindications}
        directAnswer={entry.directAnswer}
        keyTakeaways={keyTakeaways}
        sources={sources}
        faq={faq}
        benefits={benefits}
        heroImage={hero}
        canonicalUrl={canonicalUrl}
      />
      <AutoPrint />
    </>
  )
}
