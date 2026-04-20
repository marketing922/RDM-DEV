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
    title: 'Mentions legales',
    description: `Mentions legales du site ${dict.meta.siteName}`,
  }
}

const sections = [
  { id: 'editeur', label: 'Editeur du site' },
  { id: 'coordonnees', label: 'Coordonnees' },
  { id: 'directeur', label: 'Directeur de la publication' },
  { id: 'hebergeur', label: 'Hebergeur' },
  { id: 'propriete-intellectuelle', label: 'Propriete intellectuelle' },
  { id: 'donnees-personnelles', label: 'Donnees personnelles' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'credits', label: 'Credits' },
  { id: 'limitation-responsabilite', label: 'Limitation de responsabilite' },
  { id: 'droit-applicable', label: 'Droit applicable et juridiction' },
]

export default async function MentionsLegalesPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <section className="py-16 bg-[#FEF9E9]">
      <div className="max-w-7xl mx-auto px-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: 'Mentions legales' },
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
                Mentions legales
              </h1>
              <p className="text-sm text-[#712E2F]/80 mb-10">
                Derniere mise a jour : avril 2026
              </p>

              <div className="space-y-10">
                <article id="editeur">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Editeur du site
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Le site internet www.remedes-mamie.com est edite par :</p>
                    <p><strong className="text-[#712E2F]">SAS CALEBASSE</strong></p>
                    <p>Societe par Actions Simplifiee au capital de 10 000 euros</p>
                    <p>Siege social : 15 rue de la Vistule, 75013 Paris, France</p>
                    <p>RCS Paris B 415 228 311</p>
                    <p>N° TVA intracommunautaire : FR81415228311</p>
                    <p>Le site www.remedes-mamie.com est exploite sous la marque commerciale Les Remedes de Mamie.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="coordonnees">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Coordonnees
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Telephone : 01 45 85 88 00 (prix d&apos;un appel local)</p>
                    <p>Email : <a href="mailto:contact@remedes-mamie.com" className="text-[#A2211E] hover:underline">contact@remedes-mamie.com</a></p>
                    <p>Formulaire de contact : <Link href={`/${locale}/contact`} className="text-[#A2211E] hover:underline">nous contacter</Link></p>
                    <p>Adresse postale : Les Remedes de Mamie, 58 rue Etienne Dolet, 92240 Malakoff, France</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="directeur">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Directeur de la publication
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Monsieur <strong className="text-[#712E2F]">Ruosi WU</strong>, en qualite de President de la societe SAS CALEBASSE.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="hebergeur">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Hebergeur
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Le site est heberge par :</p>
                    <p><strong className="text-[#712E2F]">Vercel Inc.</strong></p>
                    <p>340 S Lemon Ave #4133, Walnut, CA 91789, Etats-Unis</p>
                    <p>Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">vercel.com</a></p>
                    <p>Contact : <a href="https://vercel.com/contact" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">vercel.com/contact</a></p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="propriete-intellectuelle">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Propriete intellectuelle
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>L&apos;ensemble du contenu du site www.remedes-mamie.com, incluant notamment les textes, articles, photographies, illustrations, la marque « Les Remedes de Mamie » et son logo, la structure generale du site ainsi que les bases de donnees, est la propriete exclusive de <strong className="text-[#712E2F]">SAS CALEBASSE</strong>.</p>
                    <p>Toute reproduction, representation, modification, publication, adaptation de tout ou partie des elements du site, quel que soit le moyen ou le procede utilise, est interdite sans l&apos;autorisation ecrite prealable de SAS CALEBASSE.</p>
                    <p>Toute exploitation non autorisee du site ou de l&apos;un quelconque des elements qu&apos;il contient sera consideree comme constitutive d&apos;une contrefacon au sens des articles L.335-2 et suivants du Code de la Propriete Intellectuelle.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="donnees-personnelles">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Donnees personnelles
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Pour en savoir plus sur la collecte et le traitement de vos donnees personnelles, veuillez consulter notre <Link href={`/${locale}/politique-confidentialite`} className="text-[#A2211E] hover:underline">Politique de Confidentialite</Link>.</p>
                    <p>Conformement au Reglement General sur la Protection des Donnees (RGPD) et a la loi Informatique et Libertes du 6 janvier 1978 modifiee, vous disposez de droits sur vos donnees personnelles (acces, rectification, suppression, opposition, portabilite).</p>
                    <p>Pour exercer ces droits, contactez-nous a l&apos;adresse : <a href="mailto:contact@remedes-mamie.com" className="text-[#A2211E] hover:underline">contact@remedes-mamie.com</a></p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="cookies">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Cookies
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Pour en savoir plus sur l&apos;utilisation des cookies sur notre site, veuillez consulter notre <Link href={`/${locale}/politique-de-cookies`} className="text-[#A2211E] hover:underline">Politique de Cookies</Link>.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="credits">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Credits
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Developpement : <strong className="text-[#712E2F]">SAS CALEBASSE</strong></p>
                    <p>Photographies : SAS CALEBASSE et banques d&apos;images sous licence</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="limitation-responsabilite">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Limitation de responsabilite
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les informations fournies sur le site www.remedes-mamie.com le sont a titre indicatif et sont susceptibles d&apos;evoluer. Elles ne sauraient engager la responsabilite de SAS CALEBASSE.</p>
                    <p>SAS CALEBASSE ne garantit pas l&apos;exactitude, la completude ni l&apos;actualite des informations diffusees sur le site.</p>
                    <p>SAS CALEBASSE ne saurait etre tenue responsable des dommages directs ou indirects resultant de l&apos;acces au site ou de l&apos;utilisation des informations qu&apos;il contient.</p>
                    <p>Le site peut contenir des liens hypertextes vers des sites tiers. SAS CALEBASSE n&apos;exerce aucun controle sur le contenu de ces sites et decline toute responsabilite quant a leur contenu.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="droit-applicable">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Droit applicable et juridiction competente
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les presentes mentions legales sont soumises au droit francais.</p>
                    <p>En cas de litige, et apres tentative de recherche d&apos;une solution amiable, competence est attribuee aux tribunaux competents de Paris.</p>
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
