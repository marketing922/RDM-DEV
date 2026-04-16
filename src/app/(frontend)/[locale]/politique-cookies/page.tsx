import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/server'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return {
    title: 'Politique de cookies',
    description: `Politique de cookies du site ${dict.meta.siteName}`,
  }
}

const sections = [
  { id: 'definition', label: "Qu'est-ce qu'un cookie ou traceur ?" },
  { id: 'cookies-necessaires', label: 'Cookies strictement nécessaires' },
  { id: 'cookies-statistiques', label: 'Cookies statistiques' },
  { id: 'cookies-marketing', label: 'Cookies marketing' },
  { id: 'finalites', label: 'Finalités des cookies' },
  { id: 'gestion', label: 'Configurer vos préférences' },
  { id: 'cookies-tiers', label: 'Cookies tiers' },
  { id: 'en-savoir-plus', label: 'En savoir plus' },
]

export default async function PolitiqueCookiesPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <section className="py-16 bg-[#FEF9E9]">
      <div className="max-w-7xl mx-auto px-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: 'Politique de cookies' },
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
              <h1 className="text-3xl font-bold text-[#054A57] mb-2">
                Politique de cookies
              </h1>
              <p className="text-sm text-[#712E2F]/60 mb-10">
                Dernière mise à jour : avril 2026
              </p>

              <div className="space-y-10">
                {/* Section 1 — Définition */}
                <article id="definition">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Qu&apos;est-ce qu&apos;un cookie ou traceur ?
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Un cookie est une information déposée sur votre terminal (ordinateur, tablette, smartphone) par le serveur du site visité. Il permet au site de mémoriser des informations relatives à votre navigation.</p>
                    <p>Il existe deux types de cookies :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong className="text-[#712E2F]">Les cookies de session</strong> : ils disparaissent dès que vous quittez le site.</li>
                      <li><strong className="text-[#712E2F]">Les cookies permanents</strong> : ils restent sur votre terminal jusqu&apos;à leur date d&apos;expiration ou jusqu&apos;à ce que vous les supprimiez manuellement.</li>
                    </ul>
                    <p>Des pixels invisibles (également appelés « balises web ») peuvent aussi être utilisés à des fins similaires.</p>
                    <p>Le terme « cookie » utilisé dans la présente politique recouvre l&apos;ensemble des traceurs suivants : cookies HTTP, cookies Flash, pixels invisibles ou « web bugs », et tout identifiant généré par un logiciel ou un système d&apos;exploitation.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* Section 2 — Cookies strictement nécessaires */}
                <article id="cookies-necessaires">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Cookies strictement nécessaires
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés. Ils sont déposés sur la base de l&apos;intérêt légitime de la SAS CALEBASSE.</p>
                    <div className="overflow-x-auto mt-4">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#DCD8C7]">
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Nom</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Opérateur</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Finalité</th>
                            <th className="py-2 text-sm font-semibold text-[#054A57]">Durée</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCD8C7]">
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">tarteaucitron</td>
                            <td className="py-2 pr-4">Tarteaucitron</td>
                            <td className="py-2 pr-4">Mémorisation du choix de consentement</td>
                            <td className="py-2">12 mois</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">PHPSESSID / session</td>
                            <td className="py-2 pr-4">Site</td>
                            <td className="py-2 pr-4">Session de navigation</td>
                            <td className="py-2">Session</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* Section 3 — Cookies statistiques */}
                <article id="cookies-statistiques">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Cookies statistiques (mesure d&apos;audience)
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Ces cookies nous permettent de comprendre comment les visiteurs interagissent avec le site. Leur dépôt est soumis à votre <strong className="text-[#712E2F]">consentement</strong>.</p>

                    <h3 className="text-base font-semibold text-[#054A57] mt-6 mb-2">Google Analytics</h3>
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#DCD8C7]">
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Nom</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Opérateur</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Finalité</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Durée</th>
                            <th className="py-2 text-sm font-semibold text-[#054A57]">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCD8C7]">
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_ga</td>
                            <td className="py-2 pr-4">Google Analytics</td>
                            <td className="py-2 pr-4">Distinction des utilisateurs</td>
                            <td className="py-2 pr-4">2 ans</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_ga_*</td>
                            <td className="py-2 pr-4">Google Analytics</td>
                            <td className="py-2 pr-4">Persistance de l&apos;état de session</td>
                            <td className="py-2 pr-4">2 ans</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_gid</td>
                            <td className="py-2 pr-4">Google Analytics</td>
                            <td className="py-2 pr-4">Distinction des utilisateurs</td>
                            <td className="py-2 pr-4">24 heures</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_gat</td>
                            <td className="py-2 pr-4">Google Analytics</td>
                            <td className="py-2 pr-4">Limitation du taux de requêtes</td>
                            <td className="py-2 pr-4">1 minute</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">collect</td>
                            <td className="py-2 pr-4">Google Analytics</td>
                            <td className="py-2 pr-4">Envoi de données d&apos;analyse</td>
                            <td className="py-2 pr-4">Session</td>
                            <td className="py-2">Pixel</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h3 className="text-base font-semibold text-[#054A57] mt-6 mb-2">Microsoft Clarity</h3>
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#DCD8C7]">
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Nom</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Opérateur</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Finalité</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Durée</th>
                            <th className="py-2 text-sm font-semibold text-[#054A57]">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCD8C7]">
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_clck</td>
                            <td className="py-2 pr-4">Microsoft Clarity</td>
                            <td className="py-2 pr-4">Identifiant utilisateur Clarity</td>
                            <td className="py-2 pr-4">1 an</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_clsk</td>
                            <td className="py-2 pr-4">Microsoft Clarity</td>
                            <td className="py-2 pr-4">Connexion des pages vues en session</td>
                            <td className="py-2 pr-4">1 jour</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_cltk</td>
                            <td className="py-2 pr-4">Microsoft Clarity</td>
                            <td className="py-2 pr-4">Token de session Clarity</td>
                            <td className="py-2 pr-4">Session</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">CLID</td>
                            <td className="py-2 pr-4">Microsoft Clarity</td>
                            <td className="py-2 pr-4">Identifiant utilisateur unique</td>
                            <td className="py-2 pr-4">1 an</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">c.gif</td>
                            <td className="py-2 pr-4">Microsoft Clarity</td>
                            <td className="py-2 pr-4">Collecte de données de session</td>
                            <td className="py-2 pr-4">Session</td>
                            <td className="py-2">Pixel</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h3 className="text-base font-semibold text-[#054A57] mt-6 mb-2">Hotjar</h3>
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#DCD8C7]">
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Nom</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Opérateur</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Finalité</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Durée</th>
                            <th className="py-2 text-sm font-semibold text-[#054A57]">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCD8C7]">
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_hjAbsoluteSessionInProgress</td>
                            <td className="py-2 pr-4">Hotjar</td>
                            <td className="py-2 pr-4">Détection de la première session</td>
                            <td className="py-2 pr-4">1 jour</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_hjFirstSeen</td>
                            <td className="py-2 pr-4">Hotjar</td>
                            <td className="py-2 pr-4">Identification première visite</td>
                            <td className="py-2 pr-4">1 jour</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_hjIncludedInSessionSample_*</td>
                            <td className="py-2 pr-4">Hotjar</td>
                            <td className="py-2 pr-4">Échantillonnage de session</td>
                            <td className="py-2 pr-4">1 jour</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_hjSession_*</td>
                            <td className="py-2 pr-4">Hotjar</td>
                            <td className="py-2 pr-4">Données de session</td>
                            <td className="py-2 pr-4">1 jour</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_hjSessionUser_*</td>
                            <td className="py-2 pr-4">Hotjar</td>
                            <td className="py-2 pr-4">Identifiant utilisateur Hotjar</td>
                            <td className="py-2 pr-4">1 an</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* Section 4 — Cookies marketing */}
                <article id="cookies-marketing">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Cookies marketing (publicité ciblée)
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Ces cookies sont utilisés pour suivre les visiteurs sur les sites web afin d&apos;afficher des publicités pertinentes. Leur dépôt est soumis à votre <strong className="text-[#712E2F]">consentement</strong>.</p>

                    <h3 className="text-base font-semibold text-[#054A57] mt-6 mb-2">Meta / Facebook</h3>
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#DCD8C7]">
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Nom</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Opérateur</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Finalité</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Durée</th>
                            <th className="py-2 text-sm font-semibold text-[#054A57]">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCD8C7]">
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_fbp</td>
                            <td className="py-2 pr-4">Meta / Facebook</td>
                            <td className="py-2 pr-4">Suivi publicitaire Facebook</td>
                            <td className="py-2 pr-4">3 mois</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_fbc</td>
                            <td className="py-2 pr-4">Meta / Facebook</td>
                            <td className="py-2 pr-4">Attribution des clics publicitaires</td>
                            <td className="py-2 pr-4">3 mois</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">fr</td>
                            <td className="py-2 pr-4">Meta / Facebook</td>
                            <td className="py-2 pr-4">Publicité ciblée Facebook</td>
                            <td className="py-2 pr-4">3 mois</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h3 className="text-base font-semibold text-[#054A57] mt-6 mb-2">Microsoft Bing</h3>
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#DCD8C7]">
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Nom</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Opérateur</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Finalité</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Durée</th>
                            <th className="py-2 text-sm font-semibold text-[#054A57]">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCD8C7]">
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_uetsid</td>
                            <td className="py-2 pr-4">Microsoft Bing</td>
                            <td className="py-2 pr-4">Suivi publicitaire Bing</td>
                            <td className="py-2 pr-4">1 jour</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_uetsid_exp</td>
                            <td className="py-2 pr-4">Microsoft Bing</td>
                            <td className="py-2 pr-4">Expiration de _uetsid</td>
                            <td className="py-2 pr-4">Persistant</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_uetvid</td>
                            <td className="py-2 pr-4">Microsoft Bing</td>
                            <td className="py-2 pr-4">Suivi multi-session Bing</td>
                            <td className="py-2 pr-4">1 an</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">_uetvid_exp</td>
                            <td className="py-2 pr-4">Microsoft Bing</td>
                            <td className="py-2 pr-4">Expiration de _uetvid</td>
                            <td className="py-2 pr-4">Persistant</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">MR</td>
                            <td className="py-2 pr-4">Microsoft Bing</td>
                            <td className="py-2 pr-4">Suivi de conversion</td>
                            <td className="py-2 pr-4">7 jours</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">SRM_B</td>
                            <td className="py-2 pr-4">Microsoft Bing</td>
                            <td className="py-2 pr-4">Identifiant Bing Ads</td>
                            <td className="py-2 pr-4">1 an</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h3 className="text-base font-semibold text-[#054A57] mt-6 mb-2">Microsoft Clarity</h3>
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#DCD8C7]">
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Nom</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Opérateur</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Finalité</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Durée</th>
                            <th className="py-2 text-sm font-semibold text-[#054A57]">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCD8C7]">
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">ANONCHK</td>
                            <td className="py-2 pr-4">Microsoft Clarity</td>
                            <td className="py-2 pr-4">Vérification anti-bot</td>
                            <td className="py-2 pr-4">1 jour</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">MUID</td>
                            <td className="py-2 pr-4">Microsoft Clarity</td>
                            <td className="py-2 pr-4">Identifiant utilisateur Microsoft</td>
                            <td className="py-2 pr-4">1 an</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">SM</td>
                            <td className="py-2 pr-4">Microsoft Clarity</td>
                            <td className="py-2 pr-4">Synchronisation identifiant</td>
                            <td className="py-2 pr-4">Session</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h3 className="text-base font-semibold text-[#054A57] mt-6 mb-2">Taboola</h3>
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#DCD8C7]">
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Nom</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Opérateur</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Finalité</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Durée</th>
                            <th className="py-2 text-sm font-semibold text-[#054A57]">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCD8C7]">
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">eng_mt</td>
                            <td className="py-2 pr-4">Taboola</td>
                            <td className="py-2 pr-4">Suivi publicitaire Taboola</td>
                            <td className="py-2 pr-4">Persistant</td>
                            <td className="py-2">Cookie</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h3 className="text-base font-semibold text-[#054A57] mt-6 mb-2">Google Ads</h3>
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#DCD8C7]">
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Nom</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Opérateur</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Finalité</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Durée</th>
                            <th className="py-2 text-sm font-semibold text-[#054A57]">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCD8C7]">
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">pagead/landing</td>
                            <td className="py-2 pr-4">Google Ads</td>
                            <td className="py-2 pr-4">Mesure de conversion publicitaire</td>
                            <td className="py-2 pr-4">Session</td>
                            <td className="py-2">Pixel</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* Section 5 — Finalités des cookies */}
                <article id="finalites">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Finalités des cookies
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p><strong className="text-[#712E2F]">Cookies techniques (intérêt légitime) :</strong></p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Maintien de la connexion et de la session de navigation</li>
                      <li>Affichage correct du site</li>
                      <li>Mémorisation des préférences cookies (consentement)</li>
                    </ul>
                    <p className="mt-4"><strong className="text-[#712E2F]">Cookies soumis à consentement :</strong></p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Mesure d&apos;audience et analyse du comportement des visiteurs</li>
                      <li>Mémorisation des préférences utilisateur</li>
                      <li>Fonctionnement des formulaires</li>
                      <li>Gestion des espaces personnels</li>
                      <li>Publicité ciblée et personnalisée</li>
                      <li>Mesure de la performance publicitaire</li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* Section 6 — Gestion des préférences */}
                <article id="gestion">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Comment configurer vos préférences ?
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p><strong className="text-[#712E2F]">Via le panneau de gestion des cookies :</strong></p>
                    <p>Vous pouvez à tout moment modifier vos choix en cliquant sur le bouton « Gérer mes cookies » situé en bas de chaque page, ou en cliquant sur le lien ci-dessous :</p>
                    <p className="mt-2">
                      <a href="#tarteaucitron" className="text-[#A2211E] hover:underline">Ouvrir le panneau de gestion des cookies</a>
                    </p>

                    <p className="mt-4"><strong className="text-[#712E2F]">Via les paramètres de votre navigateur :</strong></p>
                    <p>Vous pouvez configurer votre navigateur pour enregistrer les cookies, les refuser systématiquement, ou être averti avant d&apos;accepter un cookie.</p>
                    <p><strong className="text-[#712E2F]">Attention :</strong> le refus de certains cookies peut affecter le bon fonctionnement du site.</p>

                    <p className="mt-4">Liens utiles pour gérer les cookies dans votre navigateur :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Google Chrome</a></li>
                      <li><a href="https://www.apple.com/legal/privacy/fr-ww/cookies" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Safari</a></li>
                      <li><a href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Mozilla Firefox</a></li>
                      <li><a href="https://support.microsoft.com/fr-fr/help/4468242" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Microsoft Edge</a></li>
                      <li><a href="https://help.opera.com" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Opera</a></li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* Section 7 — Cookies tiers */}
                <article id="cookies-tiers">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Cookies tiers
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Certains cookies sont déposés par des sociétés tierces lors de votre interaction avec des éléments de notre site (vidéos, boutons de partage, publicités, etc.).</p>
                    <p>La SAS CALEBASSE ne contrôle pas l&apos;utilisation de ces cookies par ces tiers. Nous vous invitons à consulter leurs politiques de cookies respectives :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Google</a></li>
                      <li><a href="https://www.facebook.com/policies/cookies/" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Meta / Facebook</a></li>
                      <li><a href="https://privacy.microsoft.com/fr-fr/privacystatement" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Microsoft</a></li>
                      <li><a href="https://www.hotjar.com/legal/policies/cookie-information/" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Hotjar</a></li>
                      <li><a href="https://www.taboola.com/policies/cookie-policy" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Taboola</a></li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                {/* Section 8 — En savoir plus */}
                <article id="en-savoir-plus">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    En savoir plus
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Pour en savoir plus sur les cookies et les traceurs, vous pouvez consulter le site de la CNIL :</p>
                    <p>
                      <a href="https://www.cnil.fr/fr/cookies-et-autres-traceurs" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">https://www.cnil.fr/fr/cookies-et-autres-traceurs</a>
                    </p>
                    <p className="mt-4">Consultez également notre <a href={`/${locale}/politique-confidentialite`} className="text-[#A2211E] hover:underline">Politique de Confidentialité</a> pour plus d&apos;informations sur la protection de vos données personnelles.</p>
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
