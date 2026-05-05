import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 60

const seedContext = {
  skipCompliance: true,
  skipComplianceReason: 'seed-faq batch upsert',
  skipModeration: true,
  skipEmbed: true,
}

function richText(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
      })),
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

type FaqEntry = {
  category: 'plantes' | 'utilisation' | 'site' | 'sante'
  order: number
  fr: { question: string; answer: string[] }
  en: { question: string; answer: string[] }
}

const FAQ_ENTRIES: FaqEntry[] = [
  // ── Plantes ────────────────────────────────────────────────
  {
    category: 'plantes',
    order: 10,
    fr: {
      question: 'Vos plantes sont-elles réellement biologiques ?',
      answer: [
        "Oui. Toutes nos plantes proviennent de filières certifiées Agriculture Biologique (AB / Eurofeuille). Chaque lot est tracé du producteur jusqu'à la mise en sachet.",
        "Nous favorisons les producteurs français et européens travaillant en agroécologie ou en cueillette sauvage encadrée.",
      ],
    },
    en: {
      question: 'Are your plants really organic?',
      answer: [
        "Yes. All of our plants come from certified Organic Agriculture supply chains (AB / EU Leaf). Each batch is traceable from grower to packaging.",
        "We favor French and European producers practicing agroecology or controlled wild harvesting.",
      ],
    },
  },
  {
    category: 'plantes',
    order: 20,
    fr: {
      question: 'Comment garantissez-vous la qualité d\'une plante ?',
      answer: [
        "Chaque lot est analysé en laboratoire pour vérifier l'identité botanique, la pureté microbiologique et l'absence de métaux lourds, pesticides et radioactivité, conformément à la Pharmacopée européenne.",
        "Nous conservons les bulletins d'analyse et publions le numéro de lot sur chaque emballage.",
      ],
    },
    en: {
      question: 'How do you guarantee plant quality?',
      answer: [
        "Each batch is laboratory-tested for botanical identity, microbiological purity and absence of heavy metals, pesticides and radioactivity, in line with the European Pharmacopoeia.",
        "We keep the analysis certificates and print the batch number on every package.",
      ],
    },
  },
  {
    category: 'plantes',
    order: 30,
    fr: {
      question: 'D\'où viennent vos plantes ?',
      answer: [
        "La majorité de nos plantes est produite en France et en Europe. Quelques plantes spécifiques (ginseng, reishi, baies de goji, etc.) proviennent de filières asiatiques certifiées avec lesquelles nous travaillons en direct.",
        "Nous indiquons systématiquement le pays d'origine sur la fiche produit.",
      ],
    },
    en: {
      question: 'Where do your plants come from?',
      answer: [
        "Most of our plants are grown in France and Europe. A few specific plants (ginseng, reishi, goji berries, etc.) come from certified Asian supply chains we work with directly.",
        "We always indicate the country of origin on the product page.",
      ],
    },
  },
  {
    category: 'plantes',
    order: 40,
    fr: {
      question: 'Quelle est la différence entre une plante en vrac et une gélule ?',
      answer: [
        "La plante en vrac (tisane, infusion, décoction) délivre les principes actifs hydrosolubles dans l'eau chaude. C'est la forme traditionnelle, douce et adaptée à un usage quotidien.",
        "La gélule contient la plante en poudre ou un extrait concentré, dosé précisément. Elle est plus pratique en déplacement mais l'extraction n'est pas la même qu'en infusion.",
      ],
    },
    en: {
      question: 'What is the difference between bulk herbs and capsules?',
      answer: [
        "Bulk herbs (teas, infusions, decoctions) release water-soluble compounds into hot water. It is the traditional form, gentle and suited to daily use.",
        "Capsules contain powdered or concentrated extract with precise dosing. More convenient on the go but the extraction is not the same as in an infusion.",
      ],
    },
  },

  // ── Utilisation ────────────────────────────────────────────
  {
    category: 'utilisation',
    order: 10,
    fr: {
      question: 'Comment préparer une tisane correctement ?',
      answer: [
        "Pour une tisane standard : 1 à 2 cuillères à café de plante par tasse (250 ml), eau frémissante (90-95 °C), infusion de 5 à 10 minutes selon la plante. Couvrir pendant l'infusion préserve les arômes volatils.",
        "Pour les racines et écorces, préférer une décoction : faire bouillir la plante 5 à 10 minutes dans l'eau froide puis laisser infuser 10 minutes hors du feu.",
      ],
    },
    en: {
      question: 'How do I properly prepare a herbal tea?',
      answer: [
        "Standard infusion: 1 to 2 teaspoons of herb per cup (250 ml), simmering water (90-95 °C), steep for 5 to 10 minutes depending on the plant. Cover while steeping to preserve volatile aromas.",
        "For roots and barks, use a decoction: boil the herb in cold water for 5 to 10 minutes then steep for another 10 minutes off the heat.",
      ],
    },
  },
  {
    category: 'utilisation',
    order: 20,
    fr: {
      question: 'Combien de tasses par jour puis-je consommer ?',
      answer: [
        "En usage de confort, 2 à 3 tasses par jour suffisent largement. Au-delà, le corps n'absorbe plus les bénéfices supplémentaires et certaines plantes peuvent devenir excitantes (thé vert, menthe poivrée) ou laxatives.",
        "Pour un usage prolongé (plus de 3 semaines), demander conseil à un professionnel de santé.",
      ],
    },
    en: {
      question: 'How many cups per day can I drink?',
      answer: [
        "For wellness use, 2 to 3 cups per day are more than enough. Beyond that, the body no longer absorbs additional benefits and some plants can become stimulating (green tea, peppermint) or laxative.",
        "For prolonged use (more than 3 weeks), consult a healthcare professional.",
      ],
    },
  },
  {
    category: 'utilisation',
    order: 30,
    fr: {
      question: 'Comment conserver les plantes ?',
      answer: [
        "Conservez les plantes dans leur sachet refermé ou dans un contenant hermétique opaque, à l'abri de la lumière, de la chaleur et de l'humidité. Évitez le rebord de fenêtre et les placards près du four.",
        "Bien stockées, les plantes séchées gardent leurs propriétés 12 à 24 mois selon les espèces. La date de durabilité minimale est indiquée sur chaque emballage.",
      ],
    },
    en: {
      question: 'How should I store the herbs?',
      answer: [
        "Store herbs in their resealed pouch or in an airtight opaque container, away from light, heat and humidity. Avoid windowsills and cabinets near the oven.",
        "Properly stored, dried herbs keep their properties for 12 to 24 months depending on the species. The best-before date is printed on every package.",
      ],
    },
  },

  // ── Santé ──────────────────────────────────────────────────
  {
    category: 'sante',
    order: 10,
    fr: {
      question: 'Vos produits remplacent-ils un traitement médical ?',
      answer: [
        "Non. Nos plantes sont des compléments d'usage traditionnel pour le bien-être quotidien. Elles ne diagnostiquent, ne traitent ni ne guérissent aucune maladie.",
        "En cas de symptômes persistants, de prise de médicaments, de grossesse ou de pathologie chronique, consultez impérativement votre médecin ou un pharmacien.",
      ],
    },
    en: {
      question: 'Do your products replace medical treatment?',
      answer: [
        "No. Our plants are traditional-use supplements for daily wellness. They do not diagnose, treat or cure any disease.",
        "In case of persistent symptoms, ongoing medication, pregnancy or chronic conditions, always consult your doctor or pharmacist.",
      ],
    },
  },
  {
    category: 'sante',
    order: 20,
    fr: {
      question: 'Y a-t-il des interactions avec mes médicaments ?',
      answer: [
        "Certaines plantes peuvent interagir avec des traitements (anticoagulants, antidépresseurs, contraceptifs, immunosuppresseurs). Le millepertuis, le pamplemousse, le ginkgo et le ginseng en sont des exemples connus.",
        "Avant tout usage prolongé en parallèle d'un traitement, demandez l'avis de votre médecin ou pharmacien.",
      ],
    },
    en: {
      question: 'Are there interactions with my medication?',
      answer: [
        "Some plants can interact with medications (anticoagulants, antidepressants, contraceptives, immunosuppressants). St. John's wort, grapefruit, ginkgo and ginseng are well-known examples.",
        "Before any prolonged use alongside treatment, ask your doctor or pharmacist for advice.",
      ],
    },
  },
  {
    category: 'sante',
    order: 30,
    fr: {
      question: 'Vos produits conviennent-ils aux femmes enceintes ?',
      answer: [
        "De nombreuses plantes sont contre-indiquées pendant la grossesse et l'allaitement. Nous indiquons les précautions sur chaque fiche, mais par principe : aucun complément à base de plantes sans avis médical durant cette période.",
        "Quelques plantes douces (camomille, mélisse) peuvent être consommées ponctuellement, en infusion légère, après validation par votre sage-femme ou médecin.",
      ],
    },
    en: {
      question: 'Are your products suitable during pregnancy?',
      answer: [
        "Many plants are contraindicated during pregnancy and breastfeeding. We list precautions on each product page, but as a rule: no plant-based supplement without medical advice during this period.",
        "A few gentle plants (chamomile, lemon balm) may be consumed occasionally, as a light infusion, after approval from your midwife or doctor.",
      ],
    },
  },
  {
    category: 'sante',
    order: 40,
    fr: {
      question: 'Vos produits conviennent-ils aux enfants ?',
      answer: [
        "Pour les enfants de moins de 12 ans, la phytothérapie doit être encadrée par un professionnel de santé. Les dosages adultes ne sont pas adaptés.",
        "Certaines tisanes très douces (camomille, fleur d'oranger, tilleul) sont traditionnellement utilisées en très petite quantité chez l'enfant après l'âge de 3 ans.",
      ],
    },
    en: {
      question: 'Are your products suitable for children?',
      answer: [
        "For children under 12, herbal medicine should be supervised by a healthcare professional. Adult dosages are not appropriate.",
        "Some very gentle teas (chamomile, orange blossom, linden) are traditionally used in very small quantities for children over the age of 3.",
      ],
    },
  },

  // ── Site & service ─────────────────────────────────────────
  {
    category: 'site',
    order: 10,
    fr: {
      question: 'Comment passer commande ?',
      answer: [
        "Notre site est avant tout une encyclopédie : nous référençons les produits avec un lien vers les marketplaces partenaires (Amazon, Temu) où la commande, la facturation et la livraison sont gérées par le revendeur.",
        "Cliquez sur « Où l'acheter » sur une fiche produit pour accéder aux options d'achat disponibles.",
      ],
    },
    en: {
      question: 'How do I place an order?',
      answer: [
        "Our site is primarily an encyclopedia: we list products with links to partner marketplaces (Amazon, Temu) where ordering, billing and shipping are handled by the reseller.",
        "Click \"Where to buy\" on any product page to see the available purchase options.",
      ],
    },
  },
  {
    category: 'site',
    order: 20,
    fr: {
      question: 'Comment vous contacter ?',
      answer: [
        "Vous pouvez nous écrire via le formulaire de la page Contact, ou directement à communication@calebasse.com pour toute question sur les plantes, le contenu du site ou des suggestions.",
        "Nous répondons sous 48 h ouvrées en moyenne.",
      ],
    },
    en: {
      question: 'How can I contact you?',
      answer: [
        "You can reach us through the Contact page form, or directly at communication@calebasse.com for any question about plants, site content or suggestions.",
        "We typically reply within 48 working hours.",
      ],
    },
  },
  {
    category: 'site',
    order: 30,
    fr: {
      question: 'Comment vérifier qu\'une information est fiable sur le site ?',
      answer: [
        "Chaque fiche cite ses sources : pharmacopées (européenne, française, chinoise), références traditionnelles, monographies de l'EMA (European Medicines Agency) lorsqu'elles existent.",
        "Nous séparons explicitement les usages traditionnels des allégations validées scientifiquement. Les contre-indications et précautions sont issues des autorités sanitaires.",
      ],
    },
    en: {
      question: 'How can I verify the information on the site?',
      answer: [
        "Each entry cites its sources: pharmacopoeias (European, French, Chinese), traditional references, EMA monographs where available.",
        "We explicitly distinguish traditional uses from scientifically validated claims. Contraindications and precautions come from health authorities.",
      ],
    },
  },
]

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const url = new URL(req.url)
    if (url.searchParams.get('confirm') !== 'yes') {
      return NextResponse.json(
        { error: 'Add ?confirm=yes to seed in production.' },
        { status: 400 },
      )
    }
  }

  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })

  const payload = await getPayload({ config: configPromise })
  const summary: any[] = []

  // Wipe via SQL direct pour éviter payload.find/delete qui touche
  // payload_locked_documents (schéma instable sur cette collection neuve).
  try {
    const drizzle = (payload.db as any).drizzle
    if (drizzle) {
      await drizzle.execute('DELETE FROM faq_items_locales')
      await drizzle.execute('DELETE FROM faq_items')
    }
  } catch (err: any) {
    payload.logger?.warn?.(`[seed-faq] wipe SQL: ${err?.message || err}`)
  }

  for (const entry of FAQ_ENTRIES) {
    try {
      const created = await payload.create({
        collection: 'faqItems',
        locale: 'fr',
        data: {
          question: entry.fr.question,
          answer: richText(entry.fr.answer),
          category: entry.category,
          order: entry.order,
        },
        overrideAccess: true,
        req: { context: seedContext } as any,
      } as any)
      await payload.update({
        collection: 'faqItems',
        id: (created as any).id,
        locale: 'en',
        data: {
          question: entry.en.question,
          answer: richText(entry.en.answer),
        },
        overrideAccess: true,
        req: { context: seedContext } as any,
      } as any)
      summary.push({ category: entry.category, question: entry.fr.question, action: 'created' })
    } catch (err: any) {
      summary.push({
        category: entry.category,
        question: entry.fr.question,
        error: err?.message || String(err),
      })
    }
  }

  const counts = summary.reduce(
    (acc: any, e) => {
      const k = e.error ? 'errors' : e.action || 'unknown'
      acc[k] = (acc[k] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return NextResponse.json({
    total: FAQ_ENTRIES.length,
    counts,
    summary,
  })
}
