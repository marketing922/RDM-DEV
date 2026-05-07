import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import Image from 'next/image'
import Link from 'next/link'
import { getWikiEntries, getBlogPosts, getBenefits } from '@/lib/queries'
import { getFaqItems } from '@/lib/queries/faqItems'
import { richTextToPlain } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import BodyExplorer, { type BodyRegion } from '@/components/home/BodyExplorer'
import Reveal from '@/components/ui/Reveal'
import NewsletterForm from '@/components/home/NewsletterForm'
import { DEFAULT_PLANT_IMAGE, DEFAULT_BLOG_IMAGE } from '@/lib/brand-assets'

export const revalidate = 60

type Props = { params: Promise<{ locale: string }> }

/* ─── Brand assets (Cloudinary) ──────────────────────────────────── */

const CLOUDINARY = 'https://res.cloudinary.com/laboratoire-calebasse/image/upload'

const BRAND_VALUES = [
  {
    key: 'naturel',
    label: '100 % Naturel & Pur',
    subtitle: 'Plantes sans pesticides ni métaux lourds, qualité pharmacopée garantie',
    num: '01',
    src: `${CLOUDINARY}/v1761638875/100_naturel_et_pur_a729474982.png`,
    rotate: '-1.5deg',
  },
  {
    key: 'france',
    label: 'Conçu & Fabriqué en France',
    subtitle: 'Chaque lot est analysé pour garantir la pureté et la sécurité, du champ à votre maison',
    num: '02',
    src: `${CLOUDINARY}/v1761638875/fabrique_en_France_c8918f0126.png`,
    rotate: '1deg',
  },
  {
    key: 'savoir',
    label: 'Savoir-faire Ancestral',
    subtitle: 'Inspiré par les médecines traditionnelles du monde',
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

// Mapping enum WikiEntry.category → bodyRegion id (peuplé sur toutes les fiches).
// Une catégorie peut couvrir plusieurs régions, et `multi`/`immunity` sont
// pertinents pour toutes les régions.
const ALL_REGIONS = ['tete', 'gorge', 'respiration', 'digestion', 'feminin', 'circulation']
const CATEGORY_TO_REGIONS: Record<string, string[]> = {
  nervous: ['tete'],
  respiratory: ['gorge', 'respiration'],
  digestive: ['digestion'],
  female: ['feminin'],
  male: ['feminin'], // pas de région "masculin" sur le diagramme actuel
  circulatory: ['circulation'],
  joints: ['circulation'],
  immunity: ALL_REGIONS,
  skin: ['tete'],
  metabolism: ['digestion'],
  multi: ALL_REGIONS,
}

function buildRegionData(entries: any[]): BodyRegion[] {
  return BODY_REGION_DEFS.map((def) => {
    const kws = def.keywords.map(normalize)

    const matches = entries.filter((entry) => {
      // Primary: WikiEntry.category mappe directement à la région.
      const cat = String(entry?.category || '')
      if (cat && (CATEGORY_TO_REGIONS[cat] || []).includes(def.id)) return true

      // Secondary: any related benefit has bodyRegion === def.id
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

    // Fallback "compteur non vide" : si aucune plante ne matche cette région
    // mais qu'on a bien des entrées en DB, on prend les 3 premières plantes
    // disponibles plutôt que d'afficher un compteur à 0. Ce ne sont pas des
    // données fictives — ce sont de vraies plantes du wiki, simplement pas
    // encore catégorisées finement pour cette région. L'objectif est de garder
    // l'explorer du corps utile pendant que la catégorisation se complète.
    let display = matches
    if (matches.length === 0 && entries.length > 0) {
      display = entries.slice(0, 3)
    }

    return {
      id: def.id,
      label: def.label,
      adjective: def.adjective,
      count: matches.length,
      plants: display.slice(0, 6).map((e: any) => ({
        name: String(e.name || ''),
        slug: String(e.slug || ''),
      })),
    }
  })
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  // Fetch CMS data in parallel — wiki entries fetched in bulk so we can both
  // render the top-3 herbarium plates AND feed the BodyExplorer with the full
  // set (matched against region keywords).
  const [wikiResult, recentWikiResult, blogResult, benefitsResult, faqItems] = await Promise.all([
    // depth:0 pour éviter qu'une relation cassée fasse retomber le résultat
    // sur le fallback vide via safeQuery (le body explorer n'a besoin que des
    // champs scalaires : category, name, slug, shortDescription).
    getWikiEntries({ limit: 100, locale, depth: 0 }),
    getWikiEntries({ limit: 3, locale, sort: '-createdAt' }),
    getBlogPosts({ limit: 3, locale }),
    getBenefits({ limit: 6, locale }),
    getFaqItems({ locale, limit: 4 }),
  ])
  const dbAllWiki = wikiResult.docs
  const dbWikiEntries = recentWikiResult.docs
  const dbBlogPosts = blogResult.docs
  const dbBenefits = benefitsResult.docs

  const wikiEntries = dbWikiEntries.length > 0 ? dbWikiEntries : null
  const blogPosts = dbBlogPosts.length > 0 ? dbBlogPosts : null
  const benefits = dbBenefits.length > 0 ? dbBenefits : null

  // Real counts for the hero stats row
  const plantsCount = wikiResult.totalDocs ?? 0
  const benefitsCount = benefitsResult.totalDocs ?? 0
  const articlesCount = blogResult.totalDocs ?? 0

  // Body regions — derived strictly from DB data; empty regions show count 0.
  const bodyRegions = buildRegionData(dbAllWiki)

  return (
    <>
      {/* ═══════════════ 1. HERO — ALMANACH ═══════════════ */}
      <section className="relative overflow-hidden bg-rm-cream">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-10 pt-10 sm:pt-12 md:pt-[72px] pb-10 sm:pb-12 md:pb-12 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          {/* Left column */}
          <div className="relative">
            {/* Volume badge */}
            <div className="flex items-center gap-2.5 mb-4 md:mb-[18px]">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                Volume IV · Printemps 2026
              </span>
            </div>

            {/* Display headline */}
            <h1 className="font-display font-normal text-rm-teal leading-[1.02] tracking-[-0.02em] text-[34px] sm:text-[48px] md:text-[60px] lg:text-[62px] xl:text-[78px]">
              <span className="block">L'almanach des</span>
              <span className="block sm:whitespace-nowrap">
                <em className="italic text-rm-burgundy">plantes</em> qui soignent
              </span>
              <span className="block">depuis toujours.</span>
            </h1>

            {/* Serif subtitle */}
            <p className="font-serif text-[16px] sm:text-[19px] leading-[1.55] text-rm-inkSoft mt-5 sm:mt-6 md:mt-7 max-w-[520px]">
              Une encyclopédie botanique réunissant les savoirs de la pharmacopée française et de la médecine traditionnelle chinoise — rigoureusement sourcée, illustrée, et lisible par tous.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-3.5 mt-6 sm:mt-7 md:mt-8 items-stretch sm:items-center">
              <Link
                href={`/${locale}/plantes`}
                className="inline-flex items-center justify-center gap-2 font-sans text-sm font-semibold bg-rm-burgundy text-white px-[22px] py-[14px] rounded-[10px] shadow-[0_6px_16px_rgba(162,33,30,0.18)] hover:bg-rm-burgundy/90 transition-colors"
              >
                Parcourir l'encyclopédie
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="8" x2="13" y2="8" />
                  <polyline points="9,4 13,8 9,12" />
                </svg>
              </Link>
              <Link
                href={`/${locale}/a-propos`}
                className="font-sans text-sm font-semibold text-rm-teal underline underline-offset-4 decoration-1 hover:text-rm-burgundy transition-colors py-[14px] px-[18px] text-center sm:text-left"
              >
                Notre démarche →
              </Link>
            </div>

            {/* Stats row — live counts from Payload */}
            <div className="flex items-center flex-wrap gap-x-5 gap-y-3 sm:gap-x-7 mt-8 sm:mt-10 md:mt-11 font-sans text-xs text-rm-inkSoft">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[24px] sm:text-[28px] text-rm-teal leading-none">{plantsCount}</span>
                <span>{plantsCount > 1 ? 'plantes' : 'plante'}</span>
              </div>
              <span className="block w-px h-6 bg-rm-ruleStrong" />
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[24px] sm:text-[28px] text-rm-teal leading-none">{benefitsCount}</span>
                <span>{benefitsCount > 1 ? 'bienfaits' : 'bienfait'}</span>
              </div>
              <span className="block w-px h-6 bg-rm-ruleStrong" />
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[24px] sm:text-[28px] text-rm-teal leading-none">{articlesCount}</span>
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
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-10 py-10 md:py-12">
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
      {wikiEntries && (
      <section className="bg-rm-cream border-t border-dashed border-rm-rule">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-10 py-12 sm:py-16 md:py-24">
          <Reveal className="text-center mb-10 sm:mb-12 md:mb-14 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                Planches d&apos;herbier
              </span>
              <span className="block w-7 h-px bg-rm-burgundy" />
            </div>
            <h2 className="font-display text-[28px] sm:text-[34px] md:text-[44px] leading-[1.08] text-rm-teal tracking-[-0.01em]">
              Les <em className="italic text-rm-burgundy">plantes</em> à découvrir
            </h2>
            <p className="font-serif italic text-[15px] sm:text-[16px] md:text-[18px] leading-[1.55] text-rm-inkSoft mt-4">
              {dict.home.wiki.subtitle}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
            {wikiEntries.map((plant: any, idx: number) => {
              const imgSrc =
                plant.image ||
                plant.externalImageUrl ||
                (Array.isArray(plant.galleryUrls) && plant.galleryUrls[0]?.url) ||
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

          <Reveal className="text-center mt-10 sm:mt-12 md:mt-14" delay={150}>
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
      )}

      {/* ═══════════════ 3.5 BIENFAITS ═══════════════ */}
      <section className="bg-rm-paper border-t border-dashed border-rm-rule">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-10 py-12 sm:py-16 md:py-24">
          <Reveal className="text-center mb-10 sm:mb-12 md:mb-14 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                Index des usages
              </span>
              <span className="block w-7 h-px bg-rm-burgundy" />
            </div>
            <h2 className="font-display text-[28px] sm:text-[34px] md:text-[44px] leading-[1.08] text-rm-teal tracking-[-0.01em]">
              {dict.benefits.title}
            </h2>
            <p className="font-serif italic text-[15px] sm:text-[16px] md:text-[18px] leading-[1.55] text-rm-inkSoft mt-4">
              {dict.benefits.subtitle}
            </p>
          </Reveal>

          {!benefits ? (
            <div className="text-center py-12 font-serif italic text-rm-inkSoft/70">
              {dict.benefits.emptyHint}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {benefits.map((b: any, idx: number) => {
                const desc =
                  typeof b.shortDescription === 'string'
                    ? b.shortDescription
                    : b.directAnswer ||
                      (b.description && richTextToPlain(b.description))
                return (
                  <Reveal key={b.slug} delay={idx * 60}>
                    <Link
                      href={`/${locale}/bienfaits/${b.slug}`}
                      className="group bg-rm-cream rounded-2xl p-5 border border-rm-rule hover:border-rm-burgundy hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(162,33,30,0.08)] transition-all duration-300 flex flex-col h-full"
                    >
                      <div className="w-12 h-12 rounded-xl bg-rm-creamSoft flex items-center justify-center mb-3 group-hover:bg-rm-burgundy transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6 text-rm-burgundy group-hover:text-white transition-colors"
                        >
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-rm-teal text-sm leading-snug group-hover:text-rm-burgundy transition-colors">
                        {b.name}
                      </p>
                      {desc && (
                        <p className="mt-2 text-xs text-rm-inkSoft/70 line-clamp-2">
                          {desc}
                        </p>
                      )}
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          )}

          <Reveal className="text-center mt-10 sm:mt-12 md:mt-14" delay={200}>
            <Link
              href={`/${locale}/bienfaits`}
              className="inline-flex items-center gap-2 font-sans text-sm font-semibold border-2 border-rm-burgundy text-rm-burgundy px-6 py-3.5 hover:bg-rm-burgundy hover:text-white transition-colors"
            >
              Voir tous les bienfaits
              <span aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 4. LE CORPS & LA PLANTE ═══════════════ */}
      <section className="bg-rm-paper border-t border-dashed border-rm-rule">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-10 py-12 sm:py-16 md:py-24">
          <Reveal className="text-center mb-10 sm:mb-12 md:mb-14 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                Chapitre II · Le corps &amp; la plante
              </span>
              <span className="block w-7 h-px bg-rm-burgundy" />
            </div>
            <h2 className="font-display text-[28px] sm:text-[34px] md:text-[44px] leading-[1.08] text-rm-teal tracking-[-0.01em]">
              Où <em className="italic text-rm-burgundy">avez-vous</em> besoin d&apos;aide&nbsp;?
            </h2>
            <p className="font-serif italic text-[15px] sm:text-[16px] md:text-[18px] leading-[1.55] text-rm-inkSoft mt-4">
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
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-10 py-12 sm:py-16 md:py-24">
          <Reveal className="text-center mb-10 sm:mb-12 md:mb-14 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                Journal
              </span>
              <span className="block w-7 h-px bg-rm-burgundy" />
            </div>
            <h2 className="font-display text-[28px] sm:text-[34px] md:text-[44px] leading-[1.08] text-rm-teal tracking-[-0.01em]">
              Le <em className="italic text-rm-burgundy">journal</em> des plantes
            </h2>
            <p className="font-serif italic text-[15px] sm:text-[16px] md:text-[18px] leading-[1.55] text-rm-inkSoft mt-4">
              {dict.home.blog.subtitle}
            </p>
          </Reveal>

          {!blogPosts ? (
            <div className="text-center py-16 font-serif italic text-rm-inkSoft/70">
              Le journal s&apos;écrit. Premiers articles bientôt disponibles.
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
            {(() => {
              const posts = blogPosts as any[]
              const featured = posts[0] as any
              const side = posts.slice(1) as any[]
              const getImg = (p: any) =>
                p.image ||
                (typeof p.externalImageUrl === 'string' && p.externalImageUrl.trim()
                  ? p.externalImageUrl.trim()
                  : null) ||
                resolveMediaUrl(p.featuredImage, 'card') ||
                DEFAULT_BLOG_IMAGE
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
                    <div className="p-5 sm:p-6 md:p-8">
                      <div className="font-mono text-[11px] tracking-wide text-rm-inkSoft/80 uppercase mb-3 flex flex-wrap items-center gap-2">
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
                      <h3 className="font-display text-[22px] sm:text-[26px] md:text-[30px] leading-[1.12] text-rm-teal tracking-[-0.01em] group-hover:text-rm-burgundy transition-colors">
                        {featured.title}
                      </h3>
                      {featured.excerpt && (
                        <p className="font-serif italic text-[15px] sm:text-[16px] leading-[1.55] text-rm-inkSoft mt-3 line-clamp-3">
                          {featured.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                  </Reveal>

                  {/* Side (1/3) */}
                  <div className="flex flex-col gap-5 sm:gap-6 md:gap-8">
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
          )}

          <Reveal className="text-center mt-10 sm:mt-12 md:mt-14" delay={150}>
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

      {/* ═══════════════ 6. FAQ PREVIEW ═══════════════ */}
      <section className="bg-rm-cream border-t border-dashed border-rm-rule">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-10 py-12 sm:py-16 md:py-24">
          <Reveal className="text-center mb-10 sm:mb-12 md:mb-14">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                Questions
              </span>
              <span className="block w-7 h-px bg-rm-burgundy" />
            </div>
            <h2 className="font-display text-[28px] sm:text-[34px] md:text-[44px] leading-[1.08] text-rm-teal tracking-[-0.01em]">
              On vous <em className="italic text-rm-burgundy">répond</em>
            </h2>
          </Reveal>

          {faqItems.length === 0 ? (
            <div className="text-center py-12 font-serif italic text-rm-inkSoft/70">
              La foire aux questions s&apos;enrichit. Premières réponses bientôt en ligne.
            </div>
          ) : (
            <div className="divide-y divide-rm-rule border-t border-b border-rm-rule">
              {faqItems.map((item: any, idx: number) => (
                <Reveal key={item.id} delay={idx * 80}>
                  <details className="group py-5 px-2 sm:px-4">
                    <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                      <span className="font-display text-[17px] sm:text-[18px] md:text-[20px] leading-[1.3] text-rm-teal group-open:text-rm-burgundy transition-colors">
                        {item.question}
                      </span>
                      <span aria-hidden="true" className="font-mono text-rm-burgundy text-[18px] mt-0.5 group-open:rotate-45 transition-transform">
                        +
                      </span>
                    </summary>
                    <div className="font-serif text-[15px] sm:text-[16px] leading-[1.65] text-rm-inkSoft mt-3 pl-1">
                      {richTextToPlain(item.answer)}
                    </div>
                  </details>
                </Reveal>
              ))}
            </div>
          )}

          <Reveal className="text-center mt-10 sm:mt-12" delay={200}>
            <Link
              href={`/${locale}/faq`}
              className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-rm-burgundy hover:underline"
            >
              Toutes les questions
              <span aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 7. NEWSLETTER ═══════════════ */}
      <section className="bg-rm-paper border-t border-dashed border-rm-rule">
        <Reveal className="mx-auto max-w-2xl px-4 sm:px-6 md:px-10 py-12 sm:py-16 md:py-24 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <span className="block w-7 h-px bg-rm-burgundy" />
            <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
              Courrier saisonnier
            </span>
            <span className="block w-7 h-px bg-rm-burgundy" />
          </div>
          <h2 className="font-display text-[26px] sm:text-[32px] md:text-[42px] leading-[1.08] text-rm-teal tracking-[-0.01em]">
            <em className="italic text-rm-burgundy">Recevez</em> notre newsletter
          </h2>
          <p className="font-serif italic text-[15px] sm:text-[17px] md:text-[19px] leading-[1.55] text-rm-inkSoft mt-4">
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
    </>
  )
}
