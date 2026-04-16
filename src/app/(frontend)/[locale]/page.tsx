import type { ReactNode } from 'react'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import Image from 'next/image'
import Link from 'next/link'
import { getWikiEntries, getBlogPosts } from '@/lib/queries'

type Props = { params: Promise<{ locale: string }> }

/* ─── Mock Data (fallback when DB is empty) ──────────────────────── */

const mockPlants = [
  { name: 'Camomille', latinName: 'Matricaria chamomilla', description: 'Apaisante et digestive, la camomille est utilisée depuis l\'Antiquité pour calmer les tensions et favoriser le sommeil.', image: 'https://images.unsplash.com/photo-1623171404303-5f3bd1949ca0?w=600&q=80', slug: 'camomille' },
  { name: 'Menthe Poivrée', latinName: 'Mentha x piperita', description: 'Rafraîchissante et tonique, la menthe poivrée soulage les maux de tête et facilite la digestion.', image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=600&q=80', slug: 'menthe-poivree' },
  { name: 'Lavande', latinName: 'Lavandula angustifolia', description: 'Reconnue pour ses vertus relaxantes, la lavande aide à réduire le stress et améliore la qualité du sommeil.', image: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=600&q=80', slug: 'lavande' },
]

const mockBlogPosts = [
  { title: '5 tisanes pour mieux dormir naturellement', excerpt: 'Camomille, tilleul, valériane, passiflore et mélisse : découvrez les plantes les plus efficaces pour retrouver un sommeil réparateur. Nos conseils de préparation et les dosages recommandés pour chaque infusion du soir.', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&q=80', slug: '5-tisanes-pour-mieux-dormir', category: 'Conseils', readingTime: 5, date: '12 avril 2026' },
  { title: 'Le curcuma : racine dorée aux mille vertus', excerpt: 'Utilisé depuis des millénaires en médecine ayurvédique, le curcuma est reconnu pour ses propriétés anti-inflammatoires naturelles. Apprenez à l\'associer au poivre noir pour maximiser l\'absorption de la curcumine.', image: 'https://images.unsplash.com/photo-1606951444141-e5533feb55be?w=600&q=80', slug: 'bienfaits-curcuma', category: 'Bienfaits', readingTime: 4, date: '8 avril 2026' },
  { title: 'Préparez votre infusion détox maison', excerpt: 'Romarin, citron, gingembre et menthe : une recette simple et efficace pour soutenir votre organisme au quotidien. Suivez notre guide pas à pas pour une infusion détox savoureuse et bienfaisante.', image: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=600&q=80', slug: 'recette-infusion-detox', category: 'Recettes', readingTime: 3, date: '3 avril 2026' },
]

const mockFaqItems = [
  { question: 'Comment sont sélectionnées vos plantes ?', answer: 'Toutes nos plantes sont rigoureusement sélectionnées selon les normes de la pharmacopée française et européenne. Nous privilégions les filières biologiques et les circuits courts.' },
  { question: 'Vos informations sont-elles vérifiées ?', answer: 'Chaque fiche plante et article est rédigé en s\'appuyant sur des sources scientifiques reconnues (EFSA, pharmacopée européenne) et relu par notre équipe.' },
  { question: 'Comment utiliser votre encyclopédie des plantes ?', answer: 'Parcourez nos fiches plantes par nom ou par bienfait. Chaque fiche détaille les propriétés, usages traditionnels et précautions d\'emploi de la plante.' },
  { question: 'Les plantes médicinales remplacent-elles un traitement médical ?', answer: 'Non. Les informations sur notre site sont à visée informative uniquement et ne remplacent pas un avis médical. Consultez toujours un professionnel de santé.' },
]

/* ─── SVG Components ─────────────────────────────────────────────── */

function CertIcon({ type }: { type: string }) {
  const icons: Record<string, ReactNode> = {
    bio: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#A2211E]">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M8 12s1-4 4-4 4 4 4 4-1 4-4 4-4-4-4-4z" />
        <path d="M12 8v8" />
      </svg>
    ),
    pharmacopee: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#A2211E]">
        <path d="M9 2h6v4H9z" />
        <path d="M4 6h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
        <path d="M12 10v6" />
        <path d="M9 13h6" />
      </svg>
    ),
    vegan: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#A2211E]">
        <path d="M7 20.5C7 17 9 12 17 4" />
        <path d="M17 4c-4 0-8 1-10.5 5.5C4 14 7 17 7 20.5" />
        <path d="M17 4c0 4-1 8-5.5 10.5" />
      </svg>
    ),
    metaux: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#A2211E]">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    france: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#A2211E]">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="9" y1="4" x2="9" y2="20" />
        <line x1="15" y1="4" x2="15" y2="20" />
      </svg>
    ),
    naturel: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#A2211E]">
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

  // Try to fetch from Payload, fallback to mock data
  const { docs: dbWikiEntries } = await getWikiEntries({ limit: 3, locale })
  const { docs: dbBlogPosts } = await getBlogPosts({ limit: 3, locale })

  const wikiEntries = dbWikiEntries.length > 0 ? dbWikiEntries : null
  const blogPosts = dbBlogPosts.length > 0 ? dbBlogPosts : null

  return (
    <>
      {/* ═══════════════ 1. HERO ═══════════════ */}
      <section className="bg-[#FEF9E9]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 md:py-24">
          {/* Badge above the grid */}
          <span className="inline-block bg-[#A2211E] text-white text-xs font-bold px-3 py-1 rounded-full mb-6">
            100% Naturel
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
            {/* Left column */}
            <div className="flex flex-col justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#054A57] leading-tight">
                  {dict.home.hero.title}
                </h1>
                <p className="mt-5 text-lg text-[#712E2F]/70 leading-relaxed max-w-lg">
                  {dict.home.hero.subtitle}
                </p>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/${locale}/plantes`}
                  className="inline-flex items-center justify-center bg-[#A2211E] hover:bg-[#712E2F] text-white font-semibold py-3.5 px-8 rounded-lg transition-colors text-base"
                >
                  {dict.home.hero.cta}
                </Link>
                <Link
                  href={`/${locale}/a-propos`}
                  className="inline-flex items-center justify-center border-2 border-[#A2211E] text-[#A2211E] hover:bg-[#A2211E] hover:text-white font-semibold py-3.5 px-8 rounded-lg transition-colors text-base"
                >
                  {dict.home.hero.ctaSecondary}
                </Link>
              </div>
            </div>
            {/* Right column — image: aligned top with h1, bottom with buttons */}
            <div className="relative rounded-2xl overflow-hidden min-h-[350px]">
              <Image
                src="https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=1200&q=85"
                alt="Plantes médicinales et tisanes naturelles"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 2. CERTIFICATIONS BAR ═══════════════ */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
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
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <CertIcon type={cert.type} />
                  <span className="text-sm text-[#054A57] font-medium leading-snug">
                    {dict.home.certifications[cert.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 3. ENGAGEMENTS ═══════════════ */}
      <section className="bg-[#FFF5D5] py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#FEF9E9] rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#A2211E]">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#054A57]">Sources vérifiées</p>
                <p className="text-sm text-[#712E2F]/70">Conformes à la pharmacopée chinoise</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#FEF9E9] rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#A2211E]">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#054A57]">Encyclopédie complète</p>
                <p className="text-sm text-[#712E2F]/70">Fiches plantes détaillées et illustrées</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#FEF9E9] rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#A2211E]">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#054A57]">Contenu accessible</p>
                <p className="text-sm text-[#712E2F]/70">Informations claires pour tous</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 4. PLANTS WIKI ═══════════════ */}
      <section className="py-16 md:py-24 bg-[#FEF9E9]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#054A57]">
              {dict.home.wiki.title}
            </h2>
            <p className="mt-3 text-lg text-[#712E2F]/70 max-w-xl mx-auto">
              {dict.home.wiki.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockPlants.map((plant) => (
              <Link
                key={plant.slug}
                href={`/${locale}/plantes/${plant.slug}`}
                className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden group hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300"
              >
                {/* Image zone */}
                <div className="relative h-48 bg-[#DCD8C7] overflow-hidden">
                  <Image
                    src={plant.image}
                    alt={plant.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                {/* Content */}
                <div className="p-5">
                  <p className="text-lg font-semibold text-[#054A57]">
                    {plant.name}
                  </p>
                  <p className="text-sm text-[#D0802C] italic">
                    {plant.latinName}
                  </p>
                  <p className="text-sm text-[#712E2F]/70 mt-2 line-clamp-2">
                    {plant.description}
                  </p>
                  <p className="text-sm font-semibold text-[#A2211E] mt-3 hover:underline">
                    {dict.common.learnMore} &rarr;
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href={`/${locale}/plantes`}
              className="inline-flex items-center justify-center border-2 border-[#A2211E] text-[#A2211E] hover:bg-[#A2211E] hover:text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              {dict.home.wiki.viewAll}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ 5. BLOG ═══════════════ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#054A57]">
              {dict.home.blog.title}
            </h2>
            <p className="mt-3 text-lg text-[#712E2F]/70 max-w-xl mx-auto">
              {dict.home.blog.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Featured article (2/3) */}
            <Link
              href={`/${locale}/blog/${mockBlogPosts[0].slug}`}
              className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden group hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] transition-all duration-300"
            >
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src={mockBlogPosts[0].image}
                  alt={mockBlogPosts[0].title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
                <span className="absolute top-4 left-4 bg-[#D0802C] text-white text-xs font-bold px-3 py-1 rounded-full">
                  {mockBlogPosts[0].category}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-sm text-[#DCD8C7] mb-2">
                  <span>{mockBlogPosts[0].date}</span>
                  <span>&middot;</span>
                  <span>{mockBlogPosts[0].readingTime} {dict.blog.readingTime}</span>
                </div>
                <h3 className="text-xl font-bold text-[#054A57] group-hover:text-[#A2211E] transition-colors">
                  {mockBlogPosts[0].title}
                </h3>
                <p className="mt-2 text-[#712E2F]/70 line-clamp-2">
                  {mockBlogPosts[0].excerpt}
                </p>
              </div>
            </Link>

            {/* Side articles (1/3) */}
            <div className="flex flex-col gap-6">
              {mockBlogPosts.slice(1).map((post) => (
                <Link
                  key={post.slug}
                  href={`/${locale}/blog/${post.slug}`}
                  className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden group hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] transition-all duration-300 flex-1"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                    <span className="absolute top-3 left-3 bg-[#D0802C] text-white text-xs font-bold px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-[#DCD8C7] mb-1">
                      <span>{post.date}</span>
                      <span>&middot;</span>
                      <span>{post.readingTime} {dict.blog.readingTime}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#054A57] group-hover:text-[#A2211E] transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center justify-center border-2 border-[#A2211E] text-[#A2211E] hover:bg-[#A2211E] hover:text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              {dict.home.blog.viewAll}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ 6. NEWSLETTER CTA ═══════════════ */}
      <section className="bg-[#A2211E] py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {dict.home.newsletter.title}
          </h2>
          <p className="mt-4 text-lg text-white/80 leading-relaxed">
            {dict.home.newsletter.subtitle}
          </p>

          <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              placeholder={dict.home.newsletter.placeholder}
              className="flex-1 h-12 px-5 rounded-lg text-base text-[#054A57] bg-white border-0 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-[#DCD8C7]"
            />
            <button
              type="submit"
              className="h-12 px-8 bg-[#054A57] hover:bg-[#054A57]/90 text-white font-semibold rounded-lg transition-colors"
            >
              {dict.home.newsletter.cta}
            </button>
          </form>

          <p className="text-xs text-white/50 mt-5">
            {dict.home.newsletter.privacy}
          </p>
        </div>
      </section>

      {/* ═══════════════ 7. FAQ PREVIEW ═══════════════ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#054A57] text-center mb-12">
            {dict.home.faq.title}
          </h2>

          <div className="space-y-4">
            {mockFaqItems.map((faq, i) => (
              <details
                key={i}
                className="bg-[#FEF9E9] rounded-2xl overflow-hidden group"
              >
                <summary className="flex w-full items-center justify-between gap-4 p-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold text-[#054A57] text-left">
                    {faq.question}
                  </span>
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
                    className="text-[#DCD8C7] flex-shrink-0 transition-transform duration-300 group-open:rotate-180"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-[#712E2F]/70 text-sm leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href={`/${locale}/faq`}
              className="inline-flex items-center justify-center text-[#A2211E] hover:text-[#712E2F] font-semibold text-base transition-colors"
            >
              {dict.home.faq.viewAll} &rarr;
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
