import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/server'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { Disclaimer } from '@/components/shared/Disclaimer'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return {
    title: 'Avertissement sante',
    description: `Avertissement sante — informations importantes sur les complements alimentaires — ${dict.meta.siteName}`,
  }
}

const sections = [
  { id: 'complements', label: 'Complements alimentaires' },
  { id: 'allegations', label: 'Allegations autorisees' },
  { id: 'precautions', label: 'Precautions' },
  { id: 'urgences', label: 'Numeros d\'urgence' },
]

function WarningCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-warning-bg border border-warning-border rounded-xl p-lg my-md">
      <div className="flex items-start gap-sm">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning-text flex-shrink-0 mt-[2px]">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div className="font-body text-body-sm text-warning-text">
          {children}
        </div>
      </div>
    </div>
  )
}

export default async function AvertissementSantePage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <section className="py-2xl">
      <div className="max-w-7xl mx-auto px-lg">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: 'Avertissement sante' },
          ]}
        />

        {/* Full disclaimer at top */}
        <Disclaimer variant="full" dict={dict} />

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
              <h1 className="font-heading text-h1 text-neutral-600 mb-2xl">
                Avertissement sante
              </h1>

              <div className="space-y-2xl">
                <article id="complements">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Complements alimentaires
                  </h2>
                  <WarningCallout>
                    <p>Les complements alimentaires ne sont pas des medicaments. Ils ne peuvent en aucun cas remplacer une alimentation variee et equilibree ni un mode de vie sain.</p>
                  </WarningCallout>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Les produits proposes sur le site remedes-mamie.com sont des complements alimentaires au sens du Decret n°2006-352 du 20 mars 2006 relatif aux complements alimentaires.</p>
                    <p>Ils sont destines a completer le regime alimentaire normal et constituent une source concentree de nutriments ou d&apos;autres substances ayant un effet nutritionnel ou physiologique.</p>
                    <p>Ne pas depasser la dose journaliere recommandee indiquee sur chaque produit. Tenir hors de portee des enfants.</p>
                  </div>
                </article>

                <article id="allegations">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Allegations autorisees (EFSA)
                  </h2>
                  <WarningCallout>
                    <p>Seules les allegations de sante autorisees par l&apos;Autorite europeenne de securite des aliments (EFSA) sont utilisees sur ce site.</p>
                  </WarningCallout>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Conformement au Reglement (CE) n°1924/2006 concernant les allegations nutritionnelles et de sante portant sur les denrees alimentaires, toutes les allegations de sante presentees sur ce site sont :</p>
                    <ul className="list-disc list-inside space-y-xs ml-md">
                      <li>Autorisees par la Commission europeenne sur la base d&apos;avis scientifiques de l&apos;EFSA</li>
                      <li>Inscrites au registre de l&apos;Union des allegations de sante autorisees</li>
                      <li>Accompagnees de la mention de la quantite du nutriment ou de la substance necessaire pour obtenir l&apos;effet benefique allegue</li>
                    </ul>
                    <p className="mt-md">Registre des allegations autorisees : <a href="https://ec.europa.eu/food/safety/labelling-and-nutrition/nutrition-and-health-claims/eu-register-nutrition-and-health-claims_en" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Registre de l&apos;UE</a></p>
                  </div>
                </article>

                <article id="precautions">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Precautions d&apos;emploi
                  </h2>
                  <WarningCallout>
                    <p>Consultez un professionnel de sante avant toute utilisation, en particulier si vous etes enceinte, allaitante, sous traitement medical ou souffrez d&apos;une pathologie.</p>
                  </WarningCallout>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Avant d&apos;utiliser nos produits, veuillez prendre en compte les precautions suivantes :</p>
                    <ul className="list-disc list-inside space-y-xs ml-md">
                      <li>Consultez votre medecin ou pharmacien avant utilisation si vous suivez un traitement medical</li>
                      <li>Deconseille aux femmes enceintes et allaitantes sans avis medical prealable</li>
                      <li>Deconseille aux enfants de moins de 18 ans sauf mention contraire</li>
                      <li>Cessez immediatement l&apos;utilisation en cas de reaction indesirable et consultez un professionnel de sante</li>
                      <li>Respectez les dosages recommandes indiques sur chaque produit</li>
                      <li>Ne remplace pas un traitement medical prescrit par un professionnel de sante</li>
                    </ul>
                  </div>
                </article>

                <article id="urgences">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Numeros d&apos;urgence
                  </h2>
                  <WarningCallout>
                    <p>En cas de malaise, d&apos;intoxication ou de reaction allergique grave, appelez immediatement les secours.</p>
                  </WarningCallout>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>En cas d&apos;urgence, contactez immediatement :</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mt-md">
                      <div className="bg-neutral-50 rounded-xl p-lg text-center">
                        <p className="font-heading text-h2 text-brand mb-xs">15</p>
                        <p className="font-ui text-body-sm text-neutral-500 font-medium">SAMU</p>
                        <p className="font-body text-caption text-neutral-300">Urgences medicales</p>
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-lg text-center">
                        <p className="font-heading text-h2 text-brand mb-xs">18</p>
                        <p className="font-ui text-body-sm text-neutral-500 font-medium">Pompiers</p>
                        <p className="font-body text-caption text-neutral-300">Secours et incendies</p>
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-lg text-center">
                        <p className="font-heading text-h2 text-brand mb-xs">112</p>
                        <p className="font-ui text-body-sm text-neutral-500 font-medium">Urgence europeenne</p>
                        <p className="font-body text-caption text-neutral-300">Numero unique europeen</p>
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-lg text-center">
                        <p className="font-heading text-h2 text-brand mb-xs">01 40 05 48 48</p>
                        <p className="font-ui text-body-sm text-neutral-500 font-medium">Centre antipoison</p>
                        <p className="font-body text-caption text-neutral-300">Paris — 24h/24</p>
                      </div>
                    </div>
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
