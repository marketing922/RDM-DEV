import React from 'react'
import Link from 'next/link'
import Reveal from '@/components/ui/Reveal'
import { InstitBreadcrumb, InstitHeader } from './primitives'
import {
  LegalTOC,
  LegalMeta,
  LegalSection,
  LegalBox,
  LegalBody,
} from './legal/LegalPrimitives'

type Props = {
  locale: string
  homeLabel: string
}

const TOC_ITEMS: Array<{ id: string; label: string }> = [
  { id: 'preambule', label: 'Préambule' },
  { id: 'champ-application', label: "Champ d'application" },
  { id: 'produits', label: 'Produits' },
  { id: 'prix', label: 'Prix' },
  { id: 'commande', label: 'Commande' },
  { id: 'paiement', label: 'Paiement' },
  { id: 'reserve', label: 'Réserve de propriété' },
  { id: 'livraison', label: 'Livraison' },
  { id: 'retractation', label: 'Droit de rétractation' },
  { id: 'garanties', label: 'Garanties légales' },
  { id: 'responsabilite', label: 'Responsabilité' },
  { id: 'donnees', label: 'Données personnelles' },
  { id: 'ip', label: 'Propriété intellectuelle' },
  { id: 'service-client', label: 'Service client' },
  { id: 'mediation', label: 'Médiation' },
  { id: 'droit-applicable', label: 'Droit applicable' },
  { id: 'modification', label: 'Modification des CGV' },
  { id: 'formulaire-retractation', label: 'Annexe 1 — Formulaire' },
  { id: 'code-conso', label: 'Annexe 2 — Code conso.' },
  { id: 'code-civil', label: 'Annexe 3 — Code civil' },
]

export default function CGVTemplate({ locale, homeLabel }: Props) {
  const link = (href: string) =>
    href.startsWith('http') ? href : `/${locale}${href}`

  return (
    <main className="min-h-screen bg-rm-cream text-rm-ink font-sans">
      <InstitBreadcrumb
        crumbs={[
          { label: homeLabel, href: `/${locale}` },
          { label: 'Boutique' },
          { label: 'CGV' },
        ]}
        locale={locale}
      />

      <InstitHeader
        chapter="Boutique"
        title="Conditions"
        sub="générales de vente."
        intro="En vigueur à compter du 1er mai 2026. Régissent toute vente de produits Les Remèdes de Mamie."
      />

      <div className="max-w-[1040px] mx-auto px-6 md:px-10 py-16 md:py-20 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 lg:gap-14">
          {/* ── Sidebar TOC ── */}
          <aside>
            <LegalTOC items={TOC_ITEMS} />
          </aside>

          {/* ── Body ── */}
          <Reveal>
            <LegalBody>
              <LegalMeta version="1.0" updated="avril 2026" />

              {/* § 01 — Préambule */}
              <LegalSection id="preambule" num={1} title="Préambule">
                <p className="my-4">
                  Les présentes Conditions Générales de Vente (ci-après
                  «&nbsp;CGV&nbsp;») régissent les relations contractuelles
                  entre&nbsp;:
                </p>
                <p className="my-4">
                  <strong className="text-rm-teal">SAS CALEBASSE</strong>
                  <br />
                  Société par Actions Simplifiée au capital de 10 000 euros
                  <br />
                  Siège social&nbsp;: 15 rue de la Vistule, 75013 Paris
                  <br />
                  Immatriculée au Registre du Commerce et des Sociétés de Paris
                  sous le numéro B 415 228 311
                  <br />
                  N° TVA intracommunautaire&nbsp;: FR81415228311
                  <br />
                  Téléphone&nbsp;: 01 45 85 88 00
                  <br />
                  Email&nbsp;:{' '}
                  <a
                    href="mailto:contact@remedes-mamie.com"
                    className="text-rm-burgundy hover:underline"
                  >
                    contact@remedes-mamie.com
                  </a>
                </p>
                <p className="my-4">
                  Ci-après dénommée «&nbsp;
                  <strong className="text-rm-teal">
                    Les Remèdes de Mamie
                  </strong>
                  &nbsp;» ou «&nbsp;
                  <strong className="text-rm-teal">le Vendeur</strong>&nbsp;».
                </p>
                <p className="my-4">
                  Et toute personne physique non commerçante effectuant un
                  achat sur le site www.remedes-mamie.com, ci-après dénommée
                  «&nbsp;<strong className="text-rm-teal">le Client</strong>
                  &nbsp;» ou «&nbsp;
                  <strong className="text-rm-teal">l'Acheteur</strong>&nbsp;».
                </p>
                <p className="my-4">
                  Le site www.remedes-mamie.com est exploité par SAS CALEBASSE
                  sous la marque commerciale «&nbsp;Les Remèdes de Mamie&nbsp;».
                </p>
              </LegalSection>

              {/* § 02 — Champ d'application */}
              <LegalSection
                id="champ-application"
                num={2}
                title="Champ d'application"
              >
                <p className="my-4">
                  Les présentes CGV s'appliquent à toutes les ventes de
                  produits effectuées sur le site www.remedes-mamie.com à
                  destination de consommateurs personnes physiques, majeurs et
                  capables, situés en France métropolitaine.
                </p>
                <p className="my-4">
                  Toute commande passée sur le site implique l'acceptation
                  préalable, pleine et entière des présentes CGV. Le Client
                  reconnaît avoir pris connaissance des CGV avant de passer
                  commande.
                </p>
                <p className="my-4">
                  Les Remèdes de Mamie se réserve le droit de modifier les
                  présentes CGV à tout moment. Les CGV applicables sont celles
                  en vigueur à la date de la commande.
                </p>
              </LegalSection>

              {/* § 03 — Produits */}
              <LegalSection id="produits" num={3} title="Produits">
                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  3.1 Disponibilité
                </h3>
                <p className="my-4">
                  Les produits proposés à la vente sont ceux figurant sur le
                  site www.remedes-mamie.com, dans la limite des stocks
                  disponibles.
                </p>
                <p className="my-4">
                  Les Remèdes de Mamie se réserve le droit de modifier à tout
                  moment l'assortiment de produits proposés sur le site.
                </p>
                <p className="my-4">
                  En cas d'indisponibilité d'un produit après passation de la
                  commande, le Client en sera informé par email dans les
                  meilleurs délais. Le Client pourra alors choisir entre&nbsp;:
                </p>
                <ul className="list-disc pl-6 space-y-2 my-4">
                  <li>L'attente du réapprovisionnement</li>
                  <li>
                    L'annulation de sa commande et le remboursement intégral
                    des sommes versées
                  </li>
                </ul>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  3.2 Description des produits
                </h3>
                <p className="my-4">
                  Les produits sont décrits et présentés avec la plus grande
                  exactitude possible. Toutefois, en cas d'erreurs ou
                  d'omissions dans la présentation, la responsabilité des
                  Remèdes de Mamie ne saurait être engagée.
                </p>
                <p className="my-4">
                  Les photographies des produits ne sont pas contractuelles et
                  ne sauraient engager la responsabilité du Vendeur.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  3.3 Nature des produits
                </h3>
                <p className="my-4">
                  Les produits commercialisés sur le site sont des{' '}
                  <strong className="text-rm-teal">
                    compléments alimentaires
                  </strong>{' '}
                  et des{' '}
                  <strong className="text-rm-teal">tisanes/infusions</strong>{' '}
                  conformes à la réglementation française et européenne en
                  vigueur.
                </p>
                <p className="my-4">
                  Les compléments alimentaires ne doivent pas être utilisés
                  comme substituts d'un régime alimentaire varié et équilibré
                  et d'un mode de vie sain. Il est recommandé de respecter les
                  doses journalières conseillées, de tenir les produits hors de
                  portée des enfants et de consulter un professionnel de santé
                  en cas de doute. Voir aussi notre{' '}
                  <Link
                    href={link('/avertissement-sante')}
                    className="text-rm-burgundy hover:underline"
                  >
                    avertissement santé
                  </Link>
                  .
                </p>
              </LegalSection>

              {/* § 04 — Prix */}
              <LegalSection id="prix" num={4} title="Prix">
                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  4.1 Affichage des prix
                </h3>
                <p className="my-4">
                  Tous les prix sont indiqués en euros (€) et s'entendent{' '}
                  <strong className="text-rm-teal">
                    toutes taxes comprises (TTC)
                  </strong>
                  , hors frais de livraison.
                </p>
                <p className="my-4">
                  Les frais de livraison sont indiqués avant la validation
                  définitive de la commande.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  4.2 Modification des prix
                </h3>
                <p className="my-4">
                  Les Remèdes de Mamie se réserve le droit de modifier ses
                  prix à tout moment. Les produits seront facturés sur la base
                  des tarifs en vigueur au moment de la validation de la
                  commande.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  4.3 Erreur de prix
                </h3>
                <p className="my-4">
                  En cas d'erreur manifeste sur le prix d'un produit (prix
                  dérisoire, erreur de virgule, etc.), Les Remèdes de Mamie se
                  réserve le droit d'annuler la commande et d'en informer le
                  Client dans les meilleurs délais.
                </p>
              </LegalSection>

              {/* § 05 — Commande */}
              <LegalSection id="commande" num={5} title="Commande">
                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  5.1 Processus de commande
                </h3>
                <p className="my-4">
                  La commande s'effectue selon les étapes suivantes&nbsp;:
                </p>
                <ol className="list-decimal pl-6 space-y-2 my-4">
                  <li>Sélection des produits et ajout au panier</li>
                  <li>Vérification du contenu du panier</li>
                  <li>
                    Identification du Client (création de compte ou commande en
                    mode invité)
                  </li>
                  <li>Saisie de l'adresse de livraison</li>
                  <li>Choix du mode de livraison</li>
                  <li>Saisie de l'adresse de facturation</li>
                  <li>
                    Acceptation des présentes CGV (case à cocher obligatoire)
                  </li>
                  <li>Choix du mode de paiement</li>
                  <li>Vérification récapitulative de la commande</li>
                  <li>
                    Validation définitive de la commande par un{' '}
                    <strong className="text-rm-teal">double clic</strong>{' '}
                    (conformément à l'article 1127-2 du Code civil)
                  </li>
                  <li>Redirection vers la page de paiement sécurisé</li>
                  <li>Confirmation de la commande par email</li>
                </ol>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  5.2 Confirmation de commande
                </h3>
                <p className="my-4">
                  Un email de confirmation récapitulant les éléments essentiels
                  de la commande (numéro de commande, produits, quantités,
                  prix, adresse de livraison) est envoyé au Client après
                  validation du paiement.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  5.3 Modification ou annulation
                </h3>
                <p className="my-4">
                  Le Client peut modifier ou annuler sa commande en contactant
                  le service client par email à{' '}
                  <a
                    href="mailto:contact@remedes-mamie.com"
                    className="text-rm-burgundy hover:underline"
                  >
                    contact@remedes-mamie.com
                  </a>
                  , sous réserve que la commande n'ait pas encore été expédiée.
                </p>
              </LegalSection>

              {/* § 06 — Paiement */}
              <LegalSection id="paiement" num={6} title="Paiement">
                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  6.1 Moyens de paiement
                </h3>
                <p className="my-4">
                  Le paiement s'effectue en ligne par&nbsp;:
                </p>
                <ul className="list-disc pl-6 space-y-2 my-4">
                  <li>
                    <strong className="text-rm-teal">Carte bancaire</strong>
                    &nbsp;: Visa, Mastercard, Carte Bleue
                  </li>
                  <li>
                    <strong className="text-rm-teal">Apple Pay</strong>
                  </li>
                  <li>
                    <strong className="text-rm-teal">Google Pay</strong>
                  </li>
                </ul>
                <p className="my-4">
                  Le paiement est sécurisé par notre prestataire{' '}
                  <strong className="text-rm-teal">Stripe</strong>, certifié
                  PCI-DSS.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  6.2 Sécurité des paiements
                </h3>
                <p className="my-4">
                  Les transactions sont sécurisées par le protocole SSL/TLS.
                  Les données bancaires sont transmises de manière cryptée et
                  ne sont jamais stockées par Les Remèdes de Mamie.
                </p>
                <p className="my-4">
                  Le système 3D Secure peut être activé par la banque du Client
                  pour renforcer la sécurité de la transaction.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  6.3 Débit
                </h3>
                <p className="my-4">
                  Le compte bancaire du Client est débité au moment de la
                  validation du paiement.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  6.4 Défaut de paiement
                </h3>
                <p className="my-4">
                  En cas de défaut de paiement, de paiement irrégulier ou
                  incomplet, Les Remèdes de Mamie se réserve le droit de
                  suspendre ou d'annuler la commande.
                </p>
              </LegalSection>

              {/* § 07 — Réserve de propriété */}
              <LegalSection
                id="reserve"
                num={7}
                title="Réserve de propriété"
              >
                <p className="my-4">
                  Les Remèdes de Mamie conserve la propriété des produits
                  vendus jusqu'au paiement intégral du prix, en principal et
                  accessoires.
                </p>
              </LegalSection>

              {/* § 08 — Livraison */}
              <LegalSection id="livraison" num={8} title="Livraison">
                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  8.1 Zone de livraison
                </h3>
                <p className="my-4">
                  Les livraisons sont effectuées en{' '}
                  <strong className="text-rm-teal">
                    France métropolitaine
                  </strong>{' '}
                  uniquement.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  8.2 Modes de livraison
                </h3>
                <p className="my-4">
                  Les modes de livraison proposés sont&nbsp;:
                </p>
                <div className="my-4 overflow-x-auto">
                  <table className="w-full border-collapse font-serif text-[14px] md:text-[15px]">
                    <thead>
                      <tr className="border-b border-rm-ruleStrong">
                        <th className="text-left py-2 pr-4 font-semibold text-rm-teal">
                          Mode
                        </th>
                        <th className="text-left py-2 pr-4 font-semibold text-rm-teal">
                          Transporteur
                        </th>
                        <th className="text-left py-2 font-semibold text-rm-teal">
                          Délai indicatif
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-rm-rule">
                        <td className="py-2 pr-4">Livraison à domicile</td>
                        <td className="py-2 pr-4">Colissimo</td>
                        <td className="py-2">3 à 5 jours ouvrés</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">Point relais</td>
                        <td className="py-2 pr-4">Mondial Relay</td>
                        <td className="py-2">4 à 6 jours ouvrés</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  8.3 Frais de livraison
                </h3>
                <p className="my-4">
                  Les frais de livraison sont calculés en fonction du mode de
                  livraison choisi et sont affichés avant la validation de la
                  commande.
                </p>
                <p className="my-4">
                  <strong className="text-rm-teal">
                    La livraison est offerte à partir de 30 € d'achat
                  </strong>{' '}
                  (hors frais de livraison).
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  8.4 Délais de livraison
                </h3>
                <p className="my-4">
                  Les délais de livraison indiqués sont des délais moyens et
                  correspondent aux délais de traitement et d'acheminement en
                  France métropolitaine.
                </p>
                <p className="my-4">
                  Les délais courent à compter de la confirmation du paiement.
                  Ils ne tiennent pas compte des week-ends et jours fériés.
                </p>
                <p className="my-4">
                  En cas de retard de livraison significatif, le Client en sera
                  informé par email.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  8.5 Réception de la commande
                </h3>
                <p className="my-4">
                  À la réception de la commande, le Client est invité à
                  vérifier l'état du colis et des produits.
                </p>
                <p className="my-4">
                  En cas de colis endommagé ou de produit manquant/détérioré,
                  le Client doit&nbsp;:
                </p>
                <ul className="list-disc pl-6 space-y-2 my-4">
                  <li>
                    Émettre des réserves écrites auprès du transporteur au
                    moment de la livraison
                  </li>
                  <li>
                    Contacter le service client dans les 48 heures suivant la
                    réception à{' '}
                    <a
                      href="mailto:contact@remedes-mamie.com"
                      className="text-rm-burgundy hover:underline"
                    >
                      contact@remedes-mamie.com
                    </a>
                  </li>
                </ul>
              </LegalSection>

              {/* § 09 — Droit de rétractation */}
              <LegalSection
                id="retractation"
                num={9}
                title="Droit de rétractation"
              >
                <LegalBox tone="info">
                  Conformément aux articles L. 221-18 et suivants du Code de la
                  consommation, le Client dispose d'un délai de{' '}
                  <strong>quatorze (14) jours francs</strong> à compter de la
                  réception des produits pour exercer son droit de rétractation,
                  sans avoir à justifier de motifs ni à payer de pénalités.
                </LegalBox>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  9.1 Délai de rétractation
                </h3>
                <p className="my-4">
                  Conformément aux articles L. 221-18 et suivants du Code de la
                  consommation, le Client dispose d'un délai de{' '}
                  <strong className="text-rm-teal">
                    quatorze (14) jours francs
                  </strong>{' '}
                  à compter de la réception des produits pour exercer son droit
                  de rétractation, sans avoir à justifier de motifs ni à payer
                  de pénalités.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  9.2 Conditions
                </h3>
                <p className="my-4">
                  Pour être acceptés, les produits retournés doivent être&nbsp;:
                </p>
                <ul className="list-disc pl-6 space-y-2 my-4">
                  <li>
                    <strong className="text-rm-teal">Non ouverts</strong> et
                    dans leur emballage d'origine intact
                  </li>
                  <li>
                    <strong className="text-rm-teal">Non utilisés</strong>
                  </li>
                  <li>Accompagnés de tous leurs accessoires et notices</li>
                </ul>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  9.3 Exclusions
                </h3>
                <p className="my-4">
                  Conformément à l'article L. 221-28 du Code de la
                  consommation, le droit de rétractation ne peut être exercé
                  pour&nbsp;:
                </p>
                <ul className="list-disc pl-6 space-y-2 my-4">
                  <li>
                    Les produits qui ont été descellés par le Client après la
                    livraison et qui ne peuvent être renvoyés pour des raisons
                    d'hygiène ou de protection de la santé
                  </li>
                  <li>
                    Les produits qui, après avoir été livrés et de par leur
                    nature, sont mélangés de manière indissociable avec
                    d'autres articles
                  </li>
                </ul>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  9.4 Procédure de rétractation
                </h3>
                <p className="my-4">
                  Pour exercer son droit de rétractation, le Client doit
                  notifier sa décision au moyen d'une déclaration dénuée
                  d'ambiguïté&nbsp;:
                </p>
                <ul className="list-disc pl-6 space-y-2 my-4">
                  <li>
                    Par email&nbsp;:{' '}
                    <a
                      href="mailto:contact@remedes-mamie.com"
                      className="text-rm-burgundy hover:underline"
                    >
                      contact@remedes-mamie.com
                    </a>
                  </li>
                  <li>
                    Par courrier&nbsp;: Les Remèdes de Mamie – 58 rue Etienne
                    Dolet, 92240 Malakoff
                  </li>
                  <li>
                    En utilisant le{' '}
                    <a
                      href="#formulaire-retractation"
                      className="text-rm-burgundy hover:underline"
                    >
                      formulaire de rétractation ci-annexé
                    </a>
                  </li>
                </ul>
                <p className="my-4">
                  Le Client dispose ensuite d'un délai de{' '}
                  <strong className="text-rm-teal">
                    quatorze (14) jours
                  </strong>{' '}
                  à compter de la notification de sa rétractation pour
                  retourner les produits.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  9.5 Frais de retour
                </h3>
                <p className="my-4">
                  Les frais de retour des produits sont à la charge du Client.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  9.6 Remboursement
                </h3>
                <p className="my-4">
                  Le remboursement sera effectué dans un délai de{' '}
                  <strong className="text-rm-teal">
                    quatorze (14) jours
                  </strong>{' '}
                  à compter de la réception des produits retournés ou de la
                  preuve de leur expédition.
                </p>
                <p className="my-4">
                  Le remboursement sera effectué par le même moyen de paiement
                  que celui utilisé pour la commande initiale, sauf accord
                  exprès du Client pour un autre moyen.
                </p>
              </LegalSection>

              {/* § 10 — Garanties légales */}
              <LegalSection id="garanties" num={10} title="Garanties légales">
                <LegalBox tone="warn">
                  Les produits bénéficient de la{' '}
                  <strong>garantie légale de conformité</strong> (24 mois —
                  art. L. 217-4 et s. Code de la consommation) et de la{' '}
                  <strong>garantie des vices cachés</strong> (2 ans — art. 1641
                  et s. Code civil). Les textes complets figurent en annexe.
                </LegalBox>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  10.1 Garantie légale de conformité
                </h3>
                <p className="my-4">
                  Les produits bénéficient de la garantie légale de conformité
                  prévue par les articles L. 217-4 et suivants du Code de la
                  consommation.
                </p>
                <p className="my-4">
                  En cas de défaut de conformité, le Client peut choisir entre
                  la réparation ou le remplacement du produit, sous réserve des
                  conditions de coût prévues par l'article L. 217-9 du Code de
                  la consommation.
                </p>
                <p className="my-4">
                  Le Client est dispensé de rapporter la preuve de l'existence
                  du défaut de conformité du produit pendant les{' '}
                  <strong className="text-rm-teal">
                    vingt-quatre (24) mois
                  </strong>{' '}
                  suivant la délivrance du produit.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  10.2 Garantie des vices cachés
                </h3>
                <p className="my-4">
                  Le Client bénéficie également de la garantie légale des vices
                  cachés prévue par les articles 1641 à 1649 du Code civil.
                </p>
                <p className="my-4">
                  En cas de vice caché, le Client peut choisir entre la
                  résolution de la vente ou une réduction du prix conformément
                  à l'article 1644 du Code civil.
                </p>
                <p className="my-4">
                  L'action résultant des vices rédhibitoires doit être intentée
                  par le Client dans un délai de{' '}
                  <strong className="text-rm-teal">deux (2) ans</strong> à
                  compter de la découverte du vice.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  10.3 Textes légaux
                </h3>
                <p className="my-4">
                  Les textes des articles L. 217-4 à L. 217-14 du Code de la
                  consommation et des articles 1641 à 1649 du Code civil sont
                  reproduits en annexe des présentes CGV.
                </p>
              </LegalSection>

              {/* § 11 — Responsabilité */}
              <LegalSection
                id="responsabilite"
                num={11}
                title="Responsabilité"
              >
                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  11.1 Limitation de responsabilité
                </h3>
                <p className="my-4">
                  La responsabilité des Remèdes de Mamie ne saurait être
                  engagée pour tous les inconvénients ou dommages inhérents à
                  l'utilisation du réseau Internet, notamment une rupture de
                  service, une intrusion extérieure ou la présence de virus
                  informatiques.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  11.2 Force majeure
                </h3>
                <p className="my-4">
                  Les Remèdes de Mamie ne pourra être tenue responsable de
                  l'inexécution totale ou partielle de ses obligations si cette
                  inexécution est imputable à un cas de force majeure, tel que
                  défini par la jurisprudence des tribunaux français.
                </p>
              </LegalSection>

              {/* § 12 — Données personnelles */}
              <LegalSection id="donnees" num={12} title="Données personnelles">
                <p className="my-4">
                  Les informations collectées lors de la commande font l'objet
                  d'un traitement informatique destiné à la gestion des
                  commandes et à la relation client.
                </p>
                <p className="my-4">
                  Pour plus d'informations sur le traitement de vos données
                  personnelles, veuillez consulter notre{' '}
                  <Link
                    href={link('/politique-confidentialite')}
                    className="text-rm-burgundy hover:underline"
                  >
                    Politique de Confidentialité
                  </Link>
                  .
                </p>
              </LegalSection>

              {/* § 13 — Propriété intellectuelle */}
              <LegalSection id="ip" num={13} title="Propriété intellectuelle">
                <p className="my-4">
                  Tous les éléments du site www.remedes-mamie.com sont et
                  restent la propriété exclusive de{' '}
                  <strong className="text-rm-teal">SAS CALEBASSE</strong>.
                </p>
                <p className="my-4">
                  Toute reproduction, exploitation ou utilisation des éléments
                  du site, sous quelque forme que ce soit, est interdite sans
                  l'autorisation écrite préalable de SAS CALEBASSE.
                </p>
              </LegalSection>

              {/* § 14 — Service client */}
              <LegalSection
                id="service-client"
                num={14}
                title="Service client"
              >
                <p className="my-4">
                  Pour toute question ou réclamation, le Client peut contacter
                  le service client&nbsp;:
                </p>
                <ul className="list-disc pl-6 space-y-2 my-4">
                  <li>
                    <strong className="text-rm-teal">Par email</strong>
                    &nbsp;:{' '}
                    <a
                      href="mailto:contact@remedes-mamie.com"
                      className="text-rm-burgundy hover:underline"
                    >
                      contact@remedes-mamie.com
                    </a>
                  </li>
                  <li>
                    <strong className="text-rm-teal">Par téléphone</strong>
                    &nbsp;: 01 45 85 88 00 (prix d'un appel local)
                  </li>
                  <li>
                    <strong className="text-rm-teal">Par courrier</strong>
                    &nbsp;: Les Remèdes de Mamie – 58 rue Etienne Dolet, 92240
                    Malakoff
                  </li>
                  <li>
                    <strong className="text-rm-teal">
                      Via le formulaire de contact
                    </strong>
                    &nbsp;:{' '}
                    <Link
                      href={link('/contact')}
                      className="text-rm-burgundy hover:underline"
                    >
                      www.remedes-mamie.com/contact
                    </Link>
                  </li>
                </ul>
              </LegalSection>

              {/* § 15 — Médiation */}
              <LegalSection id="mediation" num={15} title="Médiation">
                <p className="my-4">
                  Conformément aux articles L. 611-1 et suivants du Code de la
                  consommation, en cas de litige non résolu avec notre service
                  client, le Client peut recourir gratuitement au service de
                  médiation de la consommation.
                </p>
                <p className="my-4">Le médiateur compétent est&nbsp;:</p>
                <p className="my-4">
                  <strong className="text-rm-teal">
                    CMAP – Centre de Médiation et d'Arbitrage de Paris
                  </strong>
                  <br />
                  39 avenue Franklin D. Roosevelt
                  <br />
                  75008 Paris
                  <br />
                  Site web&nbsp;:{' '}
                  <a
                    href="https://www.cmap.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rm-burgundy hover:underline"
                  >
                    www.cmap.fr
                  </a>
                </p>
                <p className="my-4">
                  Le Client peut également utiliser la plateforme européenne de
                  règlement en ligne des litiges&nbsp;:{' '}
                  <a
                    href="https://ec.europa.eu/consumers/odr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rm-burgundy hover:underline"
                  >
                    https://ec.europa.eu/consumers/odr
                  </a>
                </p>
              </LegalSection>

              {/* § 16 — Droit applicable et juridiction compétente */}
              <LegalSection
                id="droit-applicable"
                num={16}
                title="Droit applicable et juridiction compétente"
              >
                <p className="my-4">
                  Les présentes CGV sont soumises au droit français.
                </p>
                <p className="my-4">
                  En cas de litige relatif à l'interprétation ou à l'exécution
                  des présentes, et à défaut de résolution amiable, les
                  tribunaux français seront seuls compétents.
                </p>
              </LegalSection>

              {/* § 17 — Modification des CGV (Article 16 du .md) */}
              <LegalSection
                id="modification"
                num={17}
                title="Modification des CGV"
              >
                <p className="my-4">
                  Les Remèdes de Mamie se réserve le droit de modifier les
                  présentes CGV à tout moment. Les CGV applicables sont celles
                  en vigueur à la date de la commande.
                </p>
                <p className="my-4">
                  Voir également nos{' '}
                  <Link
                    href={link('/mentions-legales')}
                    className="text-rm-burgundy hover:underline"
                  >
                    mentions légales
                  </Link>
                  .
                </p>
              </LegalSection>

              {/* § 18 — Annexe 1 — Formulaire de rétractation */}
              <LegalSection
                id="formulaire-retractation"
                num={18}
                title="Annexe 1 — Formulaire de rétractation"
              >
                <p className="my-4 italic text-rm-inkSoft">
                  (À compléter et renvoyer uniquement si vous souhaitez vous
                  rétracter du contrat)
                </p>
                <p className="my-4">
                  À l'attention de&nbsp;:
                  <br />
                  <strong className="text-rm-teal">
                    Les Remèdes de Mamie
                  </strong>
                  <br />
                  58 rue Etienne Dolet
                  <br />
                  92240 Malakoff
                  <br />
                  Email&nbsp;:{' '}
                  <a
                    href="mailto:contact@remedes-mamie.com"
                    className="text-rm-burgundy hover:underline"
                  >
                    contact@remedes-mamie.com
                  </a>
                </p>
                <p className="my-4">
                  Je/Nous (*) vous notifie/notifions (*) par la présente
                  ma/notre (*) rétractation du contrat portant sur la vente
                  du/des produit(s) (*) ci-dessous&nbsp;:
                </p>
                <ul className="list-disc pl-6 space-y-2 my-4">
                  <li>
                    Commandé(s) le (*) / Reçu(s) le (*)&nbsp;:
                    ________________
                  </li>
                  <li>Numéro de commande&nbsp;: ________________</li>
                  <li>Nom du/des produit(s)&nbsp;: ________________</li>
                  <li>
                    Nom du (des) consommateur(s)&nbsp;: ________________
                  </li>
                  <li>
                    Adresse du (des) consommateur(s)&nbsp;: ________________
                  </li>
                </ul>
                <p className="my-4">Date&nbsp;: ________________</p>
                <p className="my-4">
                  Signature du (des) consommateur(s) (uniquement en cas de
                  notification du présent formulaire sur papier)&nbsp;:
                </p>
                <p className="my-4">________________</p>
                <p className="my-4 italic text-rm-inkSoft">
                  (*) Rayez la mention inutile.
                </p>
              </LegalSection>

              {/* § 19 — Annexe 2 — Extraits du Code de la consommation */}
              <LegalSection
                id="code-conso"
                num={19}
                title="Annexe 2 — Extraits du Code de la consommation"
              >
                <p className="my-4 italic text-rm-inkSoft">
                  Articles L. 217-4 à L. 217-14 (Garantie légale de
                  conformité).
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  Article L. 217-4
                </h3>
                <p className="my-4">
                  Le vendeur est tenu de livrer un bien conforme au contrat et
                  répond des défauts de conformité existant lors de la
                  délivrance. Il répond également des défauts de conformité
                  résultant de l'emballage, des instructions de montage ou de
                  l'installation lorsque celle-ci a été mise à sa charge par le
                  contrat ou a été réalisée sous sa responsabilité.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  Article L. 217-5
                </h3>
                <p className="my-4">
                  Pour être conforme au contrat, le bien doit&nbsp;:
                </p>
                <ol className="list-decimal pl-6 space-y-2 my-4">
                  <li>
                    Être propre à l'usage habituellement attendu d'un bien
                    semblable et, le cas échéant&nbsp;:
                    <ul className="list-disc pl-6 space-y-2 my-2">
                      <li>
                        correspondre à la description donnée par le vendeur et
                        posséder les qualités que celui-ci a présentées à
                        l'acheteur sous forme d'échantillon ou de modèle&nbsp;;
                      </li>
                      <li>
                        présenter les qualités qu'un acheteur peut légitimement
                        attendre eu égard aux déclarations publiques faites par
                        le vendeur, par le producteur ou par son représentant,
                        notamment dans la publicité ou l'étiquetage&nbsp;;
                      </li>
                    </ul>
                  </li>
                  <li>
                    Ou présenter les caractéristiques définies d'un commun
                    accord par les parties ou être propre à tout usage spécial
                    recherché par l'acheteur, porté à la connaissance du
                    vendeur et que ce dernier a accepté.
                  </li>
                </ol>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  Article L. 217-9
                </h3>
                <p className="my-4">
                  En cas de défaut de conformité, l'acheteur choisit entre la
                  réparation et le remplacement du bien. Toutefois, le vendeur
                  peut ne pas procéder selon le choix de l'acheteur si ce choix
                  entraîne un coût manifestement disproportionné au regard de
                  l'autre modalité, compte tenu de la valeur du bien ou de
                  l'importance du défaut. Il est alors tenu de procéder, sauf
                  impossibilité, selon la modalité non choisie par l'acheteur.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  Article L. 217-12
                </h3>
                <p className="my-4">
                  L'action résultant du défaut de conformité se prescrit par
                  deux ans à compter de la délivrance du bien.
                </p>
              </LegalSection>

              {/* § 20 — Annexe 3 — Extraits du Code civil */}
              <LegalSection
                id="code-civil"
                num={20}
                title="Annexe 3 — Extraits du Code civil"
              >
                <p className="my-4 italic text-rm-inkSoft">
                  Articles 1641 à 1649 (Garantie des vices cachés).
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  Article 1641
                </h3>
                <p className="my-4">
                  Le vendeur est tenu de la garantie à raison des défauts
                  cachés de la chose vendue qui la rendent impropre à l'usage
                  auquel on la destine, ou qui diminuent tellement cet usage
                  que l'acheteur ne l'aurait pas acquise, ou n'en aurait donné
                  qu'un moindre prix, s'il les avait connus.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  Article 1644
                </h3>
                <p className="my-4">
                  Dans le cas des articles 1641 et 1643, l'acheteur a le choix
                  de rendre la chose et de se faire restituer le prix, ou de
                  garder la chose et de se faire rendre une partie du prix.
                </p>

                <h3 className="font-serif font-semibold text-rm-teal text-[17px] md:text-[18px] mt-6 mb-2">
                  Article 1648
                </h3>
                <p className="my-4">
                  L'action résultant des vices rédhibitoires doit être intentée
                  par l'acquéreur dans un délai de deux ans à compter de la
                  découverte du vice.
                </p>

                <p className="mt-10 pt-6 border-t border-dashed border-rm-ruleStrong font-mono text-[11px] text-rm-inkSoft">
                  Conditions Générales de Vente en vigueur à compter du 1er mai
                  2026.
                </p>
              </LegalSection>
            </LegalBody>
          </Reveal>
        </div>
      </div>
    </main>
  )
}
