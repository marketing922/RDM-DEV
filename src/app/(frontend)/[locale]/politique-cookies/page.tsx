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
  { id: 'definition', label: "Qu'est-ce qu'un cookie" },
  { id: 'cookies-utilises', label: 'Cookies utilises' },
  { id: 'plausible', label: 'Plausible Analytics' },
  { id: 'gestion', label: 'Gestion des preferences' },
  { id: 'contact', label: 'Contact' },
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
              <h1 className="text-3xl font-bold text-[#054A57] mb-4">
                Politique de cookies
              </h1>
              <p className="text-sm text-[#712E2F]/60 mb-10">
                Derniere mise a jour : 16 avril 2026
              </p>

              <div className="space-y-10">
                <article id="definition">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Qu&apos;est-ce qu&apos;un cookie ?
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Un cookie est un petit fichier texte depose sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d&apos;un site web. Il permet au site de memoriser des informations sur votre visite, comme votre langue preferee et d&apos;autres parametres, afin de faciliter votre prochaine visite et de rendre le site plus utile.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="cookies-utilises">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Cookies utilises sur ce site
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Voici la liste des cookies utilises sur le site remedes-mamie.com :</p>
                    <div className="overflow-x-auto mt-4">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#DCD8C7]">
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Nom</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Finalite</th>
                            <th className="py-2 pr-4 text-sm font-semibold text-[#054A57]">Duree</th>
                            <th className="py-2 text-sm font-semibold text-[#054A57]">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCD8C7]">
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">locale</td>
                            <td className="py-2 pr-4">Preference de langue</td>
                            <td className="py-2 pr-4">1 an</td>
                            <td className="py-2">Essentiel</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">session</td>
                            <td className="py-2 pr-4">Authentification utilisateur</td>
                            <td className="py-2 pr-4">Session</td>
                            <td className="py-2">Essentiel</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-mono text-xs">cookie-consent</td>
                            <td className="py-2 pr-4">Memorisation du choix cookies</td>
                            <td className="py-2 pr-4">13 mois</td>
                            <td className="py-2">Essentiel</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="plausible">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Plausible Analytics
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Nous utilisons <strong className="text-[#712E2F]">Plausible Analytics</strong> pour mesurer l&apos;audience de notre site. Plausible est une solution d&apos;analyse respectueuse de la vie privee qui fonctionne <strong className="text-[#712E2F]">sans cookies</strong> et sans collecte de donnees personnelles.</p>
                    <p>Plausible ne depose aucun cookie sur votre terminal, ne collecte pas votre adresse IP et ne vous identifie pas entre les sessions. Les donnees collectees sont anonymes et agregees.</p>
                    <p>Plausible est heberge dans l&apos;Union europeenne et est conforme au RGPD. L&apos;utilisation de Plausible ne necessite pas de consentement prealable au titre de la directive ePrivacy.</p>
                    <p>Plus d&apos;informations : <a href="https://plausible.io/data-policy" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">https://plausible.io/data-policy</a></p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="gestion">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Gestion des preferences
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Vous pouvez a tout moment gerer vos preferences en matiere de cookies :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong className="text-[#712E2F]">Bandeau cookies</strong> : lors de votre premiere visite, un bandeau vous permet d&apos;accepter ou de refuser les cookies non essentiels.</li>
                      <li><strong className="text-[#712E2F]">Parametres du navigateur</strong> : vous pouvez configurer votre navigateur pour bloquer ou supprimer les cookies. Attention, la desactivation des cookies essentiels peut affecter le fonctionnement du site.</li>
                    </ul>
                    <p className="mt-4">Liens utiles pour gerer les cookies dans votre navigateur :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Google Chrome</a></li>
                      <li><a href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Mozilla Firefox</a></li>
                      <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Safari</a></li>
                      <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">Microsoft Edge</a></li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="contact">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Contact
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Pour toute question concernant notre politique de cookies, contactez-nous :</p>
                    <p>Email : <a href="mailto:dpo@remedes-mamie.com" className="text-[#A2211E] hover:underline">dpo@remedes-mamie.com</a></p>
                    <p>Adresse : SAS CALEBASSE, 15 rue de la Vistule, 75013 Paris, France</p>
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
