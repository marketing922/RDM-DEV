import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { richTextToPlain, calculateReadingTime } from '@/lib/utils'
import { BreadcrumbJsonLd, GeoStructuredData } from '@/components/seo'
import { getWikiEntryBySlug, getWikiEntries, getBlogPosts, getProducts } from '@/lib/queries'
import { siteMetadataBase } from '@/lib/metadata'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import {
  EditorialSection,
  EditorialFigure,
  EditorialAside,
  EditorialChapo,
  EditorialTable,
  CrossCard,
  FAQList,
} from '@/components/editorial/primitives'
import Reveal from '@/components/ui/Reveal'
import PlantActions from '@/components/plantes/PlantActions'
import PlantImage from '@/components/plantes/PlantImage'
import { DEFAULT_PLANT_IMAGE } from '@/lib/brand-assets'

export const revalidate = 3600
// Pré-génère les 30 plantes les plus récentes au build, le reste en ISR à
// la demande. Évite de pré-builder 100+ × 2 locales = 200+ pages au cold
// build (3-5min sinon, et explosion du Vercel build minutes Hobby).
export const dynamicParams = true

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

// ───────────────────────────────────────────────────────────
// Static params + metadata (preserved)
// ───────────────────────────────────────────────────────────

export async function generateStaticParams() {
  // Aucune page pré-générée au build — toutes générées à la demande
  // (dynamicParams=true) puis cachées via ISR. Réduit drastiquement la
  // consommation BD au build (Neon free tier).
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const entry = await getWikiEntryBySlug(slug, locale)
  if (!entry) return { title: `Not Found | ${dict.meta.siteName}` }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'
  const e = entry as any
  const imageUrl =
    (e.externalImageUrl as string | undefined) ??
    resolveMediaUrl(e.heroImage, 'card') ??
    resolveMediaUrl((e.images?.[0] as any)?.image, 'card') ??
    DEFAULT_PLANT_IMAGE

  return {
    metadataBase: siteMetadataBase(),
    title: `${entry.name} | ${dict.wiki.title} | ${dict.meta.siteName}`,
    description:
      e.directAnswer || e.shortDescription || `${entry.name} - ${e.latinName || ''}`,
    openGraph: {
      images: [{ url: imageUrl, width: 800, height: 600, alt: entry.name }],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/plantes/${slug}`,
      languages: {
        fr: `${siteUrl}/fr/plantes/${slug}`,
        en: `${siteUrl}/en/plantes/${slug}`,
      },
    },
  }
}

// ───────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────

function pad3(val: unknown, fallback = '001'): string {
  const s = String(val ?? '').replace(/\D/g, '')
  if (!s) return fallback
  return s.slice(-3).padStart(3, '0')
}

function formatDate(date: string | undefined, locale: string): string {
  if (!date) return ''
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date))
  } catch {
    return ''
  }
}

/** Split a plant name into (leading, lastWord). The last word is italicised in burgundy. */
function splitTitle(name: string): { lead: string; tail: string } {
  const trimmed = (name || '').trim()
  if (!trimmed) return { lead: '', tail: '' }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { lead: '', tail: parts[0] }
  const tail = parts.pop() as string
  return { lead: parts.join(' '), tail }
}

// ───────────────────────────────────────────────────────────
// Sprig SVG placeholder
// ───────────────────────────────────────────────────────────

function Sprig({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s2.5 3.5.5 9.2A7 7 0 0 1 11 20Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  )
}

// ───────────────────────────────────────────────────────────
// Page
// ───────────────────────────────────────────────────────────

export default async function PlantDetailPage({ params }: Props) {
  const { locale, slug } = await params

  const [dict, entry, { docs: allPlants }, { docs: blogPosts }] = await Promise.all([
    getDictionary(locale as Locale),
    getWikiEntryBySlug(slug, locale),
    getWikiEntries({ limit: 12, locale }),
    getBlogPosts({ limit: 3, locale }),
  ])
  if (!entry) notFound()

  const e = entry as any
  const plantName: string =
    e.name ||
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  const { lead: titleLead, tail: titleTail } = splitTitle(plantName)

  // ── Media --------------------------------------------------
  // Priorité : externalImageUrl (Cloudinary) → heroImage (upload Payload)
  // → images[0] (galerie upload) → fallback générique.
  const heroSrc: string | null =
    (e.externalImageUrl as string | undefined) ||
    resolveMediaUrl(e.heroImage, 'original') ||
    resolveMediaUrl((e.images?.[0] as any)?.image, 'original') ||
    null
  const heroFallback = DEFAULT_PLANT_IMAGE

  // Galerie : URLs Cloudinary additionnelles (galleryUrls) + uploads Payload (images[1+])
  // + auto-détection live des variants Cloudinary (slug-2, slug-tisane, ...).
  // Dédupe sur une URL normalisée : on retire le segment `/vNNNN/` (version
  // Cloudinary) et la query string, sinon `image/upload/v1778143602/...` et
  // `image/upload/...` (auto-détecté) sont considérés comme distincts alors
  // qu'ils servent le même asset.
  const galleryItems: Array<{ src: string; alt?: string; caption?: string }> = []
  // Map<sectionIndex (1-based), images[]> — images injectées inline après la
  // section N du contenu (Portrait, Histoire, Principes actifs, Usages…).
  // Les galleryUrls SANS sectionIndex (ou hors bornes 1-9) tombent dans
  // galleryItems = grille "Portrait botanique" comme avant (rétrocompat).
  const sectionImages = new Map<number, Array<{ src: string; alt?: string; caption?: string }>>()
  const seen = new Set<string>()
  const normalizeForDedupe = (url: string): string => {
    try {
      const u = new URL(url)
      const path = u.pathname
        .replace(/\/v\d+\//, '/')
        .replace(/\.(png|jpe?g|webp|avif)$/i, '')
      return `${u.host}${path}`.toLowerCase()
    } catch {
      return url.toLowerCase()
    }
  }
  const heroKey = heroSrc ? normalizeForDedupe(heroSrc) : ''
  const pushGallery = (src: string, extra?: { alt?: string; caption?: string }) => {
    if (!src) return
    const key = normalizeForDedupe(src)
    if (seen.has(key) || key === heroKey) return
    seen.add(key)
    galleryItems.push({ src, ...extra })
  }
  if (Array.isArray(e.galleryUrls)) {
    for (const g of e.galleryUrls) {
      const url = (g as any)?.url
      if (typeof url !== 'string' || !url.trim()) continue
      const caption = (g as any)?.caption
      const idx = typeof (g as any)?.sectionIndex === 'number' ? (g as any).sectionIndex : null
      // sectionIndex valide → injecte inline après la section N
      if (idx && idx >= 1 && idx <= 9) {
        const key = normalizeForDedupe(url)
        if (seen.has(key) || key === heroKey) continue
        seen.add(key)
        if (!sectionImages.has(idx)) sectionImages.set(idx, [])
        sectionImages.get(idx)!.push({ src: url, caption })
        continue
      }
      // Pas de sectionIndex → galerie classique (Portrait botanique grid)
      pushGallery(url, { caption })
    }
  }
  // Variantes auto-détectées : on lit le manifest persistant (`detectedVariants`,
  // peuplé par /api/refresh-plant-variants) au lieu de probe Cloudinary à
  // chaque render. Évite 128 HEAD requests par cold start Vercel.
  if (Array.isArray(e.detectedVariants)) {
    for (const dv of e.detectedVariants) {
      const url = (dv as any)?.url
      if (typeof url === 'string' && url.trim()) pushGallery(url)
    }
  }
  if (Array.isArray(e.images)) {
    for (let i = 0; i < e.images.length; i++) {
      const img = (e.images[i] as any)?.image
      const url = resolveMediaUrl(img, 'original')
      if (url) pushGallery(url, { alt: img?.alt })
    }
  }

  // Helper : rend les images galleryUrls ciblant cette section (sectionIndex=N).
  // Inséré juste après le contenu de chaque <EditorialSection>.
  // Utilise Image width/height (pas fill) pour respecter le ratio natif —
  // sinon les images se compressent en bande dans un parent sans hauteur fixée.
  const renderSectionImages = (n: number) => {
    const imgs = sectionImages.get(n)
    if (!imgs || imgs.length === 0) return null
    return (
      <div className="not-prose mt-8 mb-2 space-y-6 max-w-3xl">
        {imgs.map((img, i) => (
          <figure
            key={`section-${n}-img-${i}`}
            className="w-full overflow-hidden rounded-[8px] border border-rm-rule bg-rm-creamSoft"
          >
            <Image
              src={img.src}
              alt={img.alt || img.caption || ''}
              width={1200}
              height={800}
              sizes="(max-width: 768px) 100vw, 720px"
              className="w-full h-auto object-cover"
            />
            {img.caption && (
              <figcaption className="px-3 py-2 font-serif italic text-[12px] text-rm-inkSoft">
                {img.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    )
  }

  // ── Textual content ---------------------------------------
  const longText: string =
    e.longDescription || (e.description ? richTextToPlain(e.description) : '')
  const shortText: string =
    e.shortDescription ||
    (longText ? longText.split('\n\n')[0] : '') ||
    ''
  const precautionsText: string =
    e.precautionsText ||
    (e.contraindications ? richTextToPlain(e.contraindications) : '') ||
    (e.precautions ? richTextToPlain(e.precautions) : '')

  const activeCompoundsText: string =
    typeof e.activeCompounds === 'string'
      ? e.activeCompounds
      : e.activeCompounds
        ? richTextToPlain(e.activeCompounds)
        : ''

  // ── Meta --------------------------------------------------
  const fiche = pad3(e.id)
  const updatedLabel = formatDate(e.updatedAt || e.publishedAt, locale)
  const authorName: string =
    (e.author && typeof e.author === 'object' && (e.author.name || e.author.fullName)) ||
    (typeof e.author === 'string' ? e.author : '') ||
    'L’équipe Remèdes de Mamie'

  const readingMinutes = calculateReadingTime(
    [shortText, longText, activeCompoundsText, precautionsText].filter(Boolean).join(' '),
  )

  // ── Benefits ----------------------------------------------
  const benefits: Array<{ id?: any; name: string; slug: string; bodyRegion?: string }> =
    Array.isArray(e.benefits)
      ? e.benefits.filter((b: any) => b && typeof b === 'object' && b.name)
      : []

  // ── Related products (via shared benefits) ----------------
  const benefitIds = benefits
    .map((b: any) => b.id ?? b._id)
    .filter(Boolean)
  const { docs: relatedProducts } =
    benefitIds.length > 0
      ? await getProducts({ limit: 4, locale, benefitIds })
      : ({ docs: [] as any[] } as any)

  const benefitDotColor = (region?: string): string => {
    switch ((region || '').toLowerCase()) {
      case 'head':
      case 'tete':
      case 'tête':
        return 'bg-rm-burgundy'
      case 'chest':
      case 'thorax':
      case 'poitrine':
        return 'bg-rm-teal'
      case 'belly':
      case 'ventre':
      case 'digestif':
        return 'bg-rm-ochre'
      case 'skin':
      case 'peau':
        return 'bg-rm-burgundy'
      default:
        return 'bg-rm-ochre'
    }
  }

  // ── Tag chips ---------------------------------------------
  const rawTags: string[] = Array.isArray(e.tags)
    ? e.tags
        .map((t: any) => (typeof t === 'string' ? t : t?.tag || t?.name || t?.label))
        .filter(Boolean)
    : []
  const derivedTags = [e.partsUsed, e.form, e.bodyRegion].filter(Boolean) as string[]
  const tagChips = (rawTags.length ? rawTags : derivedTags).slice(0, 6)

  // ── En bref ------------------------------------------------
  const enBref: Array<{ label: string; value: string }> = [
    { label: 'Partie utilisée', value: e.partsUsed },
    { label: 'Cueillette', value: e.harvest },
    { label: 'Goût', value: e.taste || e.flavor },
    { label: 'Énergie MTC', value: e.mtcEnergy || e.tcmEnergy || e.energy },
    { label: 'Pays d’origine', value: e.origin },
  ].filter((r) => r.value) as Array<{ label: string; value: string }>

  // ── Fiche technique (14 cells max, as 2-col key/value pairs) ----
  const ficheTechnique: Array<{ label: string; value: string }> = [
    { label: 'Nom latin', value: e.latinName },
    { label: 'Famille', value: e.family },
    { label: 'Parties utilisées', value: e.partsUsed },
    { label: 'Récolte', value: e.harvest },
    { label: 'Forme', value: e.form },
    { label: 'Origine', value: e.origin },
    { label: 'Conservation', value: e.conservation },
  ].filter((r) => r.value) as Array<{ label: string; value: string }>

  // ── Key takeaways ------------------------------------------
  const keyTakeaways: string[] = Array.isArray(e.keyTakeaways)
    ? e.keyTakeaways
        .map((k: any) =>
          typeof k === 'string' ? k : k?.takeaway || k?.text || '',
        )
        .filter(Boolean)
    : []

  // ── FAQ ----------------------------------------------------
  const faqItems: Array<{ question: string; answer: string }> = Array.isArray(e.faq)
    ? e.faq.filter((q: any) => q && q.question && q.answer)
    : []

  // ── Sources ------------------------------------------------
  const sources: Array<{
    title?: string
    publisher?: string
    year?: number | string
    url?: string
  }> = Array.isArray(e.sources) ? e.sources : []

  // ── Direct answer (used as § 1 intro fallback) -------------
  const directAnswer: string = e.directAnswer || ''

  // ── Related data ------------------------------------------
  const neighbourPlants = allPlants.filter((p: any) => p.slug !== slug).slice(0, 5)
  const sidebarPlants = neighbourPlants.slice(0, 4)
  const citingPosts = Array.isArray(blogPosts) ? blogPosts.slice(0, 3) : []

  // ── Sommaire (only sections with data) --------------------
  const sommaire: Array<{ num: string; id: string; label: string; show: boolean }> = [
    { num: '01', id: 'portrait', label: 'Portrait botanique', show: true },
    {
      num: '02',
      id: 'histoire',
      label: 'Histoire',
      show: Boolean(longText),
    },
    {
      num: '03',
      id: 'principes-actifs',
      label: 'Principes actifs',
      show: Boolean(activeCompoundsText),
    },
    { num: '04', id: 'usages', label: 'Usages', show: keyTakeaways.length > 0 || benefits.length > 0 },
    {
      num: '05',
      id: 'preparations',
      label: 'Préparations & posologie',
      show: Boolean(e.form || e.harvest || e.conservation),
    },
    {
      num: '06',
      id: 'precautions',
      label: 'Précautions',
      show: Boolean(precautionsText),
    },
    {
      num: '07',
      id: 'fiche-technique',
      label: 'Fiche technique',
      show: ficheTechnique.length > 0,
    },
    {
      num: '08',
      id: 'a-retenir',
      label: 'À retenir',
      show: keyTakeaways.length > 0 || Boolean(directAnswer),
    },
    { num: '09', id: 'faq', label: 'FAQ', show: faqItems.length > 0 },
  ]
  const activeSommaire = sommaire.filter((s) => s.show)

  // ═══════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-rm-cream text-rm-ink font-sans">
      <BreadcrumbJsonLd
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: dict.wiki.title, href: `/${locale}/plantes` },
          { label: plantName, href: `/${locale}/plantes/${slug}` },
        ]}
      />
      <GeoStructuredData
        kind="plant"
        locale={locale}
        slug={slug}
        name={plantName}
        image={heroSrc || heroFallback}
        publishedAt={e.publishedAt}
        updatedAt={e.updatedAt}
        geo={{
          directAnswer: e.directAnswer,
          definition: e.definition,
          keyTakeaways: e.keyTakeaways,
          quotableStatements: e.quotableStatements,
          dataPoints: e.dataPoints,
          faq: e.faq,
          authoritySignals: e.authoritySignals,
          sources: e.sources,
          lastFactCheckedAt: e.lastFactCheckedAt,
        }}
      />

      {/* ═════════ Breadcrumb ═════════ */}
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.wiki.title, href: `/${locale}/plantes` },
            { label: plantName },
          ]}
        />
      </div>

      {/* ═════════ Title block ═════════ */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-4 pb-7 border-b border-rm-rule">
        <Reveal>
          <div className="grid lg:grid-cols-[1fr_360px] gap-6 sm:gap-10 lg:gap-14 items-start">
            {/* Left — text */}
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-rm-burgundy">
                N° {fiche} · Fiche botanique
              </p>
              <h1 className="mt-3 sm:mt-4 font-display text-[36px] sm:text-[48px] md:text-[64px] lg:text-[88px] leading-[0.95] tracking-[-0.02em] text-rm-teal font-normal">
                {titleLead && <span>{titleLead} </span>}
                <span className="italic text-rm-burgundy">{titleTail}</span>
              </h1>
              {e.latinName && (
                <p className="mt-3 sm:mt-4 font-serif italic text-[16px] sm:text-[20px] md:text-[22px] text-rm-burgundy/90">
                  {e.latinName}
                </p>
              )}
              <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[12px] text-rm-inkSoft">
                {updatedLabel && <span>Mis à jour le {updatedLabel}</span>}
                {authorName && (
                  <>
                    <span aria-hidden>·</span>
                    <span>Par {authorName}</span>
                  </>
                )}
                <span aria-hidden>·</span>
                <span>{readingMinutes} min de lecture</span>
              </div>

              {tagChips.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {tagChips.map((tag, i) => (
                    <span
                      key={`${tag}-${i}`}
                      className="inline-flex items-center font-sans text-[11px] text-rm-inkSoft bg-rm-creamSoft border border-rm-rule rounded-full px-2.5 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right — square image */}
            <div className="relative aspect-square w-full max-w-[280px] sm:max-w-[360px] justify-self-start lg:justify-self-end overflow-hidden rounded-[4px] border border-rm-rule bg-rm-creamSoft">
              <PlantImage
                src={heroSrc}
                alt={plantName}
                sizes="(max-width: 1024px) 100vw, 360px"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═════════ Body 3-column ═════════ */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-14">
        <div className="grid lg:grid-cols-[220px_1fr_300px] gap-8 sm:gap-10 lg:gap-14">
          {/* ── Left sticky sommaire ───────────────────────────── */}
          <aside className="order-2 lg:order-1 lg:sticky lg:top-20 lg:self-start">
            <details className="lg:hidden mb-4 border border-rm-rule rounded-[8px] bg-rm-paper [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-rm-burgundy">
                <span>Sommaire ({activeSommaire.length})</span>
                <span aria-hidden className="text-rm-ochre">+</span>
              </summary>
              <ol className="border-t border-rm-rule px-4 pb-2">
                {activeSommaire.map((s, i) => (
                  <li key={s.id} className="border-b border-rm-rule last:border-b-0">
                    <a
                      href={`#${s.id}`}
                      className={`flex items-baseline gap-3 py-2.5 font-sans text-[13px] transition-colors hover:text-rm-burgundy ${
                        i === 0 ? 'text-rm-burgundy font-semibold' : 'text-rm-inkSoft'
                      }`}
                    >
                      <span className="font-mono text-[11px] text-rm-ochre w-6 flex-shrink-0">
                        {s.num}
                      </span>
                      <span>{s.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </details>

            <div className="hidden lg:block font-mono text-[11px] uppercase tracking-[0.2em] text-rm-burgundy mb-4">
              Sommaire
            </div>
            <ol className="hidden lg:block border-t border-rm-rule">
              {activeSommaire.map((s, i) => (
                <li
                  key={s.id}
                  className="border-b border-rm-rule"
                >
                  <a
                    href={`#${s.id}`}
                    className={`flex items-baseline gap-3 py-2.5 font-sans text-[13px] transition-colors hover:text-rm-burgundy ${
                      i === 0
                        ? 'text-rm-burgundy font-semibold'
                        : 'text-rm-inkSoft'
                    }`}
                  >
                    <span className="font-mono text-[11px] text-rm-ochre w-6 flex-shrink-0">
                      {s.num}
                    </span>
                    <span>{s.label}</span>
                  </a>
                </li>
              ))}
            </ol>

            {enBref.length > 0 && (
              <div className="mt-8 bg-rm-paper border border-rm-rule rounded-[10px] p-4">
                <div className="font-display text-[16px] text-rm-teal mb-3 pb-2 border-b border-rm-rule">
                  En bref
                </div>
                <dl className="space-y-2.5 text-[12px]">
                  {enBref.map((row) => (
                    <div key={row.label} className="flex justify-between gap-3">
                      <dt className="text-rm-inkSoft">{row.label}</dt>
                      <dd className="text-rm-ink font-semibold text-right font-serif">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <PlantActions
              title={`${e.name || 'Fiche plante'} — Les Remèdes de Mamie`}
              description={shortText || directAnswer || undefined}
              printUrl={`/${locale}/plantes/${slug}/print`}
            />

            {relatedProducts.length > 0 && (
              <div className="mt-6 bg-rm-paper border border-rm-rule rounded-[10px] p-4 print:hidden">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-rm-rule">
                  <span className="font-display text-[15px] text-rm-teal">
                    Produits associés
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-rm-ochre">
                    {relatedProducts.length}
                  </span>
                </div>
                <ul className="space-y-3 list-none pl-0 max-h-[320px] overflow-y-auto pr-1 -mr-1">
                  {relatedProducts.map((p: any) => {
                    const img =
                      resolveMediaUrl((p.images?.[0] as any)?.image, 'thumbnail') ||
                      p.externalImageUrl ||
                      null
                    return (
                      <li
                        key={p.slug || p.id}
                        className="border-b border-rm-rule pb-3 last:border-b-0 last:pb-0"
                      >
                        <Link
                          href={`/${locale}/produits/${p.slug}`}
                          className="grid grid-cols-[40px_1fr] gap-3 group"
                        >
                          <div className="relative w-10 h-10 bg-rm-creamSoft border border-rm-rule overflow-hidden rounded">
                            {img ? (
                              <Image
                                src={img}
                                alt={p.name || ''}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <div className="font-serif text-[13px] text-rm-ink leading-snug group-hover:text-rm-burgundy transition-colors line-clamp-2">
                              {p.name}
                            </div>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </aside>

          {/* ── Center article ─────────────────────────────────── */}
          <article className="order-1 lg:order-2 min-w-0">
            {/* Chapô */}
            {(shortText || directAnswer) && (
              <Reveal>
                <EditorialChapo>{shortText || directAnswer}</EditorialChapo>
              </Reveal>
            )}

            {/* § 1 — Portrait botanique */}
            <Reveal>
              <EditorialSection id="portrait" num="01" title="Portrait botanique">
                <div className="space-y-4 font-serif text-[16px] leading-[1.7] text-rm-ink">
                  {e.family && (
                    <p>
                      <span className="font-semibold text-rm-teal">Famille : </span>
                      {e.family}
                      {e.origin && (
                        <>
                          {' '}— originaire{' '}
                          <span className="italic">{e.origin}</span>.
                        </>
                      )}
                    </p>
                  )}
                  {e.partsUsed && (
                    <p>
                      <span className="font-semibold text-rm-teal">
                        Parties utilisées :{' '}
                      </span>
                      {e.partsUsed}
                      {e.harvest && (
                        <>
                          {' '}— récolte {e.harvest.toLowerCase()}.
                        </>
                      )}
                    </p>
                  )}
                  {directAnswer && <p>{directAnswer}</p>}
                </div>

                {/* Planche botanique : prioritise la 1re variante de galerie
                    (différente de l'image principale du header), sinon
                    fallback sur le hero pour ne jamais laisser un cadre vide. */}
                {(() => {
                  const figureSrc = galleryItems[0]?.src || heroSrc
                  const figureCaption =
                    galleryItems[0]?.caption ||
                    `${plantName}${e.latinName ? ` — ${e.latinName}` : ''}. Planche botanique.`
                  if (!figureSrc) return null
                  return (
                    <EditorialFigure caption={figureCaption}>
                      <PlantImage
                        src={figureSrc}
                        alt={galleryItems[0]?.alt || plantName}
                        sizes="(max-width: 1024px) 100vw, 640px"
                        className="object-cover"
                      />
                    </EditorialFigure>
                  )
                })()}

                {/* Galerie : variantes additionnelles (à partir de la 2e),
                    seulement si on en a au moins 2. */}
                {galleryItems.length > 1 && (
                  <div className="mt-8">
                    <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-rm-burgundy mb-3">
                      Autres planches
                    </p>
                    <div className={`grid gap-3 ${
                      galleryItems.length === 2 ? 'grid-cols-1 max-w-md' :
                      galleryItems.length === 3 ? 'grid-cols-2' :
                      'grid-cols-2 sm:grid-cols-3'
                    }`}>
                      {galleryItems.slice(1).map((item, i) => (
                        <figure key={i} className="space-y-2">
                          <div className="relative aspect-square overflow-hidden rounded-[4px] border border-rm-rule bg-rm-creamSoft">
                            <PlantImage
                              src={item.src}
                              alt={item.alt || `${plantName} — variante ${i + 2}`}
                              sizes="(max-width: 640px) 50vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                          {item.caption && (
                            <figcaption className="font-serif italic text-[12px] leading-snug text-rm-inkSoft text-center">
                              {item.caption}
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  </div>
                )}

                <EditorialAside kind="À ne pas confondre">
                  Attention aux espèces voisines qui peuvent présenter un
                  profil d’usage et une toxicité différents. Vérifiez
                  toujours l’identification avant toute cueillette sauvage et
                  privilégiez, au moindre doute, un fournisseur de confiance.
                </EditorialAside>
                {renderSectionImages(1)}
              </EditorialSection>
            </Reveal>

            {/* § 2 — Histoire */}
            {longText && (
              <Reveal>
                <EditorialSection id="histoire" num="02" title="Histoire">
                  <div className="space-y-4 font-serif text-[16px] leading-[1.7] text-rm-ink">
                    {longText.split('\n\n').map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  {renderSectionImages(2)}
                </EditorialSection>
              </Reveal>
            )}

            {/* § 3 — Principes actifs */}
            {activeCompoundsText && (
              <Reveal>
                <EditorialSection
                  id="principes-actifs"
                  num="03"
                  title="Principes actifs"
                >
                  <div className="space-y-4 font-serif text-[16px] leading-[1.7] text-rm-ink">
                    {activeCompoundsText.split('\n\n').map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  {renderSectionImages(3)}
                </EditorialSection>
              </Reveal>
            )}

            {/* § 4 — Usages */}
            {(keyTakeaways.length > 0 || benefits.length > 0) && (
              <Reveal>
                <EditorialSection id="usages" num="04" title="Usages">
                  {keyTakeaways.length > 0 ? (
                    <ul className="space-y-3 font-serif text-[16px] leading-[1.7] text-rm-ink list-none pl-0">
                      {keyTakeaways.map((k, i) => (
                        <li
                          key={i}
                          className="flex items-baseline gap-3 border-b border-rm-rule pb-3"
                        >
                          <span className="font-mono text-[12px] text-rm-ochre flex-shrink-0">
                            — {String(i + 1).padStart(2, '0')}
                          </span>
                          <span>{k}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 font-serif text-[15px] text-rm-ink list-none pl-0">
                      {benefits.map((b) => (
                        <li
                          key={b.slug}
                          className="flex items-center gap-2.5 border border-rm-rule rounded-full px-4 py-2 bg-rm-paper"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${benefitDotColor(b.bodyRegion)}`}
                          />
                          <Link
                            href={`/${locale}/bienfaits/${b.slug}`}
                            className="hover:text-rm-burgundy transition-colors"
                          >
                            {b.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {renderSectionImages(4)}
                </EditorialSection>
              </Reveal>
            )}

            {/* § 5 — Préparations & posologie */}
            {(e.form || e.harvest || e.conservation) && (
              <Reveal>
                <EditorialSection
                  id="preparations"
                  num="05"
                  title="Préparations & posologie"
                >
                  <EditorialTable
                    headers={['Étape', 'Indication']}
                    rows={[
                      e.form ? ['Forme', e.form] : null,
                      e.harvest ? ['Récolte', e.harvest] : null,
                      e.conservation ? ['Conservation', e.conservation] : null,
                      e.partsUsed ? ['Partie utilisée', e.partsUsed] : null,
                    ].filter(Boolean) as Array<Array<string>>}
                  />
                  {renderSectionImages(5)}
                </EditorialSection>
              </Reveal>
            )}

            {/* § 6 — Précautions */}
            {precautionsText && (
              <Reveal>
                <EditorialSection id="precautions" num="06" title="Précautions">
                  <EditorialAside kind="Prudence" tone="ochre">
                    <div className="space-y-3 font-serif text-[15px] leading-[1.6] text-rm-ink">
                      {precautionsText.split('\n\n').map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </EditorialAside>
                  <p className="mt-4 font-sans text-[12px] text-rm-inkSoft">
                    Ces informations ne remplacent pas l’avis d’un
                    professionnel de santé.{' '}
                    <Link
                      href={`/${locale}/avertissement-sante`}
                      className="text-rm-burgundy hover:underline"
                    >
                      Avertissement santé →
                    </Link>
                  </p>
                  {renderSectionImages(6)}
                </EditorialSection>
              </Reveal>
            )}

            {/* § 7 — Fiche technique */}
            {ficheTechnique.length > 0 && (
              <Reveal>
                <EditorialSection
                  id="fiche-technique"
                  num="07"
                  title="Fiche technique"
                >
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 border-t border-rm-rule">
                    {ficheTechnique.map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between gap-4 py-3 border-b border-rm-rule"
                      >
                        <dt className="font-sans text-[11px] uppercase tracking-[0.12em] text-rm-inkSoft">
                          {row.label}
                        </dt>
                        <dd className="font-serif text-[15px] text-rm-ink text-right">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {renderSectionImages(7)}
                </EditorialSection>
              </Reveal>
            )}

            {/* § 8 — À retenir */}
            {(keyTakeaways.length > 0 || directAnswer) && (
              <Reveal>
                <EditorialSection id="a-retenir" num="08" title="À retenir">
                  <div className="bg-rm-teal text-rm-cream rounded-[12px] p-5 sm:p-7 md:p-9">
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-rm-cream/70 mb-4">
                      L’essentiel
                    </div>
                    <ol className="space-y-4 font-serif text-[16px] md:text-[17px] leading-[1.6] list-none pl-0">
                      {(keyTakeaways.length > 0
                        ? keyTakeaways
                        : directAnswer
                          ? directAnswer
                              .split(/(?<=[.!?])\s+/)
                              .slice(0, 5)
                              .filter((s) => s.trim().length > 10)
                          : []
                      )
                        .slice(0, 5)
                        .map((k, i) => (
                          <li key={i} className="flex items-baseline gap-4">
                            <span className="font-mono text-[12px] text-rm-ochre flex-shrink-0 w-6">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span>{k}</span>
                          </li>
                        ))}
                    </ol>
                  </div>
                  {renderSectionImages(8)}
                </EditorialSection>
              </Reveal>
            )}

            {/* § 9 — FAQ */}
            {faqItems.length > 0 && (
              <Reveal>
                <EditorialSection id="faq" num="09" title="FAQ">
                  <FAQList
                    items={faqItems.map((item) => ({
                      q: item.question,
                      a: (
                        <div className="space-y-3">
                          {String(item.answer)
                            .split('\n\n')
                            .map((p, i) => (
                              <p key={i}>{p}</p>
                            ))}
                        </div>
                      ),
                    }))}
                  />
                  {renderSectionImages(9)}
                </EditorialSection>
              </Reveal>
            )}

          </article>

          {/* ── Right sticky sidebar (avec scroll interne si trop longue) ───────────────────────────── */}
          <aside className="order-3 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 space-y-5">
            {/* Ses bienfaits */}
            <CrossCard
              title="Ses bienfaits"
              badge={benefits.length ? benefits.length : undefined}
            >
              {benefits.length > 0 ? (
                <ul className="flex flex-wrap gap-2 list-none pl-0">
                  {benefits.slice(0, 8).map((b) => (
                    <li key={b.slug}>
                      <Link
                        href={`/${locale}/bienfaits/${b.slug}`}
                        className="inline-flex items-center gap-1.5 font-sans text-[12px] text-rm-ink bg-rm-creamSoft border border-rm-rule rounded-full px-3 py-1 hover:border-rm-burgundy hover:text-rm-burgundy transition-colors"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${benefitDotColor(b.bodyRegion)}`}
                        />
                        {b.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-sans text-[12px] text-rm-inkSoft">
                  Bientôt renseigné.
                </p>
              )}
            </CrossCard>

            {/* Articles associés */}
            <CrossCard title="Articles associés">
              {citingPosts.length > 0 ? (
                <ul className="space-y-3 list-none pl-0">
                  {citingPosts.map((post: any) => (
                    <li key={post.slug} className="border-b border-rm-rule pb-3 last:border-b-0 last:pb-0">
                      <Link
                        href={`/${locale}/blog/${post.slug}`}
                        className="block font-serif text-[14px] leading-[1.4] text-rm-ink hover:text-rm-burgundy transition-colors"
                      >
                        {post.title}
                      </Link>
                      {post.publishedAt && (
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-rm-inkSoft">
                          {formatDate(post.publishedAt, locale)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-sans text-[12px] text-rm-inkSoft">
                  Bientôt.
                </p>
              )}
            </CrossCard>

            {/* Plantes voisines */}
            <CrossCard title="Plantes voisines">
              {sidebarPlants.length > 0 ? (
                <ul className="space-y-3 list-none pl-0">
                  {sidebarPlants.map((p: any) => (
                    <li
                      key={p.slug}
                      className="border-b border-rm-rule pb-3 last:border-b-0 last:pb-0"
                    >
                      <Link
                        href={`/${locale}/plantes/${p.slug}`}
                        className="block group"
                      >
                        <div className="font-display text-[15px] text-rm-teal group-hover:text-rm-burgundy transition-colors">
                          {p.name}
                        </div>
                        {p.latinName && (
                          <div className="font-serif italic text-[12px] text-rm-inkSoft">
                            {p.latinName}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-sans text-[12px] text-rm-inkSoft">
                  Bientôt.
                </p>
              )}
            </CrossCard>
          </aside>
        </div>
      </section>

      {/* ═════════ Plantes à son chevet ═════════ */}
      {neighbourPlants.length > 0 && (
        <section className="bg-rm-teal text-rm-cream py-12 sm:py-16 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="mb-8 sm:mb-10 lg:mb-14">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-rm-cream/70">
                  Ses voisines de parcelle
                </p>
                <h2 className="mt-3 font-display text-[32px] sm:text-[40px] md:text-[56px] leading-[1] text-rm-cream">
                  Plantes{' '}
                  <span className="italic text-rm-cream">à son chevet</span>
                </h2>
              </div>
            </Reveal>

            <Reveal>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 lg:gap-6">
                {neighbourPlants.map((p: any, i: number) => {
                  const imgSrc =
                    (p.externalImageUrl as string | undefined) ??
                    resolveMediaUrl(p.heroImage, 'card') ??
                    resolveMediaUrl((p.images?.[0] as any)?.image, 'card') ??
                    null
                  const keyword =
                    (Array.isArray(p.benefits) &&
                      p.benefits[0] &&
                      (p.benefits[0] as any).name) ||
                    p.partsUsed ||
                    p.form ||
                    'Plante amie'
                  return (
                    <Link
                      key={p.slug}
                      href={`/${locale}/plantes/${p.slug}`}
                      className="group block"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-[4px] border border-rm-cream/20 bg-rm-cream/5">
                        {imgSrc ? (
                          <Image
                            src={imgSrc}
                            alt={p.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 20vw"
                            className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sprig className="h-16 w-16 text-rm-cream/40" />
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rm-cream/60">
                          N° {pad3(p.id, String(i + 1).padStart(3, '0'))}
                        </p>
                        <p className="mt-1 font-display text-[20px] leading-[1.1] text-rm-cream group-hover:text-rm-ochre transition-colors">
                          {p.name}
                        </p>
                        {p.latinName && (
                          <p className="mt-0.5 font-serif italic text-[12px] text-rm-cream/70">
                            {p.latinName}
                          </p>
                        )}
                        <p className="mt-2 font-sans text-[11px] text-rm-cream/60">
                          Partagent · {keyword}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ═════════ Articles qui la citent ═════════ */}
      {citingPosts.length > 0 && (
        <section className="bg-rm-cream border-t border-rm-rule py-12 sm:py-16 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="mb-8 sm:mb-10 flex items-baseline justify-between gap-6">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-rm-burgundy">
                    Journal
                  </p>
                  <h2 className="mt-3 font-display text-[28px] sm:text-[36px] md:text-[48px] leading-[1.05] text-rm-teal">
                    Articles qui la{' '}
                    <span className="italic text-rm-burgundy">citent</span>
                  </h2>
                </div>
                <Link
                  href={`/${locale}/blog`}
                  className="hidden md:inline-flex font-sans text-[13px] text-rm-burgundy hover:underline"
                >
                  Voir tout le journal →
                </Link>
              </div>
            </Reveal>

            <Reveal>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {citingPosts.map((post: any) => {
                  const imgSrc =
                    (typeof post.externalImageUrl === 'string' && post.externalImageUrl.trim()
                      ? post.externalImageUrl.trim()
                      : null) ||
                    resolveMediaUrl(post.featuredImage, 'card') ||
                    resolveMediaUrl(post.coverImage, 'card') ||
                    resolveMediaUrl(post.heroImage, 'card') ||
                    null
                  return (
                    <Link
                      key={post.slug}
                      href={`/${locale}/blog/${post.slug}`}
                      className="group block bg-rm-paper border border-rm-rule rounded-[6px] overflow-hidden hover:border-rm-burgundy/40 transition-colors"
                    >
                      <div className="relative aspect-[4/3] bg-rm-creamSoft">
                        {imgSrc ? (
                          <Image
                            src={imgSrc}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sprig className="h-20 w-20 text-rm-teal/25" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        {post.publishedAt && (
                          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rm-burgundy">
                            {formatDate(post.publishedAt, locale)}
                          </p>
                        )}
                        <h3 className="mt-2 font-display text-[20px] leading-[1.2] text-rm-teal group-hover:text-rm-burgundy transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="mt-2 font-serif text-[14px] leading-[1.55] text-rm-inkSoft line-clamp-3">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </main>
  )
}
