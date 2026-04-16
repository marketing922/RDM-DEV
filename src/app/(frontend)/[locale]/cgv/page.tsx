import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/server'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import Link from 'next/link'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return {
    title: 'Conditions Generales de Vente',
    description: `Conditions Generales de Vente du site ${dict.meta.siteName}`,
  }
}

const sections = [
  { id: 'preambule', label: 'Preambule' },
  { id: 'champ-application', label: 'Champ d\'application' },
  { id: 'produits', label: 'Produits' },
  { id: 'prix', label: 'Prix' },
  { id: 'commande', label: 'Commande' },
  { id: 'paiement', label: 'Paiement' },
  { id: 'reserve-propriete', label: 'Reserve de propriete' },
  { id: 'livraison', label: 'Livraison' },
  { id: 'droit-retractation', label: 'Droit de retractation' },
  { id: 'garanties-legales', label: 'Garanties legales' },
  { id: 'responsabilite', label: 'Responsabilite' },
  { id: 'donnees-personnelles', label: 'Donnees personnelles' },
  { id: 'propriete-intellectuelle', label: 'Propriete intellectuelle' },
  { id: 'service-client', label: 'Service client' },
  { id: 'mediation', label: 'Mediation' },
  { id: 'droit-applicable', label: 'Droit applicable' },
]

export default async function CGVPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <section className="py-16 bg-[#FEF9E9]">
      <div className="max-w-7xl mx-auto px-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: 'CGV' },
          ]}
        />

        <div className="mt-12 flex gap-12">
          {/* Sidebar navigation */}
          <aside className="hidden lg:block w-[240px] flex-shrink-0">
            <nav className="sticky top-[100px]">
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block text-sm text-[#712E2F]/80 hover:text-[#A2211E] transition-colors duration-200 py-1.5 px-4 rounded-lg hover:bg-[#FFF5D5]"
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-[#FFF5D5] rounded-xl p-10 shadow-sm max-w-3xl border border-[#DCD8C7]">
              <h1 className="text-3xl font-bold text-[#054A57] mb-10">
                Conditions Generales de Vente
              </h1>

              <div className="space-y-10">
                <article id="preambule">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Preambule
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les presentes Conditions Generales de Vente (ci-apres « CGV ») sont conclues entre :</p>
                    <p><strong className="text-[#712E2F]">SAS CALEBASSE</strong>, Societe par Actions Simplifiee au capital de 10 000 euros, dont le siege social est situe au 15 rue de la Vistule, 75013 Paris, France, immatriculee au Registre du Commerce et des Societes de Paris sous le numero B 415 228 311, numero de TVA intracommunautaire FR81415228311, telephone 01 45 85 88 00, email <a href="mailto:contact@remedes-mamie.com" className="text-[#A2211E] hover:underline">contact@remedes-mamie.com</a>.</p>
                    <p>La societe SAS CALEBASSE exploite le site www.remedes-mamie.com sous la marque commerciale « Les Remedes de Mamie », ci-apres designee « Les Remedes de Mamie » ou « le Vendeur ».</p>
                    <p>Et d&apos;autre part, toute personne physique non commercante, ci-apres designee « le Client », souhaitant proceder a un achat sur le site www.remedes-mamie.com.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="champ-application">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Champ d&apos;application
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les presentes CGV s&apos;appliquent a toutes les ventes de produits effectuees sur le site www.remedes-mamie.com, a destination des consommateurs residant en France metropolitaine.</p>
                    <p>Le Client reconnait avoir pris connaissance des presentes CGV avant la passation de sa commande. La validation de la commande vaut acceptation sans reserve des presentes CGV.</p>
                    <p>Les CGV applicables sont celles en vigueur au jour de la passation de la commande par le Client.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="produits">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Produits
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les produits proposes a la vente sont ceux figurant sur le site www.remedes-mamie.com, dans la limite des stocks disponibles. En cas d&apos;indisponibilite d&apos;un produit apres passation de la commande, le Client sera informe par email et aura le choix entre l&apos;attente du reapprovisionnement ou l&apos;annulation de sa commande avec remboursement integral.</p>
                    <p>Les produits sont decrits avec la plus grande exactitude possible. Toutefois, les photographies illustrant les produits n&apos;ont pas de valeur contractuelle.</p>
                    <p>Les produits commercialises sur le site sont des <strong className="text-[#712E2F]">complements alimentaires et des tisanes/infusions</strong>. Ils ne constituent en aucun cas des substituts a une alimentation variee et equilibree ni a un mode de vie sain.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="prix">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Prix
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les prix des produits sont indiques en euros, toutes taxes comprises (TTC), hors frais de livraison. Les frais de livraison sont indiques avant la validation de la commande.</p>
                    <p>Le Vendeur se reserve le droit de modifier les prix a tout moment. Les produits seront factures sur la base des tarifs en vigueur au moment de la validation de la commande.</p>
                    <p>En cas d&apos;erreur manifeste sur le prix d&apos;un produit (prix derisoire, etc.), le Vendeur se reserve le droit d&apos;annuler la commande, meme si celle-ci a ete confirmee.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="commande">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Commande
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Le processus de commande comprend les etapes suivantes :</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Selection des produits et ajout au panier</li>
                      <li>Verification du contenu du panier</li>
                      <li>Identification ou creation de compte</li>
                      <li>Choix de l&apos;adresse de livraison</li>
                      <li>Choix du mode de livraison</li>
                      <li>Prise de connaissance et acceptation des CGV</li>
                      <li>Choix du mode de paiement</li>
                      <li>Verification du recapitulatif de commande</li>
                      <li>Validation et paiement de la commande</li>
                      <li>Confirmation de paiement</li>
                      <li>Reception de l&apos;email de confirmation de commande</li>
                      <li>Reception de l&apos;email de confirmation d&apos;expedition</li>
                    </ol>
                    <p>Un email de confirmation recapitulant la commande sera envoye au Client apres validation du paiement.</p>
                    <p>Le Client peut demander la modification ou l&apos;annulation de sa commande avant l&apos;expedition des produits, en contactant le service client.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="paiement">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Paiement
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Le paiement peut etre effectue par les moyens suivants :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Carte bancaire : Visa, Mastercard, CB</li>
                      <li>Apple Pay</li>
                      <li>Google Pay</li>
                    </ul>
                    <p>Le paiement est securise par <strong className="text-[#712E2F]">Stripe</strong>, prestataire certifie PCI-DSS. Les transactions sont protegees par un chiffrement SSL/TLS et le protocole d&apos;authentification 3D Secure.</p>
                    <p>Le compte du Client est debite au moment de la validation de la commande.</p>
                    <p>En cas de defaut de paiement, le Vendeur se reserve le droit de suspendre ou d&apos;annuler la commande.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="reserve-propriete">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Reserve de propriete
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Le Vendeur conserve la propriete pleine et entiere des produits vendus jusqu&apos;au paiement integral du prix, en principal et en accessoires. Le transfert de propriete des produits au Client ne sera effectif qu&apos;apres le paiement complet du prix par ce dernier.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="livraison">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Livraison
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les livraisons sont effectuees <strong className="text-[#712E2F]">en France metropolitaine uniquement</strong>.</p>
                    <p>Les modes de livraison disponibles sont :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong className="text-[#712E2F]">Colissimo</strong> : livraison a domicile sous 3 a 5 jours ouvrables</li>
                      <li><strong className="text-[#712E2F]">Mondial Relay</strong> : livraison en point relais sous 4 a 6 jours ouvrables</li>
                    </ul>
                    <p>Les frais de livraison sont calcules en fonction du mode de livraison choisi et du poids de la commande. <strong className="text-[#712E2F]">La livraison est offerte a partir de 30 euros d&apos;achat.</strong></p>
                    <p>Le Client est invite a verifier l&apos;etat du colis a la reception. En cas de dommage constate, le Client doit emettre des reserves aupres du transporteur dans un delai de 48 heures et en informer le Vendeur.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="droit-retractation">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Droit de retractation
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Conformement aux articles L.221-18 et suivants du Code de la consommation, le Client dispose d&apos;un delai de <strong className="text-[#712E2F]">14 jours francs</strong> a compter de la reception des produits pour exercer son droit de retractation, sans avoir a justifier de motifs ni a payer de penalites.</p>
                    <p>Le droit de retractation s&apos;applique aux produits non ouverts et non utilises. Sont exclus du droit de retractation :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Les produits descelles apres la livraison et ne pouvant etre renvoyes pour des raisons d&apos;hygiene ou de protection de la sante</li>
                      <li>Les produits qui ont ete melanges apres la livraison avec d&apos;autres articles</li>
                    </ul>
                    <p>Pour exercer son droit de retractation, le Client peut adresser sa demande :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Par email : <a href="mailto:contact@remedes-mamie.com" className="text-[#A2211E] hover:underline">contact@remedes-mamie.com</a></li>
                      <li>Par courrier : Les Remedes de Mamie, 58 rue Etienne Dolet, 92240 Malakoff</li>
                    </ul>
                    <p>Les frais de retour sont a la charge du Client.</p>
                    <p>Le remboursement sera effectue dans un delai maximum de 14 jours a compter de la reception des produits retournes, par le meme moyen de paiement que celui utilise pour la commande.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="garanties-legales">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Garanties legales
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Tous les produits beneficient des garanties legales prevues par le Code de la consommation et le Code civil :</p>
                    <p><strong className="text-[#712E2F]">Garantie legale de conformite</strong> (articles L.217-4 et suivants du Code de la consommation) : le Client dispose d&apos;un delai de 24 mois a compter de la delivrance du bien pour agir en garantie de conformite.</p>
                    <p><strong className="text-[#712E2F]">Garantie legale des vices caches</strong> (articles 1641 a 1649 du Code civil) : le Client peut agir dans un delai de 2 ans a compter de la decouverte du vice cache.</p>
                    <p className="text-xs italic">Les textes legaux complets relatifs aux garanties legales sont reproduits en annexe des presentes CGV et sont consultables sur <a href="https://www.legifrance.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">legifrance.gouv.fr</a>.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="responsabilite">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Responsabilite
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Le Vendeur ne saurait etre tenu responsable des dysfonctionnements du reseau Internet, notamment en cas d&apos;interruption de service, de presence de virus informatiques ou d&apos;intrusions exterieures, qui empecheraient l&apos;acces au site ou le bon deroulement d&apos;une commande.</p>
                    <p>Le Vendeur ne pourra etre tenu responsable de l&apos;inexecution de ses obligations contractuelles en cas de force majeure telle que definie par l&apos;article 1218 du Code civil.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="donnees-personnelles">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Donnees personnelles
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Pour en savoir plus sur la collecte et le traitement de vos donnees personnelles dans le cadre de vos commandes, veuillez consulter notre <Link href={`/${locale}/politique-de-confidentialite`} className="text-[#A2211E] hover:underline">Politique de Confidentialite</Link>.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="propriete-intellectuelle">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Propriete intellectuelle
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>L&apos;ensemble des elements du site www.remedes-mamie.com (textes, images, logos, marques, base de donnees, structure du site) est la propriete exclusive de <strong className="text-[#712E2F]">SAS CALEBASSE</strong>.</p>
                    <p>Toute reproduction, representation, modification ou exploitation, totale ou partielle, de ces elements, par quelque procede que ce soit, est interdite sans l&apos;autorisation ecrite prealable de SAS CALEBASSE.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="service-client">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Service client
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Pour toute question ou reclamation, le Client peut contacter le service client :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Par email : <a href="mailto:contact@remedes-mamie.com" className="text-[#A2211E] hover:underline">contact@remedes-mamie.com</a></li>
                      <li>Par telephone : 01 45 85 88 00 (prix d&apos;un appel local)</li>
                      <li>Par courrier : Les Remedes de Mamie, 58 rue Etienne Dolet, 92240 Malakoff</li>
                      <li>Via le <Link href={`/${locale}/contact`} className="text-[#A2211E] hover:underline">formulaire de contact</Link></li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="mediation">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Mediation
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Conformement aux articles L.611-1 et suivants du Code de la consommation, en cas de litige non resolu amiablement, le Client peut recourir gratuitement au service de mediation suivant :</p>
                    <p><strong className="text-[#712E2F]">CMAP - Centre de Mediation et d&apos;Arbitrage de Paris</strong></p>
                    <p>39 avenue Franklin D. Roosevelt, 75008 Paris</p>
                    <p>Site web : <a href="https://www.cmap.fr" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">www.cmap.fr</a></p>
                    <p>Le Client peut egalement recourir a la plateforme europeenne de reglement en ligne des litiges (ODR) accessible a l&apos;adresse : <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">https://ec.europa.eu/consumers/odr</a></p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="droit-applicable">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Droit applicable
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les presentes CGV sont soumises au droit francais.</p>
                    <p>En cas de litige, et apres tentative de resolution amiable, competence est attribuee aux tribunaux francais competents.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <p className="text-sm text-[#712E2F]/80 italic text-center pt-4">
                  En vigueur a compter du 1er mai 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
