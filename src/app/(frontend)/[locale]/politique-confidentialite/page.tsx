import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/server'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return {
    title: 'Politique de confidentialite',
    description: `Politique de confidentialite du site ${dict.meta.siteName}`,
  }
}

const sections = [
  { id: 'preambule', label: 'Preambule' },
  { id: 'definitions', label: 'Definitions' },
  { id: 'donnees-collectees', label: 'Donnees collectees' },
  { id: 'bases-legales', label: 'Bases legales' },
  { id: 'finalites', label: 'Finalites' },
  { id: 'durees-conservation', label: 'Durees de conservation' },
  { id: 'destinataires', label: 'Destinataires' },
  { id: 'transferts', label: 'Transferts hors UE' },
  { id: 'droits', label: 'Vos droits' },
  { id: 'sites-tiers', label: 'Sites tiers' },
  { id: 'securite', label: 'Securite' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'modification', label: 'Modification' },
]

export default async function PolitiqueConfidentialitePage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <section className="py-16 bg-[#FEF9E9]">
      <div className="max-w-7xl mx-auto px-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: 'Politique de confidentialite' },
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
              <h1 className="text-3xl font-bold text-[#054A57] mb-4">
                Politique de confidentialite
              </h1>
              <p className="text-sm text-[#712E2F]/60 mb-10">
                Derniere mise a jour : avril 2026
              </p>

              <div className="space-y-10">
                {/* 1. Preambule */}
                <article id="preambule">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    1. Preambule
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>La societe <strong className="text-[#712E2F]">SAS CALEBASSE</strong>, SAS au capital de 10 000 &euro;, dont le siege social est situe au 15 rue de la Vistule, 75013 Paris, immatriculee au RCS de Paris sous le numero 415 228 311, exploite le site <a href="https://www.remedes-mamie.com" className="text-[#A2211E] hover:underline">www.remedes-mamie.com</a> sous la marque <strong className="text-[#712E2F]">Les Remedes de Mamie</strong>.</p>
                    <p>SAS CALEBASSE s&apos;engage a proteger la vie privee des utilisateurs de son site et a traiter les donnees personnelles dans le respect du <strong className="text-[#712E2F]">Reglement General sur la Protection des Donnees (RGPD — Reglement UE 2016/679)</strong> et de la <strong className="text-[#712E2F]">loi Informatique et Libertes (loi n° 78-17 du 6 janvier 1978)</strong>.</p>
                    <p>La presente politique de confidentialite a pour objet d&apos;informer les utilisateurs sur la maniere dont leurs donnees personnelles sont collectees, traitees et protegees.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* 2. Definitions */}
                <article id="definitions">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    2. Definitions
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <ul className="space-y-3">
                      <li><strong className="text-[#712E2F]">Donnee a caractere personnel :</strong> toute information se rapportant a une personne physique identifiee ou identifiable, directement ou indirectement.</li>
                      <li><strong className="text-[#712E2F]">Donnee de sante :</strong> donnee a caractere personnel relative a la sante physique ou mentale d&apos;une personne physique, y compris la prestation de services de soins de sante, qui revele des informations sur l&apos;etat de sante de cette personne.</li>
                      <li><strong className="text-[#712E2F]">Traitement :</strong> toute operation ou ensemble d&apos;operations effectuees sur des donnees a caractere personnel (collecte, enregistrement, conservation, modification, extraction, consultation, utilisation, communication, effacement, destruction, etc.).</li>
                      <li><strong className="text-[#712E2F]">Personne concernee :</strong> toute personne physique dont les donnees a caractere personnel font l&apos;objet d&apos;un traitement.</li>
                      <li><strong className="text-[#712E2F]">Responsable de traitement :</strong> la personne physique ou morale qui determine les finalites et les moyens du traitement des donnees a caractere personnel. En l&apos;espece, SAS CALEBASSE.</li>
                      <li><strong className="text-[#712E2F]">Sous-traitant :</strong> la personne physique ou morale qui traite des donnees a caractere personnel pour le compte du responsable de traitement.</li>
                      <li><strong className="text-[#712E2F]">Site :</strong> le site internet accessible a l&apos;adresse www.remedes-mamie.com et l&apos;ensemble de ses pages et fonctionnalites.</li>
                      <li><strong className="text-[#712E2F]">Cookie :</strong> petit fichier texte depose sur le terminal de l&apos;utilisateur lors de la consultation du site, permettant de stocker des informations relatives a la navigation.</li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* 3. Categories de donnees collectees */}
                <article id="donnees-collectees">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    3. Categories de donnees collectees
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-[#054A57] mb-2">3.1 Navigation sur le site</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong className="text-[#712E2F]">Donnees d&apos;identification et de contact :</strong> informations transmises via les formulaires (nom, prenom, adresse email, etc.)</li>
                        <li><strong className="text-[#712E2F]">Donnees de connexion et d&apos;audience :</strong> informations collectees via les cookies (pages visitees, duree de visite, origine du trafic)</li>
                        <li><strong className="text-[#712E2F]">Donnees relatives au terminal :</strong> type de navigateur, systeme d&apos;exploitation, resolution d&apos;ecran, langue</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#054A57] mb-2">3.2 Commandes de produits</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong className="text-[#712E2F]">Donnees d&apos;identification :</strong> nom, prenom, adresse de livraison et de facturation</li>
                        <li><strong className="text-[#712E2F]">Donnees de contact :</strong> adresse email, numero de telephone</li>
                        <li><strong className="text-[#712E2F]">Donnees bancaires :</strong> informations de paiement (traitees directement par notre prestataire de paiement Stripe, jamais stockees sur nos serveurs)</li>
                        <li><strong className="text-[#712E2F]">Donnees de suivi de commande :</strong> historique des commandes, statut de livraison</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#054A57] mb-2">3.3 Demandes de devis ou d&apos;informations</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong className="text-[#712E2F]">Donnees d&apos;identification :</strong> nom, prenom</li>
                        <li><strong className="text-[#712E2F]">Donnees de contact :</strong> adresse email, numero de telephone</li>
                        <li><strong className="text-[#712E2F]">Donnees de sante :</strong> si transmises volontairement par l&apos;utilisateur dans le cadre de sa demande</li>
                      </ul>
                    </div>
                    <div className="bg-[#FEF9E9] border border-[#DCD8C7] rounded-lg p-4">
                      <p><strong className="text-[#712E2F]">Important :</strong> SAS CALEBASSE ne sollicite jamais la transmission de donnees de sante. Si l&apos;utilisateur transmet volontairement de telles informations dans le cadre d&apos;une demande, elles seront traitees avec les garanties renforcees prevues par le RGPD pour les donnees sensibles.</p>
                    </div>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* 4. Bases legales des traitements */}
                <article id="bases-legales">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    4. Bases legales des traitements
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les traitements de donnees personnelles mis en oeuvre par SAS CALEBASSE reposent sur les bases legales suivantes :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong className="text-[#712E2F]">Le consentement (article 6.1.a du RGPD) :</strong> pour l&apos;envoi de communications commerciales (newsletter, prospection), le depot de cookies non essentiels et le traitement eventuel de donnees de sante transmises volontairement.</li>
                      <li><strong className="text-[#712E2F]">L&apos;execution d&apos;un contrat (article 6.1.b du RGPD) :</strong> pour le traitement des commandes, la gestion du compte client et le suivi de la relation contractuelle.</li>
                      <li><strong className="text-[#712E2F]">L&apos;obligation legale (article 6.1.c du RGPD) :</strong> pour la conservation des documents comptables et de facturation conformement a la legislation en vigueur.</li>
                      <li><strong className="text-[#712E2F]">Les interets legitimes (article 6.1.f du RGPD) :</strong> pour l&apos;amelioration du site, la prevention de la fraude et la realisation de statistiques anonymisees.</li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* 5. Finalites des traitements */}
                <article id="finalites">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    5. Finalites des traitements
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Vos donnees personnelles sont collectees et traitees pour les finalites suivantes :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Fourniture et amelioration du contenu et des services du site</li>
                      <li>Creation et gestion de votre compte utilisateur</li>
                      <li>Realisation de statistiques et analyses d&apos;audience</li>
                      <li>Communication et prospection commerciale (avec votre consentement)</li>
                      <li>Gestion des demandes d&apos;informations et de devis</li>
                      <li>Suivi des commandes et gestion de la relation contractuelle</li>
                      <li>Envoi d&apos;emails transactionnels (confirmation de commande, suivi de livraison, etc.)</li>
                      <li>Respect des obligations legales et reglementaires</li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* 6. Durees de conservation */}
                <article id="durees-conservation">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    6. Durees de conservation
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les donnees personnelles sont conservees pendant les durees suivantes :</p>
                    <div className="overflow-x-auto mt-4">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#DCD8C7]">
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Finalite</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Donnees</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Base legale</th>
                            <th className="py-2 text-sm font-semibold text-[#054A57]">Duree</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCD8C7]">
                          <tr>
                            <td className="py-2 pr-4">Analyse du site</td>
                            <td className="py-2 pr-4">Donnees de navigation et d&apos;audience</td>
                            <td className="py-2 pr-4">Consentement</td>
                            <td className="py-2">12 mois</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Communication et prospection</td>
                            <td className="py-2 pr-4">Email, preferences</td>
                            <td className="py-2 pr-4">Consentement</td>
                            <td className="py-2">3 ans apres le dernier contact</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Gestion des prospects</td>
                            <td className="py-2 pr-4">Identification, contact</td>
                            <td className="py-2 pr-4">Interet legitime</td>
                            <td className="py-2">3 ans apres le dernier contact</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Execution des contrats</td>
                            <td className="py-2 pr-4">Donnees clients et commandes</td>
                            <td className="py-2 pr-4">Contrat</td>
                            <td className="py-2">Duree du contrat + prescription legale</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Obligations comptables</td>
                            <td className="py-2 pr-4">Factures, pieces comptables</td>
                            <td className="py-2 pr-4">Obligation legale</td>
                            <td className="py-2">10 ans</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* 7. Destinataires des donnees */}
                <article id="destinataires">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    7. Destinataires des donnees
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-4">
                    <p>Les donnees personnelles collectees peuvent etre communiquees aux destinataires suivants :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong className="text-[#712E2F]">Partenaires et sous-traitants :</strong> prestataires techniques intervenant dans la fourniture des services (hebergement, paiement, envoi d&apos;emails)</li>
                      <li><strong className="text-[#712E2F]">Employes habilites :</strong> personnels de SAS CALEBASSE autorises a traiter les donnees dans le cadre de leurs fonctions</li>
                      <li><strong className="text-[#712E2F]">Autorites judiciaires :</strong> sur requete et dans le cadre d&apos;obligations legales</li>
                    </ul>

                    <p className="mt-4 font-semibold text-[#054A57]">Sous-traitants :</p>
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#DCD8C7]">
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Sous-traitant</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Finalite</th>
                            <th className="py-2 text-sm font-semibold text-[#054A57]">Localisation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCD8C7]">
                          <tr>
                            <td className="py-2 pr-4">Vercel</td>
                            <td className="py-2 pr-4">Hebergement du site</td>
                            <td className="py-2">Etats-Unis</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Neon</td>
                            <td className="py-2 pr-4">Base de donnees</td>
                            <td className="py-2">Etats-Unis</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Stripe</td>
                            <td className="py-2 pr-4">Paiement en ligne</td>
                            <td className="py-2">Etats-Unis</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Brevo (Sendinblue)</td>
                            <td className="py-2 pr-4">Envoi d&apos;emails transactionnels et newsletters</td>
                            <td className="py-2">France / UE</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* 8. Transferts hors UE */}
                <article id="transferts">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    8. Transferts de donnees hors UE
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Certains de nos sous-traitants sont situes en dehors de l&apos;Union europeenne (Etats-Unis). Ces transferts sont encadres par les mecanismes suivants :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong className="text-[#712E2F]">EU-US Data Privacy Framework :</strong> pour les sous-traitants certifies dans le cadre du programme de protection des donnees UE-Etats-Unis.</li>
                      <li><strong className="text-[#712E2F]">Clauses contractuelles types :</strong> clauses adoptees par la Commission europeenne garantissant un niveau de protection adequat des donnees transferees.</li>
                      <li><strong className="text-[#712E2F]">Autres garanties :</strong> mesures supplementaires (chiffrement, pseudonymisation) mises en place lorsque necessaire pour assurer la protection des donnees.</li>
                    </ul>
                    <div className="bg-[#FEF9E9] border border-[#DCD8C7] rounded-lg p-4 mt-4">
                      <p><strong className="text-[#712E2F]">Donnees de sante :</strong> aucune donnee de sante ne fait l&apos;objet d&apos;un transfert en dehors de l&apos;Union europeenne.</p>
                    </div>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* 9. Vos droits */}
                <article id="droits">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    9. Vos droits
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-4">
                    <p>Conformement au RGPD et a la loi Informatique et Libertes, vous disposez des droits suivants concernant vos donnees personnelles :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong className="text-[#712E2F]">Droit d&apos;acces :</strong> obtenir la confirmation que vos donnees sont traitees et en obtenir une copie.</li>
                      <li><strong className="text-[#712E2F]">Droit de rectification :</strong> corriger vos donnees inexactes ou incompletes.</li>
                      <li><strong className="text-[#712E2F]">Droit d&apos;opposition :</strong> vous opposer au traitement de vos donnees pour des motifs legitimes, ou a la prospection commerciale.</li>
                      <li><strong className="text-[#712E2F]">Droit a l&apos;effacement :</strong> demander la suppression de vos donnees lorsqu&apos;elles ne sont plus necessaires aux finalites pour lesquelles elles ont ete collectees.</li>
                      <li><strong className="text-[#712E2F]">Droit a la limitation :</strong> obtenir la limitation du traitement dans certains cas prevus par le RGPD.</li>
                      <li><strong className="text-[#712E2F]">Droit a la portabilite :</strong> recevoir vos donnees dans un format structure, couramment utilise et lisible par machine.</li>
                      <li><strong className="text-[#712E2F]">Droit de retrait du consentement :</strong> retirer votre consentement a tout moment, sans affecter la liceite du traitement effectue avant le retrait.</li>
                      <li><strong className="text-[#712E2F]">Droit de reclamation :</strong> introduire une reclamation aupres de la CNIL — <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">www.cnil.fr</a> — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.</li>
                      <li><strong className="text-[#712E2F]">Directives post-mortem :</strong> definir des directives relatives au sort de vos donnees personnelles apres votre deces.</li>
                    </ul>

                    <div className="mt-4">
                      <p className="font-semibold text-[#054A57] mb-2">Comment exercer vos droits :</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Par email : <a href="mailto:contact@remedes-mamie.com" className="text-[#A2211E] hover:underline">contact@remedes-mamie.com</a></li>
                        <li>Par courrier : SAS CALEBASSE, 15 rue de la Vistule, 75013 Paris</li>
                      </ul>
                    </div>

                    <p>Nous nous engageons a repondre a votre demande dans un delai d&apos;un (1) mois a compter de sa reception. Ce delai peut etre prolonge de deux (2) mois supplementaires en cas de demande complexe ou de nombre eleve de demandes, auquel cas vous en serez informe.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* 10. Sites tiers */}
                <article id="sites-tiers">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    10. Sites tiers
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Le site peut contenir des liens hypertextes redirigeant vers des sites internet tiers. SAS CALEBASSE ne controle pas le contenu ni les pratiques de confidentialite de ces sites et ne saurait etre tenue responsable de leur politique de protection des donnees.</p>
                    <p>Nous vous invitons a consulter les politiques de confidentialite de chaque site tiers que vous visitez depuis notre site.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* 11. Securite */}
                <article id="securite">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    11. Securite
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>SAS CALEBASSE met en oeuvre des mesures techniques et organisationnelles appropriees pour garantir la securite et la confidentialite des donnees personnelles collectees, et notamment pour empecher qu&apos;elles soient deformees, endommagees ou que des tiers non autorises y aient acces.</p>
                    <p>Nos sous-traitants sont selectionnes avec soin et doivent presenter des garanties suffisantes quant a la mise en oeuvre de mesures techniques et organisationnelles appropriees, de maniere a ce que le traitement reponde aux exigences du RGPD.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* 12. Cookies */}
                <article id="cookies">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    12. Cookies
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Pour plus d&apos;informations sur l&apos;utilisation des cookies sur notre site, veuillez consulter notre <a href={`/${locale}/politique-cookies`} className="text-[#A2211E] hover:underline">Politique de cookies</a>.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* 13. Modification de la politique */}
                <article id="modification">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    13. Modification de la politique de confidentialite
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>SAS CALEBASSE se reserve le droit de modifier la presente politique de confidentialite a tout moment. Les modifications prendront effet des leur publication sur le site.</p>
                    <p>En cas de modification substantielle, nous vous en informerons par un bandeau d&apos;information sur le site ou par email si vous nous avez communique votre adresse electronique.</p>
                    <p>Nous vous invitons a consulter regulierement cette page pour prendre connaissance de toute mise a jour.</p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
