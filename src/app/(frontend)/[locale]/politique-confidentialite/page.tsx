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
  { id: 'responsable', label: 'Responsable du traitement' },
  { id: 'donnees-collectees', label: 'Donnees collectees' },
  { id: 'finalites', label: 'Finalites' },
  { id: 'base-legale', label: 'Base legale' },
  { id: 'durees-conservation', label: 'Durees de conservation' },
  { id: 'sous-traitants', label: 'Sous-traitants' },
  { id: 'droits', label: 'Vos droits' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'transferts', label: 'Transferts de donnees' },
  { id: 'contact-dpo', label: 'Contact DPO' },
]

export default async function PolitiqueConfidentialitePage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <section className="py-2xl">
      <div className="max-w-7xl mx-auto px-lg">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: 'Politique de confidentialite' },
          ]}
        />

        <div className="mt-xl flex gap-2xl">
          {/* Sidebar navigation */}
          <aside className="hidden lg:block w-[240px] flex-shrink-0">
            <nav className="sticky top-[100px]">
              <ul className="space-y-xs">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block font-ui text-body-sm text-neutral-400 hover:text-brand transition-colors duration-200 py-xs px-md rounded-lg hover:bg-brand-light/30"
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
            <div className="bg-white rounded-xl p-2xl shadow-sm max-w-3xl">
              <h1 className="font-heading text-h1 text-neutral-600 mb-md">
                Politique de confidentialite
              </h1>
              <p className="font-body text-body-sm text-neutral-300 mb-2xl">
                Derniere mise a jour : 16 avril 2026
              </p>

              <div className="space-y-2xl">
                <article id="responsable">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Responsable du traitement
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Le responsable du traitement des donnees personnelles est :</p>
                    <p><strong className="text-neutral-500">SAS CALEBASSE</strong></p>
                    <p>15 rue de la Vistule, 75013 Paris, France</p>
                    <p>RCS Paris B 415 228 311</p>
                    <p>Email : <a href="mailto:contact@remedes-mamie.com" className="text-brand hover:underline">contact@remedes-mamie.com</a></p>
                  </div>
                </article>

                <article id="donnees-collectees">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Donnees collectees
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Dans le cadre de l&apos;utilisation du site et des services, nous pouvons collecter les donnees suivantes :</p>
                    <ul className="list-disc list-inside space-y-xs ml-md">
                      <li><strong className="text-neutral-500">Donnees d&apos;identification :</strong> nom, prenom, adresse email, adresse postale, numero de telephone</li>
                      <li><strong className="text-neutral-500">Donnees de commande :</strong> historique d&apos;achat, adresse de livraison, adresse de facturation</li>
                      <li><strong className="text-neutral-500">Donnees de paiement :</strong> traitees directement par Stripe, non stockees sur nos serveurs</li>
                      <li><strong className="text-neutral-500">Donnees de navigation :</strong> pages visitees, duree de visite (via Plausible Analytics, sans cookies)</li>
                      <li><strong className="text-neutral-500">Donnees de communication :</strong> messages envoyes via le formulaire de contact, inscriptions newsletter</li>
                    </ul>
                  </div>
                </article>

                <article id="finalites">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Finalites du traitement
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Vos donnees sont collectees pour les finalites suivantes :</p>
                    <ul className="list-disc list-inside space-y-xs ml-md">
                      <li>Gestion des commandes et livraisons</li>
                      <li>Gestion de la relation client et du service apres-vente</li>
                      <li>Envoi de communications commerciales (newsletter, avec consentement)</li>
                      <li>Amelioration du site et de l&apos;experience utilisateur</li>
                      <li>Respect des obligations legales et comptables</li>
                    </ul>
                  </div>
                </article>

                <article id="base-legale">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Base legale des traitements
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Les traitements de donnees sont fondes sur :</p>
                    <ul className="list-disc list-inside space-y-xs ml-md">
                      <li><strong className="text-neutral-500">L&apos;execution du contrat</strong> : pour le traitement des commandes</li>
                      <li><strong className="text-neutral-500">Le consentement</strong> : pour l&apos;envoi de newsletters et les cookies non essentiels</li>
                      <li><strong className="text-neutral-500">L&apos;interet legitime</strong> : pour l&apos;amelioration du site et la prevention de la fraude</li>
                      <li><strong className="text-neutral-500">L&apos;obligation legale</strong> : pour la conservation des factures et documents comptables</li>
                    </ul>
                  </div>
                </article>

                <article id="durees-conservation">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Durees de conservation
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Les donnees personnelles sont conservees pendant les durees suivantes :</p>
                    <ul className="list-disc list-inside space-y-xs ml-md">
                      <li><strong className="text-neutral-500">Donnees clients</strong> : 3 ans apres la derniere commande</li>
                      <li><strong className="text-neutral-500">Donnees de prospects</strong> : 3 ans apres le dernier contact</li>
                      <li><strong className="text-neutral-500">Donnees de facturation</strong> : 10 ans (obligation legale)</li>
                      <li><strong className="text-neutral-500">Donnees de navigation</strong> : 13 mois maximum</li>
                    </ul>
                  </div>
                </article>

                <article id="sous-traitants">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Sous-traitants
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Nous faisons appel aux sous-traitants suivants pour le traitement de vos donnees :</p>
                    <div className="overflow-x-auto mt-md">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-100">
                            <th className="py-sm pr-md font-ui text-body-sm text-neutral-500">Sous-traitant</th>
                            <th className="py-sm pr-md font-ui text-body-sm text-neutral-500">Finalite</th>
                            <th className="py-sm font-ui text-body-sm text-neutral-500">Localisation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                          <tr>
                            <td className="py-sm pr-md">Vercel</td>
                            <td className="py-sm pr-md">Hebergement du site</td>
                            <td className="py-sm">Etats-Unis</td>
                          </tr>
                          <tr>
                            <td className="py-sm pr-md">Neon</td>
                            <td className="py-sm pr-md">Base de donnees</td>
                            <td className="py-sm">Etats-Unis / UE</td>
                          </tr>
                          <tr>
                            <td className="py-sm pr-md">Stripe</td>
                            <td className="py-sm pr-md">Traitement des paiements</td>
                            <td className="py-sm">Etats-Unis / Irlande</td>
                          </tr>
                          <tr>
                            <td className="py-sm pr-md">Brevo</td>
                            <td className="py-sm pr-md">Envoi d&apos;emails transactionnels et newsletters</td>
                            <td className="py-sm">France</td>
                          </tr>
                          <tr>
                            <td className="py-sm pr-md">Plausible Analytics</td>
                            <td className="py-sm pr-md">Analyse d&apos;audience (sans cookies)</td>
                            <td className="py-sm">Union europeenne</td>
                          </tr>
                          <tr>
                            <td className="py-sm pr-md">Sentry</td>
                            <td className="py-sm pr-md">Suivi des erreurs techniques</td>
                            <td className="py-sm">Etats-Unis</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </article>

                <article id="droits">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Vos droits
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Conformement au RGPD, vous disposez des droits suivants concernant vos donnees personnelles :</p>
                    <ul className="list-disc list-inside space-y-xs ml-md">
                      <li><strong className="text-neutral-500">Droit d&apos;acces</strong> : obtenir la confirmation que vos donnees sont traitees et en obtenir une copie</li>
                      <li><strong className="text-neutral-500">Droit de rectification</strong> : corriger vos donnees inexactes ou incompletes</li>
                      <li><strong className="text-neutral-500">Droit a l&apos;effacement</strong> : demander la suppression de vos donnees</li>
                      <li><strong className="text-neutral-500">Droit a la limitation</strong> : limiter le traitement de vos donnees</li>
                      <li><strong className="text-neutral-500">Droit a la portabilite</strong> : recevoir vos donnees dans un format structure</li>
                      <li><strong className="text-neutral-500">Droit d&apos;opposition</strong> : vous opposer au traitement de vos donnees</li>
                    </ul>
                    <p className="mt-md">Pour exercer vos droits, contactez-nous a : <a href="mailto:dpo@remedes-mamie.com" className="text-brand hover:underline">dpo@remedes-mamie.com</a></p>
                    <p>Vous pouvez egalement introduire une reclamation aupres de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">www.cnil.fr</a></p>
                  </div>
                </article>

                <article id="cookies">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Cookies
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Pour plus d&apos;informations sur l&apos;utilisation des cookies, consultez notre <a href={`/${locale}/politique-cookies`} className="text-brand hover:underline">Politique de cookies</a>.</p>
                  </div>
                </article>

                <article id="transferts">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Transferts de donnees hors UE
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Certains de nos sous-traitants sont situes en dehors de l&apos;Union europeenne (Etats-Unis). Ces transferts sont encadres par :</p>
                    <ul className="list-disc list-inside space-y-xs ml-md">
                      <li>Le EU-US Data Privacy Framework pour les sous-traitants certifies</li>
                      <li>Des clauses contractuelles types approuvees par la Commission europeenne</li>
                    </ul>
                  </div>
                </article>

                <article id="contact-dpo">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Contact DPO
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Pour toute question relative a la protection de vos donnees personnelles, vous pouvez contacter notre Delegue a la Protection des Donnees :</p>
                    <p>Email : <a href="mailto:dpo@remedes-mamie.com" className="text-brand hover:underline">dpo@remedes-mamie.com</a></p>
                    <p>Adresse : SAS CALEBASSE — DPO, 15 rue de la Vistule, 75013 Paris, France</p>
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
