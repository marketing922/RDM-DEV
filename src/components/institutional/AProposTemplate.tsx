import React from 'react'
import Reveal from '@/components/ui/Reveal'
import { InstitBreadcrumb } from './primitives'

type Props = {
  locale: string
  homeLabel: string
  plantsCount?: number
  benefitsCount?: number
  articlesCount?: number
}

const PRINCIPLES = [
  {
    n: '01',
    t: 'Sourcer avant tout',
    b: "Chaque affirmation renvoie à une publication vérifiable — pharmacopée française, monographie ESCOP/EMA, étude clinique indexée. Aucun usage allégation santé sans source EFSA 432/2012.",
  },
  {
    n: '02',
    t: 'Écrire pour être lu',
    b: "La rigueur n'exige pas la pédanterie. Les fiches sont relues par un non-spécialiste avant publication. Si une phrase perd le lecteur, elle est réécrite.",
  },
  {
    n: '03',
    t: 'Prudence assumée',
    b: "La phytothérapie n'est pas sans danger. Chaque fiche indique les contre-indications, interactions et limites d'usage — en toutes lettres.",
  },
] as const

export default function AProposTemplate({
  locale,
  homeLabel,
  plantsCount = 0,
  benefitsCount = 0,
  articlesCount = 0,
}: Props) {
  const STATS = [
    { n: String(plantsCount || '—'), l: 'plantes répertoriées' },
    { n: String(benefitsCount || '—'), l: 'bienfaits documentés' },
    { n: String(articlesCount || '—'), l: 'articles publiés' },
    { n: '100%', l: 'sources vérifiables' },
  ]

  return (
    <main className="min-h-screen bg-rm-cream text-rm-ink font-sans">
      <InstitBreadcrumb
        crumbs={[
          { label: homeLabel, href: `/${locale}` },
          { label: 'La maison' },
        ]}
        locale={locale}
      />

      {/* ── Hero editorial split ── */}
      <Reveal>
        <section className="pt-10 sm:pt-14 md:pt-16 pb-8 sm:pb-10 md:pb-12">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-14 items-center">
            <div>
              <div className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase mb-2.5 sm:mb-3">
                La maison · Édition SAS Calebasse
              </div>
              <h1 className="font-display font-normal text-rm-teal m-0 leading-[0.95] sm:leading-[0.9] tracking-[-0.02em] sm:tracking-[-0.025em] text-[36px] sm:text-[52px] md:text-[68px] lg:text-[88px] break-words">
                Le savoir des{' '}
                <em className="italic text-rm-burgundy">plantes</em>, tenu avec
                rigueur.
              </h1>
              <p className="font-serif text-[15px] sm:text-[17px] md:text-[20px] leading-[1.55] text-rm-inkSoft mt-5 sm:mt-6 md:mt-7">
                Les Remèdes de Mamie réunissent la pharmacopée française et la
                médecine traditionnelle chinoise dans une encyclopédie
                botanique rigoureusement sourcée — accessible à tous, utile au
                quotidien.
              </p>
            </div>
            <div className="relative aspect-[4/5] bg-rm-creamSoft border border-rm-rule overflow-hidden max-w-[320px] sm:max-w-[420px] mx-auto lg:mx-0 w-full">
              <div className="absolute inset-3 sm:inset-4 border border-rm-ruleStrong flex items-center justify-center flex-col gap-2">
                <svg
                  viewBox="0 0 24 24"
                  width="100"
                  height="100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-rm-teal opacity-50 sm:w-[140px] sm:h-[140px]"
                >
                  <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s2.5 3.5.5 9.2A7 7 0 0 1 11 20Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
                <div className="font-serif italic text-[12px] sm:text-[13px] text-rm-inkSoft mt-2 sm:mt-3 text-center px-2">
                  — 15 rue de la Vistule, Paris 13e
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Stats band (données réelles DB) ── */}
      <Reveal>
        <section className="border-t border-b border-rm-rule bg-rm-paper py-6 sm:py-7">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 sm:gap-10">
            {STATS.map((s, i) => (
              <div
                key={s.l}
                className={
                  i > 0 && i % 4 !== 0
                    ? 'md:border-l md:border-rm-rule md:pl-10'
                    : ''
                }
              >
                <div className="font-display text-[30px] sm:text-[40px] md:text-[48px] text-rm-teal leading-none tracking-[-0.03em]">
                  {s.n}
                </div>
                <div className="text-[11px] sm:text-[12px] text-rm-inkSoft mt-1.5 tracking-[0.02em]">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Notre démarche · 2 colonnes serif avec drop-cap ── */}
      <section className="py-10 sm:py-14 md:py-20">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 md:px-10">
          <Reveal>
            <h2 className="font-display text-[26px] sm:text-[36px] md:text-[48px] text-rm-teal leading-[1.1] sm:leading-[1.05] tracking-[-0.015em] border-l-[3px] border-rm-burgundy pl-3 sm:pl-4 font-normal m-0 mb-6 sm:mb-8 md:mb-10">
              Notre démarche
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="columns-1 md:columns-2 gap-8 sm:gap-12 font-serif text-[15px] sm:text-[16px] md:text-[17px] leading-[1.7] sm:leading-[1.75] text-rm-ink">
              <p className="mb-4 break-inside-avoid">
                <span className="font-display text-[44px] sm:text-[56px] md:text-[64px] float-left leading-[0.85] mr-2 mt-1.5 text-rm-burgundy">
                  L
                </span>
                es savoirs populaires sur les plantes circulent depuis toujours
                — mais ils s'affrontent, se contredisent, se perdent. Notre
                parti-pris est de les réunir dans une seule encyclopédie, de
                les mettre en regard des connaissances scientifiques
                contemporaines, et d'écrire ce que l'on peut dire sans trahir.
              </p>
              <p className="mb-4 break-inside-avoid">
                Ce travail croise deux traditions rarement mises côte à côte :
                la pharmacopée française (monographies officielles, études
                cliniques indexées) et la médecine traditionnelle chinoise
                (usages millénaires documentés). Là où elles convergent, le
                constat est robuste. Là où elles divergent, nous le disons.
              </p>
              <p className="mb-4 break-inside-avoid">
                Chaque fiche est écrite par un rédacteur, relue par un
                non-spécialiste, validée par un référent conformité avant
                publication. Les allégations santé suivent strictement le
                règlement EFSA 432/2012 — pas de promesse thérapeutique, pas
                de substitution à un avis médical.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Trois principes ── */}
      <section className="bg-rm-paper border-t border-b border-rm-rule py-10 sm:py-14 md:py-[72px]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10">
          <Reveal>
            <div className="font-sans text-[10px] sm:text-[11px] tracking-[0.25em] text-rm-burgundy uppercase mb-2.5 sm:mb-3">
              Chapitre II
            </div>
            <h2 className="font-display text-[28px] sm:text-[40px] md:text-[52px] text-rm-teal leading-[1.1] sm:leading-[1.05] tracking-[-0.018em] font-normal m-0 mb-7 sm:mb-10 md:mb-12">
              Trois principes{' '}
              <em className="italic text-rm-burgundy">tenus fermes</em>.
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.n} delay={i * 100}>
                <div>
                  <div className="font-mono text-[11px] sm:text-[12px] text-rm-burgundy mb-2.5 sm:mb-3 tracking-[0.06em]">
                    N° {p.n}
                  </div>
                  <div className="font-display text-[20px] sm:text-[24px] md:text-[26px] text-rm-teal leading-[1.2] sm:leading-[1.15] mb-2.5 sm:mb-3 tracking-[-0.01em]">
                    {p.t}
                  </div>
                  <p className="font-serif text-[14px] sm:text-[15px] leading-[1.65] text-rm-inkSoft m-0">
                    {p.b}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── L'entité ── */}
      <section className="py-10 sm:py-14 md:py-20">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 md:px-10">
          <Reveal>
            <h2 className="font-display text-[26px] sm:text-[36px] md:text-[48px] text-rm-teal leading-tight font-normal m-0 mb-2 tracking-[-0.015em] border-l-[3px] border-rm-burgundy pl-3 sm:pl-4">
              L'entité éditrice
            </h2>
            <p className="font-serif italic text-[14px] sm:text-[16px] text-rm-inkSoft ml-[15px] sm:ml-[19px] mb-7 sm:mb-10">
              Une SAS française, une marque éditoriale, une équipe qui signe.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="bg-rm-paper border border-rm-rule p-5 sm:p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5 sm:gap-6 md:gap-10 items-start">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rm-burgundy text-white text-[22px] sm:text-[26px] font-semibold flex items-center justify-center font-sans">
                  RW
                </div>
                <div>
                  <div className="font-display text-[20px] sm:text-[24px] md:text-[26px] text-rm-teal leading-tight">
                    Ruosi WU
                  </div>
                  <div className="font-serif italic text-[13px] sm:text-[14px] text-rm-inkSoft mt-1">
                    Président · Directeur de la publication
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-3 mt-4 sm:mt-5 font-serif text-[13.5px] sm:text-[14px]">
                    <div>
                      <dt className="font-sans text-[10px] uppercase tracking-[0.15em] text-rm-inkSoft/70 mb-0.5">
                        Entité juridique
                      </dt>
                      <dd className="text-rm-ink">SAS CALEBASSE</dd>
                    </div>
                    <div>
                      <dt className="font-sans text-[10px] uppercase tracking-[0.15em] text-rm-inkSoft/70 mb-0.5">
                        Capital
                      </dt>
                      <dd className="text-rm-ink">10 000 €</dd>
                    </div>
                    <div>
                      <dt className="font-sans text-[10px] uppercase tracking-[0.15em] text-rm-inkSoft/70 mb-0.5">
                        RCS Paris
                      </dt>
                      <dd className="text-rm-ink">B 415 228 311</dd>
                    </div>
                    <div>
                      <dt className="font-sans text-[10px] uppercase tracking-[0.15em] text-rm-inkSoft/70 mb-0.5">
                        TVA
                      </dt>
                      <dd className="text-rm-ink">FR81415228311</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-sans text-[10px] uppercase tracking-[0.15em] text-rm-inkSoft/70 mb-0.5">
                        Siège social
                      </dt>
                      <dd className="text-rm-ink">
                        15 rue de la Vistule, 75013 Paris, France
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Citation CTA ── */}
      <section className="bg-rm-teal text-rm-cream py-10 sm:py-14 md:py-16">
        <Reveal>
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 md:px-10 text-center">
            <div className="font-display italic text-[22px] sm:text-[28px] md:text-[40px] leading-[1.2] sm:leading-[1.15] tracking-[-0.01em]">
              « Écrire ce que l'on peut dire, avec rigueur, et le dire bien. »
            </div>
            <div className="text-[11px] sm:text-[12px] tracking-[0.15em] opacity-70 mt-4 sm:mt-5 uppercase">
              — Ligne éditoriale, Les Remèdes de Mamie
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
