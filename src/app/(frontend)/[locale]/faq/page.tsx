import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import FAQTemplate from '@/components/institutional/FAQTemplate'
import { FAQJsonLd } from '@/components/seo'
import { siteMetadataBase } from '@/lib/metadata'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    metadataBase: siteMetadataBase(),
    title: 'Questions fréquentes — Les Remèdes de Mamie',
    description:
      'Toutes les réponses aux questions fréquentes : plantes, boutique, livraison, newsletter.',
    alternates: { canonical: `/${locale}/faq` },
  }
}

// Plain-text Q/A pairs mirroring the rich JSX in FAQTemplate (used for JSON-LD).
const FAQ_ITEMS: Array<{ question: string; answer: string }> = [
  // La maison & l'équipe
  {
    question: 'Qui écrit les fiches plantes ?',
    answer:
      "Toutes les fiches sont rédigées par un auteur identifié et relues par un référent conformité avant publication. Chaque affirmation renvoie à une source vérifiable : pharmacopée française, monographie ESCOP/EMA, étude clinique indexée.",
  },
  {
    question: 'Comment sont choisies les nouvelles plantes ?',
    answer:
      "Nous suivons un calendrier éditorial saisonnier (plantes fraîches au printemps, racines en hiver). Les suggestions des lecteurs sont examinées chaque mois.",
  },
  {
    question: 'Puis-je contribuer ?',
    answer:
      "Oui, les propositions sont les bienvenues via le formulaire de contact. Elles passent par le même processus de relecture que toute fiche.",
  },
  // Usages & sécurité
  {
    question: 'Les plantes remplacent-elles un traitement médical ?',
    answer:
      "Non, jamais. Nos fiches sont informatives, pas prescriptives. Demandez toujours l'avis d'un professionnel de santé, en particulier si vous prenez un traitement en cours.",
  },
  {
    question: 'Les plantes conviennent-elles aux enfants ?',
    answer:
      "Chaque fiche mentionne explicitement les restrictions d'âge et précautions. En cas de doute, consultez un pharmacien ou un pédiatre.",
  },
  {
    question: 'Et pendant la grossesse ou l’allaitement ?',
    answer:
      "De nombreuses plantes sont contre-indiquées pendant la grossesse et l'allaitement. La section « Précautions » de chaque fiche est à lire en premier. En cas de doute, parlez-en à votre sage-femme ou médecin.",
  },
  // Boutique & livraisons
  {
    question: 'D’où viennent vos produits ?',
    answer:
      "Nos tisanes et poudres sont conditionnées en France à partir de plantes issues de filières bio françaises ou européennes tracées. Chaque produit indique son origine.",
  },
  {
    question: 'Quels sont les délais de livraison ?',
    answer:
      "Colissimo : 3 à 5 jours ouvrés · Mondial Relay : 4 à 6 jours ouvrés. Livraison en France métropolitaine uniquement pour l'instant. Offerte dès 30 € d'achat.",
  },
  {
    question: 'Puis-je retourner un produit ?',
    answer:
      "Oui, sous 14 jours francs à compter de la réception, conformément à l'article L.221-18 du Code de la consommation. Les produits doivent être non ouverts, dans leur emballage d'origine. Détails dans nos CGV.",
  },
  // Newsletter & compte
  {
    question: 'À quoi ressemble la newsletter ?',
    answer:
      "Une lettre mensuelle, envoyée le premier dimanche du mois. Elle reprend un dossier de saison, trois plantes à découvrir, et une recette. Aucun spam, désabonnement en un clic.",
  },
  {
    question: 'Comment me désabonner ?',
    answer:
      "Un lien de désabonnement figure en bas de chaque envoi. Vos données sont effacées sous 72 h. Voir aussi notre politique de confidentialité.",
  },
]

export default async function FAQPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return (
    <>
      <FAQJsonLd items={FAQ_ITEMS} />
      <FAQTemplate locale={locale} homeLabel={dict.nav.home} />
    </>
  )
}
