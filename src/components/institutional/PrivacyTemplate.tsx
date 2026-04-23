import React from 'react'
import Link from 'next/link'
import {
  InstitBreadcrumb,
  InstitHeader,
} from '@/components/institutional/primitives'
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

const TOC_ITEMS: Array<{ id: string; label: string }> = [
  { id: 'preambule', label: 'Préambule' },
  { id: 'definitions', label: 'Définitions' },
  { id: 'donnees-categories', label: 'Catégories de données collectées' },
  { id: 'bases-legales', label: 'Bases légales des traitements' },
  { id: 'finalites', label: 'Finalités des traitements' },
  { id: 'conservation', label: 'Durée de conservation' },
  { id: 'destinataires', label: 'Destinataires des données' },
  { id: 'transferts', label: 'Transferts hors Union Européenne' },
  { id: 'droits', label: 'Vos droits' },
  { id: 'sites-tiers', label: 'Sites tiers' },
  { id: 'securite', label: 'Sécurité' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'modification', label: 'Modification de la politique' },
]

// ── Sous-composant : ligne de la grille "Catégories de données"
function DataRow({
  category,
  items,
  duration,
}: {
  category: string
  items: string
  duration: string
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-3 md:gap-6 py-3 border-b border-rm-rule last:border-b-0">
      <div className="font-sans text-[12px] uppercase tracking-[0.1em] text-rm-burgundy md:pt-0.5">
        {category}
      </div>
      <div className="font-serif text-[14px] leading-[1.6] text-rm-ink">
        {items}
      </div>
      <div className="font-mono text-[12px] text-rm-inkSoft md:pt-1">
        {duration}
      </div>
    </div>
  )
}

// ── Sous-composant : carte de droit RGPD
function RightCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="border border-rm-rule bg-rm-paper p-4">
      <div className="font-display text-[17px] text-rm-teal leading-[1.2] mb-1.5 tracking-[-0.005em]">
        {title}
      </div>
      <p className="font-serif text-[13.5px] leading-[1.55] text-rm-inkSoft m-0">
        {description}
      </p>
    </div>
  )
}

const RIGHTS: Array<{ title: string; description: string }> = [
  {
    title: 'Droit d’accès',
    description:
      'Obtenir des informations sur l’existence et les modalités du traitement de vos données, ainsi qu’une copie de ces données.',
  },
  {
    title: 'Droit de rectification',
    description:
      'Demander la correction de vos données personnelles si elles sont inexactes ou incomplètes.',
  },
  {
    title: 'Droit d’opposition',
    description:
      'Vous opposer, pour des raisons tenant à votre situation particulière, au traitement fondé sur l’intérêt légitime.',
  },
  {
    title: 'Droit à l’effacement',
    description:
      'Demander l’effacement de vos données (« droit à l’oubli »), sous réserve des obligations légales de conservation.',
  },
  {
    title: 'Droit à la limitation',
    description:
      'Obtenir la limitation du traitement de vos données dans certaines situations prévues par le RGPD.',
  },
  {
    title: 'Droit à la portabilité',
    description:
      'Recevoir vos données dans un format structuré, couramment utilisé et lisible par machine.',
  },
  {
    title: 'Droit de retrait du consentement',
    description:
      'Retirer à tout moment votre consentement, sans que cela n’affecte la licéité du traitement antérieur.',
  },
  {
    title: 'Directives post-mortem',
    description:
      'Définir des directives relatives à la conservation, à l’effacement et à la communication de vos données après votre décès.',
  },
  {
    title: 'Réclamation CNIL',
    description:
      'Introduire une réclamation auprès de la CNIL — cnil.fr — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.',
  },
]

export default function PrivacyTemplate({ locale, homeLabel }: Props) {
  return (
    <main className="min-h-screen bg-rm-cream text-rm-ink font-sans">
      <InstitBreadcrumb
        crumbs={[
          { label: homeLabel, href: `/${locale}` },
          { label: 'Politique de confidentialité' },
        ]}
        locale={locale}
      />

      <InstitHeader
        chapter="RGPD"
        title="Politique de"
        sub="confidentialité."
        intro="SAS CALEBASSE respecte la réglementation (UE) 2016/679 RGPD et la loi Informatique & Libertés du 6 janvier 1978 modifiée."
      />

      <div className="max-w-[1040px] mx-auto px-6 md:px-10 py-16 md:py-20 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 lg:gap-14">
          {/* ── Sommaire latéral ── */}
          <aside className="hidden lg:block">
            <LegalTOC items={TOC_ITEMS} />
          </aside>

          {/* ── Corps légal ── */}
          <Reveal>
            <LegalBody>
              <LegalMeta version="1.0" updated="avril 2026" />

              <LegalBox tone="info">
                Cette politique respecte le Règlement Général sur la Protection
                des Données (UE) 2016/679 et la loi Informatique & Libertés du
                6 janvier 1978 modifiée.
              </LegalBox>

              {/* ─────── § 01 · Préambule ─────── */}
              <LegalSection id="preambule" num={1} title="Préambule">
                <p className="mb-4">
                  La société{' '}
                  <strong className="text-rm-burgundy">SAS CALEBASSE</strong>,
                  société par actions simplifiée au capital de 10 000 euros,
                  dont le siège social est situé au 15 rue de la Vistule, 75013
                  Paris, immatriculée au Registre du Commerce et des Sociétés
                  de Paris sous le numéro 415 228 311, exploite le site
                  www.remedes-mamie.com sous la marque commerciale{' '}
                  <strong className="text-rm-burgundy">
                    Les Remèdes de Mamie
                  </strong>
                  .
                </p>
                <p className="mb-4">
                  SAS CALEBASSE s’engage à respecter la législation française
                  et européenne en vigueur (Règlement UE 2016/679 du 27 avril
                  2016, dit «&nbsp;RGPD&nbsp;», et loi n°&nbsp;78-17 du 6
                  janvier 1978, dite «&nbsp;loi Informatique et Libertés&nbsp;»)
                  et à assurer la protection, la confidentialité et la sécurité
                  des données à caractère personnel des utilisateurs de son
                  site.
                </p>
                <p>
                  La présente Politique de Confidentialité a pour objet de vous
                  informer sur la manière dont nous collectons et traitons vos
                  données personnelles.
                </p>
              </LegalSection>

              {/* ─────── § 02 · Définitions ─────── */}
              <LegalSection id="definitions" num={2} title="Définitions">
                <dl className="space-y-3.5">
                  <div>
                    <dt className="font-semibold text-rm-burgundy">
                      Donnée à caractère personnel
                    </dt>
                    <dd>
                      Toute information se rapportant à une personne physique
                      identifiée ou identifiable, directement ou
                      indirectement.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-rm-burgundy">
                      Donnée de santé
                    </dt>
                    <dd>
                      Toute information relative à la santé physique ou mentale
                      d’une personne, y compris les prescriptions émanant de
                      thérapeutes transmises volontairement par les personnes
                      concernées.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-rm-burgundy">
                      Traitement
                    </dt>
                    <dd>
                      Toute opération appliquée à des données personnelles
                      (collecte, enregistrement, organisation, conservation,
                      modification, extraction, consultation, utilisation,
                      transmission, diffusion, effacement…).
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-rm-burgundy">
                      Personne concernée
                    </dt>
                    <dd>
                      Toute personne physique identifiée ou identifiable dont
                      SAS CALEBASSE traite les données personnelles.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-rm-burgundy">
                      Responsable de traitement
                    </dt>
                    <dd>
                      SAS CALEBASSE, qui détermine les finalités et les moyens
                      du traitement.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-rm-burgundy">
                      Sous-traitant
                    </dt>
                    <dd>
                      Toute entité traitant des données personnelles pour le
                      compte du responsable de traitement.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-rm-burgundy">Site</dt>
                    <dd>
                      Le site internet https://www.remedes-mamie.com/ édité par
                      SAS CALEBASSE.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-rm-burgundy">Cookie</dt>
                    <dd>
                      Traceur permettant d’accéder à des informations stockées
                      dans l’équipement terminal d’un visiteur.
                    </dd>
                  </div>
                </dl>
              </LegalSection>

              {/* ─────── § 03 · Catégories de données ─────── */}
              <LegalSection
                id="donnees-categories"
                num={3}
                title="Catégories de données collectées"
              >
                <p className="mb-5">
                  Selon votre parcours sur le site, SAS CALEBASSE collecte les
                  catégories de données suivantes :
                </p>

                <div className="border-t border-rm-ruleStrong mt-2 mb-6">
                  {/* En-tête de grille */}
                  <div className="hidden md:grid grid-cols-[1fr_2fr_1fr] gap-6 py-2.5 border-b border-rm-ruleStrong font-mono text-[10px] tracking-[0.18em] text-rm-burgundy uppercase">
                    <div>Catégorie</div>
                    <div>Données</div>
                    <div>Durée / nature</div>
                  </div>

                  <DataRow
                    category="Navigation"
                    items="Données de connexion et de mesure d’audience via les cookies ; données relatives au terminal (type de navigateur, système d’exploitation, applications, plugins)."
                    duration="12 mois max."
                  />
                  <DataRow
                    category="Compte"
                    items="Données d’identification (nom, prénom, civilité) et de contact (email, adresse postale, téléphone) fournies à la création du compte."
                    duration="Durée du contrat"
                  />
                  <DataRow
                    category="Commandes"
                    items="Données bancaires et de facturation (traitées via Stripe), numéro de commande, produits, codes promotionnels, historique et réclamations."
                    duration="Contrat + prescription"
                  />
                  <DataRow
                    category="Newsletter"
                    items="Adresse email, préférences et consentement (gérés via Brevo). Aucune donnée sensible n’est traitée à cette fin."
                    duration="3 ans / dernier contact"
                  />
                  <DataRow
                    category="Devis / demandes"
                    items="Données d’identification et de contact. Données de santé uniquement si transmises volontairement par la personne concernée."
                    duration="3 ans / dernier contact"
                  />
                </div>

                <LegalBox tone="warn">
                  <strong className="not-italic">Important —</strong> SAS
                  CALEBASSE ne sollicite jamais la transmission de données de
                  santé. Si vous choisissez de nous communiquer de telles
                  informations, vous le faites de votre propre initiative.
                </LegalBox>
              </LegalSection>

              {/* ─────── § 04 · Bases légales ─────── */}
              <LegalSection
                id="bases-legales"
                num={4}
                title="Bases légales des traitements"
              >
                <p className="mb-4">
                  SAS CALEBASSE ne traite vos données personnelles que lorsque :
                </p>
                <ul className="list-none m-0 p-0 space-y-3">
                  <li className="pl-4 border-l-2 border-rm-burgundy">
                    Vous avez donné votre{' '}
                    <strong className="text-rm-burgundy">consentement</strong>{' '}
                    libre, spécifique, éclairé et univoque.
                  </li>
                  <li className="pl-4 border-l-2 border-rm-burgundy">
                    Le traitement est nécessaire à l’
                    <strong className="text-rm-burgundy">
                      exécution d’un contrat
                    </strong>{' '}
                    auquel vous êtes partie ou à des mesures précontractuelles.
                  </li>
                  <li className="pl-4 border-l-2 border-rm-burgundy">
                    Le traitement est nécessaire au respect d’une{' '}
                    <strong className="text-rm-burgundy">
                      obligation légale
                    </strong>{' '}
                    à laquelle SAS CALEBASSE est soumise.
                  </li>
                  <li className="pl-4 border-l-2 border-rm-burgundy">
                    Le traitement est nécessaire aux fins des{' '}
                    <strong className="text-rm-burgundy">
                      intérêts légitimes
                    </strong>{' '}
                    poursuivis par SAS CALEBASSE.
                  </li>
                </ul>
              </LegalSection>

              {/* ─────── § 05 · Finalités ─────── */}
              <LegalSection
                id="finalites"
                num={5}
                title="Finalités des traitements"
              >
                <p className="mb-4">
                  Vos données personnelles sont collectées et traitées pour les
                  finalités suivantes :
                </p>
                <ul className="list-disc pl-5 space-y-1.5 mb-5">
                  <li>Fourniture et amélioration du contenu du site.</li>
                  <li>Création et gestion de votre compte personnel.</li>
                  <li>
                    Établissement de statistiques, notamment de fréquentation
                    du site.
                  </li>
                  <li>
                    Opérations de communication et de prospection commerciale.
                  </li>
                  <li>Gestion des demandes d’information ou de devis.</li>
                  <li>
                    Suivi des commandes et gestion de la relation
                    contractuelle.
                  </li>
                  <li>
                    Envoi des emails transactionnels (confirmation de commande,
                    expédition, etc.).
                  </li>
                  <li>
                    Respect de nos obligations légales (facturation,
                    comptabilité).
                  </li>
                </ul>
                <p>
                  Pour les commandes, certaines données sont obligatoires pour
                  l’exécution du contrat et la livraison des produits. Leur
                  non-fourniture empêche la finalisation de la commande.
                </p>
              </LegalSection>

              {/* ─────── § 06 · Durée de conservation ─────── */}
              <LegalSection
                id="conservation"
                num={6}
                title="Durée de conservation"
              >
                <p className="mb-5">
                  Les données sont conservées pour des durées strictement
                  nécessaires aux finalités poursuivies :
                </p>
                <div className="border-t border-rm-ruleStrong mt-2 mb-2">
                  <div className="hidden md:grid grid-cols-[1fr_2fr_1fr] gap-6 py-2.5 border-b border-rm-ruleStrong font-mono text-[10px] tracking-[0.18em] text-rm-burgundy uppercase">
                    <div>Finalité</div>
                    <div>Base légale / données</div>
                    <div>Durée</div>
                  </div>
                  <DataRow
                    category="Statistiques"
                    items="Adresse IP, pages consultées, données de connexion — consentement."
                    duration="12 mois max."
                  />
                  <DataRow
                    category="Prospection"
                    items="Données d’identification et de contact — consentement."
                    duration="3 ans / dernier contact"
                  />
                  <DataRow
                    category="Prospects"
                    items="Formulaires, emails, devis — mesures précontractuelles."
                    duration="3 ans / dernier contact"
                  />
                  <DataRow
                    category="Relation client"
                    items="Identification, contact, données bancaires — exécution du contrat."
                    duration="Contrat + prescription"
                  />
                  <DataRow
                    category="Comptabilité"
                    items="Factures et pièces comptables — obligation légale."
                    duration="10 ans"
                  />
                </div>
              </LegalSection>

              {/* ─────── § 07 · Destinataires ─────── */}
              <LegalSection
                id="destinataires"
                num={7}
                title="Destinataires des données"
              >
                <p className="mb-4">
                  Seules les personnes ayant besoin d’accéder aux données dans
                  le cadre de leurs fonctions y ont accès :
                </p>
                <ul className="list-disc pl-5 space-y-1.5 mb-6">
                  <li>
                    Les partenaires et sous-traitants de SAS CALEBASSE
                    (prestataires informatiques, comptables, partenaires
                    financiers).
                  </li>
                  <li>Les employés habilités de SAS CALEBASSE.</li>
                  <li>
                    Les autorités administratives et judiciaires dans le cadre
                    du respect des obligations légales.
                  </li>
                </ul>

                <div className="font-mono text-[10px] tracking-[0.2em] text-rm-burgundy uppercase mb-3">
                  Sous-traitants principaux
                </div>
                <div className="border-t border-rm-ruleStrong">
                  <DataRow
                    category="Vercel Inc."
                    items="Hébergement du site."
                    duration="États-Unis"
                  />
                  <DataRow
                    category="Neon Inc."
                    items="Base de données."
                    duration="États-Unis"
                  />
                  <DataRow
                    category="Stripe Inc."
                    items="Paiement en ligne."
                    duration="États-Unis"
                  />
                  <DataRow
                    category="Brevo (Sendinblue)"
                    items="Envoi d’emails transactionnels et newsletter."
                    duration="France / UE"
                  />
                </div>
              </LegalSection>

              {/* ─────── § 08 · Transferts hors UE ─────── */}
              <LegalSection
                id="transferts"
                num={8}
                title="Transferts hors Union Européenne"
              >
                <p className="mb-4">
                  Certains de nos sous-traitants sont situés aux États-Unis.
                  Dans ce cas, nous nous assurons que des garanties appropriées
                  sont mises en place conformément à la réglementation
                  applicable :
                </p>
                <ul className="list-disc pl-5 space-y-1.5 mb-5">
                  <li>
                    Décision d’adéquation de la Commission européenne (
                    <em>EU-US Data Privacy Framework</em>).
                  </li>
                  <li>
                    Clauses contractuelles types de la Commission européenne.
                  </li>
                  <li>Autres garanties appropriées prévues par le RGPD.</li>
                </ul>
                <LegalBox tone="info">
                  Les données de santé éventuellement transmises ne font
                  l’objet d’aucun transfert hors de l’Union Européenne.
                </LegalBox>
              </LegalSection>

              {/* ─────── § 09 · Vos droits ─────── */}
              <LegalSection id="droits" num={9} title="Vos droits">
                <p className="mb-5">
                  Conformément au RGPD et à la loi Informatique et Libertés,
                  vous disposez des droits suivants concernant vos données
                  personnelles.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {RIGHTS.map((r) => (
                    <RightCard
                      key={r.title}
                      title={r.title}
                      description={r.description}
                    />
                  ))}
                </div>

                <div className="mt-8 mb-4">
                  <div className="font-mono text-[10px] tracking-[0.2em] text-rm-burgundy uppercase mb-2">
                    Exercer vos droits
                  </div>
                  <ul className="list-none m-0 p-0 space-y-2">
                    <li>
                      <strong className="text-rm-burgundy">Par email —</strong>{' '}
                      <a
                        href="mailto:contact@remedes-mamie.com"
                        className="text-rm-teal underline underline-offset-2 hover:text-rm-burgundy transition-colors"
                      >
                        contact@remedes-mamie.com
                      </a>
                    </li>
                    <li>
                      <strong className="text-rm-burgundy">
                        Par courrier —
                      </strong>{' '}
                      SAS CALEBASSE · 15 rue de la Vistule, 75013 Paris.
                    </li>
                    <li>
                      <strong className="text-rm-burgundy">DPO —</strong> à
                      désigner (externe mutualisé). En attendant, toute demande
                      relative à la protection des données peut être adressée
                      via{' '}
                      <a
                        href="mailto:contact@remedes-mamie.com"
                        className="text-rm-teal underline underline-offset-2 hover:text-rm-burgundy transition-colors"
                      >
                        contact@remedes-mamie.com
                      </a>
                      .
                    </li>
                  </ul>
                </div>

                <p className="mb-3">
                  SAS CALEBASSE s’engage à répondre dans un délai d’
                  <strong className="text-rm-burgundy">un (1) mois</strong> à
                  compter de la réception de la demande complète. Ce délai peut
                  être prolongé de{' '}
                  <strong className="text-rm-burgundy">deux (2) mois</strong>{' '}
                  en cas de demande complexe.
                </p>
                <p>
                  Une vérification d’identité pourra être demandée en cas de
                  doute raisonnable sur l’identité du demandeur. En cas de
                  difficulté, vous pouvez également introduire une réclamation
                  auprès de la CNIL —{' '}
                  <a
                    href="https://www.cnil.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rm-teal underline underline-offset-2 hover:text-rm-burgundy transition-colors"
                  >
                    cnil.fr
                  </a>
                  .
                </p>
              </LegalSection>

              {/* ─────── § 10 · Sites tiers ─────── */}
              <LegalSection id="sites-tiers" num={10} title="Sites tiers">
                <p className="mb-4">
                  Le site www.remedes-mamie.com peut contenir des liens vers
                  des sites tiers. SAS CALEBASSE ne contrôle pas la collecte et
                  le traitement de vos données par ces sites tiers et décline
                  toute responsabilité à cet égard.
                </p>
                <p>
                  Nous vous recommandons de consulter les politiques de
                  confidentialité et de cookies de ces sites tiers.
                </p>
              </LegalSection>

              {/* ─────── § 11 · Sécurité ─────── */}
              <LegalSection id="securite" num={11} title="Sécurité">
                <p className="mb-4">
                  SAS CALEBASSE met en œuvre toutes les mesures techniques et
                  organisationnelles nécessaires pour assurer la sécurité de
                  vos données personnelles et prévenir leur perte, destruction,
                  divulgation, intrusion ou accès non autorisé.
                </p>
                <p>
                  Nos sous-traitants sont sélectionnés avec soin et sont
                  contractuellement tenus de respecter les principes de
                  sécurité applicables.
                </p>
              </LegalSection>

              {/* ─────── § 12 · Cookies ─────── */}
              <LegalSection id="cookies" num={12} title="Cookies">
                <p>
                  Pour toute information relative aux cookies et traceurs
                  utilisés sur notre site, veuillez consulter notre{' '}
                  <Link
                    href={`/${locale}/politique-cookies`}
                    className="text-rm-teal underline underline-offset-2 hover:text-rm-burgundy transition-colors"
                  >
                    Politique de Cookies
                  </Link>
                  .
                </p>
              </LegalSection>

              {/* ─────── § 13 · Modification ─────── */}
              <LegalSection
                id="modification"
                num={13}
                title="Modification de la politique"
              >
                <p className="mb-4">
                  SAS CALEBASSE se réserve le droit de modifier la présente
                  Politique de Confidentialité. En cas de modification
                  substantielle, vous en serez informé par un bandeau sur le
                  site ou par email.
                </p>
                <p>
                  Nous vous invitons à consulter régulièrement cette page pour
                  prendre connaissance de toute mise à jour.
                </p>
              </LegalSection>

              {/* ─────── Pied de bas de page : navigation transverse ─────── */}
              <div className="mt-14 pt-8 border-t border-dashed border-rm-ruleStrong flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] text-rm-inkSoft">
                <Link
                  href={`/${locale}/mentions-legales`}
                  className="hover:text-rm-burgundy transition-colors"
                >
                  ↳ Mentions légales
                </Link>
                <Link
                  href={`/${locale}/politique-cookies`}
                  className="hover:text-rm-burgundy transition-colors"
                >
                  ↳ Politique de cookies
                </Link>
                <Link
                  href={`/${locale}/contact`}
                  className="hover:text-rm-burgundy transition-colors"
                >
                  ↳ Nous contacter
                </Link>
              </div>
            </LegalBody>
          </Reveal>
        </div>
      </div>
    </main>
  )
}
