import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 300

const FINAL_CSV = path.join(process.cwd(), 'data', 'products', 'final.csv')
const LINKS_CSV = path.join(process.cwd(), 'data', 'products', 'links.csv')

const seedContext = {
  skipCompliance: true,
  skipComplianceReason: 'import-products batch upsert',
  skipModeration: true,
  skipEmbed: true,
}

// ── Mojibake fix ────────────────────────────────────────────
// CSVs are saved as UTF-8 but with characters that were originally
// Latin-1 misinterpreted (Ã© instead of é, etc.). We recover by
// re-encoding latin-1 → utf-8.
function fixMojibake(s: string): string {
  if (!s) return s
  try {
    return Buffer.from(s, 'latin1').toString('utf-8')
  } catch {
    return s
  }
}

// ── CSV parser (handles quoted fields with commas/newlines) ─
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0
  while (i < text.length) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"') {
      inQuotes = true
      i++
      continue
    }
    if (c === ',') {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (c === '\r') {
      i++
      continue
    }
    if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += c
    i++
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return []
  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? '').trim()
    })
    return obj
  })
}

// ── Slugify ─────────────────────────────────────────────────
function slugify(input: string): string {
  return input
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Effets → category mapping ───────────────────────────────
// Maps a product's `effets` text to one of the 11 plant
// categories used elsewhere in the site.
const CATEGORY_RULES: Array<{ keys: string[]; slug: string; name: string }> = [
  { keys: ['DIGEST', 'BALLONNEMENT', 'TRANSIT', 'INTESTIN', 'APPÉTIT', 'APPETIT', 'CRUDIT'], slug: 'digestion', name: 'Digestion' },
  { keys: ['RESPIRATOIRE', 'GORGE', 'VOIX', 'COUP DE FROID', 'MUCOSIT', 'GLAIRES', 'TOUX', 'PULMONAIRE'], slug: 'respiration', name: 'Respiration' },
  { keys: ['FÉMININ', 'FEMININ', 'MÉNOPAUSE', 'MENOPAUSE', 'MENSTRUEL', 'RÈGLES', 'REGLES', 'POST-PARTUM', 'POST-MENSTRU', 'INTIME'], slug: 'feminin', name: 'Féminin' },
  { keys: ["VITALITÉ DE L'HOMME", 'PROSTATE', 'VITALITE DE L\'HOMME', 'VITALITÉ SEXUELLE', 'VITALITE SEXUELLE'], slug: 'masculin', name: 'Masculin' },
  { keys: ['CIRCULATION', 'JAMBES LOURDES', 'CARDIOVASCULAIRE', 'VEINEUSE', 'ARTÈRES', 'ARTERES', 'TENSION'], slug: 'circulation', name: 'Circulation' },
  { keys: ['ARTICULAIRE', 'RHUMATISMAL', 'OSSEUX', 'OS', 'MOBILITÉ', 'MOBILITE'], slug: 'articulations', name: 'Articulations' },
  { keys: ['IMMUN', 'ADAPTOG', 'DÉFENSES', 'DEFENSES', 'TONUS', 'ANTI-FATIGUE', 'FORTIFIANT', 'FORME', 'PERFORMANCE'], slug: 'immunite-tonus', name: 'Immunité & Tonus' },
  { keys: ['PEAU', 'CUTAN', 'CAPILLAIRE', 'CHEVEUX', 'BEAUTÉ', 'BEAUTE', 'JEUNESSE'], slug: 'peau-cheveux', name: 'Peau & Cheveux' },
  { keys: ['MINCEUR', 'DRAINEUR', 'DÉTOX', 'DETOX', 'ÉLIMINATION', 'ELIMINATION', 'SUCRE', 'LIPIDES', 'FOIE', 'URINAIRE', 'MÉTABOLIQUE', 'METABOLIQUE'], slug: 'detox-metabolisme', name: 'Détox & Métabolisme' },
  { keys: ['SOMMEIL', 'CALME', 'STRESS', 'DÉTENTE', 'DETENTE', 'NERVEUX', 'HUMEUR', 'MÉMOIRE', 'MEMOIRE', 'CONCENTRATION', 'OCULAIRE', 'YEUX', 'CAPACITÉ INTELLECTUELLE', 'CAPACITE INTELLECTUELLE'], slug: 'systeme-nerveux', name: 'Système nerveux & Sens' },
]
const FALLBACK_CATEGORY = { slug: 'multi', name: 'Multi-action' }

function pickCategory(effets: string): { slug: string; name: string } {
  const up = (effets || '').toUpperCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keys.some((k) => up.includes(k))) {
      return { slug: rule.slug, name: rule.name }
    }
  }
  return FALLBACK_CATEGORY
}

// ── Lexical richText helpers ────────────────────────────────
function paragraph(text: string) {
  return {
    type: 'paragraph',
    children: [
      { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    textFormat: 0,
    textStyle: '',
  }
}

function richTextFromHtml(html: string) {
  const lines = (html || '')
    .split(/<br\s*\/?>/i)
    .map((l) => l.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
  const children = lines.length ? lines.map(paragraph) : [paragraph('')]
  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

// ── Format detection ────────────────────────────────────────
function detectFormat(name: string): 'tisane' | 'poudre' | 'gelule' | 'autre' {
  const n = (name || '').toLowerCase()
  if (n.includes('poudre') || n.includes('graine') || n.includes('zeste') || n.includes('peau')) return 'poudre'
  if (n.includes('gelule') || n.includes('gélule') || n.includes('capsule')) return 'gelule'
  return 'tisane'
}

// ── Latin name extraction ───────────────────────────────────
// Composition strings look like:
//   "Astragale Racines (Huang qi, Astragalus membranaceus) 100 g, ..."
//   "Prune (Wu mei, Prunus mume), Fruits dʼAubépine (Shan zha, Crataegus laevigata), ..."
// We pull every binomial Latin name from inside parentheses.
function extractLatinNames(composition: string): string[] {
  const names = new Set<string>()
  const re = /\(([^()]+)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(composition || '')) !== null) {
    const parts = m[1].split(',').map((s) => s.trim())
    for (const p of parts) {
      // Latin binomial: "Genus species" (capital + lowercase, then lowercase),
      // optional " var. xxx" or " subsp. xxx".
      const match = p.match(/^([A-Z][a-zëéè]+\s+[a-zëéè\-]+(?:\s+(?:var\.|subsp\.)\s*[a-zëéè\-]+)?)/)
      if (match) names.add(match[1].toLowerCase())
    }
  }
  return Array.from(names)
}

// ── Main loader ─────────────────────────────────────────────
type SourceRecord = {
  sku: string
  nom: string
  effets: string
  poids: string
  vertus: string
  composition: string
  utilisation: string
  prix: string
  codebarre: string
  bio: string
  amazonUrl?: string
  temuUrl?: string
}

function loadAndMerge(): SourceRecord[] {
  if (!fs.existsSync(FINAL_CSV)) throw new Error(`Missing ${FINAL_CSV}`)
  const finalText = fixMojibake(fs.readFileSync(FINAL_CSV, 'latin1'))
  const finalRows = rowsToObjects(parseCSV(finalText))

  // Build a lookup of all rows in links.csv (which carries Amazon/Temu URLs
  // AND, for some SKUs, the only product data — e.g. Supergreen items absent
  // from final.csv).
  const linksRowsBySku = new Map<string, Record<string, string>>()
  if (fs.existsSync(LINKS_CSV)) {
    const linksText = fixMojibake(fs.readFileSync(LINKS_CSV, 'latin1'))
    const linksRows = rowsToObjects(parseCSV(linksText))
    for (const r of linksRows) {
      const sku = (r['SKU'] || r['sku'] || '').trim()
      if (!sku || sku.startsWith('#REF')) continue
      linksRowsBySku.set(sku, r)
    }
  }

  const seen = new Set<string>()
  const out: SourceRecord[] = []

  const linksOf = (sku: string) => {
    const r = linksRowsBySku.get(sku)
    return {
      amazon: ((r?.['Lien Amazon '] || r?.['Lien Amazon'] || '') as string).trim() || undefined,
      temu: ((r?.['Lien Temu'] || '') as string).trim() || undefined,
    }
  }

  // Pass 1 — every row from final.csv (full product data), enriched with links.
  for (const r of finalRows) {
    const sku = (r['sku'] || '').trim()
    if (!sku || sku.startsWith('#REF')) continue
    if (!r['nom'] || r['nom'].startsWith('#REF')) continue
    seen.add(sku)
    const links = linksOf(sku)
    out.push({
      sku,
      nom: r['nom'] || '',
      effets: r['effets'] || '',
      poids: r['poids'] || '',
      vertus: r['vertus'] || '',
      composition: r['composition'] || '',
      utilisation: r['utilisation'] || '',
      prix: r['prix'] || '',
      codebarre: (r['codebarre'] || '').trim(),
      bio: (r['bio'] || '').trim(),
      amazonUrl: links.amazon,
      temuUrl: links.temu,
    })
  }

  // Pass 2 — SKUs that only appear in links.csv (e.g. Supergreen). Use the
  // partial data from links.csv as the source.
  for (const [sku, r] of linksRowsBySku) {
    if (seen.has(sku)) continue
    if (!r['nom']) continue
    const links = linksOf(sku)
    out.push({
      sku,
      nom: r['nom'] || '',
      effets: r['effets'] || '',
      poids: r['poids'] || '',
      vertus: r['vertus'] || '',
      composition: r['composition'] || '',
      utilisation: r['utilisation'] || '',
      prix: r['prix'] || '',
      codebarre: (r['codebarre'] || '').trim(),
      bio: (r['bio'] || '').trim(),
      amazonUrl: links.amazon,
      temuUrl: links.temu,
    })
  }

  return out
}

// ── Strip HTML / SPAN tags from short fields ────────────────
function stripTags(s: string): string {
  if (!s) return ''
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── Category upsert (cached, defensive) ─────────────────────
async function ensureCategory(payload: any, slug: string, name: string): Promise<string | null> {
  try {
    const found = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    } as any)
    if (found?.docs?.[0]?.id) return found.docs[0].id as string
  } catch {
    /* ignore find errors, try create */
  }
  try {
    const created = await payload.create({
      collection: 'categories',
      data: { name, slug },
      overrideAccess: true,
      req: { context: seedContext } as any,
    } as any)
    return (created as any)?.id ?? null
  } catch {
    return null
  }
}

// ── Tag upsert (cached, defensive) ──────────────────────────
async function ensureTag(payload: any, slug: string, name: string): Promise<string | null> {
  try {
    const found = await payload.find({
      collection: 'tags',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    } as any)
    if (found?.docs?.[0]?.id) return found.docs[0].id as string
  } catch {
    /* ignore */
  }
  try {
    const created = await payload.create({
      collection: 'tags',
      data: { name, slug },
      overrideAccess: true,
      req: { context: seedContext } as any,
    } as any)
    return (created as any)?.id ?? null
  } catch {
    return null
  }
}

// ── Pre-load all plants once into a Map (latinName-lowercase → plant) ───
type PlantLite = { id: any; slug: string; latinName?: string; benefits: any[] }
async function loadAllPlants(payload: any): Promise<Map<string, PlantLite>> {
  const map = new Map<string, PlantLite>()
  const { docs } = await payload.find({
    collection: 'wikiEntries',
    limit: 500,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  } as any)
  for (const d of docs as any[]) {
    const ln = (d.latinName || '').toString().trim().toLowerCase()
    if (!ln) continue
    map.set(ln, {
      id: d.id,
      slug: d.slug,
      latinName: d.latinName,
      benefits: Array.isArray(d.benefits) ? d.benefits : [],
    })
  }
  return map
}

// ── Append product to a plant's relatedProducts ─────────────
async function linkPlantToProduct(
  payload: any,
  plantId: any,
  productId: any,
): Promise<boolean> {
  try {
    const plant = await payload.findByID({
      collection: 'wikiEntries',
      id: plantId,
      overrideAccess: true,
      depth: 0,
    } as any)
    if (!plant) return false
    const rawList = Array.isArray((plant as any).relatedProducts)
      ? ((plant as any).relatedProducts as any[])
      : []
    const cur: any[] = []
    for (const p of rawList) {
      if (p == null) continue
      const id = typeof p === 'object' ? p.id ?? null : p
      if (id != null) cur.push(id)
    }
    if (cur.some((id) => String(id) === String(productId))) return false
    cur.push(productId)
    await payload.update({
      collection: 'wikiEntries',
      id: plantId,
      data: { relatedProducts: cur },
      overrideAccess: true,
      req: { context: seedContext } as any,
    } as any)
    return true
  } catch (err: any) {
    ;(payload as any).logger?.warn?.(
      `[import-products] linkPlantToProduct(${plantId} ← ${productId}) failed: ${err?.message || err}`,
    )
    return false
  }
}

// ── Tags derived from a record ──────────────────────────────
function tagsForRecord(rec: SourceRecord, format: string, categorySlug: string): Array<{ slug: string; name: string }> {
  const tags: Array<{ slug: string; name: string }> = []
  // Format
  if (format === 'tisane') tags.push({ slug: 'tisanes', name: 'Tisanes' })
  if (format === 'poudre') tags.push({ slug: 'poudres', name: 'Poudres' })
  if (format === 'gelule') tags.push({ slug: 'gelules', name: 'Gélules' })
  // Bio
  const bio = (rec.bio || '').toLowerCase()
  if (bio.includes('bio')) tags.push({ slug: 'bio', name: 'Bio' })
  // Category as a tag too (useful for cross-filtering)
  const catNameMap: Record<string, string> = {
    digestion: 'Digestion',
    respiration: 'Respiration',
    feminin: 'Féminin',
    masculin: 'Masculin',
    circulation: 'Circulation',
    articulations: 'Articulations',
    'immunite-tonus': 'Immunité & Tonus',
    'peau-cheveux': 'Peau & Cheveux',
    'detox-metabolisme': 'Détox & Métabolisme',
    'systeme-nerveux': 'Système nerveux & Sens',
    multi: 'Multi-action',
  }
  if (catNameMap[categorySlug]) {
    tags.push({ slug: categorySlug, name: catNameMap[categorySlug] })
  }
  return tags
}

// ── Build product payload from source row ───────────────────
function buildProductData(rec: SourceRecord, categoryId: string | null) {
  const name = stripTags(rec.nom)
  const slug = slugify(`${name}-${rec.poids || ''}`).slice(0, 80) || slugify(rec.sku)
  const price = parseFloat(rec.prix.replace(',', '.')) || 0
  return {
    name,
    slug,
    sku: rec.sku,
    shortDescription: stripTags(rec.effets),
    description: richTextFromHtml(rec.vertus),
    price,
    inStock: true,
    format: detectFormat(name),
    weight: rec.poids || undefined,
    ingredients: stripTags(rec.composition),
    usage: richTextFromHtml(rec.utilisation),
    // codebarre column from CSV is a barcode-only image — not a product packshot.
    // Leave externalImageUrl empty so the front falls back to the placeholder; the
    // user uploads real packshots via the Payload admin (or we add a separate source).
    externalImageUrl: undefined,
    amazonUrl: rec.amazonUrl,
    temuUrl: rec.temuUrl,
    category: categoryId ?? undefined,
    status: 'draft' as const,
  }
}

// ── Endpoint ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production.' }, { status: 403 })
  }
  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })
  if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({
      message:
        'Add ?confirm=yes to import products from data/products/{final.csv,links.csv}. Params: ?from=<n>&to=<n> · ?sku=<sku> · ?overwrite=yes (update existing) · ?dry=yes (preview only) · ?withLinks=no (include products without Amazon/Temu) · ?deleteOrphans=yes (DELETE products without Amazon/Temu links)',
    })
  }

  const from = parseInt(req.nextUrl.searchParams.get('from') || '0', 10) || 0
  const to = parseInt(req.nextUrl.searchParams.get('to') || '9999', 10) || 9999
  const skuFilter = (req.nextUrl.searchParams.get('sku') || '').trim()
  const overwrite = req.nextUrl.searchParams.get('overwrite') === 'yes'
  const dry = req.nextUrl.searchParams.get('dry') === 'yes'
  // Default: only import products with Amazon or Temu link (per project requirement).
  const withLinks = req.nextUrl.searchParams.get('withLinks') !== 'no'
  const deleteOrphans = req.nextUrl.searchParams.get('deleteOrphans') === 'yes'

  let records: SourceRecord[]
  try {
    records = loadAndMerge()
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }

  if (skuFilter) records = records.filter((r) => r.sku === skuFilter)
  if (withLinks) records = records.filter((r) => r.amazonUrl || r.temuUrl)

  // Orphan cleanup: delete previously-imported products that have neither Amazon nor Temu link.
  if (deleteOrphans) {
    const payload = await getPayload({ config: configPromise })
    const allowedSkus = new Set(records.map((r) => r.sku))
    const { docs: existing } = await payload.find({
      collection: 'products',
      limit: 1000,
      pagination: false,
      overrideAccess: true,
    } as any)
    const deleted: string[] = []
    for (const doc of existing as any[]) {
      const noLinks = !doc.amazonUrl && !doc.temuUrl
      const notInAllowed = !allowedSkus.has(doc.sku)
      if (noLinks || notInAllowed) {
        await payload.delete({
          collection: 'products',
          id: doc.id,
          overrideAccess: true,
          req: { context: seedContext } as any,
        } as any)
        deleted.push(doc.sku)
      }
    }
    return NextResponse.json({ deleted: deleted.length, skus: deleted })
  }

  const slice = records.slice(from, to)

  if (dry) {
    return NextResponse.json({
      total: records.length,
      sliceCount: slice.length,
      sample: slice.slice(0, 5).map((r) => ({
        sku: r.sku,
        nom: stripTags(r.nom),
        category: pickCategory(r.effets),
        prix: r.prix,
        hasAmazon: Boolean(r.amazonUrl),
        hasTemu: Boolean(r.temuUrl),
      })),
    })
  }

  const payload = await getPayload({ config: configPromise })
  const categoryCache = new Map<string, string>()
  const tagCache = new Map<string, string>()
  const plantsByLatin = await loadAllPlants(payload)
  const summary: any[] = []

  // ── Pre-create all categories + tags upfront, isolated. ─────
  // A single failed create can poison the postgres connection
  // and cascade "Drizzle Symbol" errors into the main loop.
  // We do it here so the main loop only reads from cache.
  const ALL_CATEGORIES = [
    { slug: 'digestion', name: 'Digestion' },
    { slug: 'respiration', name: 'Respiration' },
    { slug: 'feminin', name: 'Féminin' },
    { slug: 'masculin', name: 'Masculin' },
    { slug: 'circulation', name: 'Circulation' },
    { slug: 'articulations', name: 'Articulations' },
    { slug: 'immunite-tonus', name: 'Immunité & Tonus' },
    { slug: 'peau-cheveux', name: 'Peau & Cheveux' },
    { slug: 'detox-metabolisme', name: 'Détox & Métabolisme' },
    { slug: 'systeme-nerveux', name: 'Système nerveux & Sens' },
    { slug: 'multi', name: 'Multi-action' },
  ]
  const ALL_TAGS = [
    { slug: 'tisanes', name: 'Tisanes' },
    { slug: 'poudres', name: 'Poudres' },
    { slug: 'gelules', name: 'Gélules' },
    { slug: 'bio', name: 'Bio' },
    ...ALL_CATEGORIES, // category slugs are valid tag slugs too
  ]
  for (const c of ALL_CATEGORIES) {
    try {
      const id = await ensureCategory(payload, c.slug, c.name)
      if (id) categoryCache.set(c.slug, id)
    } catch (err: any) {
      payload.logger?.warn?.(`category prewarm failed: ${c.slug} — ${err?.message || err}`)
    }
  }
  for (const t of ALL_TAGS) {
    try {
      const id = await ensureTag(payload, t.slug, t.name)
      if (id) tagCache.set(t.slug, id)
    } catch (err: any) {
      payload.logger?.warn?.(`tag prewarm failed: ${t.slug} — ${err?.message || err}`)
    }
  }

  for (const rec of slice) {
    const entry: any = { sku: rec.sku, nom: stripTags(rec.nom) }
    try {
      // 1. Category — read only from prewarmed cache. Don't retry creation
      // here: if prewarm failed for this slug, the connection state is
      // already poisoned and retrying would cascade to subsequent products.
      const cat = pickCategory(rec.effets)
      const catId = categoryCache.get(cat.slug) || null
      entry.category = cat.slug
      if (!catId) entry.categoryMissing = true

      // 2. Tags — same rule as categories: cache-only, no per-product retry.
      const formatVal = detectFormat(stripTags(rec.nom))
      const wantedTags = tagsForRecord(rec, formatVal, cat.slug)
      const tagIds: string[] = []
      for (const t of wantedTags) {
        const tid = tagCache.get(t.slug)
        if (tid) tagIds.push(tid)
      }
      entry.tags = wantedTags.map((t) => t.slug)

      // 3. Plant matching from composition (Latin names) — local lookup only
      const latins = extractLatinNames(rec.composition)
      const matchedPlants: PlantLite[] = []
      for (const latin of latins) {
        const plant = plantsByLatin.get(latin)
        if (plant) matchedPlants.push(plant)
      }
      entry.plantsMatched = matchedPlants.map((p) => p.slug)

      // Aggregate benefit IDs across matched plants (filter null/undefined)
      const benefitIdSet = new Set<string>()
      for (const plant of matchedPlants) {
        for (const b of plant.benefits) {
          if (b == null) continue
          const id = typeof b === 'object' ? b.id ?? null : b
          if (id != null) benefitIdSet.add(String(id))
        }
      }
      const benefitIds = Array.from(benefitIdSet)
      entry.benefitsCount = benefitIds.length

      // 4. Build product data with relations
      const plantIds = matchedPlants.map((p) => p.id)
      const data = {
        ...buildProductData(rec, catId),
        tags: tagIds.length ? tagIds : undefined,
        benefits: benefitIds.length ? benefitIds : undefined,
        relatedPlants: plantIds.length ? plantIds : undefined,
      }

      const existing = await payload.find({
        collection: 'products',
        where: { sku: { equals: rec.sku } },
        limit: 1,
        overrideAccess: true,
      } as any)

      let productId: string | null = null
      if (existing.docs?.[0]?.id) {
        productId = String(existing.docs[0].id)
        if (!overwrite) {
          // Patch links + relations if missing
          const cur: any = existing.docs[0]
          const patch: any = {}
          if (!cur.amazonUrl && data.amazonUrl) patch.amazonUrl = data.amazonUrl
          if (!cur.temuUrl && data.temuUrl) patch.temuUrl = data.temuUrl
          if ((!cur.tags || cur.tags.length === 0) && tagIds.length) patch.tags = tagIds
          if ((!cur.benefits || cur.benefits.length === 0) && benefitIds.length) patch.benefits = benefitIds
          if ((!cur.relatedPlants || cur.relatedPlants.length === 0) && plantIds.length)
            patch.relatedPlants = plantIds
          if (Object.keys(patch).length === 0) {
            entry.action = 'skip (exists)'
          } else {
            await payload.update({
              collection: 'products',
              id: cur.id,
              data: patch,
              overrideAccess: true,
              req: { context: seedContext } as any,
            } as any)
            entry.action = `patched (${Object.keys(patch).join(', ')})`
          }
        } else {
          await payload.update({
            collection: 'products',
            id: existing.docs[0].id,
            data,
            overrideAccess: true,
            req: { context: seedContext } as any,
          } as any)
          entry.action = 'updated'
        }
      } else {
        const created = await payload.create({
          collection: 'products',
          data,
          overrideAccess: true,
          req: { context: seedContext } as any,
        } as any)
        productId = String((created as any)?.id ?? '')
        entry.action = 'created'
      }

      // 5. Defer plant linking to Phase 2 so a failing wikiEntries update
      //    can't poison the Drizzle connection mid-loop.
      if (productId) {
        entry.productId = productId
        entry.plantIdsToLink = matchedPlants.map((p) => p.id)
      }
    } catch (err: any) {
      entry.error =
        (err?.cause as any)?.message ||
        (err?.message || String(err)).slice(0, 300)
      // Surface stack so we can pinpoint which operation throws.
      payload.logger?.error?.(`[import-products] ${rec.sku}: ${err?.stack || err}`)
    }
    summary.push(entry)
  }

  // ── Phase 2: bidirectional plant→product linking ─────────────
  // Done after all products are upserted, so a failing wikiEntries
  // update can't cascade and break the products loop.
  // Group by plant so we update each plant once with all its products.
  const productsByPlant = new Map<string, string[]>()
  for (const e of summary) {
    if (!e.productId || !Array.isArray(e.plantIdsToLink)) continue
    for (const plantId of e.plantIdsToLink) {
      const key = String(plantId)
      const arr = productsByPlant.get(key) || []
      arr.push(String(e.productId))
      productsByPlant.set(key, arr)
    }
  }
  let linkedTotal = 0
  let linkErrors = 0
  for (const [plantId, productIds] of productsByPlant.entries()) {
    try {
      const plant = await payload.findByID({
        collection: 'wikiEntries',
        id: plantId,
        overrideAccess: true,
        depth: 0,
      } as any)
      if (!plant) continue
      const rawList = Array.isArray((plant as any).relatedProducts)
        ? ((plant as any).relatedProducts as any[])
        : []
      const cur = new Set<string>()
      for (const p of rawList) {
        if (p == null) continue
        const id = typeof p === 'object' ? p.id ?? null : p
        if (id != null) cur.add(String(id))
      }
      let added = 0
      for (const pid of productIds) {
        if (!cur.has(pid)) {
          cur.add(pid)
          added++
        }
      }
      if (added === 0) continue
      await payload.update({
        collection: 'wikiEntries',
        id: plantId,
        data: { relatedProducts: Array.from(cur) },
        overrideAccess: true,
        req: { context: seedContext } as any,
      } as any)
      linkedTotal += added
    } catch (err: any) {
      linkErrors++
      payload.logger?.error?.(
        `[import-products] phase2 link plant=${plantId}: ${err?.stack || err?.message || err}`,
      )
    }
  }
  // Reflect linking results back into summary entries
  for (const e of summary) {
    if (Array.isArray(e.plantIdsToLink)) {
      e.plantsLinked = e.plantIdsToLink.length
      delete e.plantIdsToLink
    }
  }

  const counts = summary.reduce(
    (acc: any, e) => {
      const k = e.error ? 'errors' : (e.action || 'unknown')
      acc[k] = (acc[k] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return NextResponse.json({
    total: records.length,
    processed: slice.length,
    counts,
    phase2: { linked: linkedTotal, errors: linkErrors, plants: productsByPlant.size },
    summary,
  })
}
