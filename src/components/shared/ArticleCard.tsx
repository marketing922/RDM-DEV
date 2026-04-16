import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'

type ArticleCardProps = {
  post: {
    title: string
    slug: string
    excerpt?: string
    featuredImage?: { url: string; alt?: string }
    author?: { name: string; avatar?: { url: string } }
    publishedAt?: string
    readingTime?: number
    category?: { name: string }
  }
  locale: string
}

export function ArticleCard({ post, locale }: ArticleCardProps) {
  const {
    title,
    slug,
    excerpt,
    featuredImage,
    author,
    publishedAt,
    readingTime,
    category,
  } = post

  return (
    <Card href={`/${locale}/blog/${slug}`}>
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-card">
        {featuredImage ? (
          <Image
            src={featuredImage.url}
            alt={featuredImage.alt || title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-slow hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-neutral-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-xs p-md">
        {category && (
          <span className="text-overline text-brand uppercase tracking-wide">
            {category.name}
          </span>
        )}

        <h3 className="font-ui font-medium text-neutral-600 line-clamp-2">
          {title}
        </h3>

        {excerpt && (
          <p className="text-body-sm text-neutral-400 line-clamp-2">
            {excerpt}
          </p>
        )}

        {/* Footer: author + reading time */}
        <div className="flex items-center gap-xs mt-sm pt-sm border-t border-neutral-100">
          {author && (
            <div className="flex items-center gap-xs">
              <div className="relative w-[28px] h-[28px] rounded-full bg-card overflow-hidden shrink-0">
                {author.avatar ? (
                  <Image
                    src={author.avatar.url}
                    alt={author.name}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-brand-light text-brand text-caption font-medium">
                    {author.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-body-sm text-neutral-400">
                {author.name}
              </span>
            </div>
          )}

          {readingTime && (
            <span className="text-body-sm text-neutral-300 ml-auto">
              {readingTime} min de lecture
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
