import React from 'react'
import Link from 'next/link'
import { InstitBreadcrumb, InstitHeader } from '@/components/institutional/primitives'
import Reveal from '@/components/ui/Reveal'

type Props = { locale: string; homeLabel: string }

type QA = { q: string; a: React.ReactNode }
type Group = { id: string; title: string; qs: QA[] }

function buildGroups(locale: string): Group[] {
  return [
    {
      id: 'maison',
      title: "La maison & l'équipe",
      qs: [
        {
          q: 'Qui écrit les fiches plantes ?',
          a: (
            <>
              Toutes les fiches sont rédigées par un auteur identifié et relues par un
              référent conformité avant publication. Chaque affirmation renvoie à une
              source vérifiable : pharmacopée française, monographie ESCOP/EMA, étude
              clinique indexée.
            </>
          ),
        },
        {
          q: 'Comment sont choisies les nouvelles plantes ?',
          a: (
            <>
              Nous suivons un calendrier éditorial saisonnier (plantes fraîches au
              printemps, racines en hiver). Les suggestions des lecteurs sont examinées
              chaque mois.
            </>
          ),
        },
        {
          q: 'Puis-je contribuer ?',
          a: (
            <>
              Oui, les propositions sont les bienvenues via le{' '}
              <Link
                href={`/${locale}/contact`}
                className="text-rm-burgundy underline decoration-rm-burgundy/40 underline-offset-2 hover:decoration-rm-burgundy transition-colors"
              >
                formulaire de contact
              </Link>
              . Elles passent par le même processus de relecture que toute fiche.
            </>
          ),
        },
      ],
    },
    {
      id: 'usages',
      title: 'Usages & sécurité',
      qs: [
        {
          q: 'Les plantes remplacent-elles un traitement médical ?',
          a: (
            <>
              Non, jamais. Nos fiches sont informatives, pas prescriptives. Demandez
              toujours l'avis d'un professionnel de santé, en particulier si vous prenez
              un traitement en cours. Voir notre{' '}
              <Link
                href={`/${locale}/avertissement-sante`}
                className="text-rm-burgundy underline decoration-rm-burgundy/40 underline-offset-2 hover:decoration-rm-burgundy transition-colors"
              >
                avertissement santé
              </Link>
              .
            </>
          ),
        },
        {
          q: 'Les plantes conviennent-elles aux enfants ?',
          a: (
            <>
              Chaque fiche mentionne explicitement les restrictions d'âge et précautions.
              En cas de doute, consultez un pharmacien ou un pédiatre.
            </>
          ),
        },
        {
          q: 'Et pendant la grossesse ou l’allaitement ?',
          a: (
            <>
              De nombreuses plantes sont contre-indiquées pendant la grossesse et
              l'allaitement. La section « Précautions » de chaque fiche est à lire en
              premier. En cas de doute, parlez-en à votre sage-femme ou médecin.
            </>
          ),
        },
      ],
    },
    {
      id: 'boutique',
      title: 'Boutique & livraisons',
      qs: [
        {
          q: 'D’où viennent vos produits ?',
          a: (
            <>
              Nos tisanes et poudres sont conditionnées en France à partir de plantes
              issues de filières bio françaises ou européennes tracées. Chaque produit
              indique son origine.
            </>
          ),
        },
        {
          q: 'Quels sont les délais de livraison ?',
          a: (
            <>
              Colissimo : 3 à 5 jours ouvrés · Mondial Relay : 4 à 6 jours ouvrés.
              Livraison en France métropolitaine uniquement pour l'instant. Offerte
              dès 30 € d'achat.
            </>
          ),
        },
        {
          q: 'Puis-je retourner un produit ?',
          a: (
            <>
              Oui, sous 14 jours francs à compter de la réception, conformément à
              l'article L.221-18 du Code de la consommation. Les produits doivent être
              non ouverts, dans leur emballage d'origine. Détails dans nos{' '}
              <Link
                href={`/${locale}/cgv`}
                className="text-rm-burgundy underline decoration-rm-burgundy/40 underline-offset-2 hover:decoration-rm-burgundy transition-colors"
              >
                CGV
              </Link>
              .
            </>
          ),
        },
      ],
    },
    {
      id: 'newsletter',
      title: 'Newsletter & compte',
      qs: [
        {
          q: 'À quoi ressemble la newsletter ?',
          a: (
            <>
              Une lettre mensuelle, envoyée le premier dimanche du mois. Elle reprend un
              dossier de saison, trois plantes à découvrir, et une recette. Aucun spam,
              désabonnement en un clic.
            </>
          ),
        },
        {
          q: 'Comment me désabonner ?',
          a: (
            <>
              Un lien de désabonnement figure en bas de chaque envoi. Vos données sont
              effacées sous 72 h. Voir aussi notre{' '}
              <Link
                href={`/${locale}/politique-confidentialite`}
                className="text-rm-burgundy underline decoration-rm-burgundy/40 underline-offset-2 hover:decoration-rm-burgundy transition-colors"
              >
                politique de confidentialité
              </Link>
              .
            </>
          ),
        },
      ],
    },
  ]
}

export default function FAQTemplate({ locale, homeLabel }: Props) {
  const groups = buildGroups(locale)

  return (
    <main className="min-h-screen bg-rm-cream text-rm-ink font-sans">
      <InstitBreadcrumb
        crumbs={[
          { label: homeLabel, href: `/${locale}` },
          { label: 'Questions fréquentes' },
        ]}
        locale={locale}
      />
      <InstitHeader
        chapter="Foire aux questions"
        title="Les questions"
        sub="qui nous reviennent souvent."
        intro="Nous avons regroupé ici les questions les plus fréquentes. Si la vôtre n'y figure pas, écrivez-nous — nous enrichissons cette page chaque mois."
      />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14 md:py-20 pb-16 sm:pb-20 md:pb-24 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 sm:gap-8 lg:gap-12">
        {/* TOC sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          {/* Mobile/tablet : collapsible details */}
          <details className="lg:hidden border border-rm-rule bg-rm-paper group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between px-4 py-3 font-mono text-[11px] tracking-[0.18em] text-rm-burgundy uppercase">
              <span>Sommaire · {groups.length} sections</span>
              <svg
                className="text-rm-burgundy flex-shrink-0 transition-transform group-open:rotate-180"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <ol className="list-none m-0 p-0 px-3 pb-3 pt-1 border-t border-rm-rule">
              {groups.map((g, i) => (
                <li
                  key={g.id}
                  className="py-1.5 pl-3 font-serif text-[13px] leading-[1.4] border-l-2 border-transparent hover:border-rm-burgundy transition-colors"
                >
                  <a
                    href={`#${g.id}`}
                    className="text-rm-inkSoft hover:text-rm-burgundy transition-colors inline-flex items-baseline gap-1.5"
                  >
                    <span className="font-mono text-[10px] text-rm-burgundy">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{g.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </details>

          {/* Desktop : full sidebar */}
          <div className="hidden lg:block">
            <div className="font-mono text-[10px] tracking-[0.2em] text-rm-burgundy mb-3.5 uppercase">
              Sommaire
            </div>
            <ol className="list-none m-0 p-0">
              {groups.map((g, i) => (
                <li
                  key={g.id}
                  className="py-[7px] pl-3 font-serif text-[13px] leading-[1.4] border-l-2 border-transparent hover:border-rm-burgundy transition-colors"
                >
                  <a
                    href={`#${g.id}`}
                    className="text-rm-inkSoft hover:text-rm-burgundy transition-colors inline-flex items-baseline gap-1.5"
                  >
                    <span className="font-mono text-[10px] text-rm-burgundy">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{g.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        {/* Groups with Q/A */}
        <div>
          {groups.map((g, gi) => (
            <Reveal key={g.id}>
              <section id={g.id} className="mb-10 sm:mb-14 scroll-mt-20 sm:scroll-mt-24">
                <h2 className="font-display text-[22px] sm:text-[28px] md:text-[34px] text-rm-teal mb-4 sm:mb-6 font-normal tracking-[-0.01em] border-b border-rm-rule pb-3 sm:pb-3.5 leading-[1.2]">
                  <span className="font-mono text-[12px] sm:text-[14px] text-rm-burgundy mr-2 sm:mr-3">
                    § {String(gi + 1).padStart(2, '0')}
                  </span>
                  {g.title}
                </h2>
                {g.qs.map((qa, qi) => (
                  <details
                    key={qi}
                    className="border-b border-rm-rule py-4 sm:py-5 group"
                    {...(gi === 0 && qi === 0 ? { open: true } : {})}
                  >
                    <summary className="flex justify-between items-start sm:items-baseline gap-3 sm:gap-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span className="font-display text-[17px] sm:text-[20px] md:text-[22px] text-rm-teal font-normal flex-1 leading-[1.3] sm:leading-[1.25] tracking-[-0.01em]">
                        {qa.q}
                      </span>
                      <svg
                        className="text-rm-burgundy flex-shrink-0 mt-1 sm:mt-0 transition-transform group-open:rotate-180"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </summary>
                    <div className="font-serif text-[14px] sm:text-[15px] md:text-[16px] leading-[1.65] sm:leading-[1.7] text-rm-inkSoft mt-2.5 sm:mt-3">
                      {qa.a}
                    </div>
                  </details>
                ))}
              </section>
            </Reveal>
          ))}

          {/* CTA card */}
          <Reveal>
            <div className="mt-8 sm:mt-10 bg-rm-paper border border-rm-rule px-5 sm:px-8 py-5 sm:py-7 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6 flex-wrap">
              <div>
                <div className="font-display text-[20px] sm:text-[24px] md:text-[28px] text-rm-teal tracking-[-0.01em] font-normal leading-[1.2]">
                  Votre question n'y est pas ?
                </div>
                <div className="font-serif italic text-[14px] sm:text-[15px] text-rm-inkSoft mt-1.5">
                  Écrivez-nous — nous répondons personnellement sous 48 h ouvrées.
                </div>
              </div>
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center justify-center gap-2 bg-rm-burgundy text-white font-sans text-[13px] font-semibold px-5 py-3.5 hover:bg-rm-burgundy/90 transition-colors w-full sm:w-auto"
              >
                Nous écrire
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </main>
  )
}
