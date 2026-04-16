import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/server'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return {
    title: 'Avertissement Sante',
    description: `Avertissement Sante du site ${dict.meta.siteName}. Informations importantes sur l'utilisation des complements alimentaires et tisanes.`,
  }
}

const sections = [
  { id: 'objet-du-site', label: 'Objet du site' },
  { id: 'consultation-professionnel', label: 'Consultation d\'un professionnel' },
  { id: 'complements-alimentaires', label: 'Complements alimentaires' },
  { id: 'allegations-sante', label: 'Allegations de sante' },
  { id: 'limitation-responsabilite', label: 'Limitation de responsabilite' },
  { id: 'en-cas-urgence', label: 'En cas d\'urgence' },
  { id: 'contact', label: 'Contact' },
]

export default async function AvertissementSantePage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <section className="py-16 bg-[#FEF9E9]">
      <div className="max-w-7xl mx-auto px-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: 'Avertissement Sante' },
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
                Avertissement Sante
              </h1>
              <p className="text-sm text-[#712E2F]/80 mb-10">
                Derniere mise a jour : avril 2026
              </p>

              <div className="space-y-10">
                <article id="objet-du-site">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Objet du site
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Le site www.remedes-mamie.com est edite par <strong className="text-[#712E2F]">SAS CALEBASSE</strong> sous la marque commerciale <strong className="text-[#712E2F]">Les Remedes de Mamie</strong>.</p>
                    <p>Les informations fournies sur ce site le sont a titre purement informatif et educatif. Elles visent a partager des connaissances generales sur les plantes medicinales, les complements alimentaires et les approches naturelles du bien-etre.</p>
                    <p>Les contenus publies sur ce site <strong className="text-[#712E2F]">NE constituent PAS</strong> :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Un diagnostic medical</li>
                      <li>Une prescription medicale</li>
                      <li>Une recommandation de traitement</li>
                      <li>Un avis medical personnalise</li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="consultation-professionnel">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Consultation d&apos;un professionnel de sante
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Nous vous recommandons vivement de <strong className="text-[#712E2F]">consulter un medecin, un pharmacien ou une sage-femme</strong> avant toute utilisation de complements alimentaires ou de tisanes, notamment si vous vous trouvez dans l&apos;une des situations suivantes :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Vous etes enceinte ou allaitante</li>
                      <li>Vous suivez un traitement medical</li>
                      <li>Vous souffrez d&apos;une maladie chronique</li>
                      <li>Vous prenez des medicaments sur ordonnance</li>
                      <li>Vous avez des allergies connues</li>
                      <li>Vous souhaitez administrer un produit a un enfant de moins de 18 ans</li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="complements-alimentaires">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Complements alimentaires
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les complements alimentaires commercialises sur notre site sont conformes a la reglementation francaise en vigueur, notamment au <strong className="text-[#712E2F]">Decret n°2006-352 du 20 mars 2006</strong> relatif aux complements alimentaires.</p>
                    <p>Les complements alimentaires ne sont pas des medicaments. Ils ne se substituent pas a une alimentation variee et equilibree ni a un mode de vie sain.</p>
                    <p>Il est important de :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Ne pas depasser la dose journaliere recommandee indiquee sur chaque produit</li>
                      <li>Tenir les produits hors de portee des jeunes enfants</li>
                      <li>Conserver les produits dans un endroit frais et sec, a l&apos;abri de la lumiere</li>
                    </ul>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="allegations-sante">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Allegations de sante
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Les allegations de sante presentees sur ce site sont formulees dans le strict respect du <strong className="text-[#712E2F]">Reglement (CE) n°1924/2006</strong> du Parlement europeen et du Conseil concernant les allegations nutritionnelles et de sante portant sur les denrees alimentaires.</p>
                    <p>Seules les allegations de sante autorisees par l&apos;Autorite europeenne de securite des aliments (<strong className="text-[#712E2F]">EFSA</strong>) sont utilisees pour decrire les proprietes de nos produits.</p>
                    <p>Aucun produit presente sur ce site n&apos;a la pretention de prevenir, traiter ou guerir une quelconque maladie.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="limitation-responsabilite">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Limitation de responsabilite
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p><strong className="text-[#712E2F]">SAS CALEBASSE</strong> decline toute responsabilite quant a :</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>L&apos;utilisation qui pourrait etre faite des informations presentes sur ce site</li>
                      <li>Toute pratique d&apos;automedication fondee sur les contenus du site</li>
                      <li>Tout dommage direct ou indirect resultant de l&apos;utilisation des produits ou des informations du site</li>
                    </ul>
                    <p>L&apos;utilisateur reste seul responsable de l&apos;usage qu&apos;il fait des informations et des produits proposes sur le site.</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="en-cas-urgence">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    En cas d&apos;urgence
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>En cas de symptomes graves ou d&apos;urgence medicale, contactez immediatement les services d&apos;urgence :</p>
                    <div className="mt-4 p-6 bg-[#FFF5D5] border-2 border-[#D0802C] rounded-xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-10 h-10 bg-[#D0802C]/10 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D0802C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                          </span>
                          <div>
                            <p className="font-bold text-[#054A57]">SAMU</p>
                            <p className="text-lg font-bold text-[#D0802C]">15</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-10 h-10 bg-[#D0802C]/10 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D0802C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                          </span>
                          <div>
                            <p className="font-bold text-[#054A57]">Pompiers</p>
                            <p className="text-lg font-bold text-[#D0802C]">18</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-10 h-10 bg-[#D0802C]/10 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D0802C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                          </span>
                          <div>
                            <p className="font-bold text-[#054A57]">Urgence europeenne</p>
                            <p className="text-lg font-bold text-[#D0802C]">112</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-10 h-10 bg-[#D0802C]/10 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D0802C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                          </span>
                          <div>
                            <p className="font-bold text-[#054A57]">Centre antipoison</p>
                            <p className="text-sm text-[#712E2F]/80">Consultez le numero de votre region</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="contact">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Contact
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Pour toute question relative aux informations presentees sur ce site :</p>
                    <p>Email : <a href="mailto:contact@remedes-mamie.com" className="text-[#A2211E] hover:underline">contact@remedes-mamie.com</a></p>
                    <p>Telephone : 01 45 85 88 00 (prix d&apos;un appel local)</p>
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
