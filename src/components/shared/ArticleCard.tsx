import Link from 'next/link'
import Image from 'next/image'
import { resolveMediaUrl } from '@/lib/mediaUrl'

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
  compact?: boolean
}

export function ArticleCard({ post, locale, compact = false }: ArticleCardProps) {
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

  if (compact) {
    // Mobile list item variant: small thumbnail + text side by side
    return (
      <Link
        href={`/${locale}/blog/${slug}`}
        className="flex gap-3 bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
      >
        <div className="relative w-24 h-24 shrink-0 bg-[#FFF5D5] overflow-hidden">
          {featuredImage ? (
            <Image
              src={resolveMediaUrl(featuredImage, 'thumbnail') ?? ''}
              alt={featuredImage.alt || title}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-[#DCD8C7]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center py-2 pr-3 min-w-0">
          {category && (
            <span className="text-xs font-medium text-[#D0802C] uppercase tracking-wide">
              {category.name}
            </span>
          )}
          <h3 className="text-sm font-semibold text-[#054A57] line-clamp-2 mt-0.5">
            {title}
          </h3>
          {readingTime && (
            <span className="text-xs text-[#712E2F]/50 mt-1">
              {readingTime} min de lecture
            </span>
          )}
        </div>
      </Link>
    )
  }

  // Default card variant
  return (
    <Link
      href={`/${locale}/blog/${slug}`}
      className="block bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-[#FFF5D5]">
        {featuredImage ? (
          <Image
            src={resolveMediaUrl(featuredImage, 'card') ?? ''}
            alt={featuredImage.alt || title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-[#DCD8C7]">
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
      <div className="flex flex-col gap-1.5 p-4">
        {category && (
          <span className="text-xs font-medium text-[#D0802C] uppercase tracking-wide">
            {category.name}
          </span>
        )}

        <h3 className="text-base font-semibold text-[#054A57] line-clamp-2">
          {title}
        </h3>

        {excerpt && (
          <p className="text-sm text-gray-600 line-clamp-3">
            {excerpt}
          </p>
        )}

        {/* Footer: author + reading time */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#DCD8C7]">
          {author && (
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 rounded-full bg-[#FFF5D5] overflow-hidden shrink-0">
                {author.avatar ? (
                  <Image
                    src={author.avatar.url}
                    alt={author.name}
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-[#FFF5D5] text-[#A2211E] text-xs font-medium">
                    {author.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm text-[#712E2F]/60">
                {author.name}
              </span>
            </div>
          )}

          {readingTime && (
            <span className="text-sm text-[#712E2F]/50 ml-auto">
              {readingTime} min de lecture
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
