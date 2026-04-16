import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/server'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

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
  { id: 'directeur', label: 'Directeur de la publication' },
  { id: 'hebergeur', label: 'Hebergeur' },
  { id: 'contact', label: 'Contact' },
  { id: 'propriete-intellectuelle', label: 'Propriete intellectuelle' },
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
              <h1 className="text-3xl font-bold text-[#054A57] mb-10">
                Mentions legales
              </h1>

              <div className="space-y-10">
                <article id="editeur">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Editeur du site
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Le site remedes-mamie.com est edite par :</p>
                    <p><strong className="text-[#712E2F]">SAS CALEBASSE</strong></p>
                    <p>Societe par actions simplifiee au capital de 1 000 euros</p>
                    <p>Siege social : 15 rue de la Vistule, 75013 Paris, France</p>
                    <p>RCS Paris B 415 228 311</p>
                    <p>N° TVA intracommunautaire : FR81415228311</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="directeur">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Directeur de la publication
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Le directeur de la publication est <strong className="text-[#712E2F]">Ruosi WU</strong>, en qualite de representant legal de la societe SAS CALEBASSE.</p>
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
                    <p>440 N Baxter Street, Los Angeles, CA 90012, Etats-Unis</p>
                    <p>Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">https://vercel.com</a></p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="contact">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Contact
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>Pour toute question ou reclamation, vous pouvez nous contacter :</p>
                    <p>Email : <a href="mailto:contact@remedes-mamie.com" className="text-[#A2211E] hover:underline">contact@remedes-mamie.com</a></p>
                    <p>Adresse postale : SAS CALEBASSE, 15 rue de la Vistule, 75013 Paris, France</p>
                  </div>
                </article>

                <hr className="border-[#DCD8C7]" />

                <article id="propriete-intellectuelle">
                  <h2 className="text-xl font-bold text-[#054A57] mb-4">
                    Propriete intellectuelle
                  </h2>
                  <div className="text-sm text-[#712E2F]/80 space-y-2">
                    <p>L&apos;ensemble du contenu du site remedes-mamie.com (textes, images, graphismes, logo, icones, sons, logiciels, etc.) est protege par le droit d&apos;auteur et le droit de la propriete intellectuelle.</p>
                    <p>Toute reproduction, representation, modification, publication, adaptation de tout ou partie des elements du site, quel que soit le moyen ou le procede utilise, est interdite sans l&apos;autorisation ecrite prealable de SAS CALEBASSE.</p>
                    <p>Toute exploitation non autorisee du site ou de l&apos;un quelconque des elements qu&apos;il contient sera consideree comme constitutive d&apos;une contrefacon et poursuivie conformement aux dispositions des articles L.335-2 et suivants du Code de la propriete intellectuelle.</p>
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
