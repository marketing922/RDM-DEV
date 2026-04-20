import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/server'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return {
    title: "Déclaration d'accessibilité",
    description: `Déclaration d'accessibilité du site ${dict.meta.siteName} — Engagement RGAA 4.1 niveau AA`,
  }
}

export default async function AccessibilitePage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: "Déclaration d'accessibilité" },
          ]}
        />

        <div className="mt-8">
          <div className="bg-white rounded-xl p-8 shadow-sm max-w-3xl">
            <h1 className="font-sans text-4xl font-bold text-gray-700 mb-4">
              Déclaration d&apos;accessibilité
            </h1>
            <p className="text-sm text-gray-400 mb-12">
              Date de déclaration : 16 avril 2026
            </p>

            <div className="space-y-12">
              <article>
                <h2 className="font-sans text-2xl font-bold text-gray-700 mb-4">
                  Engagement
                </h2>
                <div className="text-sm text-gray-500 space-y-2">
                  <p>SAS CALEBASSE s&apos;engage à rendre le site remedes-mamie.com accessible conformément à l&apos;article 47 de la loi n°2005-102 du 11 février 2005.</p>
                  <p>Nous visons la conformité au <strong className="text-gray-600">Référentiel Général d&apos;Amélioration de l&apos;Accessibilité (RGAA) version 4.1</strong>, niveau AA, conformément aux Web Content Accessibility Guidelines (WCAG) 2.1.</p>
                </div>
              </article>

              <article>
                <h2 className="font-sans text-2xl font-bold text-gray-700 mb-4">
                  État de conformité
                </h2>
                <div className="text-sm text-gray-500 space-y-2">
                  <p>Le site remedes-mamie.com est en <strong className="text-gray-600">conformité partielle</strong> avec le RGAA 4.1. Un audit complet d&apos;accessibilité est prévu pour améliorer continuellement l&apos;expérience de tous les utilisateurs.</p>
                </div>
              </article>

              <article>
                <h2 className="font-sans text-2xl font-bold text-gray-700 mb-4">
                  Mesures prises
                </h2>
                <div className="text-sm text-gray-500 space-y-2">
                  <p>Nous mettons en œuvre les mesures suivantes pour assurer l&apos;accessibilité du site :</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Utilisation de balises sémantiques HTML5</li>
                    <li>Navigation au clavier fonctionnelle</li>
                    <li>Contrastes de couleurs conformes au niveau AA</li>
                    <li>Textes alternatifs sur les images</li>
                    <li>Formulaires accessibles avec labels et messages d&apos;erreur explicites</li>
                    <li>Design responsive adapté à toutes les tailles d&apos;écran</li>
                  </ul>
                </div>
              </article>

              <article>
                <h2 className="font-sans text-2xl font-bold text-gray-700 mb-4">
                  Contact
                </h2>
                <div className="text-sm text-gray-500 space-y-2">
                  <p>Si vous rencontrez un défaut d&apos;accessibilité vous empêchant d&apos;accéder à un contenu ou une fonctionnalité du site, n&apos;hésitez pas à nous contacter :</p>
                  <p>Email : <a href="mailto:contact@remedes-mamie.com" className="text-[#A2211E] hover:underline">contact@remedes-mamie.com</a></p>
                  <p>Adresse : SAS CALEBASSE, 15 rue de la Vistule, 75013 Paris, France</p>
                  <p className="mt-4">Si vous n&apos;obtenez pas de réponse satisfaisante, vous pouvez contacter le Défenseur des droits : <a href="https://www.defenseurdesdroits.fr" target="_blank" rel="noopener noreferrer" className="text-[#A2211E] hover:underline">www.defenseurdesdroits.fr</a></p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
