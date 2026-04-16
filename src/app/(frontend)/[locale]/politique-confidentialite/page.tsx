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
                Derniere mise a jour : 16 avril 2026
              </p>

              <div className="space-y-10">
                <article id="responsable">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Responsable du traitement
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Le responsable du traitement des donnees personnelles est :</p>
                    <p><strong className="text-[#712E2F]">SAS CALEBASSE</strong></p>
                    <p>15 rue de la Vistule, 75013 Paris, France</p>
                    <p>RCS Paris B 415 228 311</p>
                    <p>Email : <a href="mailto:contact@remedes-mamie.com" className="text-[#A2211E] hover:underline">contact@remedes-mamie.com</a></p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="donnees-collectees">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Donnees collectees
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Dans le cadre de l&apos;utilisation du site et des services, nous pouvons collecter les donnees suivantes :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong className="text-[#712E2F]">Donnees d&apos;identification :</strong> nom, prenom, adresse email</li>
                      <li><strong className="text-[#712E2F]">Donnees de navigation :</strong> pages visitees, duree de visite (via Plausible Analytics, sans cookies)</li>
                      <li><strong className="text-[#712E2F]">Donnees de communication :</strong> messages envoyes via le formulaire de contact, inscriptions newsletter</li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="finalites">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Finalites du traitement
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Vos donnees sont collectees pour les finalites suivantes :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Gestion de la relation utilisateur</li>
                      <li>Envoi de communications (newsletter, avec consentement)</li>
                      <li>Amelioration du site et de l&apos;experience utilisateur</li>
                      <li>Respect des obligations legales</li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="base-legale">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Base legale des traitements
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les traitements de donnees sont fondes sur :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong className="text-[#712E2F]">Le consentement</strong> : pour l&apos;envoi de newsletters et les cookies non essentiels</li>
                      <li><strong className="text-[#712E2F]">L&apos;interet legitime</strong> : pour l&apos;amelioration du site et la prevention de la fraude</li>
                      <li><strong className="text-[#712E2F]">L&apos;obligation legale</strong> : pour la conservation des documents comptables</li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="durees-conservation">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Durees de conservation
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les donnees personnelles sont conservees pendant les durees suivantes :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong className="text-[#712E2F]">Donnees utilisateurs</strong> : 3 ans apres le dernier contact</li>
                      <li><strong className="text-[#712E2F]">Donnees de prospects</strong> : 3 ans apres le dernier contact</li>
                      <li><strong className="text-[#712E2F]">Donnees de navigation</strong> : 13 mois maximum</li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="sous-traitants">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Sous-traitants
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Nous faisons appel aux sous-traitants suivants pour le traitement de vos donnees :</p>
                    <div className="overflow-x-auto mt-4">
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
                            <td className="py-2">Etats-Unis / UE</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Brevo</td>
                            <td className="py-2 pr-4">Envoi d&apos;emails transactionnels et newsletters</td>
                            <td className="py-2">France</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Plausible Analytics</td>
                            <td className="py-2 pr-4">Analyse d&apos;audience (sans cookies)</td>
                            <td className="py-2">Union europeenne</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Sentry</td>
                            <td className="py-2 pr-4">Suivi des erreurs techniques</td>
                            <td className="py-2">Etats-Unis</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="droits">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Vos droits
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Conformement au RGPD, vous disposez des droits suivants concernant vos donnees personnelles :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong className="text-[#712E2F]">Droit d&apos;acces</strong> : obtenir la confirmation que vos donnees sont traitees et en obtenir une copie</li>
                      <li><strong className="text-[#712E2F]">Droit de rectification</strong> : corriger vos donnees inexactes ou incompletes</li>
                      <li><strong className="text-[#712E2F]">Droit a l&apos;effacement</strong> : demander la suppression de vos donnees</li>
                      <li><strong className="text-[#712E2F]">Droit a la limitation</strong> : limiter le traitement de vos donnees</li>
                      <li><strong className="text-[#712E2F]">Droit a la portabilite</strong> : recevoir vos donnees dans un format structure</li>
                      <li><strong className="text-[#712E2F]">Droit d&apos;opposition</strong> : vous opposer au traitement de vos donnees</li>
                    </ul>
                    <p className="mt-4">Pour exercer vos droits, contactez-nous a : <a href="mailto:dpo@remedes-mamie.com" className="text-[#A2211E] hover:underline">dpo@remedes-mamie.com</a></p>
                    <p>Vous pouvez egalement introduire une reclamation aupres de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">www.cnil.fr</a></p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="cookies">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Cookies
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Pour plus d&apos;informations sur l&apos;utilisation des cookies, consultez notre <a href={`/${locale}/politique-cookies`} className="text-[#A2211E] hover:underline">Politique de cookies</a>.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="transferts">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Transferts de donnees hors UE
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Certains de nos sous-traitants sont situes en dehors de l&apos;Union europeenne (Etats-Unis). Ces transferts sont encadres par :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Le EU-US Data Privacy Framework pour les sous-traitants certifies</li>
                      <li>Des clauses contractuelles types approuvees par la Commission europeenne</li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="contact-dpo">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Contact DPO
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Pour toute question relative a la protection de vos donnees personnelles, vous pouvez contacter notre Delegue a la Protection des Donnees :</p>
                    <p>Email : <a href="mailto:dpo@remedes-mamie.com" className="text-[#A2211E] hover:underline">dpo@remedes-mamie.com</a></p>
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
