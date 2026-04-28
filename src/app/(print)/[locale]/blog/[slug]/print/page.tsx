import { notFound } from 'next/navigation'
import { getBlogPostBySlug } from '@/lib/queries'
import BlogPrintPage from '@/components/blog/BlogPrintPage'
import AutoPrint from '@/components/plantes/AutoPrint'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export default async function BlogPrintRoute({ params }: Props) {
  const { locale, slug } = await params
  const post = (await getBlogPostBySlug(slug, locale).catch(() => null)) as any
  if (!post) notFound()

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://lesremedesdmamie.fr'
  const canonicalUrl = `${baseUrl}/${locale}/blog/${slug}`

  const author =
    post.author && typeof post.author === 'object'
      ? (post.author as any)
      : null

  return (
    <>
      <BlogPrintPage
        locale={locale}
        title={post.title}
        excerpt={post.excerpt}
        authorName={author?.name}
        authorRole={author?.role}
        publishedAt={post.publishedAt}
        readingTime={post.readingTime}
        category={
          post.category && typeof post.category === 'object'
            ? (post.category as any).name
            : undefined
        }
        content={post.content}
        featuredImage={post.featuredImage}
        canonicalUrl={canonicalUrl}
      />
      <AutoPrint />
    </>
  )
}
