import type { ReactNode } from 'react'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import Image from 'next/image'
import Link from 'next/link'
import { getFeaturedProducts, getWikiEntries, getBlogPosts } from '@/lib/queries'

type Props = { params: Promise<{ locale: string }> }

/* ─── Mock Data (fallback when DB is empty) ──────────────────────── */

const mockProducts = [
  { name: 'Tisane Digestion Bio', price: 12.90, weight: '100g', rating: 4.8, reviews: 48, image: 'https://images.unsplash.com/photo-1597066371673-2088a5c19802?w=600&q=80', isBio: true, category: 'Tisane', slug: 'tisane-digestion-bio' },
  { name: 'Tisane Sommeil Doux', price: 14.50, weight: '80g', rating: 4.9, reviews: 63, image: 'https://images.unsplash.com/photo-1588535216610-4d954ca1d861?w=600&q=80', isBio: true, category: 'Tisane', slug: 'tisane-sommeil-doux' },
  { name: 'Tisane Détox Matin', price: 11.90, oldPrice: 13.90, weight: '100g', rating: 4.7, reviews: 35, image: 'https://images.unsplash.com/photo-1639180374194-6f9d935cd813?w=600&q=80', isBio: true, isPromo: true, category: 'Tisane', slug: 'tisane-detox-matin' },
  { name: 'Poudre Curcuma Bio', price: 18.90, weight: '200g', rating: 4.8, reviews: 52, image: 'https://images.unsplash.com/photo-1698943510650-9232c98a5328?w=600&q=80', isBio: true, category: 'Poudre', slug: 'poudre-curcuma-bio' },
]

const mockPlants = [
  { name: 'Camomille', latinName: 'Matricaria chamomilla', image: 'https://images.unsplash.com/photo-1601761707463-c9d47c48bb1f?w=600&q=80', slug: 'camomille' },
  { name: 'Menthe Poivrée', latinName: 'Mentha x piperita', image: 'https://images.unsplash.com/photo-1648036933917-762235e009c7?w=600&q=80', slug: 'menthe-poivree' },
  { name: 'Lavande', latinName: 'Lavandula angustifolia', image: 'https://images.unsplash.com/photo-1657631700320-bf0649100658?w=600&q=80', slug: 'lavande' },
]

const mockTestimonials = [
  { name: 'Marie L.', rating: 5, text: 'La tisane digestion est devenue mon rituel quotidien. Fini les ballonnements après les repas !', product: 'Tisane Digestion Bio' },
  { name: 'Pierre D.', rating: 5, text: 'Excellent produit, je dors beaucoup mieux depuis que j\'utilise la tisane sommeil.', product: 'Tisane Sommeil Doux' },
  { name: 'Sophie M.', rating: 4, text: 'Le curcuma bio est de très bonne qualité. Je le recommande vivement.', product: 'Poudre Curcuma Bio' },
]

const mockBlogPosts = [
  { title: '5 tisanes pour mieux dormir naturellement', excerpt: 'Découvrez les plantes les plus efficaces pour retrouver un sommeil réparateur sans recourir aux somnifères.', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80', slug: '5-tisanes-pour-mieux-dormir', category: 'Conseils', readingTime: 5, date: '12 avril 2026' },
  { title: 'Les bienfaits du curcuma', excerpt: 'Anti-inflammatoire naturel, le curcuma est un allié précieux pour votre santé.', image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80', slug: 'bienfaits-curcuma', category: 'Bienfaits', readingTime: 4, date: '8 avril 2026' },
  { title: 'Recette : infusion détox maison', excerpt: 'Préparez votre propre infusion détox avec des ingrédients simples et naturels.', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80', slug: 'recette-infusion-detox', category: 'Recettes', readingTime: 3, date: '3 avril 2026' },
]

const mockFaqItems = [
  { question: 'Comment sont fabriqués vos produits ?', answer: 'Tous nos produits sont fabriqués en France dans notre atelier, à partir d\'ingrédients naturels rigoureusement sélectionnés. Chaque lot est contrôlé pour garantir une qualité optimale.' },
  { question: 'Quels sont les délais de livraison ?', answer: 'Les commandes sont expédiées sous 24 à 48h ouvrées. La livraison standard prend ensuite 2 à 4 jours ouvrés en France métropolitaine.' },
  { question: 'Vos produits sont-ils bio ?', answer: 'La majorité de nos ingrédients sont issus de l\'agriculture biologique certifiée. Chaque fiche produit précise les certifications applicables.' },
  { question: 'Les compléments alimentaires remplacent-ils un traitement médical ?', answer: 'Non. Nos compléments alimentaires ne sont pas des médicaments et ne remplacent pas un traitement médical. Consultez toujours un professionnel de santé.' },
]

/* ─── SVG Components ─────────────────────────────────────────────── */

function StarIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className={`w-3.5 h-3.5 ${filled ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}`}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

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
  const { docs: dbProducts } = await getFeaturedProducts(4, locale)
  const { docs: dbWikiEntries } = await getWikiEntries({ limit: 3, locale })
  const { docs: dbBlogPosts } = await getBlogPosts({ limit: 3, locale })

  const products = dbProducts.length > 0 ? dbProducts : null
  const wikiEntries = dbWikiEntries.length > 0 ? dbWikiEntries : null
  const blogPosts = dbBlogPosts.length > 0 ? dbBlogPosts : null

  return (
    <>
      {/* ═══════════════ 1. ANNOUNCEMENT BAR ═══════════════ */}
      <div className="bg-[#A2211E] text-white text-center py-2.5 px-4 text-sm font-medium">
        Livraison offerte d&egrave;s 30&euro; | Code BIENVENUE : -10%
      </div>

      {/* ═══════════════ 2. HERO ═══════════════ */}
      <section className="bg-[#FEF9E9]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left column */}
            <div>
              <span className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-6">
                100% Naturel
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1F2937] leading-tight">
                {dict.home.hero.title}
              </h1>
              <p className="mt-5 text-lg text-[#6B7280] leading-relaxed max-w-lg">
                {dict.home.hero.subtitle}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/${locale}/boutique`}
                  className="inline-flex items-center justify-center bg-[#A2211E] hover:bg-[#712E2F] text-white font-semibold py-3.5 px-8 rounded-lg transition-colors text-base"
                >
                  {dict.home.hero.cta}
                </Link>
                <Link
                  href={`/${locale}/a-propos`}
                  className="inline-flex items-center justify-center border-2 border-[#1F2937] text-[#1F2937] hover:bg-[#1F2937] hover:text-white font-semibold py-3.5 px-8 rounded-lg transition-colors text-base"
                >
                  {dict.home.hero.ctaSecondary}
                </Link>
              </div>
            </div>
            {/* Right column — image */}
            <div className="aspect-square relative rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80"
                alt="Tisanes et remèdes naturels"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 3. CERTIFICATIONS BAR ═══════════════ */}
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
                  <span className="text-sm text-[#374151] font-medium leading-snug">
                    {dict.home.certifications[cert.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 4. BEST-SELLERS ═══════════════ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F2937]">
              {dict.home.bestsellers.title}
            </h2>
            <p className="mt-3 text-lg text-[#6B7280] max-w-xl mx-auto">
              {dict.home.bestsellers.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockProducts.map((product) => (
              <Link
                key={product.slug}
                href={`/${locale}/boutique/${product.slug}`}
                className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden group hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300"
              >
                {/* Image */}
                <div className="aspect-square bg-[#DCD8C7] overflow-hidden relative">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {/* Badges */}
                  {product.isBio && (
                    <span className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                      {dict.products.card.bio}
                    </span>
                  )}
                  {product.isPromo && (
                    <span className="absolute top-10 left-3 bg-[#A2211E] text-white text-[10px] font-bold px-2 py-1 rounded">
                      {dict.products.card.promo}
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-[#374151] text-xs font-medium px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                </div>
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-base text-[#1F2937] line-clamp-1">
                    {product.name}
                  </h3>
                  {/* Rating */}
                  <div className="flex items-center mt-1.5">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon key={i} filled={i < Math.round(product.rating)} />
                      ))}
                    </div>
                    <span className="text-xs text-[#9CA3AF] ml-1">
                      ({product.reviews} {dict.products.card.reviews})
                    </span>
                  </div>
                  {/* Price + weight */}
                  <div className="flex items-baseline mt-2">
                    <span className="text-lg font-bold text-[#A2211E]">
                      {product.price.toFixed(2)}&euro;
                    </span>
                    {product.oldPrice && (
                      <span className="text-sm text-[#9CA3AF] line-through ml-2">
                        {product.oldPrice.toFixed(2)}&euro;
                      </span>
                    )}
                    <span className="text-xs text-[#9CA3AF] ml-auto">
                      {product.weight}
                    </span>
                  </div>
                  {/* ATC Button */}
                  <button
                    type="button"
                    className="w-full bg-[#A2211E] hover:bg-[#712E2F] text-white font-medium py-2.5 px-4 rounded-lg transition-colors mt-2"
                  >
                    {dict.products.card.addToCart}
                  </button>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href={`/${locale}/boutique`}
              className="inline-flex items-center justify-center border-2 border-[#1F2937] text-[#1F2937] hover:bg-[#1F2937] hover:text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              {dict.home.bestsellers.viewAll}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ 5. DELIVERY INFO BAR ═══════════════ */}
      <section className="bg-[#ECFDF5] py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Livraison */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-600">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#1F2937]">Livraison offerte</p>
                <p className="text-sm text-[#6B7280]">D&egrave;s 30&euro; d&apos;achat en France</p>
              </div>
            </div>
            {/* Retour */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-600">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#1F2937]">Retour gratuit</p>
                <p className="text-sm text-[#6B7280]">14 jours pour changer d&apos;avis</p>
              </div>
            </div>
            {/* Paiement */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-600">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#1F2937]">Paiement s&eacute;curis&eacute;</p>
                <p className="text-sm text-[#6B7280]">CB, PayPal, virement</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 6. PLANTS WIKI ═══════════════ */}
      <section className="py-16 md:py-24 bg-[#FEF9E9]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F2937]">
              {dict.home.wiki.title}
            </h2>
            <p className="mt-3 text-lg text-[#6B7280] max-w-xl mx-auto">
              {dict.home.wiki.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockPlants.map((plant) => (
              <Link
                key={plant.slug}
                href={`/${locale}/plantes/${plant.slug}`}
                className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300"
              >
                {/* Illustration zone */}
                <div className="bg-[#FEF9E9] flex items-center justify-center h-40">
                  <div className="w-24 h-24 rounded-full overflow-hidden relative">
                    <Image
                      src={plant.image}
                      alt={plant.name}
                      fill
                      className="w-24 h-24 rounded-full bg-[#DCD8C7] object-cover"
                      sizes="96px"
                    />
                  </div>
                </div>
                {/* Content */}
                <div>
                  <p className="text-lg font-semibold text-[#1F2937] px-5 pt-4">
                    {plant.name}
                  </p>
                  <p className="text-sm text-[#6B7280] italic px-5">
                    {plant.latinName}
                  </p>
                  <p className="text-sm font-semibold text-[#A2211E] px-5 pb-4 mt-2 hover:underline">
                    {dict.common.learnMore} &rarr;
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href={`/${locale}/plantes`}
              className="inline-flex items-center justify-center border-2 border-[#1F2937] text-[#1F2937] hover:bg-[#1F2937] hover:text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              {dict.home.wiki.viewAll}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ 7. BLOG ═══════════════ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F2937]">
              {dict.home.blog.title}
            </h2>
            <p className="mt-3 text-lg text-[#6B7280] max-w-xl mx-auto">
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
                <span className="absolute top-4 left-4 bg-[#A2211E] text-white text-xs font-bold px-3 py-1 rounded-full">
                  {mockBlogPosts[0].category}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-sm text-[#9CA3AF] mb-2">
                  <span>{mockBlogPosts[0].date}</span>
                  <span>&middot;</span>
                  <span>{mockBlogPosts[0].readingTime} {dict.blog.readingTime}</span>
                </div>
                <h3 className="text-xl font-bold text-[#1F2937] group-hover:text-[#A2211E] transition-colors">
                  {mockBlogPosts[0].title}
                </h3>
                <p className="mt-2 text-[#6B7280] line-clamp-2">
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
                    <span className="absolute top-3 left-3 bg-[#A2211E] text-white text-xs font-bold px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mb-1">
                      <span>{post.date}</span>
                      <span>&middot;</span>
                      <span>{post.readingTime} {dict.blog.readingTime}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#1F2937] group-hover:text-[#A2211E] transition-colors line-clamp-2">
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
              className="inline-flex items-center justify-center border-2 border-[#1F2937] text-[#1F2937] hover:bg-[#1F2937] hover:text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              {dict.home.blog.viewAll}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ 8. TESTIMONIALS ═══════════════ */}
      <section className="py-16 md:py-24 bg-[#FEF9E9]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F2937]">
              {dict.home.testimonials.title}
            </h2>
            <p className="mt-3 text-lg text-[#6B7280] max-w-xl mx-auto">
              {dict.home.testimonials.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockTestimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-6"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#DCD8C7] flex items-center justify-center text-[#1F2937] font-bold text-sm">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1F2937] text-sm">{testimonial.name}</p>
                  </div>
                </div>
                {/* Stars */}
                <div className="flex mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <StarIcon key={j} filled={j < testimonial.rating} />
                  ))}
                </div>
                {/* Citation */}
                <p className="text-[#374151] text-sm leading-relaxed italic">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                {/* Purchased product */}
                <p className="mt-4 text-xs text-[#9CA3AF]">
                  {testimonial.product}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 9. NEWSLETTER CTA ═══════════════ */}
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
              className="flex-1 h-12 px-5 rounded-lg text-base text-[#1F2937] bg-white border-0 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-[#9CA3AF]"
            />
            <button
              type="submit"
              className="h-12 px-8 bg-[#1F2937] hover:bg-black text-white font-semibold rounded-lg transition-colors"
            >
              {dict.home.newsletter.cta}
            </button>
          </form>

          <p className="text-xs text-white/50 mt-5">
            {dict.home.newsletter.privacy}
          </p>
        </div>
      </section>

      {/* ═══════════════ 10. FAQ PREVIEW ═══════════════ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F2937] text-center mb-12">
            {dict.home.faq.title}
          </h2>

          <div className="space-y-4">
            {mockFaqItems.map((faq, i) => (
              <details
                key={i}
                className="bg-[#FEF9E9] rounded-2xl overflow-hidden group"
              >
                <summary className="flex w-full items-center justify-between gap-4 p-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold text-[#1F2937] text-left">
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
                    className="text-[#9CA3AF] flex-shrink-0 transition-transform duration-300 group-open:rotate-180"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-[#6B7280] text-sm leading-relaxed">
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
