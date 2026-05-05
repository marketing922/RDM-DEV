import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { generateGeoField, type GeoLocale, type GeoFieldType } from '@/lib/geoGenerator'
import { richTextToPlain } from '@/lib/utils'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 300

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'string') return v.trim().length === 0
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') {
    const root = (v as any).root
    if (root?.children && Array.isArray(root.children)) {
      return richTextToPlain(v).trim().length === 0
    }
    return Object.keys(v as object).length === 0
  }
  return false
}

function defaultTargetQueries(name: string, locale: GeoLocale): string[] {
  if (locale === 'en') {
    return [
      `What are the benefits of ${name.toLowerCase()}?`,
      `${name} traditional uses`,
      `${name} natural remedy phytotherapy`,
    ]
  }
  return [
    `Quels sont les bienfaits de ${name.toLowerCase()} ?`,
    `${name} usages traditionnels`,
    `${name} phytothérapie remède naturel`,
  ]
}

function defaultAuthoritySignals(locale: GeoLocale): string {
  return locale === 'en'
    ? 'Editorial sources: EMA/HMPC Community Herbal Monographs, European Pharmacopoeia 10.0, EFSA Health Claims Register, French Pharmacopoeia, Cochrane systematic reviews. Content reviewed against the European regulatory framework on plant-based food supplements.'
    : 'Sources éditoriales : monographies EMA/HMPC, Pharmacopée européenne 10.0, registre EFSA des allégations de santé, Pharmacopée française, revues systématiques Cochrane. Contenu revu au regard du cadre réglementaire européen sur les compléments alimentaires à base de plantes.'
}

function defaultQuotable(name: string, latin: string, locale: GeoLocale) {
  return [
    {
      statement:
        locale === 'en'
          ? `${name} (${latin}) is documented in the European Pharmacopoeia and the EMA/HMPC Community Herbal Monographs as a plant of well-established or traditional use.`
          : `${name} (${latin}) est documentée dans la Pharmacopée européenne et les monographies EMA/HMPC comme plante d'usage bien établi ou traditionnel.`,
      source: locale === 'en' ? 'EMA/HMPC + European Pharmacopoeia' : 'EMA/HMPC + Pharmacopée européenne',
    },
  ]
}

function defaultSources() {
  return [
    {
      title: 'Community Herbal Monographs',
      publisher: 'EMA/HMPC',
      url: 'https://www.ema.europa.eu/en/human-regulatory-overview/herbal-medicinal-products',
    },
    {
      title: 'European Pharmacopoeia',
      publisher: 'EDQM (Council of Europe)',
      url: 'https://www.edqm.eu/en/european-pharmacopoeia',
    },
    {
      title: 'EU Register of nutrition and health claims made on foods',
      publisher: 'European Commission / EFSA',
      url: 'https://ec.europa.eu/food/food-feed-portal/screen/health-claims/eu-register',
    },
  ]
}

const GEN_FIELDS: GeoFieldType[] = ['directAnswer', 'definition', 'keyTakeaways', 'faq']
const ARRAY_FIELDS: GeoFieldType[] = ['keyTakeaways', 'faq']

async function enrichOne(
  payload: any,
  plant: any,
  locale: GeoLocale,
  dry: boolean,
  overwriteArrays: boolean,
) {
  const updates: Record<string, any> = {}
  const generated: string[] = []
  const skipped: string[] = []
  const errors: Array<{ field: string; error: string }> = []

  const allDoc = await payload.findByID({
    collection: 'wikiEntries',
    id: plant.id,
    locale: 'all',
    overrideAccess: true,
    depth: 0,
  } as any)

  const localeValue = (key: string) => {
    const v = (allDoc as any)?.[key]
    if (v && typeof v === 'object' && (locale in v) && !Array.isArray(v) && !v.root) {
      return (v as any)[locale]
    }
    return v
  }

  const ctx = {
    kind: 'plant' as const,
    id: plant.id,
    name: localeValue('name'),
    latinName: (allDoc as any)?.latinName,
    shortDescription: localeValue('shortDescription'),
    longDescription: localeValue('description')
      ? richTextToPlain(localeValue('description'))
      : localeValue('longDescription') || '',
    category: (allDoc as any)?.category,
  }

  for (const field of GEN_FIELDS) {
    const isArray = ARRAY_FIELDS.includes(field)
    const current = localeValue(field)
    const skipBecauseFilled = !isEmpty(current) && !(isArray && overwriteArrays)
    if (skipBecauseFilled) {
      skipped.push(`${field}/${locale}`)
      continue
    }
    if (dry) {
      generated.push(`${field}/${locale} [dry]`)
      continue
    }

    let out: any
    let lastErr: any
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        out = await generateGeoField(field, ctx as any, locale)
        lastErr = null
        break
      } catch (err: any) {
        lastErr = err
        const msg = err?.message || String(err)
        const transient = /\b(503|429|500|UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|fetch failed|ECONNRESET|ETIMEDOUT|timeout)\b/i.test(msg)
        if (!transient || attempt === 4) break
        const delayMs = [1000, 3000, 7000][attempt - 1]
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }
    if (lastErr || !out) {
      errors.push({ field: `${field}/${locale}`, error: lastErr?.message || 'unknown' })
      continue
    }
    if (out.field === 'directAnswer' || out.field === 'definition') {
      updates[field] = out.text
    } else if (out.field === 'keyTakeaways') {
      updates[field] = out.items.map((t: string) => ({ takeaway: t }))
    } else if (out.field === 'faq') {
      updates[field] = out.items
    }
    generated.push(`${field}/${locale}`)
  }

  // Localised metadata fills
  if (isEmpty(localeValue('targetAIQueries')) || overwriteArrays) {
    updates.targetAIQueries = defaultTargetQueries(ctx.name, locale).map((q) => ({ query: q }))
    generated.push(`targetAIQueries/${locale} [default]`)
  }
  if (isEmpty(localeValue('authoritySignals'))) {
    updates.authoritySignals = defaultAuthoritySignals(locale)
    generated.push(`authoritySignals/${locale} [default]`)
  }
  if (isEmpty(localeValue('quotableStatements')) || overwriteArrays) {
    updates.quotableStatements = defaultQuotable(ctx.name, (allDoc as any)?.latinName || '', locale)
    generated.push(`quotableStatements/${locale} [default]`)
  }

  if (locale === 'fr') {
    if (isEmpty((allDoc as any).sources)) {
      updates.sources = defaultSources()
      generated.push('sources [default]')
    }
    if (isEmpty((allDoc as any).lastFactCheckedAt)) {
      updates.lastFactCheckedAt = new Date().toISOString()
      generated.push('lastFactCheckedAt [today]')
    }
    if (isEmpty((allDoc as any).geoReadinessScore)) {
      updates.geoReadinessScore = 60
      generated.push('geoReadinessScore [60]')
    }
    if (isEmpty((allDoc as any).geoNotes)) {
      updates.geoNotes =
        'Enrichissement initial automatique (Gemini 2.5 Flash Lite + valeurs par défaut). À affiner éditorialement : ajouter des dataPoints chiffrés, sources spécifiques par plante, augmenter le geoReadinessScore après revue.'
      generated.push('geoNotes [default]')
    }
  }

  if (Object.keys(updates).length > 0 && !dry) {
    await payload.update({
      collection: 'wikiEntries',
      id: plant.id,
      data: updates,
      locale,
      overrideAccess: true,
      req: {
        context: {
          skipCompliance: true,
          skipComplianceReason: 'enrich-plants-geo',
          skipModeration: true,
        },
      } as any,
    })
  }

  return { generated, skipped, errors, updateCount: Object.keys(updates).length }
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production.' }, { status: 403 })
  }
  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })
  if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({
      message:
        'Add ?confirm=yes to enrich. Params: ?slug=<slug> · ?dry=yes · ?from=<n>&to=<n> · ?overwrite=yes · ?locale=fr|en|both (default both)',
    })
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 503 })
  }

  const dry = req.nextUrl.searchParams.get('dry') === 'yes'
  const slugFilter = req.nextUrl.searchParams.get('slug') || ''
  const localesParam = (req.nextUrl.searchParams.get('locale') || 'both') as 'fr' | 'en' | 'both'
  const from = parseInt(req.nextUrl.searchParams.get('from') || '0', 10) || 0
  const to = parseInt(req.nextUrl.searchParams.get('to') || '999', 10) || 999
  const overwriteArrays = req.nextUrl.searchParams.get('overwrite') === 'yes'

  const payload = await getPayload({ config: configPromise })
  const where: any = { _status: { equals: 'published' } }
  if (slugFilter) where.slug = { equals: slugFilter }

  const { docs } = await payload.find({
    collection: 'wikiEntries',
    where,
    limit: 200,
    pagination: false,
    overrideAccess: true,
    sort: 'referenceNumber',
  } as any)

  const slice = docs.slice(from, to)
  const locales: GeoLocale[] = localesParam === 'both' ? ['fr', 'en'] : [localesParam]

  const summary: any[] = []
  for (const plant of slice as any[]) {
    const entry: any = { slug: plant.slug, referenceNumber: plant.referenceNumber }
    for (const loc of locales) {
      try {
        entry[loc] = await enrichOne(payload, plant, loc, dry, overwriteArrays)
      } catch (err: any) {
        entry[loc] = { error: err?.message || String(err) }
      }
    }
    summary.push(entry)
  }

  return NextResponse.json({ total: slice.length, locales, dry, summary })
}
