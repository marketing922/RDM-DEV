import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/server'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return {
    title: "Declaration d'accessibilite",
    description: `Declaration d'accessibilite du site ${dict.meta.siteName} — Engagement RGAA 4.1 niveau AA`,
  }
}

export default async function AccessibilitePage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <section className="py-2xl">
      <div className="max-w-7xl mx-auto px-lg">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: "Declaration d'accessibilite" },
          ]}
        />

        <div className="mt-xl">
          <div className="bg-white rounded-xl p-2xl shadow-sm max-w-3xl">
            <h1 className="font-heading text-h1 text-neutral-600 mb-md">
              Declaration d&apos;accessibilite
            </h1>
            <p className="font-body text-body-sm text-neutral-300 mb-2xl">
              Date de declaration : 16 avril 2026
            </p>

            <div className="space-y-2xl">
              <article>
                <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                  Engagement
                </h2>
                <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                  <p>SAS CALEBASSE s&apos;engage a rendre le site remedes-mamie.com accessible conformement a l&apos;article 47 de la loi n°2005-102 du 11 fevrier 2005.</p>
                  <p>Nous visons la conformite au <strong className="text-neutral-500">Referentiel General d&apos;Amelioration de l&apos;Accessibilite (RGAA) version 4.1</strong>, niveau AA, conformement aux Web Content Accessibility Guidelines (WCAG) 2.1.</p>
                </div>
              </article>

              <article>
                <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                  Etat de conformite
                </h2>
                <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                  <p>Le site remedes-mamie.com est en <strong className="text-neutral-500">conformite partielle</strong> avec le RGAA 4.1. Un audit complet d&apos;accessibilite est prevu pour ameliorer continuellement l&apos;experience de tous les utilisateurs.</p>
                </div>
              </article>

              <article>
                <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                  Mesures prises
                </h2>
                <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                  <p>Nous mettons en oeuvre les mesures suivantes pour assurer l&apos;accessibilite du site :</p>
                  <ul className="list-disc list-inside space-y-xs ml-md">
                    <li>Utilisation de balises semantiques HTML5</li>
                    <li>Navigation au clavier fonctionnelle</li>
                    <li>Contrastes de couleurs conformes au niveau AA</li>
                    <li>Textes alternatifs sur les images</li>
                    <li>Formulaires accessibles avec labels et messages d&apos;erreur explicites</li>
                    <li>Design responsive adapte a toutes les tailles d&apos;ecran</li>
                  </ul>
                </div>
              </article>

              <article>
                <h2 className="font-heading text-h2 text-neutral-600 mb-md">
                  Contact
                </h2>
                <div className="font-body text-body-sm text-neutral-400 space-y-xs">
                  <p>Si vous rencontrez un defaut d&apos;accessibilite vous empechant d&apos;acceder a un contenu ou une fonctionnalite du site, n&apos;hesitez pas a nous contacter :</p>
                  <p>Email : <a href="mailto:contact@remedes-mamie.com" className="text-brand hover:underline">contact@remedes-mamie.com</a></p>
                  <p>Adresse : SAS CALEBASSE, 15 rue de la Vistule, 75013 Paris, France</p>
                  <p className="mt-md">Si vous n&apos;obtenez pas de reponse satisfaisante, vous pouvez contacter le Defenseur des droits : <a href="https://www.defenseurdesdroits.fr" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">www.defenseurdesdroits.fr</a></p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
