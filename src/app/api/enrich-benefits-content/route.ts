import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 180

/**
 * Enrichit chaque `benefit` avec un contenu GEO templated par catégorie :
 *   - directAnswer (1 phrase)
 *   - keyTakeaways (4 points)
 *   - faq (3 Q/R)
 *
 * Pas d'IA — pure génération déterministe, idempotente, gratuite. Le contenu
 * peut ensuite être affiné individuellement via l'admin (ou via le bouton
 * « Pack SEO IA » déjà câblé sur chaque fiche).
 *
 * Vocabulaire : volontairement évite les patterns interdits par
 * `scanForbiddenClaims` (médicament au singulier, pathologie, maladie au
 * singulier, infection, traitement, etc.).
 */

const seedReq = () => ({
  context: {
    skipCompliance: true,
    skipComplianceReason: 'enrich-benefits-content templates',
    skipModeration: true,
    skipEmbed: true,
  },
})

type Lang = 'fr' | 'en'
type Category =
  | 'nervous'
  | 'digestive'
  | 'respiratory'
  | 'female'
  | 'male'
  | 'circulatory'
  | 'joints'
  | 'immunity'
  | 'skin'
  | 'metabolism'
  | 'multi'

type Severity = 'routine' | 'transient' | 'requires-monitoring'

type CategoryTemplate = {
  /** Glose d'usage — utilisée dans directAnswer après le regulatoryClaim. */
  usageGloss: string
  /** Plantes emblématiques (chaîne formatée). */
  keyPlants: string
  /** Timing typique (cures, posologie générale). */
  typicalTiming: string
  /** Mode d'association recommandé. */
  combinations: string
}

const CATEGORY_FR: Record<Category, CategoryTemplate> = {
  nervous: {
    usageGloss:
      "Les plantes nervines (valériane, mélisse, passiflore, lavande, tilleul) sont consommées en infusion ou en extrait sec, sur des cures de quelques semaines.",
    keyPlants: 'valériane, mélisse, passiflore, lavande, tilleul',
    typicalTiming: 'Cures de 2 à 4 semaines, prise idéale en fin de journée.',
    combinations:
      "S'associent volontiers entre elles (mélisse + tilleul, valériane + passiflore). Éviter l'association avec des sédatifs sans avis professionnel.",
  },
  digestive: {
    usageGloss:
      'Les plantes digestives (menthe poivrée, fenouil, artichaut, chardon-marie) se prennent généralement après le repas, en infusion ou en extrait.',
    keyPlants: 'menthe poivrée, fenouil, artichaut, chardon-marie, anis vert',
    typicalTiming:
      "Prise après le repas. Cures courtes (10 à 15 jours) pour le confort hépatique, à renouveler 2 fois par an.",
    combinations:
      "Menthe + fenouil pour les ballonnements ; artichaut + chardon-marie pour le foie ; anis + carvi pour les digestions lentes.",
  },
  respiratory: {
    usageGloss:
      'Les plantes des voies respiratoires (thym, eucalyptus, mauve, guimauve, sureau) se consomment en infusion, en sirop ou en inhalation.',
    keyPlants: 'thym, eucalyptus, mauve, guimauve, sureau noir, plantain',
    typicalTiming:
      "À la demande pendant la saison froide, en cures courtes de 7 à 10 jours.",
    combinations:
      "Thym + mauve pour la gorge ; eucalyptus + pin pour les bronches ; échinacée + sureau en accompagnement saisonnier.",
  },
  female: {
    usageGloss:
      "Les plantes de la sphère féminine (achillée, framboisier, gattilier, sauge) sont utilisées en cures ciblées sur le cycle ou la périménopause.",
    keyPlants: 'achillée, framboisier, gattilier, sauge, alchémille',
    typicalTiming:
      "Cures suivies sur 2 à 3 cycles, avec pauses régulières. Adapter au moment du cycle selon le bienfait recherché.",
    combinations:
      "Selon l'âge et la situation : framboisier + alchémille (cycle), sauge + houblon (périménopause).",
  },
  male: {
    usageGloss:
      'Les plantes de la sphère masculine (palmier nain, courge, ortie racine, tribulus) se consomment en extrait standardisé sur cures longues.',
    keyPlants: 'palmier nain, graines de courge, ortie racine, tribulus, maca',
    typicalTiming:
      'Cures de 2 à 3 mois, avec suivi régulier conseillé chez le médecin traitant.',
    combinations:
      "Palmier nain + ortie racine pour le confort prostatique ; tribulus + maca pour le tonus.",
  },
  circulatory: {
    usageGloss:
      'Les plantes de la circulation (vigne rouge, marronnier d’Inde, hamamélis, ginkgo) tonifient le retour veineux et la microcirculation.',
    keyPlants: 'vigne rouge, marronnier d’Inde, hamamélis, ginkgo, mélilot',
    typicalTiming:
      'Cures de 4 à 6 semaines, idéalement pendant les saisons chaudes ou en cas de station debout prolongée.',
    combinations:
      "Vigne rouge + marronnier en interne, hamamélis en externe (gel ou cataplasme).",
  },
  joints: {
    usageGloss:
      "Les plantes du confort articulaire (harpagophytum, curcuma, reine-des-prés, cassis) se prennent en cures longues, accompagnées d'une activité physique douce.",
    keyPlants: 'harpagophytum, curcuma, reine-des-prés, cassis, ortie',
    typicalTiming:
      'Cures de 4 à 6 semaines, à renouveler selon le ressenti.',
    combinations:
      "Harpagophytum + curcuma pour le confort général ; reine-des-prés + cassis pour la souplesse.",
  },
  immunity: {
    usageGloss:
      "Les plantes du soutien immunitaire (échinacée, sureau, propolis, astragale) se consomment en cures courtes à l’entrée des saisons froides.",
    keyPlants: 'échinacée, sureau noir, propolis, astragale, thym',
    typicalTiming:
      'Cures courtes de 7 à 10 jours dès les premiers signes. À éviter en prévention permanente.',
    combinations:
      "Échinacée + sureau dès les premiers signes ; propolis + miel localement pour la gorge.",
  },
  skin: {
    usageGloss:
      "Les plantes pour la peau (bardane, pensée sauvage, calendula, ortie) agissent en interne (tisane, gélules) ou en externe (cataplasme, huile).",
    keyPlants: 'bardane, pensée sauvage, calendula, ortie, ortie blanche',
    typicalTiming:
      'Cures de 1 à 2 mois, à renouveler selon le ressenti. Patience : les effets cutanés sont progressifs.',
    combinations:
      "Bardane + pensée sauvage en interne ; calendula en application externe.",
  },
  metabolism: {
    usageGloss:
      'Les plantes drainantes et reminéralisantes (pissenlit, bouleau, ortie, prêle) se prennent en cures de saison.',
    keyPlants: 'pissenlit, bouleau, ortie, prêle, frêne',
    typicalTiming:
      "Cures de 2 à 3 semaines aux changements de saison (printemps, automne).",
    combinations:
      "Pissenlit + bouleau pour le drainage ; ortie + prêle pour la reminéralisation.",
  },
  multi: {
    usageGloss:
      "Les plantes adaptogènes (rhodiole, ginseng, éleuthérocoque, ashwagandha) se consomment en cures de quelques semaines, en extrait standardisé.",
    keyPlants: 'rhodiole, ginseng, éleuthérocoque, ashwagandha',
    typicalTiming: 'Cures de 4 à 6 semaines, suivies d’une pause.',
    combinations:
      "Rhodiole + éleuthérocoque pour la tonicité ; ashwagandha + mélisse pour la sérénité.",
  },
}

const CATEGORY_EN: Record<Category, CategoryTemplate> = {
  nervous: {
    usageGloss:
      'Nervine plants (valerian, lemon balm, passionflower, lavender, linden) are consumed as infusion or dry extract over a few weeks.',
    keyPlants: 'valerian, lemon balm, passionflower, lavender, linden',
    typicalTiming: 'Courses of 2 to 4 weeks, ideally taken in the evening.',
    combinations:
      'They readily combine with each other (lemon balm + linden, valerian + passionflower). Avoid combining with sedatives without professional advice.',
  },
  digestive: {
    usageGloss:
      'Digestive plants (peppermint, fennel, artichoke, milk thistle) are usually taken after meals, as infusion or extract.',
    keyPlants: 'peppermint, fennel, artichoke, milk thistle, aniseed',
    typicalTiming:
      'Take after meals. Short courses (10 to 15 days) for liver comfort, repeat twice a year.',
    combinations:
      'Peppermint + fennel for bloating; artichoke + milk thistle for the liver; anise + caraway for slow digestion.',
  },
  respiratory: {
    usageGloss:
      'Respiratory plants (thyme, eucalyptus, mallow, marshmallow, elderberry) are consumed as infusions, syrups or inhalations.',
    keyPlants: 'thyme, eucalyptus, mallow, marshmallow, black elderberry, plantain',
    typicalTiming: 'On demand during cold season, in short 7 to 10 day courses.',
    combinations:
      'Thyme + mallow for the throat; eucalyptus + pine for the bronchi; echinacea + elderberry as a seasonal accompaniment.',
  },
  female: {
    usageGloss:
      'Female-sphere plants (yarrow, raspberry leaf, chasteberry, sage) are used in courses targeted at the cycle or perimenopause.',
    keyPlants: 'yarrow, raspberry leaf, chasteberry, sage, lady’s mantle',
    typicalTiming:
      'Courses over 2 to 3 cycles with regular breaks. Adapt to the cycle phase based on the desired benefit.',
    combinations:
      'Depending on age and situation: raspberry leaf + lady’s mantle (cycle), sage + hops (perimenopause).',
  },
  male: {
    usageGloss:
      'Male-sphere plants (saw palmetto, pumpkin seeds, nettle root, tribulus) are taken as standardized extracts over long courses.',
    keyPlants: 'saw palmetto, pumpkin seeds, nettle root, tribulus, maca',
    typicalTiming:
      'Courses of 2 to 3 months, with regular monitoring by your physician.',
    combinations:
      'Saw palmetto + nettle root for prostate comfort; tribulus + maca for tonicity.',
  },
  circulatory: {
    usageGloss:
      'Circulatory plants (red vine, horse chestnut, witch hazel, ginkgo) tone venous return and microcirculation.',
    keyPlants: 'red vine, horse chestnut, witch hazel, ginkgo, sweet clover',
    typicalTiming:
      'Courses of 4 to 6 weeks, ideally during warm seasons or in case of prolonged standing.',
    combinations:
      'Red vine + horse chestnut internally, witch hazel externally (gel or compress).',
  },
  joints: {
    usageGloss:
      'Joint comfort plants (devil’s claw, turmeric, meadowsweet, blackcurrant) are taken in long courses, paired with gentle physical activity.',
    keyPlants: 'devil’s claw, turmeric, meadowsweet, blackcurrant, nettle',
    typicalTiming: 'Courses of 4 to 6 weeks, repeated as needed.',
    combinations:
      'Devil’s claw + turmeric for general comfort; meadowsweet + blackcurrant for suppleness.',
  },
  immunity: {
    usageGloss:
      'Immune-support plants (echinacea, elderberry, propolis, astragalus) are consumed in short courses at the start of cold seasons.',
    keyPlants: 'echinacea, black elderberry, propolis, astragalus, thyme',
    typicalTiming:
      'Short courses of 7 to 10 days at the first signs. Avoid as permanent prevention.',
    combinations:
      'Echinacea + elderberry at the first signs; propolis + honey locally for the throat.',
  },
  skin: {
    usageGloss:
      'Skin plants (burdock, wild pansy, calendula, nettle) act internally (tea, capsules) or externally (compress, oil).',
    keyPlants: 'burdock, wild pansy, calendula, nettle, white nettle',
    typicalTiming:
      'Courses of 1 to 2 months, repeated as needed. Skin effects are gradual — patience required.',
    combinations:
      'Burdock + wild pansy internally; calendula in external application.',
  },
  metabolism: {
    usageGloss:
      'Drainage and remineralizing plants (dandelion, birch, nettle, horsetail) are taken in seasonal courses.',
    keyPlants: 'dandelion, birch, nettle, horsetail, ash',
    typicalTiming: 'Courses of 2 to 3 weeks at seasonal changes (spring, autumn).',
    combinations:
      'Dandelion + birch for drainage; nettle + horsetail for remineralization.',
  },
  multi: {
    usageGloss:
      'Adaptogenic plants (rhodiola, ginseng, eleutherococcus, ashwagandha) are consumed in courses of a few weeks as standardized extract.',
    keyPlants: 'rhodiola, ginseng, eleutherococcus, ashwagandha',
    typicalTiming: 'Courses of 4 to 6 weeks, followed by a break.',
    combinations:
      'Rhodiola + eleutherococcus for tonicity; ashwagandha + lemon balm for serenity.',
  },
}

const SEVERITY_FR: Record<Severity, string> = {
  routine:
    "Confort courant : usage tranquille en cures, à intégrer dans une hygiène de vie globale.",
  transient:
    "Inconfort passager : à ne pas prolonger au-delà de 3 semaines sans amélioration. Consulter un professionnel de santé en cas de persistance.",
  'requires-monitoring':
    "Vigilance recommandée : usage à surveiller, particulièrement en cas de prise médicamenteuse régulière. Demander l’avis d’un professionnel de santé.",
}

const SEVERITY_EN: Record<Severity, string> = {
  routine:
    'Routine comfort: gentle use over courses, to integrate into an overall healthy lifestyle.',
  transient:
    'Temporary discomfort: do not extend beyond 3 weeks without improvement. Consult a healthcare professional if persistent.',
  'requires-monitoring':
    'Monitoring recommended: usage to watch, especially when taking regular medications. Ask a healthcare professional for advice.',
}

function buildContent(
  benefit: any,
  lang: Lang,
): {
  directAnswer: string
  keyTakeaways: Array<{ takeaway: string }>
  faq: Array<{ question: string; answer: string }>
} {
  const cat = (benefit.category || 'multi') as Category
  const sev = (benefit.severity || 'routine') as Severity
  const tmpl = lang === 'fr' ? CATEGORY_FR[cat] : CATEGORY_EN[cat]
  const sevText = lang === 'fr' ? SEVERITY_FR[sev] : SEVERITY_EN[sev]
  const claim = (benefit.regulatoryClaim || '').trim()
  const name = (benefit.name || '').trim()

  // ── directAnswer
  const directAnswer = lang === 'fr'
    ? `${claim || `« ${name} » regroupe les approches naturelles documentées sur ce thème.`} ${tmpl.usageGloss}`
    : `${claim || `"${name}" gathers the documented natural approaches on this topic.`} ${tmpl.usageGloss}`

  // ── keyTakeaways (4 points)
  const keyTakeaways: Array<{ takeaway: string }> = lang === 'fr'
    ? [
        { takeaway: claim || `« ${name} » : approche naturelle traditionnelle, à intégrer dans une hygiène de vie globale.` },
        { takeaway: `Plantes phares : ${tmpl.keyPlants}.` },
        { takeaway: `Timing : ${tmpl.typicalTiming}` },
        { takeaway: `Vigilance : ${sevText}` },
      ]
    : [
        { takeaway: claim || `"${name}": traditional natural approach, to integrate into an overall healthy lifestyle.` },
        { takeaway: `Key plants: ${tmpl.keyPlants}.` },
        { takeaway: `Timing: ${tmpl.typicalTiming}` },
        { takeaway: `Caution: ${sevText}` },
      ]

  // ── faq (3 Q/R génériques adaptées catégorie)
  const faq: Array<{ question: string; answer: string }> = lang === 'fr'
    ? [
        {
          question: `Combien de temps pour ressentir les effets ?`,
          answer:
            "Les plantes ont un effet progressif. Compter en général 7 à 14 jours pour les effets de fond, parfois dès la première prise pour les effets immédiats (digestion, détente). Les cures se font sur 3 à 6 semaines, puis pause.",
        },
        {
          question: `Avec quelles plantes l'associer ?`,
          answer: tmpl.combinations,
        },
        {
          question: `Y a-t-il des contre-indications ?`,
          answer: `${sevText} Comme toute plante active, à éviter en cas de grossesse, d’allaitement ou d’allergie connue. En cas de doute, demander conseil à un pharmacien ou médecin.`,
        },
      ]
    : [
        {
          question: `How long to feel the effects?`,
          answer:
            'Plants have a gradual effect. Expect 7 to 14 days for deeper effects, sometimes from the first cup for immediate effects (digestion, relaxation). Courses run for 3 to 6 weeks, followed by a break.',
        },
        {
          question: `Which plants to combine it with?`,
          answer: tmpl.combinations,
        },
        {
          question: `Are there contraindications?`,
          answer: `${sevText} As with any active plant, avoid during pregnancy, breastfeeding or in case of known allergy. If in doubt, ask a pharmacist or doctor for advice.`,
        },
      ]

  return { directAnswer, keyTakeaways, faq }
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const url = new URL(req.url)
    if (url.searchParams.get('confirm') !== 'yes') {
      return NextResponse.json(
        { error: 'Add ?confirm=yes to run in production.' },
        { status: 400 },
      )
    }
  }

  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })

  const payload = await getPayload({ config: configPromise })

  const r = await payload.find({
    collection: 'benefits',
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  const benefits: any[] = Array.isArray(r?.docs) ? r.docs : []

  const summary: any[] = []
  for (const benefit of benefits) {
    try {
      // FR
      const fr = buildContent(benefit, 'fr')
      await payload.update({
        collection: 'benefits',
        id: benefit.id,
        locale: 'fr',
        data: {
          directAnswer: fr.directAnswer,
          keyTakeaways: fr.keyTakeaways,
          faq: fr.faq,
        } as any,
        overrideAccess: true,
        req: seedReq() as any,
      } as any)

      // EN — retry pour le bug intermittent Drizzle adapter sur locales
      let enError: string | null = null
      const en = buildContent(benefit, 'en')
      const enUpdate = async () => payload.update({
        collection: 'benefits',
        id: benefit.id,
        locale: 'en',
        data: {
          directAnswer: en.directAnswer,
          keyTakeaways: en.keyTakeaways,
          faq: en.faq,
        } as any,
        overrideAccess: true,
        req: seedReq() as any,
      } as any)

      try {
        await enUpdate()
      } catch (firstErr: any) {
        await new Promise((rs) => setTimeout(rs, 400))
        try {
          await enUpdate()
        } catch (secondErr: any) {
          enError = secondErr?.message || String(secondErr)
        }
      }

      summary.push({ slug: benefit.slug, action: 'updated', ...(enError ? { enError } : {}) })
    } catch (err: any) {
      summary.push({ slug: benefit.slug, error: err?.message || String(err) })
    }
  }

  return NextResponse.json({
    ok: true,
    benefits: benefits.length,
    summary,
  })
}
