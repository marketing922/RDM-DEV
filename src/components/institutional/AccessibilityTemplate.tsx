import React from 'react'
import Link from 'next/link'
import { InstitBreadcrumb, InstitHeader } from '@/components/institutional/primitives'
import {
  LegalTOC,
  LegalMeta,
  LegalSection,
  LegalBox,
  LegalBody,
} from '@/components/institutional/legal/LegalPrimitives'
import Reveal from '@/components/ui/Reveal'

type Props = {
  locale: string
  homeLabel: string
}

const TOC_ITEMS = [
  { id: 'engagement', label: 'Engagement' },
  { id: 'conformite', label: 'Niveau de conformité' },
  { id: 'technologies', label: 'Technologies supportées' },
  { id: 'derogations', label: 'Dérogations' },
  { id: 'signaler', label: 'Signaler un problème' },
  { id: 'recours', label: 'Voies de recours' },
]

type TechCard = {
  label: string
  detail: string
}

const TECHNOLOGIES: TechCard[] = [
  {
    label: 'Lecteurs d’écran',
    detail: 'NVDA, JAWS (Windows), VoiceOver (macOS et iOS), TalkBack (Android)',
  },
  {
    label: 'Navigateurs',
    detail: 'Firefox, Chrome, Safari et Edge dans leurs versions récentes',
  },
  {
    label: 'Navigation clavier',
    detail: 'Parcours complet du site accessible uniquement au clavier',
  },
  {
    label: 'Zoom et grossissement',
    detail: 'Zoom jusqu’à 400 % sans perte de contenu ni de fonctionnalité',
  },
]

type Derogation = {
  title: string
  description: string
}

const DEROGATIONS: Derogation[] = [
  {
    title: 'Planches botaniques et illustrations détaillées',
    description:
      'Certaines illustrations de plantes anciennes comportent un texte alternatif court mais ne disposent pas encore d’une description longue détaillant chaque élément botanique visible. Une campagne de réécriture des descriptions est prévue en 2026.',
  },
  {
    title: 'Documents PDF antérieurs à 2024',
    description:
      'Les anciens documents PDF téléchargeables (conseils imprimables, fiches recettes) ne sont pas tous entièrement balisés selon le PDF/UA. Les nouveaux documents publiés sont produits avec un balisage accessible.',
  },
  {
    title: 'Carte interactive des points de vente',
    description:
      'La carte interactive repose sur un composant tiers dont tous les repères ne sont pas encore pleinement navigables au clavier. Une liste textuelle équivalente est proposée en alternative sous la carte.',
  },
]

export default function AccessibilityTemplate({ locale, homeLabel }: Props) {
  const linkClass =
    'text-rm-burgundy underline decoration-rm-rule underline-offset-[3px] hover:decoration-rm-burgundy transition-colors'

  return (
    <main className="min-h-screen bg-rm-cream text-rm-ink font-sans">
      <InstitBreadcrumb
        crumbs={[
          { label: homeLabel, href: `/${locale}` },
          { label: "Déclaration d'accessibilité" },
        ]}
        locale={locale}
      />

      <InstitHeader
        chapter="RGAA · WCAG 2.2"
        title="Déclaration"
        sub="d'accessibilité."
        intro="Notre engagement pour rendre le site www.remedes-mamie.com accessible à toutes et à tous, conformément au RGAA 4.1 et à la WCAG 2.2 niveau AA."
      />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14 md:py-20 pb-16 sm:pb-20 md:pb-24 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 sm:gap-8 lg:gap-12">
        <aside>
          <LegalTOC items={TOC_ITEMS} />
        </aside>

        <div>
          <LegalMeta version="1.0" updated="avril 2026" />

          <LegalBody>
            <Reveal>
              <LegalSection id="engagement" num={1} title="Engagement">
                <p className="mb-4">
                  <strong>SAS CALEBASSE</strong>, éditrice du site
                  www.remedes-mamie.com, s&apos;engage à rendre son site
                  internet accessible conformément à l&apos;article 47 de la loi
                  n°&nbsp;2005-102 du 11 février 2005 pour l&apos;égalité des
                  droits et des chances, la participation et la citoyenneté des
                  personnes handicapées.
                </p>
                <p className="mb-4">
                  Nous visons la conformité aux
                  <strong>
                    {' '}
                    Web Content Accessibility Guidelines (WCAG) 2.2, niveau AA
                  </strong>
                  , ainsi qu&apos;au
                  <strong>
                    {' '}
                    Référentiel Général d&apos;Amélioration de l&apos;Accessibilité
                    (RGAA) version 4.1
                  </strong>
                  .
                </p>
                <p>
                  Cette déclaration s&apos;applique au site
                  www.remedes-mamie.com et sera mise à jour à chaque évolution
                  significative du site ou de son niveau d&apos;accessibilité.
                </p>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="conformite" num={2} title="Niveau de conformité">
                <p className="mb-3">
                  Le site <strong>www.remedes-mamie.com</strong> est en
                  <strong> conformité partielle</strong> avec le RGAA 4.1.
                </p>

                <div className="bg-rm-paper border border-rm-rule px-5 sm:px-7 py-5 sm:py-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 sm:gap-7 items-center my-4">
                  <div className="text-center sm:border-r sm:border-rm-rule sm:pr-6">
                    <div className="font-display text-[48px] sm:text-[56px] md:text-[72px] text-rm-teal leading-none tracking-[-0.03em]">
                      75<span className="text-[28px] sm:text-[36px] text-rm-burgundy">%</span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-rm-inkSoft mt-1 tracking-[0.12em] uppercase">
                      Conformité estimée
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-[18px] sm:text-[22px] text-rm-teal mb-1">
                      Partiellement conforme
                    </div>
                    <p className="font-serif text-[13px] sm:text-[14px] text-rm-inkSoft leading-[1.6]">
                      Déclaration initiale, basée sur une auto-évaluation. Un
                      audit externe RGAA 4.1 sera réalisé en 2026.
                    </p>
                  </div>
                </div>

                <p>
                  Ce taux provisoire est une estimation issue d&apos;une
                  auto-évaluation menée sur un échantillon représentatif de
                  pages (accueil, liste d&apos;articles, article, fiche produit,
                  formulaires, pages institutionnelles). Il sera confirmé ou
                  ajusté par l&apos;audit externe prévu en 2026.
                </p>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="technologies" num={3} title="Technologies supportées">
                <p className="mb-4">
                  Le site a été testé avec les combinaisons suivantes de
                  technologies d&apos;assistance et de navigateurs :
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2">
                  {TECHNOLOGIES.map((t) => (
                    <div
                      key={t.label}
                      className="border border-rm-rule bg-rm-paper px-5 py-4"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="block w-2.5 h-2.5 rounded-full bg-rm-teal" />
                        <div className="font-display text-[18px] text-rm-teal font-normal">
                          {t.label}
                        </div>
                      </div>
                      <p className="font-serif text-[14px] leading-[1.55] text-rm-inkSoft">
                        {t.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="derogations" num={4} title="Dérogations et limitations connues">
                <p className="mb-4">
                  Malgré nos efforts, certains contenus et fonctionnalités du
                  site ne sont pas encore pleinement accessibles. Les principaux
                  écarts identifiés à ce jour sont les suivants :
                </p>
                <ol className="list-decimal pl-6 space-y-4">
                  {DEROGATIONS.map((d) => (
                    <li key={d.title}>
                      <strong className="block text-rm-teal mb-1">
                        {d.title}
                      </strong>
                      <span className="font-serif text-[15px] leading-[1.7] text-rm-inkSoft">
                        {d.description}
                      </span>
                    </li>
                  ))}
                </ol>
                <LegalBox>
                  Ces écarts font l&apos;objet d&apos;un plan de mise en
                  accessibilité priorisé. Des correctifs sont déployés au fil
                  des mises à jour du site.
                </LegalBox>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="signaler" num={5} title="Signaler un problème d'accessibilité">
                <p className="mb-4">
                  Si vous rencontrez un défaut d&apos;accessibilité vous
                  empêchant d&apos;accéder à un contenu ou à une fonctionnalité
                  du site, n&apos;hésitez pas à nous le signaler. Nous nous
                  engageons à vous répondre et, si nécessaire, à vous orienter
                  vers une alternative accessible.
                </p>
                <ul className="list-none pl-0 space-y-1 mb-4">
                  <li>
                    <strong>Email dédié</strong> :{' '}
                    <a
                      href="mailto:accessibilite@remedes-mamie.com"
                      className={linkClass}
                    >
                      accessibilite@remedes-mamie.com
                    </a>
                  </li>
                  <li>
                    <strong>Email général</strong> :{' '}
                    <a
                      href="mailto:contact@remedes-mamie.com"
                      className={linkClass}
                    >
                      contact@remedes-mamie.com
                    </a>
                  </li>
                  <li>
                    <strong>Formulaire de contact</strong> :{' '}
                    <Link href={`/${locale}/contact`} className={linkClass}>
                      www.remedes-mamie.com/contact
                    </Link>
                  </li>
                </ul>
                <p className="mb-1">
                  <strong>Adresse postale</strong> :
                </p>
                <p className="mb-1">SAS CALEBASSE — Les Remèdes de Mamie</p>
                <p className="mb-1">15 rue de la Vistule</p>
                <p className="mb-4">75013 Paris, France</p>
                <LegalBox>
                  <strong>Réponse sous 5 jours ouvrés.</strong> Merci de décrire
                  le problème rencontré, la page concernée (URL) et, si
                  possible, la technologie d&apos;assistance utilisée.
                </LegalBox>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="recours" num={6} title="Voies de recours">
                <p className="mb-4">
                  Si vous constatez un défaut d&apos;accessibilité vous
                  empêchant d&apos;accéder à un contenu ou un service du site,
                  que vous nous l&apos;avez signalé et que vous n&apos;avez pas
                  obtenu de réponse satisfaisante, vous pouvez saisir le
                  <strong> Défenseur des droits</strong>.
                </p>
                <p className="mb-3">Plusieurs moyens sont à votre disposition :</p>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>
                    Formulaire en ligne :{' '}
                    <a
                      href="https://formulaire.defenseurdesdroits.fr/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      formulaire.defenseurdesdroits.fr
                    </a>
                  </li>
                  <li>
                    Liste des délégués territoriaux :{' '}
                    <a
                      href="https://www.defenseurdesdroits.fr/saisir/delegues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      defenseurdesdroits.fr/saisir/delegues
                    </a>
                  </li>
                  <li>
                    Téléphone :{' '}
                    <a href="tel:+33969390000" className={linkClass}>
                      09 69 39 00 00
                    </a>{' '}
                    (du lundi au vendredi, 9 h – 18 h)
                  </li>
                  <li>
                    Courrier (gratuit, sans affranchissement) : Défenseur des
                    droits — Libre réponse 71120 — 75342 Paris CEDEX 07
                  </li>
                </ul>
                <p>
                  Pour plus d&apos;informations, consultez le site officiel :{' '}
                  <a
                    href="https://www.defenseurdesdroits.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    www.defenseurdesdroits.fr
                  </a>
                  .
                </p>
              </LegalSection>
            </Reveal>
          </LegalBody>
        </div>
      </div>
    </main>
  )
}
