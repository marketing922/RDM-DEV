import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)

  const articleTitle = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return {
    title: `${articleTitle} | ${dict.blog.title} | ${dict.meta.siteName}`,
    description: `${dict.blog.subtitle} - ${articleTitle}`,
  }
}

export default async function BlogDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const dict = await getDictionary(locale as Locale)

  const articleTitle = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

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
            <p className="text-body-sm font-ui font-medium text-error-text uppercase tracking-wide mb-sm">
              <span className="bg-card rounded animate-pulse inline-block w-20 h-3" />
            </p>

            {/* Title */}
            <h1 className="font-heading text-heading-1 text-neutral-600">
              {articleTitle}
            </h1>

            {/* Meta line */}
            <div className="mt-md flex flex-wrap items-center gap-sm text-body-sm text-neutral-300">
              {/* Author avatar + name */}
              <div className="flex items-center gap-xs">
                <div className="w-8 h-8 rounded-full bg-card animate-pulse" />
                <span>
                  {dict.blog.byAuthor}{' '}
                  <span className="bg-card rounded animate-pulse inline-block w-24 h-3 align-middle" />
                </span>
              </div>
              <span className="text-neutral-200">|</span>
              {/* Date */}
              <span className="bg-card rounded animate-pulse inline-block w-28 h-3" />
              <span className="text-neutral-200">|</span>
              {/* Reading time */}
              <span>
                <span className="bg-card rounded animate-pulse inline-block w-6 h-3 align-middle" />{' '}
                {dict.blog.readingTime}
              </span>
            </div>

            {/* Hero image */}
            <div className="mt-lg aspect-video bg-card rounded-xl animate-pulse" />

            {/* Prose content placeholder */}
            <div className="mt-xl prose prose-lg max-w-none">
              <div className="space-y-md">
                <div className="bg-card rounded h-4 w-full animate-pulse" />
                <div className="bg-card rounded h-4 w-5/6 animate-pulse" />
                <div className="bg-card rounded h-4 w-full animate-pulse" />
                <div className="bg-card rounded h-4 w-3/4 animate-pulse" />
              </div>
              <div className="mt-xl space-y-md">
                <div className="bg-card rounded h-6 w-1/3 animate-pulse" />
                <div className="bg-card rounded h-4 w-full animate-pulse" />
                <div className="bg-card rounded h-4 w-5/6 animate-pulse" />
                <div className="bg-card rounded h-4 w-full animate-pulse" />
                <div className="bg-card rounded h-4 w-2/3 animate-pulse" />
              </div>
              <div className="mt-xl space-y-md">
                <div className="bg-card rounded h-6 w-2/5 animate-pulse" />
                <div className="bg-card rounded h-4 w-full animate-pulse" />
                <div className="bg-card rounded h-4 w-4/5 animate-pulse" />
                <div className="bg-card rounded h-4 w-full animate-pulse" />
              </div>
              <div className="mt-xl space-y-md">
                <div className="bg-card rounded h-6 w-1/4 animate-pulse" />
                <div className="bg-card rounded h-4 w-full animate-pulse" />
                <div className="bg-card rounded h-4 w-5/6 animate-pulse" />
                <div className="bg-card rounded h-4 w-3/4 animate-pulse" />
              </div>
            </div>

            {/* Similar articles */}
            <section className="mt-3xl pt-xl border-t border-neutral-100">
              <h2 className="font-heading text-heading-3 text-neutral-600 mb-lg">
                {dict.blog.detail.similarArticles}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                {Array.from({ length: 3 }).map((_, i) => (
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
                ))}
              </div>
            </section>
          </article>
        </div>
      </div>
    </main>
  )
}
