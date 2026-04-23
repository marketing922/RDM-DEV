import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import Image from 'next/image'
import Link from 'next/link'
import { getWikiEntries, getBlogPosts, getBenefits } from '@/lib/queries'
import { richTextToPlain } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import BodyExplorer, { type BodyRegion } from '@/components/home/BodyExplorer'
import Reveal from '@/components/ui/Reveal'
import NewsletterForm from '@/components/home/NewsletterForm'

const DEFAULT_PLANT_IMAGE = 'https://res.cloudinary.com/laboratoire-calebasse/image/upload/v1761295312/Chat_GPT_Image_Oct_24_2025_10_38_36_AM_1_a78649daf4.png'
const DEFAULT_BLOG_IMAGE = 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&q=80'

export const revalidate = 60

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

/* ─── Brand assets (Cloudinary) ──────────────────────────────────── */

const CLOUDINARY = 'https://res.cloudinary.com/laboratoire-calebasse/image/upload'

const BRAND_VALUES = [
  {
    key: 'naturel',
    label: '100 % Naturel & Pur',
    subtitle: 'Sans additif ni conservateur',
    num: '01',
    src: `${CLOUDINARY}/v1761638875/100_naturel_et_pur_a729474982.png`,
    rotate: '-1.5deg',
  },
  {
    key: 'france',
    label: 'Fabriqué en France',
    subtitle: 'Conditionnement et expédition à Paris',
    num: '02',
    src: `${CLOUDINARY}/v1761638875/fabrique_en_France_c8918f0126.png`,
    rotate: '1deg',
  },
  {
    key: 'savoir',
    label: 'Savoir-faire Ancestral',
    subtitle: 'Recettes issues de la pharmacopée traditionnelle',
    num: '03',
    src: `${CLOUDINARY}/v1761638874/savoir_faire_ancestral_b831db15f3.png`,
    rotate: '-0.5deg',
  },
] as const

const CERTIFICATIONS = [
  {
    key: 'bio',
    label: 'Agriculture Biologique',
    num: '04',
    src: `${CLOUDINARY}/v1759917732/bio_1_Photoroom_83979e4d37.png`,
  },
  {
    key: 'pharmacopee',
    label: 'Pharmacopée',
    num: '05',
    src: `${CLOUDINARY}/v1759917732/pharmacopee_1_Photoroom_f8d2c169cf.png`,
  },
  {
    key: 'vegan',
    label: 'Vegan',
    num: '06',
    src: `${CLOUDINARY}/v1759917732/vegan_1_Photoroom_5c36156877.png`,
  },
  {
    key: 'metaux',
    label: 'Sans Métaux Lourds',
    num: '07',
    src: `${CLOUDINARY}/v1759917732/metaux_lourds_1_Photoroom_6dd6ec51b6.png`,
  },
] as const

/* ─── Body regions (interactive "Le corps & la plante") ─────────── */

const BODY_REGION_DEFS = [
  {
    id: 'tete',
    label: 'Tête',
    adjective: 'pour la tête',
    x: 175,
    y: 55,
    keywords: ['tête', 'crâne', 'migraine', 'céphalée', 'mémoire', 'concentration'],
  },
  {
    id: 'gorge',
    label: 'Gorge',
    adjective: 'pour la gorge',
    x: 160,
    y: 105,
    keywords: ['gorge', 'toux', 'voix', 'laryng', 'rhinit', 'pharyng'],
  },
  {
    id: 'respiration',
    label: 'Respiration',
    adjective: 'respiratoires',
    x: 195,
    y: 160,
    keywords: ['respir', 'poumon', 'bronche', 'rhume', 'nez', 'sinus', 'asthme'],
  },
  {
    id: 'digestion',
    label: 'Digestion',
    adjective: 'digestives',
    x: 100,
    y: 200,
    keywords: [
      'digest',
      'estomac',
      'intestin',
      'ballonnement',
      'transit',
      'nausée',
      'foie',
      'colon',
    ],
  },
  {
    id: 'feminin',
    label: 'Féminin',
    adjective: 'pour le féminin',
    x: 195,
    y: 240,
    keywords: ['féminin', 'règles', 'menstru', 'ménopause', 'grossesse'],
  },
  {
    id: 'circulation',
    label: 'Circulation',
    adjective: 'circulatoires',
    x: 115,
    y: 320,
    keywords: ['circul', 'veineux', 'jambes', 'varice', 'hémorroïde', 'œdèm'],
  },
] as const

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

function buildRegionData(entries: any[]): BodyRegion[] {
  return BODY_REGION_DEFS.map((def) => {
    const kws = def.keywords.map(normalize)

    const matches = entries.filter((entry) => {
      // Primary: any related benefit has bodyRegion === def.id
      const benefits = Array.isArray(entry?.benefits) ? entry.benefits : []
      const hasRegion = benefits.some(
        (b: any) => typeof b === 'object' && b?.bodyRegion === def.id,
      )
      if (hasRegion) return true

      // Fallback: keyword match on name/description/benefit names (legacy)
      const benefitNames = benefits
        .map((b: any) => (typeof b === 'object' ? b?.name || b?.slug || '' : ''))
        .join(' ')
      const haystack = normalize(
        [entry?.name, entry?.shortDescription, entry?.directAnswer, benefitNames]
          .filter(Boolean)
          .join(' '),
      )
      return kws.some((kw) => haystack.includes(kw))
    })

    return {
      id: def.id,
      label: def.label,
      adjective: def.adjective,
      count: matches.length,
      plants: matches.slice(0, 6).map((e: any) => ({
        name: String(e.name || ''),
        slug: String(e.slug || ''),
      })),
    }
  })
}

const MOCK_REGIONS: BodyRegion[] = [
  {
    id: 'tete',
    label: 'Tête',
    adjective: 'pour la tête',
    count: 14,
    plants: [
      { name: 'Menthe Poivrée', slug: 'menthe-poivree' },
      { name: 'Lavande', slug: 'lavande' },
    ],
  },
  {
    id: 'gorge',
    label: 'Gorge',
    adjective: 'pour la gorge',
    count: 8,
    plants: [{ name: 'Thym', slug: 'thym' }],
  },
  {
    id: 'respiration',
    label: 'Respiration',
    adjective: 'respiratoires',
    count: 16,
    plants: [
      { name: 'Eucalyptus', slug: 'eucalyptus' },
      { name: 'Thym', slug: 'thym' },
    ],
  },
  {
    id: 'digestion',
    label: 'Digestion',
    adjective: 'digestives',
    count: 31,
    plants: [
      { name: 'Camomille', slug: 'camomille' },
      { name: 'Menthe poivrée', slug: 'menthe-poivree' },
      { name: 'Fenouil', slug: 'fenouil' },
      { name: 'Gentiane', slug: 'gentiane' },
      { name: 'Romarin', slug: 'romarin' },
      { name: 'Boldo', slug: 'boldo' },
    ],
  },
  {
    id: 'feminin',
    label: 'Féminin',
    adjective: 'pour le féminin',
    count: 12,
    plants: [{ name: 'Sauge', slug: 'sauge' }],
  },
  {
    id: 'circulation',
    label: 'Circulation',
    adjective: 'circulatoires',
    count: 14,
    plants: [
      { name: 'Vigne rouge', slug: 'vigne-rouge' },
      { name: 'Marronnier d’Inde', slug: 'marronnier-inde' },
    ],
  },
]

/* ─── Page ────────────────────────────────────────────────────────── */

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  // Fetch CMS data in parallel — wiki entries fetched in bulk so we can both
  // render the top-3 herbarium plates AND feed the BodyExplorer with the full
  // set (matched against region keywords).
  const [wikiResult, blogResult, benefitsResult] = await Promise.all([
    getWikiEntries({ limit: 100, locale }),
    getBlogPosts({ limit: 3, locale }),
    getBenefits({ limit: 6, locale }),
  ])
  const dbAllWiki = wikiResult.docs
  const dbWikiEntries = dbAllWiki.slice(0, 3)
  const dbBlogPosts = blogResult.docs

  const wikiEntries = dbWikiEntries.length > 0 ? dbWikiEntries : null
  const blogPosts = dbBlogPosts.length > 0 ? dbBlogPosts : null

  // Real counts for the hero stats row
  const plantsCount = wikiResult.totalDocs ?? 0
  const benefitsCount = benefitsResult.totalDocs ?? 0
  const articlesCount = blogResult.totalDocs ?? 0

  // Body regions — use DB data if any region matches, otherwise mock fallback
  const computedRegions = buildRegionData(dbAllWiki)
  const bodyRegions = computedRegions.some((r) => r.count > 0)
    ? computedRegions
    : MOCK_REGIONS

  return (
    <>
      {/* ═══════════════ 1. HERO — ALMANACH ═══════════════ */}
      <section className="relative overflow-hidden bg-rm-cream">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 pt-12 md:pt-[72px] pb-12 md:pb-12 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          {/* Left column */}
          <div className="relative">
            {/* Volume badge */}
            <div className="flex items-center gap-2.5 mb-4 md:mb-[18px]">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                Volume IV · Printemps 2026
              </span>
            </div>

            {/* Display headline */}
            <h1 className="font-display font-normal text-rm-teal leading-[1.02] tracking-[-0.02em] text-[40px] sm:text-[52px] md:text-[60px] lg:text-[62px] xl:text-[78px]">
              <span className="block">L'almanach des</span>
              <span className="block whitespace-nowrap">
                <em className="italic text-rm-burgundy">plantes</em> qui soignent
              </span>
              <span className="block">depuis toujours.</span>
            </h1>

            {/* Serif subtitle */}
            <p className="font-serif text-[17px] sm:text-[19px] leading-[1.55] text-rm-inkSoft mt-6 md:mt-7 max-w-[520px]">
              Une encyclopédie botanique réunissant les savoirs de la pharmacopée française et de la médecine traditionnelle chinoise — rigoureusement sourcée, illustrée, et lisible par tous.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-3.5 mt-7 md:mt-8 items-start sm:items-center">
              <Link
                href={`/${locale}/plantes`}
                className="inline-flex items-center gap-2 font-sans text-sm font-semibold bg-rm-burgundy text-white px-[22px] py-[14px] rounded-[10px] shadow-[0_6px_16px_rgba(162,33,30,0.18)] hover:bg-rm-burgundy/90 transition-colors"
              >
                Parcourir l'encyclopédie
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="8" x2="13" y2="8" />
                  <polyline points="9,4 13,8 9,12" />
                </svg>
              </Link>
              <Link
                href={`/${locale}/a-propos`}
                className="font-sans text-sm font-semibold text-rm-teal underline underline-offset-4 decoration-1 hover:text-rm-burgundy transition-colors py-[14px] px-[18px]"
              >
                Notre démarche →
              </Link>
            </div>

            {/* Stats row — live counts from Payload */}
            <div className="flex items-center gap-5 sm:gap-7 mt-10 md:mt-11 font-sans text-xs text-rm-inkSoft">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[26px] sm:text-[28px] text-rm-teal leading-none">{plantsCount}</span>
                <span>{plantsCount > 1 ? 'plantes' : 'plante'}</span>
              </div>
              <span className="block w-px h-6 bg-rm-ruleStrong" />
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[26px] sm:text-[28px] text-rm-teal leading-none">{benefitsCount}</span>
                <span>{benefitsCount > 1 ? 'bienfaits' : 'bienfait'}</span>
              </div>
              <span className="block w-px h-6 bg-rm-ruleStrong" />
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[26px] sm:text-[28px] text-rm-teal leading-none">{articlesCount}</span>
                <span>{articlesCount > 1 ? 'articles' : 'article'}</span>
              </div>
            </div>
          </div>

          {/* Right column — circular herbarium plates (PNG with built-in gray halo) */}
          <div className="relative h-[520px] sm:h-[600px] lg:h-[680px] hidden md:block">
            {/* Plate 1 — Camomille (top-left) */}
            <div className="absolute top-0 left-0 w-[240px] h-[240px] lg:w-[270px] lg:h-[270px]">
              <Image
                src="/assets/plates/camomille.png"
                alt="Camomille — Matricaria recutita"
                fill
                className="object-contain"
                sizes="270px"
                priority
              />
            </div>
            {/* Plate 2 — Tilleul (middle-right) */}
            <div className="absolute top-[300px] right-0 w-[210px] h-[210px] lg:w-[240px] lg:h-[240px]">
              <Image
                src="/assets/plates/tilleul.png"
                alt="Tilleul — Tilia cordata"
                fill
                className="object-contain"
                sizes="240px"
              />
            </div>
            {/* Plate 3 — Bleuet (bottom-left) */}
            <div className="absolute bottom-0 left-[30px] w-[180px] h-[180px] lg:w-[200px] lg:h-[200px]">
              <Image
                src="/assets/plates/bleuet.png"
                alt="Bleuet — Centaurea cyanus"
                fill
                className="object-contain"
                sizes="200px"
              />
            </div>

            {/* Herbarium label N° 014 — near camomille top-right */}
            <div className="absolute top-12 right-4 lg:right-8 bg-rm-creamSoft border border-rm-ruleStrong px-3.5 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] rotate-[3deg] z-10">
              <div className="font-sans text-[9px] tracking-[0.2em] text-rm-teal/60 uppercase">N° 014</div>
              <div className="font-display italic text-[15px] text-rm-burgundy mt-0.5 leading-tight">
                Matricaria recutita
              </div>
            </div>

            {/* Herbarium label N° 027 — near tilleul left side */}
            <div className="absolute top-[420px] lg:top-[470px] right-[200px] lg:right-[220px] bg-rm-creamSoft border border-rm-ruleStrong px-3.5 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] rotate-[-2deg] z-10">
              <div className="font-sans text-[9px] tracking-[0.2em] text-rm-teal/60 uppercase">N° 027</div>
              <div className="font-display italic text-[15px] text-rm-burgundy mt-0.5 leading-tight">
                Tilia cordata
              </div>
            </div>

            {/* Decorative sprig */}
            <svg
              width="140" height="140" viewBox="0 0 140 140" fill="none"
              className="absolute -bottom-5 -right-5 opacity-40 text-rm-ochre pointer-events-none"
              aria-hidden="true"
            >
              <path d="M70 15 C 80 40, 85 70, 80 110" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              <path d="M72 35 C 82 32, 92 28, 98 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <path d="M75 55 C 65 52, 55 48, 48 42" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <path d="M78 75 C 88 72, 98 68, 105 62" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <path d="M80 95 C 70 92, 60 88, 53 82" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <ellipse cx="100" cy="22" rx="7" ry="3.5" transform="rotate(-20 100 22)" fill="currentColor" fillOpacity="0.5" />
              <ellipse cx="46" cy="42" rx="7" ry="3.5" transform="rotate(20 46 42)" fill="currentColor" fillOpacity="0.5" />
              <ellipse cx="107" cy="62" rx="7" ry="3.5" transform="rotate(-20 107 62)" fill="currentColor" fillOpacity="0.5" />
              <ellipse cx="51" cy="82" rx="7" ry="3.5" transform="rotate(20 51 82)" fill="currentColor" fillOpacity="0.5" />
            </svg>
          </div>
        </div>
      </section>

      {/* ═══════════════ 2. CERTIFICATIONS & ENGAGEMENTS ═══════════════ */}
      <section className="bg-rm-paper border-t border-dashed border-rm-rule">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-10 md:py-12">
          {/* Header */}
          <Reveal className="text-center mb-7 md:mb-9">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="block w-6 h-px bg-rm-burgundy" />
              <span className="font-sans text-[10px] tracking-[0.25em] text-rm-burgundy uppercase">
                Nos engagements
              </span>
              <span className="block w-6 h-px bg-rm-burgundy" />
            </div>
            <h2 className="font-display text-[22px] md:text-[28px] leading-[1.1] text-rm-teal tracking-[-0.01em]">
              Une <em className="italic text-rm-burgundy">exigence</em> à chaque étape
            </h2>
          </Reveal>

          {/* Brand values — 3 compact cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-8 md:mb-10">
            {BRAND_VALUES.map((v, idx) => (
              <Reveal key={v.key} delay={idx * 90}>
              <article
                className="relative bg-rm-cream border border-rm-rule shadow-[0_4px_14px_rgba(0,0,0,0.04)] px-4 pt-4 pb-4 text-center flex items-center gap-4 md:flex-col md:gap-2 md:pt-5 md:pb-4 transition-[transform,box-shadow] duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5"
                style={{ transform: `rotate(${v.rotate})` }}
              >
                <span className="absolute top-2 left-2 font-mono text-[8px] tracking-[0.25em] uppercase text-rm-inkSoft/60">
                  N° {v.num}
                </span>

                <div className="relative w-[64px] h-[64px] md:w-[84px] md:h-[84px] shrink-0">
                  <Image
                    src={v.src}
                    alt={v.label}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 64px, 84px"
                  />
                </div>

                <div className="text-left md:text-center">
                  <h3 className="font-display text-[15px] md:text-[16px] text-rm-teal leading-tight tracking-[-0.01em]">
                    {v.label}
                  </h3>
                  <p className="font-serif italic text-[11px] md:text-[12px] leading-[1.4] text-rm-inkSoft mt-0.5 md:mt-1">
                    {v.subtitle}
                  </p>
                </div>
              </article>
              </Reveal>
            ))}
          </div>

          {/* Inline divider with certifications label */}
          <Reveal className="flex items-center gap-3 mb-5 md:mb-6">
            <span className="flex-1 border-t border-dashed border-rm-rule" />
            <span className="font-sans text-[9px] tracking-[0.3em] text-rm-inkSoft/70 uppercase">
              Certifications
            </span>
            <span className="flex-1 border-t border-dashed border-rm-rule" />
          </Reveal>

          {/* Certifications — 4 compact circular badges */}
          <div className="grid grid-cols-4 gap-3 md:gap-6">
            {CERTIFICATIONS.map((c, idx) => (
              <Reveal key={c.key} delay={idx * 70} className="flex flex-col items-center text-center group">
                <div className="relative w-[60px] h-[60px] md:w-[72px] md:h-[72px] mb-2">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full border border-dashed border-rm-ruleStrong transition-colors group-hover:border-rm-burgundy"
                  />
                  <div className="absolute inset-1.5">
                    <Image
                      src={c.src}
                      alt={c.label}
                      fill
                      className="object-contain"
                      sizes="72px"
                    />
                  </div>
                </div>
                <span className="font-sans text-[10px] md:text-[11px] tracking-[0.02em] text-rm-teal leading-tight max-w-[120px]">
                  {c.label}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 3. PLANTS WIKI ═══════════════ */}
      <section className="bg-rm-cream border-t border-dashed border-rm-rule">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-16 md:py-24">
          <Reveal className="text-center mb-12 md:mb-14 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                Planches d&apos;herbier
              </span>
              <span className="block w-7 h-px bg-rm-burgundy" />
            </div>
            <h2 className="font-display text-[34px] md:text-[44px] leading-[1.08] text-rm-teal tracking-[-0.01em]">
              Les <em className="italic text-rm-burgundy">plantes</em> à découvrir
            </h2>
            <p className="font-serif italic text-[16px] md:text-[18px] leading-[1.55] text-rm-inkSoft mt-4">
              {dict.home.wiki.subtitle}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {(wikiEntries || mockPlants).map((plant: any, idx: number) => {
              const imgSrc =
                plant.image ||
                resolveMediaUrl((plant.images?.[0] as any)?.image, 'card') ||
                resolveMediaUrl(plant.heroImage, 'card') ||
                DEFAULT_PLANT_IMAGE
              const desc =
                (typeof plant.shortDescription === 'string' && plant.shortDescription) ||
                (typeof plant.description === 'string'
                  ? plant.description
                  : richTextToPlain(plant.description)) ||
                plant.directAnswer ||
                ''
              const num = String(idx + 1).padStart(3, '0')
              return (
                <Reveal key={plant.slug} delay={idx * 100}>
                <Link
                  href={`/${locale}/plantes/${plant.slug}`}
                  className="group bg-rm-paper border border-rm-rule overflow-hidden flex flex-col hover:border-rm-ruleStrong transition-colors h-full"
                >
                  <div className="relative aspect-[4/3] bg-rm-creamSoft overflow-hidden">
                    <Image
                      src={imgSrc}
                      alt={plant.name}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <span className="absolute top-3 left-3 font-mono text-[10px] tracking-[0.2em] uppercase text-rm-teal/70 bg-rm-cream/90 border border-rm-rule px-2 py-1">
                      N° {num}
                    </span>
                  </div>
                  <div className="p-5 md:p-6 text-center">
                    <h3 className="font-display text-[22px] leading-[1.15] text-rm-teal group-hover:text-rm-burgundy transition-colors">
                      {plant.name}
                    </h3>
                    {plant.latinName && (
                      <p className="font-serif italic text-[14px] text-rm-ochre mt-1">
                        {plant.latinName}
                      </p>
                    )}
                    {desc && (
                      <p className="font-serif italic text-[15px] leading-[1.55] text-rm-inkSoft mt-3 line-clamp-2">
                        {desc}
                      </p>
                    )}
                    <span className="inline-block mt-4 font-sans text-sm font-semibold text-rm-burgundy">
                      {dict.common.learnMore} →
                    </span>
                  </div>
                </Link>
                </Reveal>
              )
            })}
          </div>

          <Reveal className="text-center mt-12 md:mt-14" delay={150}>
            <Link
              href={`/${locale}/plantes`}
              className="inline-flex items-center gap-2 font-sans text-sm font-semibold bg-rm-burgundy text-white px-6 py-3.5 hover:bg-rm-burgundy/90 transition-colors"
            >
              {dict.home.wiki.viewAll}
              <span aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 4. LE CORPS & LA PLANTE ═══════════════ */}
      <section className="bg-rm-paper border-t border-dashed border-rm-rule">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-16 md:py-24">
          <Reveal className="text-center mb-12 md:mb-14 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                Chapitre II · Le corps &amp; la plante
              </span>
              <span className="block w-7 h-px bg-rm-burgundy" />
            </div>
            <h2 className="font-display text-[34px] md:text-[44px] leading-[1.08] text-rm-teal tracking-[-0.01em]">
              Où <em className="italic text-rm-burgundy">avez-vous</em> besoin d&apos;aide&nbsp;?
            </h2>
            <p className="font-serif italic text-[16px] md:text-[18px] leading-[1.55] text-rm-inkSoft mt-4">
              Touchez une région pour découvrir les plantes qui la soulagent traditionnellement.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <BodyExplorer regions={bodyRegions} locale={locale} />
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 5. BLOG ═══════════════ */}
      <section className="bg-rm-cream border-t border-dashed border-rm-rule">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-16 md:py-24">
          <Reveal className="text-center mb-12 md:mb-14 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                Journal
              </span>
              <span className="block w-7 h-px bg-rm-burgundy" />
            </div>
            <h2 className="font-display text-[34px] md:text-[44px] leading-[1.08] text-rm-teal tracking-[-0.01em]">
              Le <em className="italic text-rm-burgundy">journal</em> des plantes
            </h2>
            <p className="font-serif italic text-[16px] md:text-[18px] leading-[1.55] text-rm-inkSoft mt-4">
              {dict.home.blog.subtitle}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {(() => {
              const posts = blogPosts || mockBlogPosts
              const featured = posts[0] as any
              const side = posts.slice(1) as any[]
              const getImg = (p: any) =>
                p.image || resolveMediaUrl(p.featuredImage, 'card') || DEFAULT_BLOG_IMAGE
              const getCat = (p: any) => p.category?.name || p.category || ''
              const getDate = (p: any) =>
                p.date ||
                (p.publishedAt
                  ? new Date(p.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '')
              return (
                <>
                  {/* Featured (2/3) */}
                  <Reveal className="lg:col-span-2">
                  <Link
                    href={`/${locale}/blog/${featured.slug}`}
                    className="group bg-rm-paper border border-rm-rule overflow-hidden flex flex-col hover:border-rm-ruleStrong transition-colors h-full"
                  >
                    <div className="aspect-[16/9] relative overflow-hidden bg-rm-creamSoft">
                      <Image
                        src={getImg(featured)}
                        alt={featured.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        sizes="(max-width: 1024px) 100vw, 66vw"
                      />
                      {getCat(featured) && (
                        <span className="absolute top-4 left-4 bg-rm-cream/95 border border-rm-ruleStrong text-rm-ochre font-sans text-[10px] tracking-[0.22em] uppercase px-3 py-1.5">
                          {getCat(featured)}
                        </span>
                      )}
                    </div>
                    <div className="p-6 md:p-8">
                      <div className="font-mono text-[11px] tracking-wide text-rm-inkSoft/80 uppercase mb-3 flex items-center gap-2">
                        <span>{getDate(featured)}</span>
                        {featured.readingTime && (
                          <>
                            <span className="text-rm-ruleStrong">·</span>
                            <span>
                              {featured.readingTime} {dict.blog.readingTime}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="font-display text-[26px] md:text-[30px] leading-[1.12] text-rm-teal tracking-[-0.01em] group-hover:text-rm-burgundy transition-colors">
                        {featured.title}
                      </h3>
                      {featured.excerpt && (
                        <p className="font-serif italic text-[16px] leading-[1.55] text-rm-inkSoft mt-3 line-clamp-3">
                          {featured.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                  </Reveal>

                  {/* Side (1/3) */}
                  <div className="flex flex-col gap-6 md:gap-8">
                    {side.map((post: any, sIdx: number) => (
                      <Reveal key={post.slug} delay={120 + sIdx * 110} className="flex-1">
                      <Link
                        href={`/${locale}/blog/${post.slug}`}
                        className="group bg-rm-paper border border-rm-rule overflow-hidden flex flex-col h-full hover:border-rm-ruleStrong transition-colors"
                      >
                        <div className="aspect-[16/9] relative overflow-hidden bg-rm-creamSoft">
                          <Image
                            src={getImg(post)}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            sizes="(max-width: 1024px) 100vw, 33vw"
                          />
                          {getCat(post) && (
                            <span className="absolute top-3 left-3 bg-rm-cream/95 border border-rm-ruleStrong text-rm-ochre font-sans text-[10px] tracking-[0.22em] uppercase px-2.5 py-1">
                              {getCat(post)}
                            </span>
                          )}
                        </div>
                        <div className="p-4 md:p-5">
                          <div className="font-mono text-[10px] tracking-wide text-rm-inkSoft/80 uppercase mb-2 flex items-center gap-2">
                            <span>{getDate(post)}</span>
                            {post.readingTime && (
                              <>
                                <span className="text-rm-ruleStrong">·</span>
                                <span>
                                  {post.readingTime} {dict.blog.readingTime}
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="font-display text-[18px] leading-[1.15] text-rm-teal group-hover:text-rm-burgundy transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                        </div>
                      </Link>
                      </Reveal>
                    ))}
                  </div>
                </>
              )
            })()}
          </div>

          <Reveal className="text-center mt-12 md:mt-14" delay={150}>
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center gap-2 font-sans text-sm font-semibold bg-rm-burgundy text-white px-6 py-3.5 hover:bg-rm-burgundy/90 transition-colors"
            >
              {dict.home.blog.viewAll}
              <span aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 6. NEWSLETTER ═══════════════ */}
      <section className="bg-rm-paper border-t border-dashed border-rm-rule">
        <Reveal className="mx-auto max-w-2xl px-6 md:px-10 py-16 md:py-24 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <span className="block w-7 h-px bg-rm-burgundy" />
            <span className="font-sans text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
              Courrier saisonnier
            </span>
            <span className="block w-7 h-px bg-rm-burgundy" />
          </div>
          <h2 className="font-display text-[32px] md:text-[42px] leading-[1.08] text-rm-teal tracking-[-0.01em]">
            <em className="italic text-rm-burgundy">Recevez</em> notre newsletter
          </h2>
          <p className="font-serif italic text-[17px] md:text-[19px] leading-[1.55] text-rm-inkSoft mt-4">
            {dict.home.newsletter.subtitle}
          </p>

          <NewsletterForm
            placeholder={dict.home.newsletter.placeholder}
            cta={dict.home.newsletter.cta}
            locale={locale}
          />

          <p className="font-mono text-[11px] tracking-wide uppercase text-rm-inkSoft/60 mt-6">
            En vous inscrivant, vous acceptez notre{' '}
            <Link
              href={`/${locale}/politique-confidentialite`}
              className="underline underline-offset-2 decoration-rm-inkSoft/40 hover:text-rm-burgundy hover:decoration-rm-burgundy transition-colors"
            >
              politique de confidentialité
            </Link>
            .
          </p>
        </Reveal>
      </section>

      {/* ═══════════════ 7. FAQ PREVIEW ═══════════════ */}
      <section className="bg-rm-cream border-t border-dashed border-rm-rule">
        <div className="mx-auto max-w-3xl px-6 md:px-10 py-16 md:py-24">
          <Reveal className="text-center mb-12 md:mb-14">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                En marge
              </span>
              <span className="block w-7 h-px bg-rm-burgundy" />
            </div>
            <h2 className="font-display text-[32px] md:text-[42px] leading-[1.08] text-rm-teal tracking-[-0.01em]">
              Questions <em className="italic text-rm-burgundy">fréquentes</em>
            </h2>
          </Reveal>

          <Reveal className="divide-y divide-dashed divide-rm-rule border-t border-b border-dashed border-rm-rule" delay={80}>
            {mockFaqItems.map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex w-full items-center justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-baseline gap-4 flex-1 min-w-0">
                    <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-rm-inkSoft/60 shrink-0">
                      N° {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-[18px] md:text-[20px] leading-[1.25] text-rm-teal text-left">
                      {faq.question}
                    </span>
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-rm-burgundy flex-shrink-0 transition-transform duration-300 group-open:rotate-180"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <div className="pb-5 pl-[72px] pr-8 font-serif italic text-[15px] leading-[1.6] text-rm-inkSoft">
                  {faq.answer}
                </div>
              </details>
            ))}
          </Reveal>

          <Reveal className="text-center mt-10 md:mt-12" delay={150}>
            <Link
              href={`/${locale}/faq`}
              className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-rm-burgundy underline underline-offset-4 decoration-1 hover:text-rm-teal transition-colors"
            >
              {dict.home.faq.viewAll} →
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
