import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { getBlogPostBySlug, getBlogPosts } from '@/lib/queries'
import { ArticleCard } from '@/components/shared/ArticleCard'
import Image from 'next/image'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const post = await getBlogPostBySlug(slug, locale)

  if (!post) {
    return { title: `Not Found | ${dict.meta.siteName}` }
  }

  return {
    title: `${(post as any).title} | ${dict.blog.title} | ${dict.meta.siteName}`,
    description: (post as any).excerpt || `${dict.blog.subtitle}`,
  }
}

export default async function BlogDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)
  const post = await getBlogPostBySlug(slug, locale)
  if (!post) notFound()

  const p = post as any
  const articleTitle = p.title || slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

  const { docs: similarPosts } = await getBlogPosts({ limit: 3, locale })

  const tocItems = [
    { id: 'introduction', label: 'Introduction' },
    { id: 'section-1', label: 'Section 1' },
    { id: 'section-2', label: 'Section 2' },
    { id: 'section-3', label: 'Section 3' },
    { id: 'conclusion', label: 'Conclusion' },
  ]

  return (
    <main className="bg-page min-h-screen">
      <div className="mx-auto max-w-7xl px-md py-md">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.blog.title, href: `/${locale}/blog` },
            { label: articleTitle },
          ]}
        />

        <div className="mt-lg flex flex-col lg:flex-row gap-xl">
          {/* TOC sidebar (left) -- hidden on mobile */}
          <aside className="hidden lg:block lg:w-60 shrink-0">
            <div className="sticky top-[100px]">
              <h2 className="font-heading text-heading-5 text-neutral-600 mb-md">
                {dict.blog.detail.tableOfContents}
              </h2>
              <nav>
                <ul className="space-y-xs">
                  {tocItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block text-body-sm text-neutral-300 hover:text-brand transition-colors duration-fast py-xs"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Main content (right) */}
          <article className="w-full min-w-0">
            {/* Category overline */}
            {p.category ? (
              <p className="text-body-sm font-ui font-medium text-brand uppercase tracking-wide mb-sm">
                {p.category.name}
              </p>
            ) : (
              <p className="text-body-sm font-ui font-medium text-error-text uppercase tracking-wide mb-sm">
                <span className="bg-card rounded animate-pulse inline-block w-20 h-3" />
              </p>
            )}

            {/* Title */}
            <h1 className="font-heading text-heading-1 text-neutral-600">
              {articleTitle}
            </h1>

            {/* Meta line */}
            <div className="mt-md flex flex-wrap items-center gap-sm text-body-sm text-neutral-300">
              {/* Author avatar + name */}
              {p.author ? (
                <div className="flex items-center gap-xs">
                  <div className="w-8 h-8 rounded-full bg-card overflow-hidden">
                    {p.author.avatar ? (
                      <Image src={p.author.avatar.url} alt={p.author.name} width={32} height={32} className="object-cover" />
                    ) : null}
                  </div>
                  <span>
                    {dict.blog.byAuthor} {p.author.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-xs">
                  <div className="w-8 h-8 rounded-full bg-card animate-pulse" />
                  <span className="bg-card rounded animate-pulse inline-block w-24 h-3" />
                </div>
              )}
              <span className="text-neutral-200">|</span>
              {/* Date */}
              {p.publishedAt ? (
                <span>{new Date(p.publishedAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              ) : (
                <span className="bg-card rounded animate-pulse inline-block w-28 h-3" />
              )}
              {p.readingTime && (
                <>
                  <span className="text-neutral-200">|</span>
                  <span>{p.readingTime} {dict.blog.readingTime}</span>
                </>
              )}
            </div>

            {/* Hero image */}
            {p.featuredImage ? (
              <div className="mt-lg aspect-video bg-card rounded-xl overflow-hidden relative">
                <Image
                  src={p.featuredImage.url}
                  alt={p.featuredImage.alt || articleTitle}
                  fill
                  sizes="(max-width: 1024px) 100vw, 75vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="mt-lg aspect-video bg-card rounded-xl animate-pulse" />
            )}

            {/* Prose content */}
            {p.content ? (
              <div className="mt-xl prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: p.content }} />
            ) : (
              <div className="mt-xl prose prose-lg max-w-none">
                <div className="space-y-md">
                  <div className="bg-card rounded h-4 w-full animate-pulse" />
                  <div className="bg-card rounded h-4 w-5/6 animate-pulse" />
                  <div className="bg-card rounded h-4 w-full animate-pulse" />
                  <div className="bg-card rounded h-4 w-3/4 animate-pulse" />
                </div>
              </div>
            )}

            {/* Similar articles */}
            <section className="mt-3xl pt-xl border-t border-neutral-100">
              <h2 className="font-heading text-heading-3 text-neutral-600 mb-lg">
                {dict.blog.detail.similarArticles}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                {similarPosts.length > 0 ? (
                  similarPosts.filter((sp) => (sp as any).slug !== slug).slice(0, 3).map((sp) => (
                    <ArticleCard key={sp.id} post={sp as any} locale={locale} />
                  ))
                ) : (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl shadow overflow-hidden"
                    >
                      <div className="aspect-video bg-card animate-pulse" />
                      <div className="p-md">
                        <div className="bg-card rounded h-3 w-16 animate-pulse mb-sm" />
                        <div className="bg-card rounded h-5 w-full animate-pulse mb-xs" />
                        <div className="bg-card rounded h-5 w-2/3 animate-pulse mb-md" />
                        <div className="flex items-center gap-sm">
                          <div className="w-6 h-6 rounded-full bg-card animate-pulse" />
                          <div className="bg-card rounded h-3 w-20 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </article>
        </div>
      </div>
    </main>
  )
}
