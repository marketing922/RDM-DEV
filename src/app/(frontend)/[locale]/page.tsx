import type { ReactNode } from 'react'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getFeaturedProducts, getWikiEntries, getBlogPosts } from '@/lib/queries'
import { ProductCard } from '@/components/shared/ProductCard'
import { WikiCard } from '@/components/shared/WikiCard'
import { ArticleCard } from '@/components/shared/ArticleCard'

type Props = { params: Promise<{ locale: string }> }

/* ─── Skeleton Components ─────────────────────────────────────────── */

function SkeletonProductCard() {
  return (
    <div className="group bg-white rounded-2xl shadow overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="aspect-square bg-[#DCD8C7] animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-neutral-200 rounded-lg animate-pulse w-3/4" />
        <div className="h-3 bg-neutral-100 rounded-lg animate-pulse w-1/2" />
        <div className="h-5 bg-neutral-200 rounded-lg animate-pulse w-1/3 mt-2" />
      </div>
    </div>
  )
}

function SkeletonWikiCard() {
  return (
    <div className="group bg-white rounded-2xl shadow overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-center justify-center py-8 bg-[#FEF2F2]">
        <div className="w-24 h-24 rounded-full bg-[#DCD8C7] animate-pulse" />
      </div>
      <div className="p-5 space-y-3">
        <div className="h-4 bg-neutral-200 rounded-lg animate-pulse w-2/3 mx-auto" />
        <div className="h-3 bg-neutral-100 rounded-lg animate-pulse w-full" />
        <div className="h-3 bg-neutral-100 rounded-lg animate-pulse w-4/5" />
      </div>
    </div>
  )
}

function SkeletonArticleCard() {
  return (
    <div className="group bg-white rounded-2xl shadow overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="aspect-video bg-[#DCD8C7] animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-neutral-100 rounded-lg animate-pulse w-1/4" />
        <div className="h-5 bg-neutral-200 rounded-lg animate-pulse w-full" />
        <div className="h-3 bg-neutral-100 rounded-lg animate-pulse w-5/6" />
        <div className="h-3 bg-neutral-100 rounded-lg animate-pulse w-2/3" />
      </div>
    </div>
  )
}

/* ─── Certification Icons (SVG) ───────────────────────────────────── */

function CertIcon({ type }: { type: string }) {
  const icons: Record<string, ReactNode> = {
    bio: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-brand">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M8 12s1-4 4-4 4 4 4 4-1 4-4 4-4-4-4-4z" />
        <path d="M12 8v8" />
      </svg>
    ),
    pharmacopee: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-brand">
        <path d="M9 2h6v4H9z" />
        <path d="M4 6h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
        <path d="M12 10v6" />
        <path d="M9 13h6" />
      </svg>
    ),
    vegan: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-brand">
        <path d="M7 20.5C7 17 9 12 17 4" />
        <path d="M17 4c-4 0-8 1-10.5 5.5C4 14 7 17 7 20.5" />
        <path d="M17 4c0 4-1 8-5.5 10.5" />
      </svg>
    ),
    metaux: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-brand">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    france: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-brand">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="9" y1="4" x2="9" y2="20" />
        <line x1="15" y1="4" x2="15" y2="20" />
      </svg>
    ),
    naturel: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-brand">
        <path d="M17 8c.7-1 1.4-2.2 1.8-3.6.1-.4-.3-.8-.7-.7C16.7 4.1 15.5 4.8 14.5 5.5 13.2 3.9 11.2 3 9 3 5.1 3 2 6.1 2 10c0 5.5 7 11 7 11" />
        <path d="M22 10c0 5.5-7 11-7 11" />
        <path d="M22 10c0-3.9-3.1-7-7-7" />
      </svg>
    ),
  }
  return icons[type] || null
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const { docs: featuredProducts } = await getFeaturedProducts(4, locale)
  const { docs: wikiEntries } = await getWikiEntries({ limit: 4, locale })
  const { docs: blogPosts } = await getBlogPosts({ limit: 3, locale })

  return (
    <>
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FEF9E9] via-white to-[#FEF2F2] py-24 md:py-32 lg:py-40">
        {/* Decorative blurred circles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#A2211E]/20 to-[#FEF2F2]/40 blur-3xl opacity-30"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-[#FEF9E9]/60 to-[#A2211E]/10 blur-3xl opacity-30"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-600 leading-tight tracking-tight">
            {dict.home.hero.title}
          </h1>
          <p className="mt-6 text-xl md:text-2xl font-body text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            {dict.home.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="primary" size="lg" className="min-w-[220px] min-h-[52px] text-lg shadow-md hover:shadow-lg">
              {dict.home.hero.cta}
            </Button>
            <Button variant="secondary" size="lg" className="min-w-[200px] min-h-[52px] text-lg">
              {dict.home.hero.ctaSecondary}
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════ BESTSELLERS ═══════════════════ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-600 tracking-tight">
              {dict.home.bestsellers.title}
            </h2>
            <p className="mt-3 font-body text-lg md:text-xl text-neutral-400 max-w-xl mx-auto">
              {dict.home.bestsellers.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {featuredProducts.length > 0
              ? featuredProducts.map((product) => (
                  <div key={product.id} className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rounded-2xl">
                    <ProductCard product={product as any} locale={locale} />
                  </div>
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonProductCard key={i} />
                ))}
          </div>

          <div className="text-center mt-14">
            <Button variant="secondary" size="lg" className="min-h-[48px] min-w-[240px]">
              {dict.home.bestsellers.viewAll}
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════ ENCYCLOPEDIE ═══════════════════ */}
      <section className="py-20 md:py-28 bg-[#FEF9E9]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-600 tracking-tight">
              {dict.home.wiki.title}
            </h2>
            <p className="mt-3 font-body text-lg md:text-xl text-neutral-400 max-w-xl mx-auto">
              {dict.home.wiki.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {wikiEntries.length > 0
              ? wikiEntries.map((entry) => (
                  <div key={entry.id} className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rounded-2xl">
                    <WikiCard entry={entry as any} locale={locale} />
                  </div>
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonWikiCard key={i} />
                ))}
          </div>

          <div className="text-center mt-14">
            <Button variant="secondary" size="lg" className="min-h-[48px] min-w-[240px]">
              {dict.home.wiki.viewAll}
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ BLOG ═══════════════════════ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-600 tracking-tight">
              {dict.home.blog.title}
            </h2>
            <p className="mt-3 font-body text-lg md:text-xl text-neutral-400 max-w-xl mx-auto">
              {dict.home.blog.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {blogPosts.length > 0
              ? blogPosts.map((post) => (
                  <div key={post.id} className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rounded-2xl">
                    <ArticleCard post={post as any} locale={locale} />
                  </div>
                ))
              : Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonArticleCard key={i} />
                ))}
          </div>

          <div className="text-center mt-14">
            <Button variant="secondary" size="lg" className="min-h-[48px] min-w-[240px]">
              {dict.home.blog.viewAll}
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════ CERTIFICATIONS ═══════════════════ */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#FEF9E9] to-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-600 tracking-tight">
              {dict.home.certifications.title}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {(
              [
                { key: 'bio', type: 'bio' },
                { key: 'pharmacopee', type: 'pharmacopee' },
                { key: 'vegan', type: 'vegan' },
                { key: 'metaux', type: 'metaux' },
                { key: 'france', type: 'france' },
                { key: 'naturel', type: 'naturel' },
              ] as const
            ).map((cert) => (
              <div
                key={cert.key}
                className="flex flex-col items-center gap-3 bg-white rounded-xl shadow-sm p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 min-h-[120px] justify-center"
              >
                <CertIcon type={cert.type} />
                <span className="font-ui text-sm text-neutral-500 font-medium leading-snug">
                  {dict.home.certifications[cert.key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ NEWSLETTER ═══════════════════ */}
      <section className="py-20 md:py-28 bg-brand">
        <div className="mx-auto max-w-2xl px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
            {dict.home.newsletter.title}
          </h2>
          <p className="mt-4 font-body text-lg md:text-xl text-white/80 leading-relaxed">
            {dict.home.newsletter.subtitle}
          </p>

          <form className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              placeholder={dict.home.newsletter.placeholder}
              className="flex-1 h-[52px] px-6 rounded-full font-ui text-base text-neutral-600 bg-white border-0 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-neutral-300"
            />
            <Button
              variant="secondary"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-brand rounded-full min-h-[52px] min-w-[140px]"
              type="submit"
            >
              {dict.home.newsletter.cta}
            </Button>
          </form>

          <p className="font-ui text-xs text-white/50 mt-5">
            {dict.home.newsletter.privacy}
          </p>
        </div>
      </section>

      {/* ═══════════════════════ FAQ ═══════════════════════ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-600 text-center tracking-tight mb-14">
            {dict.home.faq.title}
          </h2>

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#FEF9E9] rounded-2xl p-6 transition-all duration-300 hover:shadow-sm"
              >
                <button
                  type="button"
                  aria-label={`FAQ ${i + 1}`}
                  className="flex w-full items-center justify-between gap-4 min-h-[44px]"
                >
                  <div className="h-5 bg-neutral-200/60 rounded-lg animate-pulse w-2/3" />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-neutral-300 flex-shrink-0 transition-transform duration-300"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Button variant="ghost" size="lg" className="min-h-[48px]">
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
