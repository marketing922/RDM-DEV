import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { richTextToPlain, formatPrice } from '@/lib/utils'
import { ArticleJsonLd, BreadcrumbJsonLd, GeoStructuredData } from '@/components/seo'
import {
  EditorialSection,
  EditorialAside,
  EditorialChapo,
  CrossCard,
} from '@/components/editorial/primitives'
import Reveal from '@/components/ui/Reveal'
import {
  getBlogPosts,
  getBlogPostBySlug,
  getWikiEntries,
  getProducts,
} from '@/lib/queries'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import NewsletterForm from '@/components/home/NewsletterForm'
import BlogActions from '@/components/blog/BlogActions'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 3600

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function initialsOf(name?: string): string {
  if (!name) return 'RM'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDate(d: string | undefined, locale: string): string {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

function estimateWords(plain: string): number {
  return plain ? plain.trim().split(/\s+/).length : 0
}

/** Split title on last word group → burgundy italic emphasis on the tail. */
function splitTitleForEmphasis(title: string): { head: string; tail: string } {
  const trimmed = title.trim()
  const words = trimmed.split(/\s+/)
  if (words.length <= 2) return { head: '', tail: trimmed }
  const tailCount = Math.min(3, Math.max(2, Math.round(words.length / 3)))
  const head = words.slice(0, words.length - tailCount).join(' ')
  const tail = words.slice(words.length - tailCount).join(' ')
  return { head, tail }
}

type SectionImage = {
  url: string
  alt?: string
  width?: number
  height?: number
  caption?: string
}

type ExtractedSection = {
  id: string
  title: string
  paragraphs: string[]
  images: SectionImage[]
}

/** Extract section titles from Lexical richText (h2/h3/h4), fallback when none. */
function extractSections(content: unknown): ExtractedSection[] {
  const sections: ExtractedSection[] = []
  if (!content || typeof content !== 'object' || !('root' in (content as any))) {
    return sections
  }
  const root = (content as any).root
  const children: any[] = Array.isArray(root?.children) ? root.children : []

  const textOf = (node: any): string => {
    if (!node) return ''
    if (typeof node.text === 'string') return node.text
    if (Array.isArray(node.children)) return node.children.map(textOf).join('')
    return ''
  }

  // Lexical can serialize headings with `tag: 'h2'` (string) or `tag: 2` (number),
  // depending on plugin/version. We accept h1..h4 as a section break (some
  // editors mis-use h1 for sub-titles inside the body).
  const isHeadingNode = (node: any): boolean => {
    if (!node || node.type !== 'heading') return false
    const t = node.tag
    return (
      t === 'h1' || t === 'h2' || t === 'h3' || t === 'h4' ||
      t === 1 || t === 2 || t === 3 || t === 4
    )
  }

  // Heuristic fallback: a paragraph that *looks* like a heading
  // ("1. La tisane de thym", "Conseils pratiques", etc.) when the editor
  // didn't apply a real heading style. Bold is a hint but not required.
  const looksLikeHeadingParagraph = (node: any): boolean => {
    if (!node || node.type !== 'paragraph') return false
    const kids: any[] = Array.isArray(node.children) ? node.children : []
    if (kids.length === 0) return false
    const text = textOf(node).trim()
    if (!text) return false
    // Pattern A: numbered prefix ("1. ", "2) ", "12. ") — very strong signal,
    // accept up to 120 chars even without bold.
    const numbered = /^\d+\s*[.)]\s+\S/.test(text)
    if (numbered && text.length <= 120) return true
    // Pattern B: short non-numbered paragraph without terminal punctuation
    // (likely a heading like "Conseils pratiques pour vos tisanes d'hiver").
    // Tighter length cap to avoid swallowing legitimate short paragraphs.
    const noTerminalPunct = !/[.!?…»"”]$/.test(text) && !/:$/.test(text)
    if (noTerminalPunct && text.length <= 80 && text.length >= 8) {
      // Reject sentences containing connectives that suggest mid-sentence content.
      if (/^(et|mais|or|donc|car|puis|alors)\b/i.test(text)) return false
      return true
    }
    return false
  }

  // Pull a populated upload node into a SectionImage. With Payload's depth>=1,
  // `value` is a populated media doc; otherwise it's a raw id (skip).
  const imageFromUploadNode = (node: any): SectionImage | null => {
    if (!node || node.type !== 'upload') return null
    const v = node.value
    if (!v || typeof v !== 'object') return null
    const url = typeof v.url === 'string' ? v.url : ''
    if (!url) return null
    return {
      url,
      alt: typeof v.alt === 'string' ? v.alt : undefined,
      width: typeof v.width === 'number' ? v.width : undefined,
      height: typeof v.height === 'number' ? v.height : undefined,
    }
  }

  // Detect the legacy "Photo : … (URL)" italic-paragraph caption that older
  // pipeline runs left in the body so we can drop it from rendering.
  const isLegacyPhotoCaption = (node: any): boolean => {
    if (!node || node.type !== 'paragraph') return false
    const text = textOf(node).trim()
    if (!text) return false
    return /^Photo\s*:/i.test(text) && /unsplash|wikimedia|wikipedia|commons/i.test(text)
  }

  let current: ExtractedSection | null = null
  const seenIds = new Set<string>()
  const slugify = (raw: string, fallbackIdx: number): string => {
    const base = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    let id = base || `section-${fallbackIdx}`
    let n = 2
    while (seenIds.has(id)) {
      id = `${base || 'section'}-${n++}`
    }
    seenIds.add(id)
    return id
  }

  for (const node of children) {
    if (isHeadingNode(node) || looksLikeHeadingParagraph(node)) {
      if (current) sections.push(current)
      const title = textOf(node).trim()
      const id = slugify(title, sections.length + 1)
      current = { id, title, paragraphs: [], images: [] }
      continue
    }

    // Inline images (upload nodes) — attach to the current section. If we
    // encounter one before any heading, open an Introduction section so the
    // image still renders in the body.
    const img = imageFromUploadNode(node)
    if (img) {
      if (!current) {
        current = { id: 'introduction', title: 'Introduction', paragraphs: [], images: [] }
        seenIds.add('introduction')
      }
      current.images.push(img)
      continue
    }

    // Drop legacy URL-included photo captions left by older pipeline runs.
    if (isLegacyPhotoCaption(node)) continue

    const para = textOf(node).trim()
    if (!para) continue
    if (!current) {
      current = { id: 'introduction', title: 'Introduction', paragraphs: [], images: [] }
      seenIds.add('introduction')
    }
    current.paragraphs.push(para)
  }

  if (current) sections.push(current)
  return sections
}

/* ─── generateStaticParams / generateMetadata ────────────────────── */

export async function generateStaticParams() {
  try {
    const { docs: posts } = await getBlogPosts({ limit: 999 })
    const params: Array<{ locale: string; slug: string }> = []
    for (const post of posts) {
      const slug = (post as any).slug
      if (slug) {
        params.push({ locale: 'fr', slug })
        params.push({ locale: 'en', slug })
      }
    }
    return params
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const post = await getBlogPostBySlug(slug, locale)

  if (!post) {
    return { title: `Not Found | ${dict.meta.siteName}` }
  }

  const p = post as any
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'

  return {
    metadataBase: siteMetadataBase(),
    title: `${p.title} | ${dict.blog.title} | ${dict.meta.siteName}`,
    description: p.directAnswer || p.excerpt || `${dict.blog.subtitle}`,
    openGraph: {
      ...(() => {
        const ogUrl = resolveMediaUrl(p.featuredImage, 'card')
        return ogUrl
          ? { images: [{ url: ogUrl, width: 1200, height: 630, alt: p.title }] }
          : {}
      })(),
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/blog/${slug}`,
      languages: {
        fr: `${siteUrl}/fr/blog/${slug}`,
        en: `${siteUrl}/en/blog/${slug}`,
      },
    },
  }
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default async function BlogDetailPage({ params }: Props) {
  const { locale, slug } = await params

  const [dict, post, allPostsResp, allProductsResp, allPlantsResp] =
    await Promise.all([
      getDictionary(locale as Locale),
      getBlogPostBySlug(slug, locale),
      getBlogPosts({ limit: 12, locale }),
      getProducts({ limit: 5, locale }),
      getWikiEntries({ limit: 12, locale }),
    ])
  if (!post) notFound()

  const allPosts = allPostsResp.docs
  const allProducts = allProductsResp.docs
  const allPlants = allPlantsResp.docs

  const p = post as any
  const articleTitle: string =
    p.title ||
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  const { head: titleHead, tail: titleTail } = splitTitleForEmphasis(articleTitle)

  // Eyebrow slug fragment (first 5 chars, upper-cased)
  const slugEyebrow = slug.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() || 'BLOG0'

  // Plain-text body for stats + drop cap content
  const bodyPlain = typeof p.content === 'string' ? p.content : richTextToPlain(p.content)
  const wordCount = estimateWords(bodyPlain)
  const readingMinutes: number =
    p.readingTime || Math.max(1, Math.ceil(wordCount / 200))

  // Break rich content into editorial sections (by h1..h4 or numbered/short paragraphs)
  let sections = extractSections(p.content)
  if (sections.length === 0 && bodyPlain) {
    const paragraphs = bodyPlain
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
    sections = [
      {
        id: 'article',
        title: 'L’article',
        paragraphs: paragraphs.length ? paragraphs : [bodyPlain],
        images: [],
      },
    ]
  }

  // Injecte les images de `galleryUrls` (URLs externes saisies en admin) dans
  // les sections. `sectionIndex` est 1-based (1 = première section). Plusieurs
  // images peuvent cibler la même section. Les entrées sans index ou hors
  // bornes sont collectées dans `trailingImages` et rendues en fin d'article.
  //
  // Sécurité : on ne rend que les URLs hébergées sur des hosts whitelistés
  // dans `next.config.mjs > images.remotePatterns` — sinon Next/Image jette
  // une erreur runtime et casse la page entière. Une URL hors whitelist
  // (ou une URL de page HTML, ex. unsplash.com/photos/<id> au lieu de
  // images.unsplash.com/photo-<id>) est silencieusement ignorée au rendu.
  const ALLOWED_IMAGE_HOSTS = [
    'res.cloudinary.com',
    'images.unsplash.com',
    'cdn.sanity.io',
  ]
  const isAllowedImageUrl = (url: string): boolean => {
    try {
      const u = new URL(url)
      if (u.protocol !== 'https:') return false
      return ALLOWED_IMAGE_HOSTS.some(
        (h) => u.hostname === h || u.hostname.endsWith('.public.blob.vercel-storage.com'),
      )
    } catch {
      return false
    }
  }

  const trailingImages: SectionImage[] = []
  if (Array.isArray((p as any).galleryUrls)) {
    for (const entry of (p as any).galleryUrls as any[]) {
      const url = typeof entry?.url === 'string' ? entry.url.trim() : ''
      if (!url || !isAllowedImageUrl(url)) continue
      const img: SectionImage = {
        url,
        caption: typeof entry?.caption === 'string' ? entry.caption : undefined,
      }
      const idx = typeof entry?.sectionIndex === 'number' ? entry.sectionIndex - 1 : -1
      if (idx >= 0 && idx < sections.length) {
        sections[idx] = { ...sections[idx], images: [...sections[idx].images, img] }
      } else {
        trailingImages.push(img)
      }
    }
  }

  // Featured image
  const featuredUrl =
    resolveMediaUrl(p.featuredImage, 'original') ??
    resolveMediaUrl(p.featuredImage, 'card')
  const featuredAlt = p.featuredImage?.alt || articleTitle

  // Author
  const authorName: string | undefined = p.author?.name
  const authorRole: string = p.author?.role || 'rédacteur'
  const authorInitials = initialsOf(authorName)
  const authorAvatarUrl = p.author?.avatar?.url

  // Related content
  const relatedPosts = allPosts
    .filter((sp: any) => sp.slug !== slug)
    .slice(0, 3)

  const relatedPlants: Array<{
    id?: string
    slug?: string
    name?: string
    latinName?: string
  }> = Array.isArray(p.relatedPlants) && p.relatedPlants.length > 0
    ? p.relatedPlants.filter((x: any) => x && typeof x === 'object' && x.slug)
    : allPlants
        .filter((pl: any) => pl && pl.slug)
        .slice(0, 3)
        .map((pl: any) => ({
          id: pl.id,
          slug: pl.slug,
          name: pl.name,
          latinName: pl.latinName,
        }))

  const directRelatedProducts: any[] = Array.isArray(p.relatedProducts)
    ? p.relatedProducts.filter((x: any) => x && typeof x === 'object' && x.id)
    : []

  // Fallback: if no explicit relatedProducts, derive via relatedPlants' benefits
  const fallbackBenefitIds: Array<string | number> = directRelatedProducts.length === 0
    ? Array.from(
        new Set(
          (Array.isArray(p.relatedPlants) ? p.relatedPlants : [])
            .flatMap((pl: any) =>
              (Array.isArray(pl?.benefits) ? pl.benefits : [])
                .map((b: any) => (typeof b === 'object' ? b?.id : b))
                .filter(Boolean),
            ),
        ),
      )
    : []

  const fallbackProducts: any[] =
    fallbackBenefitIds.length > 0
      ? (await getProducts({ limit: 4, locale, benefitIds: fallbackBenefitIds }))
          .docs
      : []

  const relatedProducts: any[] =
    directRelatedProducts.length > 0 ? directRelatedProducts : fallbackProducts

  const benefits: Array<{ name?: string; slug?: string }> = Array.isArray(
    p.relatedBenefits,
  )
    ? p.relatedBenefits.filter(
        (b: any) => b && typeof b === 'object' && (b.name || b.slug),
      )
    : Array.isArray(p.benefits)
      ? p.benefits.filter((b: any) => b && typeof b === 'object' && (b.name || b.slug))
      : []

  // Key takeaways for the sticky card
  const keyTakeaways: string[] = Array.isArray(p.keyTakeaways)
    ? p.keyTakeaways
        .map((k: any) => (typeof k === 'string' ? k : k?.takeaway || k?.text || ''))
        .filter((s: string) => s.trim().length > 0)
        .slice(0, 4)
    : []

  // Build sommaire entries
  const sommaire = sections.map((s, i) => ({
    id: s.id,
    label: s.title,
    num: String(i + 1).padStart(2, '0'),
  }))

  return (
    <main className="min-h-screen bg-rm-cream text-rm-ink font-sans">
      <BreadcrumbJsonLd
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          {
            label: dict.nav.journal || dict.blog.title,
            href: `/${locale}/blog`,
          },
          ...(p.category?.name
            ? [
                {
                  label: p.category.name,
                  href: p.category.slug
                    ? `/${locale}/blog?category=${p.category.slug}`
                    : `/${locale}/blog`,
                },
              ]
            : []),
          { label: articleTitle, href: `/${locale}/blog/${slug}` },
        ]}
      />
      <ArticleJsonLd article={post as any} locale={locale} />
      <GeoStructuredData
        kind="article"
        locale={locale}
        slug={slug}
        name={articleTitle}
        image={resolveMediaUrl(p.featuredImage, 'card') ?? undefined}
        author={authorName}
        publishedAt={p.publishedAt}
        updatedAt={p.updatedAt}
        category={p.category?.name}
        geo={{
          directAnswer: p.directAnswer,
          definition: p.definition,
          keyTakeaways: p.keyTakeaways,
          quotableStatements: p.quotableStatements,
          dataPoints: p.dataPoints,
          faq: p.faq,
          authoritySignals: p.authoritySignals,
          sources: p.sources,
          lastFactCheckedAt: p.lastFactCheckedAt,
        }}
      />

      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8 py-6">
        {/* ═══════════════ BREADCRUMB ═══════════════ */}
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            {
              label: dict.nav.journal || dict.blog.title,
              href: `/${locale}/blog`,
            },
            ...(p.category?.name
              ? [
                  {
                    label: p.category.name,
                    href: p.category.slug
                      ? `/${locale}/blog?category=${p.category.slug}`
                      : `/${locale}/blog`,
                  },
                ]
              : []),
            { label: articleTitle },
          ]}
        />

        {/* ═══════════════ HERO ÉDITORIAL ═══════════════ */}
        <Reveal>
          <header className="mt-8 sm:mt-10 md:mt-14 max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(300px,400px)] gap-6 sm:gap-8 lg:gap-12 items-start">
            <div className="min-w-0">
            {/* Eyebrow */}
            <p className="font-mono text-[11px] tracking-[0.25em] text-rm-burgundy uppercase mb-6">
              Dossier <span className="text-rm-ruleStrong mx-1">·</span>{' '}
              {slugEyebrow}
              {p.category?.name ? (
                <>
                  <span className="text-rm-ruleStrong mx-1">·</span>{' '}
                  {p.category.name}
                </>
              ) : null}
            </p>

            {/* Title display — tail in burgundy italic */}
            <h1 className="font-display font-normal text-rm-teal leading-[1.05] tracking-[-0.02em] text-[36px] sm:text-[44px] md:text-[52px] lg:text-[58px]">
              {titleHead ? (
                <>
                  {titleHead}{' '}
                  <em className="italic text-rm-burgundy font-normal">
                    {titleTail}
                  </em>
                </>
              ) : (
                <em className="italic text-rm-burgundy font-normal">
                  {titleTail}
                </em>
              )}
            </h1>

            {/* Subtitle / excerpt */}
            {p.excerpt && (
              <p className="mt-6 md:mt-8 font-serif italic text-[18px] md:text-[20px] leading-[1.55] text-rm-inkSoft">
                {p.excerpt}
              </p>
            )}
            </div>

            {/* Hero image — side column on desktop, below title on mobile */}
            <figure className="lg:sticky lg:top-20">
              <div className="relative aspect-[4/3] lg:aspect-square overflow-hidden rounded-[10px] border border-rm-rule bg-rm-creamSoft">
                {featuredUrl && (
                  <Image
                    src={featuredUrl}
                    alt={featuredAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-cover object-center"
                    priority
                  />
                )}
              </div>
              {p.featuredImage?.caption && (
                <figcaption className="mt-3 font-serif italic text-[12px] text-rm-inkSoft/80 text-center">
                  {p.featuredImage.caption}
                </figcaption>
              )}
            </figure>
            </div>

            {/* Author strip */}
            <div className="mt-8 sm:mt-10 border-y border-rm-rule py-4 sm:py-5 flex flex-wrap items-center gap-4 sm:gap-5">
              {/* Avatar */}
              <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                <div className="w-12 h-12 rounded-full bg-rm-ochre overflow-hidden shrink-0 flex items-center justify-center">
                  {authorAvatarUrl ? (
                    <Image
                      src={authorAvatarUrl}
                      alt={authorName || ''}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="font-display text-[16px] text-white leading-none">
                      {authorInitials}
                    </span>
                  )}
                </div>

                {/* Center meta */}
                <div className="font-sans text-[13px] leading-[1.45] text-rm-inkSoft">
                  <p>
                    {dict.blog.byAuthor}{' '}
                    <strong className="text-rm-teal font-semibold">
                      {authorName || 'Remèdes de Mamie'}
                    </strong>
                    <span className="mx-1.5 text-rm-ruleStrong">·</span>
                    <span className="font-serif italic text-rm-ochre">
                      {authorRole}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-rm-inkSoft/80">
                    {p.publishedAt && (
                      <>
                        Publié le {formatDate(p.publishedAt, locale)}
                        <span className="mx-1.5 text-rm-ruleStrong">·</span>
                      </>
                    )}
                    {readingMinutes} {dict.blog.readingTime}
                    {wordCount > 0 && (
                      <>
                        <span className="mx-1.5 text-rm-ruleStrong">·</span>
                        {wordCount.toLocaleString(locale)} mots
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Right — action buttons */}
              <BlogActions locale={locale} slug={slug} title={articleTitle} />
            </div>

          </header>
        </Reveal>

        {/* ═══════════════ BODY 3-COLUMN GRID ═══════════════ */}
        <div className="mt-10 sm:mt-14 md:mt-16 max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-8 sm:gap-10 lg:gap-14">
          {/* LEFT — STICKY SOMMAIRE */}
          <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
            <p className="font-mono text-[11px] tracking-[0.25em] text-rm-burgundy uppercase mb-4">
              Sommaire
            </p>
            <ul className="space-y-2.5 border-l border-rm-rule pl-4">
              {sommaire.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`block font-sans text-[13px] leading-snug transition-colors ${
                      i === 0
                        ? 'text-rm-burgundy font-semibold'
                        : 'text-rm-inkSoft hover:text-rm-burgundy'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-rm-ruleStrong mr-1.5">
                      {s.num}
                    </span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>

            {keyTakeaways.length > 0 && (
              <div className="mt-8 bg-rm-paper border border-rm-rule rounded-[10px] p-4">
                <p className="font-mono text-[10px] tracking-[0.25em] text-rm-burgundy uppercase mb-3">
                  Points clés
                </p>
                <ul className="space-y-2 font-serif text-[13px] leading-[1.5] text-rm-ink">
                  {keyTakeaways.map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-rm-ochre font-mono text-[11px] leading-[1.8]">
                        ▪
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {relatedProducts.length > 0 && (
              <div className="mt-6 bg-rm-paper border border-rm-rule rounded-[10px] p-4">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-rm-rule">
                  <span className="font-display text-[15px] text-rm-teal">
                    Produits associés
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-rm-ochre">
                    {relatedProducts.length}
                  </span>
                </div>
                <ul className="space-y-3 list-none pl-0 max-h-[320px] overflow-y-auto pr-1 -mr-1">
                  {relatedProducts.map((rp: any) => {
                    const img =
                      resolveMediaUrl((rp.images?.[0] as any)?.image, 'thumbnail') ||
                      rp.externalImageUrl ||
                      null
                    const price =
                      typeof rp.price === 'number'
                        ? new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(rp.price)
                        : null
                    return (
                      <li
                        key={rp.slug || rp.id}
                        className="border-b border-rm-rule pb-3 last:border-b-0 last:pb-0"
                      >
                        <Link
                          href={`/${locale}/produits/${rp.slug}`}
                          className="grid grid-cols-[40px_1fr] gap-3 group"
                        >
                          <div className="relative w-10 h-10 bg-rm-creamSoft border border-rm-rule overflow-hidden rounded">
                            {img ? (
                              <Image
                                src={img}
                                alt={rp.name || ''}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <div className="font-serif text-[13px] text-rm-ink leading-snug group-hover:text-rm-burgundy transition-colors line-clamp-2">
                              {rp.name}
                            </div>
                            {price && (
                              <div className="font-mono text-[11px] text-rm-ochre mt-0.5">
                                {price}
                              </div>
                            )}
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </aside>

          {/* CENTER — ARTICLE */}
          <article className="min-w-0">
            {/* Chapô */}
            {p.excerpt ? (
              <EditorialChapo>{p.excerpt}</EditorialChapo>
            ) : sections[0]?.paragraphs[0] ? (
              <EditorialChapo>{sections[0].paragraphs[0]}</EditorialChapo>
            ) : null}

            {/* Sections */}
            {sections.map((section, sIdx) => {
              const num = String(sIdx + 1).padStart(2, '0')
              return (
                <EditorialSection
                  key={section.id}
                  id={section.id}
                  num={num}
                  title={section.title}
                >
                  {section.images.length > 0 && (
                    <div className="not-prose mb-6 space-y-4">
                      {section.images.map((img, iIdx) => (
                        <figure
                          key={`${section.id}-img-${iIdx}`}
                          className="relative w-full overflow-hidden rounded-[8px] border border-rm-rule"
                        >
                          <Image
                            src={img.url}
                            alt={img.alt || img.caption || section.title}
                            width={img.width || 1200}
                            height={img.height || 800}
                            className="w-full h-auto object-cover"
                            sizes="(max-width: 768px) 100vw, 720px"
                          />
                          {img.caption && (
                            <figcaption className="mt-2 px-1 font-serif italic text-[13px] text-rm-inkSoft">
                              {img.caption}
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  )}
                  <div className="font-serif text-[17px] md:text-[18px] leading-[1.75] text-rm-inkSoft space-y-5">
                    {section.paragraphs.map((para, pIdx) => {
                      const isFirstOfFirst = sIdx === 0 && pIdx === 0
                      if (isFirstOfFirst) {
                        const first = para.charAt(0)
                        const rest = para.slice(1)
                        return (
                          <p key={pIdx} className="clearfix">
                            <span
                              className="font-display text-[52px] sm:text-[64px] md:text-[72px] leading-[0.9] text-rm-burgundy float-left pr-2 sm:pr-3 pt-1"
                              aria-hidden="true"
                            >
                              {first}
                            </span>
                            {rest}
                          </p>
                        )
                      }
                      return <p key={pIdx}>{para}</p>
                    })}
                  </div>

                  {/* Inject "Attention" aside after first section */}
                  {sIdx === 0 && p.precautions && (
                    <EditorialAside kind="Attention" tone="burgundy">
                      {typeof p.precautions === 'string'
                        ? p.precautions
                        : richTextToPlain(p.precautions)}
                    </EditorialAside>
                  )}
                </EditorialSection>
              )
            })}

            {/* Galerie en fin d'article (URLs sans sectionIndex ou hors bornes) */}
            {trailingImages.length > 0 && (
              <div className="not-prose mt-12 space-y-6">
                {trailingImages.map((img, iIdx) => (
                  <figure
                    key={`trailing-img-${iIdx}`}
                    className="relative w-full overflow-hidden rounded-[8px] border border-rm-rule"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || img.caption || articleTitle}
                      width={img.width || 1200}
                      height={img.height || 800}
                      className="w-full h-auto object-cover"
                      sizes="(max-width: 768px) 100vw, 720px"
                    />
                    {img.caption && (
                      <figcaption className="mt-2 px-1 font-serif italic text-[13px] text-rm-inkSoft">
                        {img.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}

            {/* Author box */}
            {authorName && (
              <Reveal>
                <aside className="mt-16 bg-rm-teal text-rm-cream rounded-[12px] p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start">
                  <div className="w-[72px] h-[72px] rounded-full bg-rm-ochre overflow-hidden shrink-0 flex items-center justify-center ring-2 ring-rm-cream/20">
                    {authorAvatarUrl ? (
                      <Image
                        src={authorAvatarUrl}
                        alt={authorName}
                        width={72}
                        height={72}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="font-display text-[24px] text-white leading-none">
                        {authorInitials}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-rm-cream/70">
                      {dict.blog.byAuthor}
                    </p>
                    <h3 className="mt-1 font-display text-[28px] text-rm-cream leading-tight">
                      {authorName}
                    </h3>
                    {authorRole && (
                      <p className="mt-0.5 font-serif italic text-[15px] text-rm-ochre">
                        {authorRole}
                      </p>
                    )}
                    {p.author?.bio && (
                      <p className="mt-3 font-serif text-[15px] leading-[1.65] text-rm-cream/90">
                        {typeof p.author.bio === 'string'
                          ? p.author.bio
                          : richTextToPlain(p.author.bio)}
                      </p>
                    )}
                  </div>
                </aside>
              </Reveal>
            )}

            {/* "Avis, question ?" CTA */}
            <aside className="mt-10 bg-rm-paper border border-rm-rule rounded-[12px] p-6 sm:p-7 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-rm-burgundy mb-2">
                  Avis, question ?
                </p>
                <p className="font-serif italic text-[17px] text-rm-teal leading-[1.45] max-w-[440px]">
                  Vous souhaitez réagir, compléter ou demander un
                  éclaircissement ? Écrivez-nous.
                </p>
              </div>
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center gap-2 bg-rm-burgundy text-rm-cream font-sans text-[13px] font-semibold tracking-wide px-5 py-3 rounded-full hover:bg-rm-burgundy/90 transition-colors"
              >
                Nous écrire
                <span aria-hidden>→</span>
              </Link>
            </aside>
          </article>

          {/* RIGHT — STICKY SIDEBAR */}
          <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 space-y-5">
            {relatedPlants.length > 0 && (
              <CrossCard title="Plantes citées" badge={relatedPlants.length}>
                <ul className="space-y-3">
                  {relatedPlants.map((plant) => (
                    <li key={plant.slug}>
                      <Link
                        href={`/${locale}/plantes/${plant.slug}`}
                        className="group block"
                      >
                        <p className="font-display text-[15px] text-rm-teal leading-tight group-hover:text-rm-burgundy transition-colors">
                          {plant.name}
                        </p>
                        {plant.latinName && (
                          <p className="font-serif italic text-[12px] text-rm-ochre mt-0.5">
                            {plant.latinName}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CrossCard>
            )}


            {benefits.length > 0 && (
              <CrossCard title="Bienfaits liés" badge={benefits.length}>
                <ul className="flex flex-wrap gap-1.5">
                  {benefits.map((b, i) => (
                    <li key={b.slug || i}>
                      <Link
                        href={b.slug ? `/${locale}/bienfaits/${b.slug}` : '#'}
                        className="inline-flex items-center gap-1 font-sans text-[11px] tracking-[0.1em] uppercase text-rm-teal bg-rm-creamSoft border border-rm-rule px-2.5 py-1 rounded-full hover:border-rm-burgundy hover:text-rm-burgundy transition-colors"
                      >
                        {b.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CrossCard>
            )}

            {relatedPosts.length > 0 && (
              <CrossCard title="À lire ensuite" badge={relatedPosts.length}>
                <ul className="space-y-3.5">
                  {relatedPosts.map((rp: any) => (
                    <li key={rp.id || rp.slug} className="group">
                      <Link href={`/${locale}/blog/${rp.slug}`} className="block">
                        {rp.category?.name && (
                          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rm-burgundy mb-1">
                            {rp.category.name}
                          </p>
                        )}
                        <p className="font-display text-[15px] leading-[1.2] text-rm-teal group-hover:text-rm-burgundy transition-colors">
                          {rp.title}
                        </p>
                        {rp.readingTime && (
                          <p className="mt-1 font-sans text-[11px] text-rm-inkSoft/80">
                            {rp.readingTime} {dict.blog.readingTime}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CrossCard>
            )}

            {/* Newsletter card */}
            <div className="bg-rm-burgundy text-rm-cream rounded-[12px] p-5">
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-rm-cream/70">
                Newsletter
              </p>
              <h3 className="mt-1 font-display text-[20px] leading-tight">
                Le Journal, par saison
              </h3>
              <p className="mt-2 font-serif italic text-[13px] leading-[1.5] text-rm-cream/85">
                Recevez nos dossiers, recettes et conseils aux changements de
                saison.
              </p>
              <div className="mt-3 [&_form]:flex-col [&_form]:!gap-2 [&_form]:!mt-0 [&_input]:!h-10 [&_input]:!bg-rm-cream/10 [&_input]:!border-rm-cream/25 [&_input]:!text-rm-cream [&_input]:!px-3 [&_input]:placeholder:!text-rm-cream/55 [&_button]:!h-10 [&_button]:!bg-rm-ochre [&_button]:!text-rm-ink [&_button]:hover:!bg-rm-ochre/90 [&_button]:!px-5 [&_p]:!text-rm-cream/90">
                <NewsletterForm
                  placeholder="Votre email"
                  cta="S’abonner"
                  locale={locale}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ═══════════════ "À LIRE AUSSI" STRIP ═══════════════
        On affichait avant 5 produits (`allProducts`) sous l'intitulé
        "On en parle". Sur une page article, l'utilisateur attend plutôt
        d'autres articles à lire — on bascule donc sur les derniers articles
        publiés, en excluant l'article courant. */}
      {(() => {
        const otherArticles = (allPosts as any[])
          .filter((a) => a?.slug && a.slug !== slug)
          .slice(0, 5)
        if (otherArticles.length === 0) return null
        return (
        <Reveal>
          <section className="mt-14 sm:mt-20 bg-rm-creamSoft border-t border-rm-rule py-10 sm:py-14 md:py-20">
            <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
              <div className="flex items-baseline justify-between mb-8 sm:mb-10 gap-4">
                <h2 className="font-display italic text-rm-teal text-[26px] sm:text-[32px] md:text-[44px] tracking-[-0.01em]">
                  À lire aussi
                </h2>
                <Link
                  href={`/${locale}/blog`}
                  className="font-sans text-[12px] tracking-[0.15em] uppercase text-rm-burgundy hover:text-rm-teal transition-colors"
                >
                  Voir tout →
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {otherArticles.map((article: any, idx: number) => {
                  const img =
                    resolveMediaUrl(article.featuredImage, 'card') ?? null
                  const num = `N°${String(idx + 1).padStart(2, '0')}`
                  return (
                    <Link
                      key={article.id || article.slug}
                      href={`/${locale}/blog/${article.slug || ''}`}
                      className="group block bg-rm-cream border border-rm-rule rounded-[10px] overflow-hidden hover:border-rm-burgundy transition-colors"
                    >
                      <div className="relative aspect-square bg-rm-paper overflow-hidden flex items-center justify-center">
                        {img ? (
                          <Image
                            src={img}
                            alt={article.title || ''}
                            fill
                            sizes="(max-width: 768px) 50vw, 220px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <svg
                            width="56"
                            height="56"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            className="text-rm-teal opacity-30"
                            aria-hidden="true"
                          >
                            <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s2.5 3.5.5 9.2A7 7 0 0 1 11 20Z" />
                            <path d="M2 21c0-3 1.85-5.36 5.08-6" />
                          </svg>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="font-mono text-[10px] tracking-[0.2em] text-rm-burgundy">
                            {num}
                          </span>
                          <span className="font-sans text-[11px] text-rm-ochre">
                            ★
                          </span>
                        </div>
                        <p className="font-display text-[15px] text-rm-teal leading-tight line-clamp-2 min-h-[36px] group-hover:text-rm-burgundy transition-colors">
                          {article.title}
                        </p>
                        {typeof article.readingTime === 'number' && article.readingTime > 0 && (
                          <p className="mt-2 font-sans text-[12px] text-rm-inkSoft">
                            {article.readingTime} {dict.blog.readingTime}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        </Reveal>
        )
      })()}

      {/* Back to journal */}
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8 py-12 text-center">
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-rm-teal underline underline-offset-4 decoration-1 hover:text-rm-burgundy transition-colors"
        >
          <span aria-hidden>←</span>
          Tous les articles du Journal
        </Link>
      </div>
    </main>
  )
}
