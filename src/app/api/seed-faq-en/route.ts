import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 60

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
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

// Mapping FR question (existante en DB) → traduction EN.
const EN_TRANSLATIONS: Array<{
  frQuestion: string
  enQuestion: string
  enAnswer: string[]
}> = [
  {
    frQuestion: 'Vos plantes sont-elles réellement biologiques ?',
    enQuestion: 'Are your plants really organic?',
    enAnswer: [
      "Yes. All of our plants come from certified Organic Agriculture supply chains (AB / EU Leaf). Each batch is traceable from grower to packaging.",
      "We favor French and European producers practicing agroecology or controlled wild harvesting.",
    ],
  },
  {
    frQuestion: "Comment garantissez-vous la qualité d'une plante ?",
    enQuestion: 'How do you guarantee plant quality?',
    enAnswer: [
      "Each batch is laboratory-tested for botanical identity, microbiological purity and absence of heavy metals, pesticides and radioactivity, in line with the European Pharmacopoeia.",
      "We keep the analysis certificates and print the batch number on every package.",
    ],
  },
  {
    frQuestion: "D'où viennent vos plantes ?",
    enQuestion: 'Where do your plants come from?',
    enAnswer: [
      "Most of our plants are grown in France and Europe. A few specific plants (ginseng, reishi, goji berries, etc.) come from certified Asian supply chains we work with directly.",
      "We always indicate the country of origin on the product page.",
    ],
  },
  {
    frQuestion: 'Quelle est la différence entre une plante en vrac et une gélule ?',
    enQuestion: 'What is the difference between bulk herbs and capsules?',
    enAnswer: [
      "Bulk herbs (teas, infusions, decoctions) release water-soluble compounds into hot water. It is the traditional form, gentle and suited to daily use.",
      "Capsules contain powdered or concentrated extract with precise dosing. More convenient on the go but the extraction is not the same as in an infusion.",
    ],
  },
  {
    frQuestion: 'Comment préparer une tisane correctement ?',
    enQuestion: 'How do I properly prepare a herbal tea?',
    enAnswer: [
      "Standard infusion: 1 to 2 teaspoons of herb per cup (250 ml), simmering water (90-95 °C), steep for 5 to 10 minutes depending on the plant. Cover while steeping to preserve volatile aromas.",
      "For roots and barks, use a decoction: boil the herb in cold water for 5 to 10 minutes then steep for another 10 minutes off the heat.",
    ],
  },
  {
    frQuestion: 'Combien de tasses par jour puis-je consommer ?',
    enQuestion: 'How many cups per day can I drink?',
    enAnswer: [
      "For wellness use, 2 to 3 cups per day are more than enough. Beyond that, the body no longer absorbs additional benefits and some plants can become stimulating (green tea, peppermint) or laxative.",
      "For prolonged use (more than 3 weeks), consult a healthcare professional.",
    ],
  },
  {
    frQuestion: 'Comment conserver les plantes ?',
    enQuestion: 'How should I store the herbs?',
    enAnswer: [
      "Store herbs in their resealed pouch or in an airtight opaque container, away from light, heat and humidity. Avoid windowsills and cabinets near the oven.",
      "Properly stored, dried herbs keep their properties for 12 to 24 months depending on the species. The best-before date is printed on every package.",
    ],
  },
  {
    frQuestion: 'Vos produits remplacent-ils un traitement médical ?',
    enQuestion: 'Do your products replace medical treatment?',
    enAnswer: [
      "No. Our plants are traditional-use supplements for daily wellness. They do not diagnose, treat or cure any disease.",
      "In case of persistent symptoms, ongoing medication, pregnancy or chronic conditions, always consult your doctor or pharmacist.",
    ],
  },
  {
    frQuestion: 'Y a-t-il des interactions avec mes médicaments ?',
    enQuestion: 'Are there interactions with my medication?',
    enAnswer: [
      "Some plants can interact with medications (anticoagulants, antidepressants, contraceptives, immunosuppressants). St. John's wort, grapefruit, ginkgo and ginseng are well-known examples.",
      "Before any prolonged use alongside treatment, ask your doctor or pharmacist for advice.",
    ],
  },
  {
    frQuestion: 'Vos produits conviennent-ils aux femmes enceintes ?',
    enQuestion: 'Are your products suitable during pregnancy?',
    enAnswer: [
      "Many plants are contraindicated during pregnancy and breastfeeding. We list precautions on each product page, but as a rule: no plant-based supplement without medical advice during this period.",
      "A few gentle plants (chamomile, lemon balm) may be consumed occasionally, as a light infusion, after approval from your midwife or doctor.",
    ],
  },
  {
    frQuestion: 'Vos produits conviennent-ils aux enfants ?',
    enQuestion: 'Are your products suitable for children?',
    enAnswer: [
      "For children under 12, herbal medicine should be supervised by a healthcare professional. Adult dosages are not appropriate.",
      "Some very gentle teas (chamomile, orange blossom, linden) are traditionally used in very small quantities for children over the age of 3.",
    ],
  },
  {
    frQuestion: 'Comment passer commande ?',
    enQuestion: 'How do I place an order?',
    enAnswer: [
      "Our site is primarily an encyclopedia: we list products with links to partner marketplaces (Amazon, Temu) where ordering, billing and shipping are handled by the reseller.",
      "Click \"Where to buy\" on any product page to see the available purchase options.",
    ],
  },
  {
    frQuestion: 'Comment vous contacter ?',
    enQuestion: 'How can I contact you?',
    enAnswer: [
      "You can reach us through the Contact page form, or directly at communication@calebasse.com for any question about plants, site content or suggestions.",
      "We typically reply within 48 working hours.",
    ],
  },
  {
    frQuestion: "Comment vérifier qu'une information est fiable sur le site ?",
    enQuestion: 'How can I verify the information on the site?',
    enAnswer: [
      "Each entry cites its sources: pharmacopoeias (European, French, Chinese), traditional references, EMA monographs where available.",
      "We explicitly distinguish traditional uses from scientifically validated claims. Contraindications and precautions come from health authorities.",
    ],
  },
]

export async function GET(req: NextRequest) {
  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })

  const payload = await getPayload({ config: configPromise })
  const drizzle = (payload.db as any).drizzle
  if (!drizzle) {
    return NextResponse.json({ error: 'Drizzle client unavailable' }, { status: 500 })
  }

  const summary: any[] = []

  for (const t of EN_TRANSLATIONS) {
    try {
      // 1. Trouver l'ID parent via la question FR.
      const found: any = await drizzle.execute(
        sql`SELECT _parent_id FROM faq_items_locales WHERE _locale = 'fr' AND question = ${t.frQuestion} LIMIT 1`,
      )
      const rows = found?.rows || found || []
      const parentId = rows?.[0]?._parent_id ?? rows?.[0]?.parent_id
      if (!parentId) {
        summary.push({ question: t.frQuestion, error: 'parent FR not found' })
        continue
      }

      // 2. Supprimer l'éventuelle ligne EN existante (idempotence).
      await drizzle.execute(
        sql`DELETE FROM faq_items_locales WHERE _parent_id = ${parentId} AND _locale = 'en'`,
      )

      // 3. Insérer la ligne EN.
      const answerJson = JSON.stringify(richText(t.enAnswer))
      await drizzle.execute(
        sql`INSERT INTO faq_items_locales (_parent_id, _locale, question, answer) VALUES (${parentId}, 'en', ${t.enQuestion}, ${answerJson}::jsonb)`,
      )

      summary.push({ parentId, frQuestion: t.frQuestion, enQuestion: t.enQuestion, action: 'inserted' })
    } catch (err: any) {
      summary.push({ question: t.frQuestion, error: err?.message || String(err) })
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
    total: EN_TRANSLATIONS.length,
    counts,
    summary,
  })
}
