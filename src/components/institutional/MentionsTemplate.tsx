import React from 'react'
import Link from 'next/link'
import { InstitBreadcrumb, InstitHeader } from '@/components/institutional/primitives'
import {
  LegalTOC,
  LegalMeta,
  LegalSection,
  LegalBody,
} from '@/components/institutional/legal/LegalPrimitives'
import Reveal from '@/components/ui/Reveal'

type Props = {
  locale: string
  homeLabel: string
}

const TOC_ITEMS = [
  { id: 'editeur', label: 'Éditeur du site' },
  { id: 'coordonnees', label: 'Coordonnées' },
  { id: 'directeur', label: 'Directeur de la publication' },
  { id: 'hebergeur', label: 'Hébergeur' },
  { id: 'ip', label: 'Propriété intellectuelle' },
  { id: 'donnees', label: 'Données personnelles' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'credits', label: 'Crédits' },
  { id: 'responsabilite', label: 'Limitation de responsabilité' },
  { id: 'droit', label: 'Droit applicable et juridiction' },
]

export default function MentionsTemplate({ locale, homeLabel }: Props) {
  const linkClass =
    'text-rm-burgundy underline decoration-rm-rule underline-offset-[3px] hover:decoration-rm-burgundy transition-colors'

  return (
    <main className="min-h-screen bg-rm-cream text-rm-ink font-sans">
      <InstitBreadcrumb
        crumbs={[
          { label: homeLabel, href: `/${locale}` },
          { label: 'Mentions légales' },
        ]}
        locale={locale}
      />

      <InstitHeader
        chapter="Informations légales"
        title="Mentions"
        sub="légales."
        intro="Identité de l'éditeur, hébergeur, propriété intellectuelle et conditions d'utilisation du site www.remedes-mamie.com."
      />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14 md:py-20 pb-16 sm:pb-20 md:pb-24 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 sm:gap-8 lg:gap-12">
        <aside>
          <LegalTOC items={TOC_ITEMS} />
        </aside>

        <div>
          <LegalMeta version="2.1" updated="avril 2026" />

          <LegalBody>
            <Reveal>
              <LegalSection id="editeur" num={1} title="Éditeur du site">
                <p className="mb-4">
                  Le site internet <strong>www.remedes-mamie.com</strong> est édité par :
                </p>
                <p className="mb-1">
                  <strong>SAS CALEBASSE</strong>
                </p>
                <p className="mb-1">
                  Société par Actions Simplifiée au capital de 10 000 euros
                </p>
                <p className="mb-1">
                  Siège social : 15 rue de la Vistule, 75013 Paris, France
                </p>
                <p className="mb-1">
                  Immatriculée au Registre du Commerce et des Sociétés de Paris sous
                  le numéro <strong>B 415 228 311</strong>
                </p>
                <p className="mb-4">
                  Numéro de TVA intracommunautaire : <strong>FR81415228311</strong>
                </p>
                <p>
                  Le site www.remedes-mamie.com est exploité sous la marque
                  commerciale <strong>Les Remèdes de Mamie</strong>.
                </p>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="coordonnees" num={2} title="Coordonnées">
                <ul className="list-none pl-0 mb-4 space-y-1">
                  <li>
                    <strong>Téléphone</strong> : 01 45 85 88 00 (prix d&apos;un appel
                    local)
                  </li>
                  <li>
                    <strong>Email</strong> :{' '}
                    <a href="mailto:contact@remedes-mamie.com" className={linkClass}>
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
                <p className="mb-1">Les Remèdes de Mamie</p>
                <p className="mb-1">58 rue Etienne Dolet</p>
                <p className="mb-1">92240 Malakoff</p>
                <p>France</p>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="directeur" num={3} title="Directeur de la publication">
                <p>
                  Monsieur <strong>Ruosi WU</strong>, en qualité de Président de la
                  société SAS CALEBASSE.
                </p>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="hebergeur" num={4} title="Hébergeur">
                <p className="mb-4">
                  Le site www.remedes-mamie.com est hébergé par :
                </p>
                <p className="mb-1">
                  <strong>Vercel Inc.</strong>
                </p>
                <p className="mb-1">340 S Lemon Ave #4133</p>
                <p className="mb-1">Walnut, CA 91789</p>
                <p className="mb-4">États-Unis</p>
                <ul className="list-none pl-0 space-y-1">
                  <li>
                    Site web :{' '}
                    <a
                      href="https://vercel.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      vercel.com
                    </a>
                  </li>
                  <li>
                    Contact :{' '}
                    <a
                      href="https://vercel.com/contact"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      vercel.com/contact
                    </a>
                  </li>
                </ul>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="ip" num={5} title="Propriété intellectuelle">
                <p className="mb-4">
                  L&apos;ensemble des éléments composant le site www.remedes-mamie.com,
                  notamment mais non limitativement :
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>les textes, articles et contenus rédactionnels</li>
                  <li>les photographies, illustrations et éléments graphiques</li>
                  <li>la marque «&nbsp;Les Remèdes de Mamie&nbsp;» et le logo associé</li>
                  <li>la structure générale du site et son design</li>
                  <li>les bases de données</li>
                </ul>
                <p className="mb-4">
                  sont la propriété exclusive de SAS CALEBASSE ou font l&apos;objet
                  d&apos;une autorisation d&apos;utilisation.
                </p>
                <p className="mb-4">
                  Toute reproduction, représentation, modification, publication,
                  adaptation ou exploitation de tout ou partie des éléments du site,
                  quel que soit le moyen ou le procédé utilisé, est interdite sans
                  l&apos;autorisation écrite préalable de SAS CALEBASSE.
                </p>
                <p>
                  Toute exploitation non autorisée du site ou de l&apos;un quelconque
                  des éléments qu&apos;il contient sera considérée comme constitutive
                  d&apos;une contrefaçon et poursuivie conformément aux dispositions
                  des articles L.335-2 et suivants du Code de la Propriété
                  Intellectuelle.
                </p>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="donnees" num={6} title="Données personnelles">
                <p className="mb-4">
                  Les informations concernant la collecte et le traitement des données
                  personnelles sont détaillées dans notre{' '}
                  <Link
                    href={`/${locale}/politique-confidentialite`}
                    className={linkClass}
                  >
                    Politique de Confidentialité
                  </Link>
                  .
                </p>
                <p>
                  Conformément au Règlement Général sur la Protection des Données
                  (RGPD) et à la loi Informatique et Libertés, vous disposez de droits
                  sur vos données personnelles. Pour exercer ces droits, vous pouvez
                  nous contacter à l&apos;adresse :{' '}
                  <a href="mailto:contact@remedes-mamie.com" className={linkClass}>
                    contact@remedes-mamie.com
                  </a>
                </p>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="cookies" num={7} title="Cookies">
                <p>
                  Des cookies peuvent être déposés sur votre terminal lors de votre
                  navigation sur le site. Pour en savoir plus sur l&apos;utilisation
                  des cookies et la gestion de vos préférences, consultez notre{' '}
                  <Link href={`/${locale}/politique-cookies`} className={linkClass}>
                    Politique de Cookies
                  </Link>
                  .
                </p>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="credits" num={8} title="Crédits">
                <ul className="list-none pl-0 space-y-1">
                  <li>Développement : SAS CALEBASSE</li>
                  <li>
                    Photographies : SAS CALEBASSE et banques d&apos;images sous
                    licence
                  </li>
                </ul>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection
                id="responsabilite"
                num={9}
                title="Limitation de responsabilité"
              >
                <p className="mb-4">
                  Les informations contenues sur ce site sont présentées à titre
                  indicatif et sont susceptibles d&apos;évoluer. SAS CALEBASSE ne
                  saurait garantir l&apos;exactitude, la complétude ou l&apos;actualité
                  des informations diffusées sur le site.
                </p>
                <p className="mb-4">
                  SAS CALEBASSE ne pourra être tenue responsable des dommages directs
                  ou indirects pouvant résulter de l&apos;accès ou de l&apos;utilisation
                  du site, y compris l&apos;inaccessibilité, les pertes de données,
                  détériorations, destructions ou virus qui pourraient affecter
                  l&apos;équipement informatique de l&apos;utilisateur.
                </p>
                <p>
                  Les liens hypertextes présents sur le site et renvoyant vers des
                  sites tiers sont fournis à titre d&apos;information. SAS CALEBASSE
                  n&apos;exerce aucun contrôle sur ces sites et décline toute
                  responsabilité quant à leur contenu.
                </p>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection
                id="droit"
                num={10}
                title="Droit applicable et juridiction compétente"
              >
                <p className="mb-4">
                  Les présentes mentions légales sont régies par le droit français.
                </p>
                <p>
                  En cas de litige relatif à l&apos;interprétation ou à
                  l&apos;exécution des présentes, et à défaut de résolution amiable,
                  compétence expresse est attribuée aux tribunaux compétents de Paris,
                  nonobstant pluralité de défendeurs ou appel en garantie.
                </p>
              </LegalSection>
            </Reveal>
          </LegalBody>
        </div>
      </div>
    </main>
  )
}
