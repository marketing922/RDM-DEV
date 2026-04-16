import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/server'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return {
    title: 'Conditions Generales de Vente',
    description: `Conditions Generales de Vente du site ${dict.meta.siteName}`,
  }
}

const sections = [
  { id: 'objet', label: 'Objet' },
  { id: 'prix', label: 'Prix' },
  { id: 'commande', label: 'Commande' },
  { id: 'paiement', label: 'Paiement' },
  { id: 'livraison', label: 'Livraison' },
  { id: 'retractation', label: 'Droit de retractation' },
  { id: 'garanties', label: 'Garanties' },
  { id: 'responsabilite', label: 'Responsabilite' },
  { id: 'donnees-personnelles', label: 'Donnees personnelles' },
  { id: 'mediateur', label: 'Mediateur' },
  { id: 'droit-applicable', label: 'Droit applicable' },
]

export default async function CGVPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <section className="py-2xl">
      <div className="max-w-7xl mx-auto px-lg">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: 'Conditions Generales de Vente' },
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
                Conditions Generales de Vente
              </h1>
              <p className="font-body text-body-sm text-neutral-300 mb-2xl">
                En vigueur au 16 avril 2026
              </p>

              <div className="space-y-2xl">
                <article id="objet">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Article 1 — Objet
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Les presentes Conditions Generales de Vente (CGV) regissent les ventes de complements alimentaires et produits a base de plantes effectuees par la societe SAS CALEBASSE, RCS Paris B 415 228 311, ci-apres &quot;le Vendeur&quot;, aupres de consommateurs, ci-apres &quot;le Client&quot;, sur le site remedes-mamie.com.</p>
                    <p>Toute commande implique l&apos;acceptation sans reserve des presentes CGV.</p>
                  </div>
                </article>

                <article id="prix">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Article 2 — Prix
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Les prix sont indiques en euros toutes taxes comprises (TTC). Le Vendeur se reserve le droit de modifier ses prix a tout moment, les produits etant factures sur la base des tarifs en vigueur au moment de la validation de la commande.</p>
                    <p>Les frais de livraison sont indiques avant la validation finale de la commande.</p>
                  </div>
                </article>

                <article id="commande">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Article 3 — Commande
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Le Client passe commande sur le site remedes-mamie.com en ajoutant les produits souhaites a son panier et en validant le processus de commande. Une confirmation de commande est envoyee par email.</p>
                    <p>Le Vendeur se reserve le droit de refuser ou d&apos;annuler toute commande d&apos;un Client avec lequel il existerait un litige relatif au paiement d&apos;une commande precedente.</p>
                  </div>
                </article>

                <article id="paiement">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Article 4 — Paiement
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Le paiement est exigible immediatement a la commande. Le Client peut effectuer son paiement par carte bancaire via la plateforme securisee <strong className="text-neutral-500">Stripe</strong>.</p>
                    <p>Les donnees de paiement sont traitees directement par Stripe et ne transitent pas par les serveurs du Vendeur. Stripe est conforme au standard PCI DSS.</p>
                  </div>
                </article>

                <article id="livraison">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Article 5 — Livraison
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Les produits sont livres a l&apos;adresse de livraison indiquee lors de la commande. Les delais de livraison sont donnes a titre indicatif et ne constituent pas un engagement contractuel.</p>
                    <p>En cas de retard de livraison superieur a 30 jours, le Client peut annuler la commande et obtenir un remboursement integral.</p>
                  </div>
                </article>

                <article id="retractation">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Article 6 — Droit de retractation
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Conformement aux articles L.221-18 et suivants du Code de la consommation, le Client dispose d&apos;un delai de 14 jours a compter de la reception des produits pour exercer son droit de retractation, sans avoir a justifier de motifs ni a payer de penalites.</p>
                    <p>Les produits doivent etre retournes dans leur emballage d&apos;origine, non ouverts et en parfait etat. Les frais de retour sont a la charge du Client.</p>
                  </div>
                </article>

                <article id="garanties">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Article 7 — Garanties
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Le Vendeur garantit la conformite des produits vendus conformement aux articles L.217-4 et suivants du Code de la consommation et aux articles 1641 et suivants du Code civil relatifs aux vices caches.</p>
                    <p>En cas de defaut de conformite, le Client peut demander la reparation ou le remplacement du produit, ou a defaut, une reduction du prix ou la resolution du contrat.</p>
                  </div>
                </article>

                <article id="responsabilite">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Article 8 — Responsabilite
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Les produits vendus sont des complements alimentaires et ne sont pas des medicaments. Ils ne peuvent en aucun cas se substituer a un traitement medical. Le Vendeur ne saurait etre tenu responsable de l&apos;utilisation inappropriee des produits.</p>
                    <p>Le Client est invite a consulter un professionnel de sante avant toute utilisation, en particulier en cas de grossesse, d&apos;allaitement ou de traitement medical en cours.</p>
                  </div>
                </article>

                <article id="donnees-personnelles">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Article 9 — Donnees personnelles
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Les donnees personnelles collectees lors de la commande sont traitees conformement au Reglement General sur la Protection des Donnees (RGPD). Pour plus d&apos;informations, consultez notre <a href={`/${locale}/politique-confidentialite`} className="text-brand hover:underline">Politique de confidentialite</a>.</p>
                  </div>
                </article>

                <article id="mediateur">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Article 10 — Mediateur
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Conformement aux articles L.616-1 et R.616-1 du Code de la consommation, en cas de litige, le Client peut recourir gratuitement au service de mediation suivant :</p>
                    <p><strong className="text-neutral-500">CMAP — Centre de Mediation et d&apos;Arbitrage de Paris</strong></p>
                    <p>39 avenue Franklin D. Roosevelt, 75008 Paris</p>
                    <p>Site web : <a href="https://www.cmap.fr" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">https://www.cmap.fr</a></p>
                  </div>
                </article>

                <article id="droit-applicable">
                  <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                    Article 11 — Droit applicable
                  </h2>
                  <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                    <p>Les presentes CGV sont soumises au droit francais. En cas de litige, et apres tentative de resolution amiable, les tribunaux francais seront seuls competents.</p>
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
