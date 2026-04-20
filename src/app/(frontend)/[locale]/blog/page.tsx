import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getFeaturedBlogPost, getBlogPosts } from '@/lib/queries'
import { ArticleCard } from '@/components/shared/ArticleCard'
import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 60

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; category?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: `${dict.blog.title} | ${dict.meta.siteName}`,
    description: dict.blog.subtitle,
  }
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { page: pageParam, category: categoryParam } = await searchParams
  const dict = await getDictionary(locale as Locale)
  const featuredPost = await getFeaturedBlogPost(locale)

  const currentPage = parseInt(pageParam || '1', 10)
  const postsPerPage = 6
  const { docs: posts, totalPages } = await getBlogPosts({
    limit: postsPerPage,
    page: currentPage,
    locale,
  })

  const categoryKeys = Object.keys(dict.blog.categories) as Array<
    keyof typeof dict.blog.categories
  >

  const activeCategory = categoryParam || 'all'

  return (
    <main className="bg-[#FEF9E9] min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.blog.title },
          ]}
        />

        {/* Header */}
        <div className="mt-8 mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#054A57]">
            {dict.blog.title}
          </h1>
          <p className="mt-3 text-lg text-[#712E2F]/70 max-w-2xl mx-auto">
            {dict.blog.subtitle}
          </p>
        </div>

        {/* Featured article */}
        <div className="mb-12">
          <p className="text-sm font-medium text-[#A2211E] mb-3 uppercase tracking-wide">
            {dict.blog.featured}
          </p>
          {featuredPost ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition-shadow duration-300">
              {/* Image left 3/5 */}
              <div className="w-full md:w-3/5 aspect-video md:aspect-auto md:min-h-[360px] bg-[#FFF5D5] relative overflow-hidden">
                {(featuredPost as any).featuredImage ? (
                  <Image
                    src={(featuredPost as any).featuredImage.url}
                    alt={(featuredPost as any).featuredImage.alt || (featuredPost as any).title}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-[#FFF5D5] animate-pulse" />
                )}
              </div>
              {/* Content right 2/5 */}
              <div className="w-full md:w-2/5 p-6 lg:p-8 flex flex-col justify-center">
                {(featuredPost as any).category && (
                  <span className="text-sm font-medium text-[#D0802C] uppercase tracking-wide">
                    {(featuredPost as any).category.name}
                  </span>
                )}
                <h2 className="text-2xl lg:text-3xl font-bold text-[#054A57] mt-2 mb-3">
                  {(featuredPost as any).title}
                </h2>
                {(featuredPost as any).excerpt && (
                  <p className="text-base text-[#712E2F]/70 line-clamp-3 mb-4">
                    {(featuredPost as any).excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 text-sm text-[#712E2F]/60 mb-4">
                  {(featuredPost as any).author && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#FFF5D5] overflow-hidden shrink-0">
                        {(featuredPost as any).author.avatar ? (
                          <Image
                            src={(featuredPost as any).author.avatar.url}
                            alt={(featuredPost as any).author.name}
                            width={32}
                            height={32}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-[#FFF5D5] text-[#A2211E] text-xs font-medium">
                            {(featuredPost as any).author.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span>{(featuredPost as any).author.name}</span>
                    </div>
                  )}
                  {(featuredPost as any).publishedAt && (
                    <span className="ml-auto">
                      {new Date((featuredPost as any).publishedAt).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                <Link
                  href={`/${locale}/blog/${(featuredPost as any).slug}`}
                  className="inline-flex items-center text-[#A2211E] font-medium hover:underline"
                >
                  Lire l&apos;article
                  <span className="ml-1">&rarr;</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-3/5 aspect-video md:aspect-auto md:min-h-[360px] bg-[#FFF5D5] animate-pulse" />
              <div className="w-full md:w-2/5 p-6 lg:p-8 flex flex-col justify-center">
                <div className="bg-[#FFF5D5] rounded h-3 w-20 animate-pulse mb-3" />
                <div className="bg-[#FFF5D5] rounded h-7 w-full animate-pulse mb-2" />
                <div className="bg-[#FFF5D5] rounded h-7 w-3/4 animate-pulse mb-4" />
                <div className="space-y-2 mb-4">
                  <div className="bg-[#FFF5D5] rounded h-4 w-full animate-pulse" />
                  <div className="bg-[#FFF5D5] rounded h-4 w-5/6 animate-pulse" />
                  <div className="bg-[#FFF5D5] rounded h-4 w-2/3 animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFF5D5] animate-pulse" />
                  <div className="bg-[#FFF5D5] rounded h-3 w-24 animate-pulse" />
                  <div className="bg-[#FFF5D5] rounded h-3 w-16 animate-pulse ml-auto" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category filter pills */}
        <div className="mb-10 overflow-x-auto scrollbar-hide">
          <div className="flex md:flex-wrap md:justify-center gap-2 min-w-max md:min-w-0">
            {categoryKeys.map((key) => {
              const isActive = String(key) === activeCategory
              return (
                <Link
                  key={String(key)}
                  href={
                    key === 'all'
                      ? `/${locale}/blog`
                      : `/${locale}/blog?category=${String(key)}`
                  }
                  className={`inline-flex items-center h-9 px-5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#A2211E] text-white shadow-sm'
                      : 'bg-white text-[#712E2F] border border-[#DCD8C7] hover:bg-[#FFF5D5] hover:text-[#A2211E] hover:border-[#A2211E]'
                  }`}
                >
                  {dict.blog.categories[key]}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Article grid - Desktop: 3 cols, Tablet: 2 cols, Mobile: list items */}
        {posts.length > 0 ? (
          <>
            {/* Desktop/tablet grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <ArticleCard key={post.id} post={post as any} locale={locale} />
              ))}
            </div>
            {/* Mobile list */}
            <div className="flex flex-col gap-3 sm:hidden">
              {posts.map((post) => (
                <ArticleCard key={post.id} post={post as any} locale={locale} compact />
              ))}
            </div>
          </>
        ) : (
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="aspect-video bg-[#FFF5D5] animate-pulse" />
                <div className="p-4">
                  <div className="bg-[#FFF5D5] rounded h-3 w-16 animate-pulse mb-2" />
                  <div className="bg-[#FFF5D5] rounded h-5 w-full animate-pulse mb-1" />
                  <div className="bg-[#FFF5D5] rounded h-5 w-2/3 animate-pulse mb-3" />
                  <div className="space-y-1.5 mb-3">
                    <div className="bg-[#FFF5D5] rounded h-3 w-full animate-pulse" />
                    <div className="bg-[#FFF5D5] rounded h-3 w-5/6 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-[#DCD8C7]">
                    <div className="w-6 h-6 rounded-full bg-[#FFF5D5] animate-pulse" />
                    <div className="bg-[#FFF5D5] rounded h-3 w-20 animate-pulse" />
                    <div className="bg-[#FFF5D5] rounded h-3 w-16 animate-pulse ml-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {(totalPages ?? 1) > 1 && (
          <nav className="mt-12 flex justify-center items-center gap-2" aria-label="Pagination">
            {/* Previous arrow */}
            {currentPage > 1 ? (
              <Link
                href={`/${locale}/blog?page=${currentPage - 1}${categoryParam ? `&category=${categoryParam}` : ''}`}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-[#DCD8C7] text-[#712E2F] hover:bg-[#FFF5D5] hover:border-[#A2211E] hover:text-[#A2211E] transition-colors"
                aria-label="Page précédente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            ) : (
              <span className="w-10 h-10 flex items-center justify-center rounded-full border border-[#DCD8C7] text-[#DCD8C7] cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </span>
            )}

            {/* Page numbers */}
            {Array.from({ length: totalPages ?? 1 }, (_, i) => i + 1).map((pageNum) => (
              <Link
                key={pageNum}
                href={`/${locale}/blog?page=${pageNum}${categoryParam ? `&category=${categoryParam}` : ''}`}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  pageNum === currentPage
                    ? 'bg-[#A2211E] text-white'
                    : 'border border-[#DCD8C7] text-[#712E2F] hover:bg-[#FFF5D5] hover:border-[#A2211E] hover:text-[#A2211E]'
                }`}
              >
                {pageNum}
              </Link>
            ))}

            {/* Next arrow */}
            {currentPage < (totalPages ?? 1) ? (
              <Link
                href={`/${locale}/blog?page=${currentPage + 1}${categoryParam ? `&category=${categoryParam}` : ''}`}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-[#DCD8C7] text-[#712E2F] hover:bg-[#FFF5D5] hover:border-[#A2211E] hover:text-[#A2211E] transition-colors"
                aria-label="Page suivante"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <span className="w-10 h-10 flex items-center justify-center rounded-full border border-[#DCD8C7] text-[#DCD8C7] cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
