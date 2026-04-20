import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { richTextToPlain } from '@/lib/utils'
import { ArticleJsonLd, GeoStructuredData } from '@/components/seo'
import { getBlogPostBySlug, getBlogPosts } from '@/lib/queries'
import { ArticleCard } from '@/components/shared/ArticleCard'
import Image from 'next/image'
import { ShareButtons } from '@/components/blog/ShareButtons'
import { TableOfContents } from '@/components/blog/TableOfContents'

export const revalidate = 3600

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

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
    title: `${p.title} | ${dict.blog.title} | ${dict.meta.siteName}`,
    description: p.excerpt || `${dict.blog.subtitle}`,
    openGraph: {
      ...(p.featuredImage?.url ? { images: [{ url: p.featuredImage.url, width: 1200, height: 630, alt: p.title }] } : {}),
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

export default async function BlogDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const post = await getBlogPostBySlug(slug, locale)
  if (!post) notFound()

  const p = post as any
  const articleTitle = p.title || slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

  const { docs: similarPosts } = await getBlogPosts({ limit: 4, locale })
  const filteredSimilar = similarPosts.filter((sp) => (sp as any).slug !== slug).slice(0, 3)

  return (
    <main className="bg-[#FEF9E9] min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.blog.title, href: `/${locale}/blog` },
            { label: articleTitle },
          ]}
        />

        <ArticleJsonLd article={post as any} locale={locale} />
        <GeoStructuredData
          kind="article"
          locale={locale}
          slug={slug}
          name={articleTitle}
          image={p.featuredImage?.url}
          author={p.author?.name}
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

        {/* Article header - full width above the two-column layout */}
        <div className="mt-8 max-w-4xl mx-auto lg:mx-0 lg:max-w-none">
          {/* Category overline */}
          {p.category ? (
            <p className="text-sm font-medium text-[#D0802C] uppercase tracking-wide mb-2">
              {p.category.name}
            </p>
          ) : (
            <p className="mb-2">
              <span className="bg-[#FFF5D5] rounded animate-pulse inline-block w-20 h-3" />
            </p>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#054A57] leading-tight">
            {articleTitle}
          </h1>

          {/* Meta line: author, date, reading time */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#712E2F]/60">
            {p.author ? (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#FFF5D5] overflow-hidden shrink-0">
                  {p.author.avatar ? (
                    <Image src={p.author.avatar.url} alt={p.author.name} width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-[#FFF5D5] text-[#A2211E] text-sm font-medium">
                      {p.author.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="font-medium text-[#054A57]">{p.author.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#FFF5D5] animate-pulse" />
                <span className="bg-[#FFF5D5] rounded animate-pulse inline-block w-24 h-3" />
              </div>
            )}
            {p.publishedAt && (
              <>
                <span className="text-[#712E2F]/30">&bull;</span>
                <span>{new Date(p.publishedAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </>
            )}
            {p.readingTime && (
              <>
                <span className="text-[#712E2F]/30">&bull;</span>
                <span>{p.readingTime} {dict.blog.readingTime}</span>
              </>
            )}
          </div>

          {/* Hero image */}
          {p.featuredImage ? (
            <div className="mt-6 aspect-video bg-[#FFF5D5] rounded-xl overflow-hidden relative">
              <Image
                src={p.featuredImage.url}
                alt={p.featuredImage.alt || articleTitle}
                fill
                sizes="(max-width: 1024px) 100vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="mt-6 aspect-video bg-[#FFF5D5] rounded-xl animate-pulse" />
          )}
        </div>

        {/* Two-column layout: TOC sidebar + content */}
        <div className="mt-10 flex flex-col lg:flex-row gap-10">
          {/* TOC sidebar (left) -- hidden on mobile */}
          <aside className="hidden lg:block lg:w-64 shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-xl border border-[#DCD8C7] p-5">
                <h2 className="text-lg font-bold text-[#054A57] mb-4">
                  {dict.blog.detail.tableOfContents}
                </h2>
                <TableOfContents content={typeof p.content === 'string' ? p.content : richTextToPlain(p.content)} locale={locale} />
              </div>
            </div>
          </aside>

          {/* Main content (right) */}
          <article className="w-full min-w-0 max-w-3xl">
            {/* Prose content with custom styles */}
            {p.content ? (
              <div className="blog-prose prose prose-lg max-w-none">
                <p>{richTextToPlain(p.content)}</p>
              </div>
            ) : (
              <div className="prose prose-lg max-w-none">
                <div className="space-y-4">
                  <div className="bg-[#FFF5D5] rounded h-4 w-full animate-pulse" />
                  <div className="bg-[#FFF5D5] rounded h-4 w-5/6 animate-pulse" />
                  <div className="bg-[#FFF5D5] rounded h-4 w-full animate-pulse" />
                  <div className="bg-[#FFF5D5] rounded h-4 w-3/4 animate-pulse" />
                </div>
              </div>
            )}

            {/* Author bio card */}
            {p.author && (
              <div className="mt-12 bg-white rounded-xl border border-[#DCD8C7] p-6 flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-16 h-16 rounded-full bg-[#FFF5D5] overflow-hidden shrink-0">
                  {p.author.avatar ? (
                    <Image
                      src={p.author.avatar.url}
                      alt={p.author.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-[#FFF5D5] text-[#A2211E] text-xl font-medium">
                      {p.author.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#054A57]">{p.author.name}</h3>
                  {p.author.role && (
                    <p className="text-sm text-[#D0802C] font-medium">{p.author.role}</p>
                  )}
                  {p.author.bio && (
                    <p className="mt-2 text-sm text-[#712E2F]/70">{richTextToPlain(p.author.bio)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Share buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-[#054A57]">Partager :</span>
              <ShareButtons title={articleTitle} locale={locale} slug={slug} />
            </div>
          </article>
        </div>

        {/* Similar articles */}
        <section className="mt-16 pt-10 border-t border-[#DCD8C7]">
          <h2 className="text-2xl md:text-3xl font-bold text-[#054A57] mb-6">
            {dict.blog.detail.similarArticles}
          </h2>
          {filteredSimilar.length > 0 ? (
            <>
              {/* Desktop: 3 cols */}
              <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredSimilar.map((sp) => (
                  <ArticleCard key={sp.id} post={sp as any} locale={locale} />
                ))}
              </div>
              {/* Mobile: 2 cols or scrollable */}
              <div className="grid grid-cols-2 gap-3 sm:hidden">
                {filteredSimilar.map((sp) => (
                  <ArticleCard key={sp.id} post={sp as any} locale={locale} />
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="aspect-video bg-[#FFF5D5] animate-pulse" />
                  <div className="p-4">
                    <div className="bg-[#FFF5D5] rounded h-3 w-16 animate-pulse mb-2" />
                    <div className="bg-[#FFF5D5] rounded h-5 w-full animate-pulse mb-1" />
                    <div className="bg-[#FFF5D5] rounded h-5 w-2/3 animate-pulse mb-3" />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#FFF5D5] animate-pulse" />
                      <div className="bg-[#FFF5D5] rounded h-3 w-20 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Cross-link: Plantes & Bienfaits */}
        <section className="mt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href={`/${locale}/plantes`}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#054A57] to-[#0B7B88] p-8 text-white transition-transform hover:-translate-y-1"
            >
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                  Encyclopédie
                </p>
                <h3 className="text-2xl font-bold mb-2">Explorer les plantes</h3>
                <p className="text-sm text-white/85 mb-4 max-w-md">
                  Fiches détaillées, propriétés, usages traditionnels et précautions d&rsquo;emploi.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  Voir l&rsquo;encyclopédie
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="absolute -bottom-4 -right-4 h-40 w-40 text-white/10"
              >
                <path d="M7 20.5C7 17 9 12 17 4" />
                <path d="M17 4c-4 0-8 1-10.5 5.5C4 14 7 17 7 20.5" />
                <path d="M17 4c0 4-1 8-5.5 10.5" />
              </svg>
            </Link>
            <Link
              href={`/${locale}/bienfaits`}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#A2211E] to-[#712E2F] p-8 text-white transition-transform hover:-translate-y-1"
            >
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                  Par besoin
                </p>
                <h3 className="text-2xl font-bold mb-2">Découvrir les bienfaits</h3>
                <p className="text-sm text-white/85 mb-4 max-w-md">
                  Sommeil, digestion, stress, immunité… Trouvez la plante qui répond à votre besoin.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  Voir tous les bienfaits
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="absolute -bottom-4 -right-4 h-40 w-40 text-white/10"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </Link>
          </div>
        </section>
      </div>

      {/* Scoped styles for blog prose content */}
      <style dangerouslySetInnerHTML={{ __html: `
        .blog-prose h2 {
          font-weight: 700;
          font-size: 1.25rem;
          color: #054A57;
          border-left: 3px solid #A2211E;
          padding-left: 0.75rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .blog-prose h3 {
          font-weight: 600;
          font-size: 1.125rem;
          color: #054A57;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .blog-prose p {
          color: #3d3d3d;
          line-height: 1.75;
          margin-bottom: 1rem;
        }
        .blog-prose blockquote {
          border-left: 3px solid #A2211E;
          background-color: #FEF9E9;
          font-style: italic;
          padding: 1rem 1.25rem;
          margin: 1.5rem 0;
          border-radius: 0 0.5rem 0.5rem 0;
          color: #712E2F;
        }
        .blog-prose blockquote p {
          margin-bottom: 0;
          color: #712E2F;
        }
        .blog-prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .blog-prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .blog-prose li {
          color: #3d3d3d;
          margin-bottom: 0.5rem;
        }
        .blog-prose a {
          color: #A2211E;
          text-decoration: underline;
        }
        .blog-prose a:hover {
          color: #712E2F;
        }
        .blog-prose img {
          border-radius: 0.75rem;
          margin: 1.5rem 0;
        }
      `}} />
    </main>
  )
}
