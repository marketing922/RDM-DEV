import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 120

/**
 * Synchronise les relations sur la collection `benefits` à partir des
 * relations inverses déjà déclarées sur les autres collections :
 *
 * - `wikiEntries.benefits[]`     → `benefit.relatedPlants[]`
 * - `blogPosts.relatedBenefits[]` → `benefit.relatedArticles[]`
 * - Heuristique sur `products.name + shortDescription` (mots-clés)
 *                                   → `benefit.relatedProducts[]`
 *
 * Idempotent : peut être relancé. Écrit les bienfaits avec un contexte
 * `skipCompliance / skipModeration / skipEmbed` pour que les hooks ne
 * (re-)déclenchent pas un cycle d'audit/embedding sur chaque update.
 */

const seedReq = () => ({
  context: {
    skipCompliance: true,
    skipComplianceReason: 'sync-benefit-relations',
    skipModeration: true,
    skipEmbed: true,
  },
})

/**
 * Heuristique mots-clés produits → bienfait. Une regex est testée contre
 * `name + shortDescription` du produit (lowercased, accents non normalisés
 * — les seeds gardent les accents). Plusieurs bienfaits peuvent matcher
 * pour un même produit (ex. tisane sommeil + détente).
 */
const PRODUCT_KEYWORDS: Record<string, RegExp> = {
  sommeil: /\b(sommeil|nuit|endormissement|insomnie|nocturne)\b/i,
  'detente-nerveuse': /\b(stress|d[ée]tente|relax|anti[\s-]?stress|s[ée]r[ée]nit[ée]|apais)/i,
  'confort-mental': /\b(mental|esprit|calme|zen|m[ée]ditation)\b/i,
  concentration: /\b(concentration|m[ée]moire|attention|vigilance|focus)\b/i,
  'fatigue-passagere': /\b(fatigue|tonique|vitalit[ée]|[ée]nergie|coup\s*de\s*pompe|adaptog)/i,
  'confort-digestif': /\b(digestion|digestif|estomac|apr[èe]s[\s-]?repas|carminat)/i,
  'digestion-difficile': /\b(ballonnement|lourdeur|gaz|dyspepsie|flatulence)\b/i,
  'transit-intestinal': /\b(transit|constipation|laxatif|intestin)\b/i,
  'confort-hepatique': /\b(foie|h[ée]pat|bile|d[ée]tox|drainage\s*foie)/i,
  'confort-gorge': /\b(gorge|enrou|aphone|voix\s*cass)/i,
  'confort-respiratoire': /\b(respir|bronche|poumon|toux|rhume|inhalation)/i,
  'voies-aeriennes-superieures': /\b(sinus|nez|congestion|hivernal|froid)\b/i,
  'confort-vocal': /\b(voix|chant|orateur|cordes\s*vocales)\b/i,
  'defenses-naturelles': /\b(immunit[ée]|d[ée]fense|hivernal|protection|saison\s*froide)/i,
  'confort-circulatoire': /\b(circulat|sang|cardiov)/i,
  'jambes-legeres': /\b(jambes?\s*lourdes?|jambes?\s*l[ée]g[èe]res?|veineux|veine)/i,
  'confort-veineux': /\b(veine|h[ée]morro|variqueux)\b/i,
  microcirculation: /\b(microcirculation|capillaires?)\b/i,
  'confort-articulaire': /\b(articulation|articulaire|cartilage|raideur)\b/i,
  'souplesse-articulaire': /\b(souplesse|mobilit[ée]|flexibilit[ée])\b/i,
  'confort-musculaire': /\b(muscl|crampe|courbature)\b/i,
  'recuperation-effort': /\b(r[ée]cup[ée]ration|sport|effort|apr[èe]s[\s-]?sport)/i,
  'confort-menstruel': /\b(menstrue|r[èe]gle|cycle\s*f[ée]minin)/i,
  'confort-premenstruel': /\b(pr[ée]menstruel|spm|syndrome\s*pr[ée]menstruel)/i,
  menopause: /\b(m[ée]nopause|bouff[ée]e\s*de\s*chaleur|peri[\s-]?m[ée]nopause)/i,
  'bien-etre-feminin': /\b(f[ée]minin|femme\s*\(?bien[\s-]?[ée]tre\)?)/i,
  'confort-prostatique': /\b(prostat|miction|urinaire\s*masculin)/i,
  'vitalite-masculine': /\b(masculin|tonus\s*viril|libido|vigueur)/i,
}

async function findAll(payload: any, collection: string): Promise<any[]> {
  const out: any[] = []
  let page = 1
  // Pagination défensive : on tourne jusqu'à totalPages au cas où > 100.
  while (true) {
    const r = await payload.find({
      collection,
      limit: 100,
      page,
      depth: 0,
      overrideAccess: true,
      pagination: true,
    })
    const docs = Array.isArray(r?.docs) ? r.docs : []
    out.push(...docs)
    if (page >= (r?.totalPages || 1) || docs.length === 0) break
    page++
  }
  return out
}

function uniqueIds(arr: any[]): any[] {
  const seen = new Set<string>()
  const out: any[] = []
  for (const v of arr) {
    const key = String(v)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(v)
  }
  return out
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

  const [benefits, plants, products, posts] = await Promise.all([
    findAll(payload, 'benefits'),
    findAll(payload, 'wikiEntries'),
    findAll(payload, 'products'),
    findAll(payload, 'blogPosts'),
  ])

  // Index : slug → benefit.id
  const benefitBySlug: Record<string, any> = {}
  for (const b of benefits) {
    if (b?.slug) benefitBySlug[b.slug] = b
  }

  // Aggrégat : benefitId → { plants: Set<id>, products: Set<id>, articles: Set<id> }
  type Agg = { plants: any[]; products: any[]; articles: any[] }
  const agg: Record<string, Agg> = {}
  for (const b of benefits) agg[b.id] = { plants: [], products: [], articles: [] }

  // ── 1) Plantes : wikiEntries.benefits[] (slug ou id ou doc populé)
  for (const plant of plants) {
    const refs: any[] = Array.isArray(plant?.benefits) ? plant.benefits : []
    for (const ref of refs) {
      let benefit: any = null
      if (typeof ref === 'string' || typeof ref === 'number') {
        benefit = benefits.find((b) => b.id === ref) || null
        if (!benefit) {
          // ref pourrait être un slug aussi (cas seed)
          benefit = benefitBySlug[String(ref)] || null
        }
      } else if (ref && typeof ref === 'object') {
        benefit = ref.id ? benefits.find((b) => b.id === ref.id) : null
        if (!benefit && ref.slug) benefit = benefitBySlug[ref.slug] || null
      }
      if (benefit) agg[benefit.id].plants.push(plant.id)
    }
  }

  // ── 2) Articles : blogPosts.relatedBenefits[]
  for (const post of posts) {
    const refs: any[] = Array.isArray(post?.relatedBenefits) ? post.relatedBenefits : []
    for (const ref of refs) {
      let benefit: any = null
      if (typeof ref === 'string' || typeof ref === 'number') {
        benefit = benefits.find((b) => b.id === ref) || null
        if (!benefit) benefit = benefitBySlug[String(ref)] || null
      } else if (ref && typeof ref === 'object') {
        benefit = ref.id ? benefits.find((b) => b.id === ref.id) : null
        if (!benefit && ref.slug) benefit = benefitBySlug[ref.slug] || null
      }
      if (benefit) agg[benefit.id].articles.push(post.id)
    }
  }

  // ── 3) Produits : heuristique mots-clés sur name + shortDescription
  const heuristicHits: Record<string, number> = {}
  for (const product of products) {
    const haystack = [
      typeof product?.name === 'string' ? product.name : '',
      typeof product?.shortDescription === 'string' ? product.shortDescription : '',
    ]
      .join(' ')
      .toLowerCase()
    if (!haystack.trim()) continue

    for (const [benefitSlug, regex] of Object.entries(PRODUCT_KEYWORDS)) {
      if (!regex.test(haystack)) continue
      const benefit = benefitBySlug[benefitSlug]
      if (!benefit) continue
      agg[benefit.id].products.push(product.id)
      heuristicHits[benefitSlug] = (heuristicHits[benefitSlug] || 0) + 1
    }
  }

  // ── 4) Écriture : pour chaque bienfait, mettre à jour les 3 relations
  // Slicing pour éviter le timeout Vercel Hobby (60s). ?from=N&to=M
  const url4 = new URL(req.url)
  const from = Number(url4.searchParams.get('from') || '0')
  const to = Number(url4.searchParams.get('to') || benefits.length)
  const benefitsSlice = benefits.slice(from, to)

  const summary: any[] = []
  for (const benefit of benefitsSlice) {
    const a = agg[benefit.id]
    const data = {
      relatedPlants: uniqueIds(a.plants).slice(0, 50),
      relatedProducts: uniqueIds(a.products).slice(0, 50),
      relatedArticles: uniqueIds(a.articles).slice(0, 50),
    }
    // Retry pattern : l'adapter Drizzle est intermittent sur les arrays
    // imbriqués + locales. Une 2ᵉ tentative après un court délai stabilise
    // les rows manquantes.
    const doUpdate = async () => payload.update({
      collection: 'benefits',
      id: benefit.id,
      data: data as any,
      overrideAccess: true,
      req: seedReq() as any,
    } as any)

    let lastErr: any = null
    let success = false
    for (let attempt = 0; attempt < 3 && !success; attempt++) {
      try {
        if (attempt > 0) await new Promise((rs) => setTimeout(rs, 400))
        await doUpdate()
        success = true
      } catch (err: any) {
        lastErr = err
      }
    }

    if (success) {
      summary.push({
        slug: benefit.slug,
        plants: data.relatedPlants.length,
        products: data.relatedProducts.length,
        articles: data.relatedArticles.length,
      })
    } else {
      summary.push({ slug: benefit.slug, error: lastErr?.message || String(lastErr) })
    }
  }

  return NextResponse.json({
    ok: true,
    benefits: benefits.length,
    from,
    to,
    processed: benefitsSlice.length,
    plants: plants.length,
    products: products.length,
    posts: posts.length,
    heuristicHits,
    summary,
  })
}
