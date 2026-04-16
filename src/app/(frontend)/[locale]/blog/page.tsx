import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getFeaturedBlogPost, getBlogPosts } from '@/lib/queries'
import { ArticleCard } from '@/components/shared/ArticleCard'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: `${dict.blog.title} | ${dict.meta.siteName}`,
    description: dict.blog.subtitle,
  }
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const featuredPost = await getFeaturedBlogPost(locale)
  const { docs: posts } = await getBlogPosts({ limit: 6, locale })

  const categoryKeys = Object.keys(dict.blog.categories) as Array<
    keyof typeof dict.blog.categories
  >

  return (
    <main className="bg-page min-h-screen">
      <div className="mx-auto max-w-7xl px-md py-md">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.blog.title },
          ]}
        />

        {/* Header */}
        <div className="mt-lg mb-xl text-center">
          <h1 className="font-heading text-heading-1 text-neutral-600">
            {dict.blog.title}
          </h1>
          <p className="mt-sm text-body-lg text-neutral-400 max-w-2xl mx-auto">
            {dict.blog.subtitle}
          </p>
        </div>

        {/* Featured article */}
        <div className="mb-2xl">
          <p className="text-body-sm font-ui font-medium text-brand mb-sm uppercase tracking-wide">
            {dict.blog.featured}
          </p>
          {featuredPost ? (
            <Link href={`/${locale}/blog/${(featuredPost as any).slug}`} className="block bg-white rounded-xl shadow overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition-shadow duration-slow">
              {/* Image left 3/5 */}
              <div className="w-full md:w-3/5 aspect-video md:aspect-auto md:min-h-[320px] bg-card relative overflow-hidden">
                {(featuredPost as any).featuredImage ? (
                  <Image
                    src={(featuredPost as any).featuredImage.url}
                    alt={(featuredPost as any).featuredImage.alt || (featuredPost as any).title}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-card animate-pulse" />
                )}
              </div>
              {/* Content right 2/5 */}
              <div className="w-full md:w-2/5 p-lg flex flex-col justify-center">
                {(featuredPost as any).category && (
                  <span className="text-body-sm font-ui font-medium text-brand mb-sm">
                    {(featuredPost as any).category.name}
                  </span>
                )}
                <h2 className="font-heading text-heading-3 text-neutral-600 mb-md">
                  {(featuredPost as any).title}
                </h2>
                {(featuredPost as any).excerpt && (
                  <p className="text-body text-neutral-400 line-clamp-3 mb-lg">
                    {(featuredPost as any).excerpt}
                  </p>
                )}
                <div className="flex items-center gap-sm text-body-sm text-neutral-300">
                  {(featuredPost as any).author && (
                    <div className="flex items-center gap-xs">
                      <div className="w-8 h-8 rounded-full bg-card overflow-hidden">
                        {(featuredPost as any).author.avatar ? (
                          <Image
                            src={(featuredPost as any).author.avatar.url}
                            alt={(featuredPost as any).author.name}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        ) : null}
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
              </div>
            </Link>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-3/5 aspect-video md:aspect-auto md:min-h-[320px] bg-card animate-pulse" />
              <div className="w-full md:w-2/5 p-lg flex flex-col justify-center">
                <div className="bg-card rounded h-3 w-20 animate-pulse mb-sm" />
                <div className="bg-card rounded h-6 w-full animate-pulse mb-sm" />
                <div className="bg-card rounded h-6 w-3/4 animate-pulse mb-md" />
                <div className="space-y-xs mb-lg">
                  <div className="bg-card rounded h-4 w-full animate-pulse" />
                  <div className="bg-card rounded h-4 w-5/6 animate-pulse" />
                  <div className="bg-card rounded h-4 w-2/3 animate-pulse" />
                </div>
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-full bg-card animate-pulse" />
                  <div className="bg-card rounded h-3 w-24 animate-pulse" />
                  <div className="bg-card rounded h-3 w-16 animate-pulse ml-auto" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category filter pills */}
        <div className="mb-xl flex flex-wrap justify-center gap-sm">
          {categoryKeys.map((key) => (
            <button
              key={String(key)}
              className={`inline-flex items-center h-[36px] px-lg rounded-pill text-body-sm font-ui font-medium transition-all duration-fast ${
                key === 'all'
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-white text-neutral-400 border border-neutral-100 hover:bg-brand-light hover:text-brand hover:border-brand'
              }`}
            >
              {dict.blog.categories[key]}
            </button>
          ))}
        </div>

        {/* Article grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {posts.length > 0 ? (
            posts.map((post) => (
              <ArticleCard key={post.id} post={post as any} locale={locale} />
            ))
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow overflow-hidden"
              >
                <div className="aspect-video bg-card animate-pulse" />
                <div className="p-md">
                  <div className="bg-card rounded h-3 w-16 animate-pulse mb-sm" />
                  <div className="bg-card rounded h-5 w-full animate-pulse mb-xs" />
                  <div className="bg-card rounded h-5 w-2/3 animate-pulse mb-md" />
                  <div className="space-y-xs mb-md">
                    <div className="bg-card rounded h-3 w-full animate-pulse" />
                    <div className="bg-card rounded h-3 w-5/6 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-sm pt-sm border-t border-neutral-50">
                    <div className="w-6 h-6 rounded-full bg-card animate-pulse" />
                    <div className="bg-card rounded h-3 w-20 animate-pulse" />
                    <div className="bg-card rounded h-3 w-16 animate-pulse ml-auto" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
