import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type Props = { params: Promise<{ locale: string }> }

function SkeletonCard() {
  return (
    <Card>
      <div className="aspect-[4/3] bg-neutral-100 animate-pulse" />
      <div className="p-md space-y-xs">
        <div className="h-4 bg-neutral-100 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-neutral-100 rounded animate-pulse w-1/2" />
        <div className="h-5 bg-neutral-100 rounded animate-pulse w-1/3 mt-sm" />
      </div>
    </Card>
  )
}

function SkeletonArticle() {
  return (
    <Card>
      <div className="aspect-[16/9] bg-neutral-100 animate-pulse" />
      <div className="p-md space-y-xs">
        <div className="h-3 bg-neutral-100 rounded animate-pulse w-1/4" />
        <div className="h-4 bg-neutral-100 rounded animate-pulse w-full" />
        <div className="h-3 bg-neutral-100 rounded animate-pulse w-5/6" />
      </div>
    </Card>
  )
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-page to-white py-5xl">
        <div className="max-w-7xl mx-auto px-lg text-center">
          <h1 className="font-heading text-display text-neutral-600 mb-md">
            {dict.home.hero.title}
          </h1>
          <p className="font-body text-body-lg text-neutral-400 max-w-2xl mx-auto mb-2xl">
            {dict.home.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-md">
            <Button variant="primary" size="lg">
              {dict.home.hero.cta}
            </Button>
            <Button variant="secondary" size="lg">
              {dict.home.hero.ctaSecondary}
            </Button>
          </div>
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="py-4xl bg-white">
        <div className="max-w-7xl mx-auto px-lg">
          <div className="text-center mb-2xl">
            <h2 className="font-heading text-h2 text-neutral-600 mb-xs">
              {dict.home.bestsellers.title}
            </h2>
            <p className="font-body text-body-lg text-neutral-400">
              {dict.home.bestsellers.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="text-center mt-2xl">
            <Button variant="secondary">
              {dict.home.bestsellers.viewAll}
            </Button>
          </div>
        </div>
      </section>

      {/* Wiki / Encyclopedia Section */}
      <section className="py-4xl bg-page">
        <div className="max-w-7xl mx-auto px-lg">
          <div className="text-center mb-2xl">
            <h2 className="font-heading text-h2 text-neutral-600 mb-xs">
              {dict.home.wiki.title}
            </h2>
            <p className="font-body text-body-lg text-neutral-400">
              {dict.home.wiki.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <div className="aspect-square bg-neutral-100 animate-pulse rounded-t-xl" />
                <div className="p-md space-y-xs">
                  <div className="h-4 bg-neutral-100 rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-neutral-100 rounded animate-pulse w-full" />
                  <div className="h-3 bg-neutral-100 rounded animate-pulse w-4/5" />
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-2xl">
            <Button variant="secondary">
              {dict.home.wiki.viewAll}
            </Button>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-4xl bg-white">
        <div className="max-w-7xl mx-auto px-lg">
          <div className="text-center mb-2xl">
            <h2 className="font-heading text-h2 text-neutral-600 mb-xs">
              {dict.home.blog.title}
            </h2>
            <p className="font-body text-body-lg text-neutral-400">
              {dict.home.blog.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonArticle key={i} />
            ))}
          </div>
          <div className="text-center mt-2xl">
            <Button variant="secondary">
              {dict.home.blog.viewAll}
            </Button>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-3xl bg-page">
        <div className="max-w-7xl mx-auto px-lg">
          <h2 className="font-heading text-h2 text-neutral-600 text-center mb-2xl">
            {dict.home.certifications.title}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-lg">
            {(
              [
                { key: 'bio', icon: '🌿' },
                { key: 'pharmacopee', icon: '📋' },
                { key: 'vegan', icon: '🌱' },
                { key: 'metaux', icon: '🛡️' },
                { key: 'france', icon: '🇫🇷' },
                { key: 'naturel', icon: '🍃' },
              ] as const
            ).map((cert) => (
              <div
                key={cert.key}
                className="flex flex-col items-center gap-xs bg-white rounded-xl shadow-sm px-xl py-lg min-w-[120px]"
              >
                <span className="text-h2">{cert.icon}</span>
                <span className="font-ui text-body-sm text-neutral-500 text-center font-medium">
                  {dict.home.certifications[cert.key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-4xl bg-brand">
        <div className="max-w-2xl mx-auto px-lg text-center">
          <h2 className="font-heading text-h2 text-white mb-xs">
            {dict.home.newsletter.title}
          </h2>
          <p className="font-body text-body-lg text-white/80 mb-2xl">
            {dict.home.newsletter.subtitle}
          </p>
          <form className="flex flex-col sm:flex-row gap-sm max-w-lg mx-auto">
            <input
              type="email"
              placeholder={dict.home.newsletter.placeholder}
              className="flex-1 h-[52px] px-lg rounded-xl font-ui text-body text-neutral-600 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <Button
              variant="secondary"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-brand"
              type="submit"
            >
              {dict.home.newsletter.cta}
            </Button>
          </form>
          <p className="font-ui text-caption text-white/60 mt-md">
            {dict.home.newsletter.privacy}
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-4xl bg-white">
        <div className="max-w-3xl mx-auto px-lg">
          <h2 className="font-heading text-h2 text-neutral-600 text-center mb-2xl">
            {dict.home.faq.title}
          </h2>
          <div className="space-y-md">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-neutral-50 rounded-xl p-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-neutral-200 rounded animate-pulse w-2/3" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300 flex-shrink-0 ml-md">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-2xl">
            <Button variant="ghost">
              {dict.home.faq.viewAll}
            </Button>
          </div>
        </div>
      </section>

      {/* Bottom padding for mobile nav */}
      <div className="h-14 lg:hidden" />
    </>
  )
}
