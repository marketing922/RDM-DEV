import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getFeaturedBlogPost, getBlogPosts } from '@/lib/queries'
import Image from 'next/image'
import Link from 'next/link'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import BlogSearch from '@/components/blog/BlogSearch'
import Reveal from '@/components/ui/Reveal'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 60

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; category?: string; q?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    metadataBase: siteMetadataBase(),
    title: `${dict.blog.title} | ${dict.meta.siteName}`,
    description: dict.blog.subtitle,
    alternates: {
      canonical: `/${locale}/blog`,
      languages: {
        fr: `/fr/blog`,
        en: `/en/blog`,
      },
    },
  }
}

function blogPostImage(post: any, size: 'card' | 'thumbnail' = 'card'): string | null {
  if (typeof post?.externalImageUrl === 'string' && post.externalImageUrl.trim()) {
    return post.externalImageUrl.trim()
  }
  return resolveMediaUrl(post?.featuredImage, size) ?? null
}

function formatDate(value: string | undefined, locale: string) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { page: pageParam, category: categoryParam, q: qParam } = await searchParams
  const dict = await getDictionary(locale as Locale)

  const q = String(qParam || '').trim()
  const currentPage = parseInt(pageParam || '1', 10)
  const postsPerPage = 9
  const activeCategory = categoryParam || 'all'
  const isFiltered = q !== '' || activeCategory !== 'all'

  // Featured post only on page 1, no filter, no search — otherwise skip.
  const featuredPost = isFiltered || currentPage > 1
    ? null
    : ((await getFeaturedBlogPost(locale)) as any)

  const { docs: postsRaw, totalPages } = await getBlogPosts({
    limit: postsPerPage,
    page: currentPage,
    locale,
    category: activeCategory,
    search: q,
  })
  const posts = postsRaw as any[]

  // Dedupe featured post from grid on page 1
  const gridPosts =
    currentPage === 1 && featuredPost
      ? posts.filter((p) => p.id !== featuredPost.id)
      : posts

  // Build category list from dict (may exist without posts having categories)
  const categoryKeys = Object.keys(dict.blog.categories) as Array<
    keyof typeof dict.blog.categories
  >

  // Helper to preserve current q + category across pagination / chip clicks.
  const buildUrl = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams()
    const mixed: Record<string, string | null> = {
      q: q || null,
      category: activeCategory === 'all' ? null : activeCategory,
      page: currentPage > 1 ? String(currentPage) : null,
      ...overrides,
    }
    for (const [key, value] of Object.entries(mixed)) {
      if (value !== null && value !== '') params.set(key, String(value))
    }
    const qs = params.toString()
    return qs ? `/${locale}/blog?${qs}` : `/${locale}/blog`
  }

  // Detect whether any post in current page has a category (to decide if filter bar is meaningful)
  const anyCategoryOnPosts =
    (featuredPost && featuredPost.category) ||
    posts.some((p) => p.category && (p.category.name || p.category.slug))

  return (
    <main className="min-h-screen bg-rm-cream">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-10 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.blog.title },
          ]}
        />

        {/* ─── Header almanach ─── */}
        <Reveal>
        <header className="mt-8 sm:mt-10 md:mt-14 mb-8 sm:mb-10 md:mb-14 text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2.5 mb-4 sm:mb-5">
            <span className="block w-7 h-px bg-rm-burgundy" />
            <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
              Journal
            </span>
            <span className="block w-7 h-px bg-rm-burgundy" />
          </div>
          <h1 className="font-display font-normal text-rm-teal leading-[1.05] tracking-[-0.02em] text-[32px] sm:text-[44px] md:text-[52px] lg:text-[60px]">
            Le <em className="italic text-rm-burgundy">Journal</em> des plantes
          </h1>
          <p className="font-serif italic text-[15px] sm:text-[17px] md:text-[19px] leading-[1.55] text-rm-inkSoft mt-4 sm:mt-5">
            {dict.blog.subtitle}
          </p>
        </header>
        </Reveal>

        {/* ─── Search ─── */}
        <BlogSearch initialSearch={q} placeholder={dict.blog.searchPlaceholder || 'Rechercher un article…'} />

        {/* ─── Category filter chips (only if relevant) ─── */}
        {anyCategoryOnPosts && (
          <div className="mb-10 md:mb-12 overflow-x-auto scrollbar-hide border-t border-b border-dashed border-rm-rule py-4">
            <div className="flex md:flex-wrap md:justify-center gap-2 min-w-max md:min-w-0">
              {categoryKeys.map((key) => {
                const isActive = String(key) === activeCategory
                return (
                  <Link
                    key={String(key)}
                    href={buildUrl({
                      category: key === 'all' ? null : String(key),
                      page: null,
                    })}
                    className={`inline-flex items-center h-8 px-4 rounded-full font-sans text-[11px] tracking-[0.18em] uppercase transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-rm-burgundy text-white border border-rm-burgundy'
                        : 'bg-rm-paper text-rm-teal border border-rm-ruleStrong hover:border-rm-burgundy hover:text-rm-burgundy'
                    }`}
                  >
                    {dict.blog.categories[key]}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── Featured + Sidebar (page 1 only) ─── */}
        {currentPage === 1 && featuredPost && (
          <section className="mb-12 sm:mb-16 md:mb-20">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                {dict.blog.featured}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
              {/* Featured article 2/3 */}
              <Reveal className="lg:col-span-2">
              <Link
                href={`/${locale}/blog/${featuredPost.slug}`}
                className="group bg-rm-paper border border-rm-rule overflow-hidden grid grid-cols-1 md:grid-cols-[40%_1fr] h-full transition-colors hover:border-rm-ruleStrong"
              >
                <div className="relative aspect-[4/3] md:aspect-auto md:h-full md:min-h-[260px] bg-rm-creamSoft overflow-hidden">
                  {blogPostImage(featuredPost, 'card') ? (
                    <Image
                      src={blogPostImage(featuredPost, 'card') ?? ''}
                      alt={featuredPost.featuredImage?.alt || featuredPost.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      className="object-contain object-center p-3 transition-transform duration-500 group-hover:scale-[1.02]"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-rm-creamSoft" />
                  )}
                  {featuredPost.category?.name && (
                    <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-rm-cream/95 border border-rm-ruleStrong text-rm-ochre font-sans text-[10px] tracking-[0.22em] uppercase px-2.5 py-1 sm:px-3 sm:py-1.5">
                      {featuredPost.category.name}
                    </span>
                  )}
                </div>
                <div className="p-5 sm:p-6 md:p-7 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-[11px] tracking-wide text-rm-inkSoft/80 uppercase mb-3">
                    {featuredPost.publishedAt && (
                      <span>{formatDate(featuredPost.publishedAt, locale)}</span>
                    )}
                    {featuredPost.readingTime && (
                      <>
                        <span className="text-rm-ruleStrong">·</span>
                        <span>
                          {featuredPost.readingTime} {dict.blog.readingTime}
                        </span>
                      </>
                    )}
                  </div>
                  <h2 className="font-display text-[20px] sm:text-[24px] md:text-[28px] leading-[1.15] text-rm-teal tracking-[-0.01em] group-hover:text-rm-burgundy transition-colors">
                    {featuredPost.title}
                  </h2>
                  {featuredPost.excerpt && (
                    <p className="font-serif italic text-[14px] sm:text-[15px] md:text-[16px] leading-[1.55] text-rm-inkSoft mt-3 line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  )}
                  <span className="mt-4 sm:mt-5 font-sans text-sm font-semibold text-rm-burgundy inline-flex items-center gap-1.5">
                    Lire l&apos;article
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
              </Reveal>

              {/* Sidebar 1/3 — 2-3 latest (excluding featured) */}
              <aside className="flex flex-col gap-4 sm:gap-6">
                {posts
                  .filter((p) => p.id !== featuredPost.id)
                  .slice(0, 3)
                  .map((post: any, sIdx: number) => (
                    <Reveal key={post.id} delay={120 + sIdx * 100}>
                    <Link
                      href={`/${locale}/blog/${post.slug}`}
                      className="group flex gap-3 sm:gap-4 bg-rm-paper border border-rm-rule p-3 sm:p-4 hover:border-rm-ruleStrong transition-colors h-full"
                    >
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-rm-creamSoft overflow-hidden border border-rm-rule">
                        {blogPostImage(post, 'thumbnail') ? (
                          <Image
                            src={blogPostImage(post, 'thumbnail') ?? ''}
                            alt={post.featuredImage?.alt || post.title}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-rm-creamSoft" />
                        )}
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        {post.category?.name && (
                          <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-rm-ochre mb-1">
                            {post.category.name}
                          </span>
                        )}
                        <h3 className="font-display text-[17px] leading-[1.15] text-rm-teal line-clamp-2 group-hover:text-rm-burgundy transition-colors">
                          {post.title}
                        </h3>
                        {post.readingTime && (
                          <span className="font-mono text-[10px] tracking-wide text-rm-inkSoft/70 uppercase mt-2">
                            {post.readingTime} {dict.blog.readingTime}
                          </span>
                        )}
                      </div>
                    </Link>
                    </Reveal>
                  ))}
              </aside>
            </div>
          </section>
        )}

        {/* ─── Dotted separator ─── */}
        <div className="border-t border-dashed border-rm-rule mb-10 sm:mb-12 md:mb-14" />

        {/* ─── Grid — les autres articles ─── */}
        {gridPosts.length > 0 ? (
          <>
            <Reveal className="flex items-center gap-2.5 mb-5 sm:mb-6">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                Tous les articles
              </span>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
              {gridPosts.map((post: any, idx: number) => {
                const num = String((currentPage - 1) * postsPerPage + idx + 1).padStart(3, '0')
                return (
                  <Reveal key={post.id} delay={(idx % 3) * 90}>
                  <Link
                    href={`/${locale}/blog/${post.slug}`}
                    className="group bg-rm-paper border border-rm-rule overflow-hidden flex flex-col h-full hover:border-rm-ruleStrong transition-colors"
                  >
                    <div className="relative aspect-[4/3] bg-rm-creamSoft overflow-hidden">
                      {blogPostImage(post, 'card') ? (
                        <Image
                          src={blogPostImage(post, 'card') ?? ''}
                          alt={post.featuredImage?.alt || post.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="w-full h-full bg-rm-creamSoft" />
                      )}
                      <span className="absolute top-3 left-3 font-mono text-[10px] tracking-[0.2em] uppercase text-rm-teal/70 bg-rm-cream/90 border border-rm-rule px-2 py-1">
                        N° {num}
                      </span>
                      {post.category?.name && (
                        <span className="absolute top-3 right-3 bg-rm-cream/95 border border-rm-ruleStrong text-rm-ochre font-sans text-[10px] tracking-[0.22em] uppercase px-2.5 py-1">
                          {post.category.name}
                        </span>
                      )}
                    </div>
                    <div className="p-5 md:p-6 flex flex-col flex-1">
                      <div className="font-mono text-[11px] tracking-wide text-rm-inkSoft/80 uppercase mb-3 flex flex-wrap items-center gap-2">
                        {post.publishedAt && (
                          <span>{formatDate(post.publishedAt, locale)}</span>
                        )}
                        {post.readingTime && (
                          <>
                            <span className="text-rm-ruleStrong">·</span>
                            <span>
                              {post.readingTime} {dict.blog.readingTime}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="font-display text-[22px] leading-[1.15] text-rm-teal tracking-[-0.01em] group-hover:text-rm-burgundy transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="font-serif italic text-[15px] leading-[1.55] text-rm-inkSoft mt-3 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      <span className="mt-5 font-sans text-sm font-semibold text-rm-burgundy inline-flex items-center gap-1.5">
                        {dict.blog.readMore}
                        <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </Link>
                  </Reveal>
                )
              })}
            </div>
          </>
        ) : (
          /* ─── Empty state almanach ─── */
          <div className="border border-dashed border-rm-ruleStrong bg-rm-paper p-10 md:p-16 text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-5">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                Le journal
              </span>
              <span className="block w-7 h-px bg-rm-burgundy" />
            </div>
            <h2 className="font-display text-[26px] md:text-[32px] text-rm-teal leading-[1.15]">
              {isFiltered ? (
                <>
                  <em className="italic">Aucun article</em> pour ces critères
                </>
              ) : (
                <>
                  <em className="italic">Le cahier</em> est encore vierge
                </>
              )}
            </h2>
            <p className="font-serif italic text-[16px] leading-[1.55] text-rm-inkSoft mt-4">
              {isFiltered
                ? 'Essayez d’autres mots-clés ou une autre catégorie.'
                : 'Aucun article n’a encore été publié. Revenez bientôt — le journal s’étoffe au fil des saisons.'}
            </p>
            {isFiltered ? (
              <Link
                href={`/${locale}/blog`}
                className="inline-block mt-6 font-sans text-sm font-semibold text-rm-burgundy underline underline-offset-4 decoration-1 hover:text-rm-teal transition-colors"
              >
                Effacer les filtres →
              </Link>
            ) : (
              <Link
                href={`/${locale}/plantes`}
                className="inline-flex items-center gap-2 mt-8 font-sans text-sm font-semibold bg-rm-burgundy text-white px-6 py-3 hover:bg-rm-burgundy/90 transition-colors"
              >
                Parcourir les plantes
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        )}

        {/* ─── Pagination ─── */}
        {(totalPages ?? 1) > 1 && (
          <nav
            className="mt-12 sm:mt-16 flex flex-wrap justify-center items-center gap-2 sm:gap-3 border-t border-dashed border-rm-rule pt-8 sm:pt-10"
            aria-label="Pagination"
          >
            {currentPage > 1 ? (
              <Link
                href={buildUrl({ page: String(currentPage - 1) })}
                className="w-10 h-10 flex items-center justify-center border border-rm-ruleStrong text-rm-teal hover:bg-rm-paper hover:border-rm-burgundy hover:text-rm-burgundy transition-colors"
                aria-label="Page précédente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            ) : (
              <span className="w-10 h-10 flex items-center justify-center border border-rm-rule text-rm-ruleStrong cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </span>
            )}

            {Array.from({ length: totalPages ?? 1 }, (_, i) => i + 1).map((pageNum) => (
              <Link
                key={pageNum}
                href={buildUrl({ page: pageNum === 1 ? null : String(pageNum) })}
                className={`min-w-10 h-10 px-3 flex items-center justify-center font-mono text-sm transition-colors ${
                  pageNum === currentPage
                    ? 'bg-rm-burgundy text-white border border-rm-burgundy'
                    : 'border border-rm-ruleStrong text-rm-teal hover:bg-rm-paper hover:border-rm-burgundy hover:text-rm-burgundy'
                }`}
              >
                {pageNum}
              </Link>
            ))}

            {currentPage < (totalPages ?? 1) ? (
              <Link
                href={buildUrl({ page: String(currentPage + 1) })}
                className="w-10 h-10 flex items-center justify-center border border-rm-ruleStrong text-rm-teal hover:bg-rm-paper hover:border-rm-burgundy hover:text-rm-burgundy transition-colors"
                aria-label="Page suivante"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <span className="w-10 h-10 flex items-center justify-center border border-rm-rule text-rm-ruleStrong cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </nav>
        )}
      </div>
    </main>
  )
}
