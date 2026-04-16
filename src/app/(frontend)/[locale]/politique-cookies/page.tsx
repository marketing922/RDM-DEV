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
    <section className="py-2xl">
      <div className="max-w-7xl mx-auto px-lg">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: 'Politique de cookies' },
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
                Politique de cookies
              </h1>
              <p className="font-body text-body-sm text-neutral-300 mb-2xl">
                Derniere mise a jour : 16 avril 2026
              </p>

              <div className="space-y-2xl">
                <article id="definition">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Qu&apos;est-ce qu&apos;un cookie ?
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Un cookie est un petit fichier texte depose sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d&apos;un site web. Il permet au site de memoriser des informations sur votre visite, comme votre langue preferee et d&apos;autres parametres, afin de faciliter votre prochaine visite et de rendre le site plus utile.</p>
                  </div>
                </article>

                <article id="cookies-utilises">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Cookies utilises sur ce site
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Voici la liste des cookies utilises sur le site remedes-mamie.com :</p>
                    <div className="overflow-x-auto mt-md">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-100">
                            <th className="py-sm pr-md font-ui text-body-sm text-neutral-500">Nom</th>
                            <th className="py-sm pr-md font-ui text-body-sm text-neutral-500">Finalite</th>
                            <th className="py-sm pr-md font-ui text-body-sm text-neutral-500">Duree</th>
                            <th className="py-sm font-ui text-body-sm text-neutral-500">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                          <tr>
                            <td className="py-sm pr-md font-mono text-caption">locale</td>
                            <td className="py-sm pr-md">Preference de langue</td>
                            <td className="py-sm pr-md">1 an</td>
                            <td className="py-sm">Essentiel</td>
                          </tr>
                          <tr>
                            <td className="py-sm pr-md font-mono text-caption">session</td>
                            <td className="py-sm pr-md">Authentification utilisateur</td>
                            <td className="py-sm pr-md">Session</td>
                            <td className="py-sm">Essentiel</td>
                          </tr>
                          <tr>
                            <td className="py-sm pr-md font-mono text-caption">cookie-consent</td>
                            <td className="py-sm pr-md">Memorisation du choix cookies</td>
                            <td className="py-sm pr-md">13 mois</td>
                            <td className="py-sm">Essentiel</td>
                          </tr>
                          <tr>
                            <td className="py-sm pr-md font-mono text-caption">__stripe_mid</td>
                            <td className="py-sm pr-md">Prevention de la fraude (Stripe)</td>
                            <td className="py-sm pr-md">1 an</td>
                            <td className="py-sm">Essentiel</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </article>

                <article id="plausible">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Plausible Analytics
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Nous utilisons <strong className="text-neutral-500">Plausible Analytics</strong> pour mesurer l&apos;audience de notre site. Plausible est une solution d&apos;analyse respectueuse de la vie privee qui fonctionne <strong className="text-neutral-500">sans cookies</strong> et sans collecte de donnees personnelles.</p>
                    <p>Plausible ne depose aucun cookie sur votre terminal, ne collecte pas votre adresse IP et ne vous identifie pas entre les sessions. Les donnees collectees sont anonymes et agregees.</p>
                    <p>Plausible est heberge dans l&apos;Union europeenne et est conforme au RGPD. L&apos;utilisation de Plausible ne necessite pas de consentement prealable au titre de la directive ePrivacy.</p>
                    <p>Plus d&apos;informations : <a href="https://plausible.io/data-policy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">https://plausible.io/data-policy</a></p>
                  </div>
                </article>

                <article id="gestion">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Gestion des preferences
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Vous pouvez a tout moment gerer vos preferences en matiere de cookies :</p>
                    <ul className="list-disc list-inside space-y-xs ml-md">
                      <li><strong className="text-neutral-500">Bandeau cookies</strong> : lors de votre premiere visite, un bandeau vous permet d&apos;accepter ou de refuser les cookies non essentiels.</li>
                      <li><strong className="text-neutral-500">Parametres du navigateur</strong> : vous pouvez configurer votre navigateur pour bloquer ou supprimer les cookies. Attention, la desactivation des cookies essentiels peut affecter le fonctionnement du site.</li>
                    </ul>
                    <p className="mt-md">Liens utiles pour gerer les cookies dans votre navigateur :</p>
                    <ul className="list-disc list-inside space-y-xs ml-md">
                      <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Google Chrome</a></li>
                      <li><a href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Mozilla Firefox</a></li>
                      <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Safari</a></li>
                      <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Microsoft Edge</a></li>
                    </ul>
                  </div>
                </article>

                <article id="contact">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Contact
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Pour toute question concernant notre politique de cookies, contactez-nous :</p>
                    <p>Email : <a href="mailto:dpo@remedes-mamie.com" className="text-brand hover:underline">dpo@remedes-mamie.com</a></p>
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
