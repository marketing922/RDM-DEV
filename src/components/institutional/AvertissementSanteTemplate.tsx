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
  { id: 'objet', label: 'Objet du site' },
  { id: 'consultation', label: 'Consultation d’un professionnel' },
  { id: 'complements', label: 'Compléments alimentaires' },
  { id: 'allegations', label: 'Allégations de santé' },
  { id: 'responsabilite', label: 'Limitation de responsabilité' },
  { id: 'urgence', label: 'En cas d’urgence' },
  { id: 'contact', label: 'Contact' },
]

export default function AvertissementSanteTemplate({ locale, homeLabel }: Props) {
  const linkClass =
    'text-rm-burgundy underline decoration-rm-rule underline-offset-[3px] hover:decoration-rm-burgundy transition-colors'

  return (
    <main className="min-h-screen bg-rm-cream text-rm-ink font-sans">
      <InstitBreadcrumb
        crumbs={[
          { label: homeLabel, href: `/${locale}` },
          { label: 'Avertissement santé' },
        ]}
        locale={locale}
      />

      <InstitHeader
        chapter="Santé"
        title="Avertissement"
        sub="santé."
        intro="Les informations présentes sur ce site sont fournies à titre informatif et éducatif. Elles ne se substituent en aucun cas à un avis médical personnalisé."
      />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14 md:py-20 pb-16 sm:pb-20 md:pb-24 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 sm:gap-8 lg:gap-12">
        <aside>
          <LegalTOC items={TOC_ITEMS} />
        </aside>

        <div>
          <LegalMeta version="1.0" updated="avril 2026" />

          <LegalBody>
            <Reveal>
              <LegalSection id="objet" num={1} title="Objet du site">
                <p className="mb-4">
                  Le site www.remedes-mamie.com, édité par SAS CALEBASSE sous la
                  marque <strong>Les Remèdes de Mamie</strong>, propose des
                  informations relatives aux plantes, aux compléments alimentaires et
                  au bien-être naturel.
                </p>
                <p className="mb-4">
                  Ces informations sont fournies{' '}
                  <strong>à titre purement informatif et éducatif</strong>. Elles sont
                  issues de la littérature scientifique, de la tradition herboriste et
                  de sources documentées, mais ne constituent en aucun cas :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>un diagnostic médical</li>
                  <li>une prescription médicale</li>
                  <li>une recommandation de traitement</li>
                  <li>un avis médical personnalisé</li>
                </ul>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection
                id="consultation"
                num={2}
                title="Consultation d'un professionnel de santé"
              >
                <p className="mb-4">
                  <strong>
                    Nous vous recommandons vivement de consulter un professionnel de
                    santé qualifié
                  </strong>{' '}
                  (médecin, pharmacien, sage-femme) avant toute utilisation de plantes
                  médicinales ou de compléments alimentaires, et notamment si vous :
                </p>
                <ul className="pl-0 mb-4 space-y-2 list-none">
                  {[
                    'êtes enceinte ou allaitez',
                    'suivez un traitement médical',
                    'souffrez d’une maladie chronique (diabète, hypertension, troubles cardiaques, etc.)',
                    'prenez des médicaments sur ordonnance',
                    'présentez des allergies connues',
                    'envisagez un usage pour un enfant de moins de 18 ans',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-[10px] h-[6px] w-[6px] shrink-0 rounded-full bg-rm-burgundy"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  Les plantes et compléments alimentaires peuvent interagir avec
                  certains médicaments ou être contre-indiqués dans certaines
                  situations. Seul un professionnel de santé est habilité à vous
                  conseiller de manière personnalisée.
                </p>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="complements" num={3} title="Compléments alimentaires">
                <p className="mb-4">
                  Les compléments alimentaires commercialisés sur ce site sont
                  conformes à la réglementation française et européenne en vigueur
                  (Décret n°&nbsp;2006-352 du 20 mars 2006).
                </p>
                <p className="mb-4">Conformément à la réglementation :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Les compléments alimentaires{' '}
                    <strong>ne doivent pas être utilisés comme substituts</strong>{' '}
                    d&apos;un régime alimentaire varié et équilibré et d&apos;un mode
                    de vie sain.
                  </li>
                  <li>
                    <strong>Ne pas dépasser la dose journalière recommandée</strong>{' '}
                    indiquée sur l&apos;emballage du produit.
                  </li>
                  <li>
                    <strong>Tenir hors de portée des jeunes enfants.</strong>
                  </li>
                  <li>
                    Conserver dans un endroit frais et sec, à l&apos;abri de la
                    lumière.
                  </li>
                </ul>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="allegations" num={4} title="Allégations de santé">
                <p className="mb-4">
                  Les informations présentes sur ce site respectent le Règlement (CE)
                  n°&nbsp;1924/2006 relatif aux allégations nutritionnelles et de
                  santé. Seules les allégations autorisées par la Commission
                  européenne et validées par l&apos;Autorité Européenne de Sécurité
                  des Aliments (EFSA) sont utilisées.
                </p>
                <p>
                  Aucune information présente sur ce site ne prétend que nos produits
                  permettent de prévenir, traiter ou guérir une maladie.
                </p>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection
                id="responsabilite"
                num={5}
                title="Limitation de responsabilité"
              >
                <p className="mb-4">
                  SAS CALEBASSE met tout en œuvre pour fournir des informations
                  exactes et à jour. Toutefois, nous ne pouvons garantir l&apos;absence
                  d&apos;erreurs ou d&apos;omissions.
                </p>
                <p className="mb-4">
                  SAS CALEBASSE <strong>décline toute responsabilité</strong> :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    quant à l&apos;utilisation qui pourrait être faite des
                    informations contenues sur ce site
                  </li>
                  <li>
                    en cas d&apos;automédication pratiquée sur la base des
                    informations du site
                  </li>
                  <li>
                    pour tout dommage direct ou indirect résultant de l&apos;utilisation
                    des informations ou produits
                  </li>
                </ul>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="urgence" num={6} title="En cas d'urgence">
                <p className="mb-4">
                  En cas de symptômes graves, de réaction allergique, d&apos;ingestion
                  accidentelle ou de tout problème de santé urgent :
                </p>
                <LegalBox tone="warn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 not-italic">
                    <div className="flex items-baseline gap-3 bg-rm-paper border border-rm-rule px-4 py-3">
                      <span className="font-sans text-[11px] tracking-[0.2em] uppercase text-rm-inkSoft">
                        SAMU
                      </span>
                      <span className="font-mono text-[20px] text-rm-burgundy font-bold ml-auto">
                        15
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 bg-rm-paper border border-rm-rule px-4 py-3">
                      <span className="font-sans text-[11px] tracking-[0.2em] uppercase text-rm-inkSoft">
                        Pompiers
                      </span>
                      <span className="font-mono text-[20px] text-rm-burgundy font-bold ml-auto">
                        18
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 bg-rm-paper border border-rm-rule px-4 py-3">
                      <span className="font-sans text-[11px] tracking-[0.2em] uppercase text-rm-inkSoft">
                        Urgence européenne
                      </span>
                      <span className="font-mono text-[20px] text-rm-burgundy font-bold ml-auto">
                        112
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 bg-rm-paper border border-rm-rule px-4 py-3">
                      <span className="font-sans text-[11px] tracking-[0.2em] uppercase text-rm-inkSoft">
                        Centre antipoison
                      </span>
                      <span className="font-serif text-[12px] text-rm-inkSoft ml-auto text-right">
                        consultez le centre de votre région
                      </span>
                    </div>
                  </div>
                </LegalBox>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="contact" num={7} title="Contact">
                <p className="mb-4">
                  Pour toute question relative à nos produits ou aux informations
                  présentes sur ce site :
                </p>
                <ul className="list-none pl-0 space-y-1">
                  <li>
                    <strong>Email</strong> :{' '}
                    <a href="mailto:contact@remedes-mamie.com" className={linkClass}>
                      contact@remedes-mamie.com
                    </a>
                  </li>
                  <li>
                    <strong>Téléphone</strong> : 01 45 85 88 00
                  </li>
                  <li>
                    <strong>Formulaire</strong> :{' '}
                    <Link href={`/${locale}/contact`} className={linkClass}>
                      nous contacter
                    </Link>
                  </li>
                </ul>
              </LegalSection>
            </Reveal>
          </LegalBody>
        </div>
      </div>
    </main>
  )
}
