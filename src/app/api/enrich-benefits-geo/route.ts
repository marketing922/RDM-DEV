import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { generateGeoField, type GeoLocale, type GeoFieldType } from '@/lib/geoGenerator'
import { richTextToPlain } from '@/lib/utils'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 300

/* ─── Helpers ─────────────────────────────────────────────────────── */

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'string') return v.trim().length === 0
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') {
    const root = (v as any).root
    if (root?.children && Array.isArray(root.children)) {
      // Lexical empty check
      const text = richTextToPlain(v).trim()
      return text.length === 0
    }
    return Object.keys(v as object).length === 0
  }
  return false
}

function defaultTargetQueries(name: string, locale: GeoLocale): string[] {
  if (locale === 'en') {
    return [
      `What is ${name.toLowerCase()}?`,
      `Which plants help with ${name.toLowerCase()}?`,
      `${name} natural remedy`,
    ]
  }
  return [
    `Qu'est-ce que ${name.toLowerCase()} ?`,
    `Quelles plantes pour ${name.toLowerCase()} ?`,
    `${name} remède naturel`,
  ]
}

function defaultAuthoritySignals(locale: GeoLocale): string {
  return locale === 'en'
    ? 'Editorial sources: EFSA Health Claims Register, EMA/HMPC Community Herbal Monographs, ANSES recommendations, French Pharmacopoeia. Content reviewed against the European regulatory framework on plant-based food supplements.'
    : 'Sources éditoriales : EFSA Health Claims Register, monographies EMA/HMPC, recommandations ANSES, Pharmacopée française. Contenu revu au regard du cadre réglementaire européen sur les compléments alimentaires à base de plantes.'
}

function defaultQuotable(name: string, claim: string, locale: GeoLocale): Array<{ statement: string; source?: string }> {
  if (!claim) return []
  return [
    {
      statement:
        locale === 'en'
          ? `According to the European regulatory framework, ${name} is associated with the authorised claim: "${claim.replace(/[«»"]/g, '').trim()}".`
          : `Selon le cadre réglementaire européen, ${name} est associé à l'allégation autorisée : « ${claim.replace(/[«»"]/g, '').trim()} ».`,
      source: locale === 'en' ? 'EFSA Health Claims Register' : 'EFSA — Registre des allégations de santé',
    },
  ]
}

function defaultSources(): Array<{ title: string; publisher?: string; year?: number; url?: string }> {
  return [
    {
      title: 'Community Herbal Monographs',
      publisher: 'EMA/HMPC',
      url: 'https://www.ema.europa.eu/en/human-regulatory-overview/herbal-medicinal-products',
    },
    {
      title: 'EU Register of nutrition and health claims made on foods',
      publisher: 'European Commission / EFSA',
      url: 'https://ec.europa.eu/food/food-feed-portal/screen/health-claims/eu-register',
    },
  ]
}

/* ─── Per-benefit enrichment ──────────────────────────────────────── */

const GEN_FIELDS: GeoFieldType[] = ['directAnswer', 'definition', 'keyTakeaways', 'faq']

async function enrichOne(
  payload: any,
  benefit: any,
  locale: GeoLocale,
  dry: boolean,
  overwriteArrays: boolean,
) {
  const updates: Record<string, any> = {}
  const generated: string[] = []
  const skipped: string[] = []
  const errors: Array<{ field: string; error: string }> = []

  // Read with locale:'all' to get per-locale values explicitly, bypassing
  // Payload's locale-fallback behaviour (which can leak the FR value into EN
  // reads when EN was never written).
  const allDoc = await payload.findByID({
    collection: 'benefits',
    id: benefit.id,
    locale: 'all',
    overrideAccess: true,
    depth: 0,
  } as any)

  // Helper: get the value for the current locale from a localized field.
  // Localized fields under locale:'all' are { fr: ..., en: ... }.
  const localeValue = (key: string) => {
    const v = (allDoc as any)?.[key]
    if (v && typeof v === 'object' && (locale in v) && !Array.isArray(v) && !v.root) {
      return (v as any)[locale]
    }
    return v
  }

  const ctx = {
    kind: 'benefit' as const,
    id: benefit.id,
    name: localeValue('name'),
    shortDescription: localeValue('shortDescription'),
    longDescription: localeValue('description')
      ? richTextToPlain(localeValue('description'))
      : '',
    category: (allDoc as any)?.category,
  }

  // Payload v3 returns localized ARRAYS merged across locales under
  // locale:'all' (TEXT fields are correctly per-locale). So skip-checks for
  // array fields can be wrong on the EN pass. The `overwrite` flag forces
  // regeneration of array fields, while text fields still respect skip.
  const ARRAY_FIELDS: GeoFieldType[] = ['keyTakeaways', 'faq']

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
        // Exponential backoff: 1s, 3s, 7s
        const delayMs = [1000, 3000, 7000][attempt - 1]
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }
    if (lastErr || !out) {
      errors.push({ field: `${field}/${locale}`, error: lastErr?.message || 'unknown error' })
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

  // Localised metadata fills (use localeValue() to bypass fallback).
  // targetAIQueries and quotableStatements are arrays — same Payload v3 leak
  // applies, so they honour the `overwriteArrays` flag.
  if (isEmpty(localeValue('targetAIQueries')) || overwriteArrays) {
    updates.targetAIQueries = defaultTargetQueries(ctx.name, locale).map((q) => ({ query: q }))
    generated.push(`targetAIQueries/${locale} [default]`)
  }
  if (isEmpty(localeValue('authoritySignals'))) {
    updates.authoritySignals = defaultAuthoritySignals(locale)
    generated.push(`authoritySignals/${locale} [default]`)
  }
  if (isEmpty(localeValue('quotableStatements')) || overwriteArrays) {
    const items = defaultQuotable(ctx.name, localeValue('regulatoryClaim') || '', locale)
    if (items.length > 0) {
      updates.quotableStatements = items
      generated.push(`quotableStatements/${locale} [default]`)
    }
  }

  // Locale-independent fills (only set on FR pass to avoid double-write)
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
        'Enrichissement initial automatique (Gemini 2.5 Flash Lite + valeurs par défaut). À affiner éditorialement : ajouter des dataPoints chiffrés, sources spécifiques par bienfait, augmenter le geoReadinessScore après revue.'
      generated.push('geoNotes [default]')
    }
  }

  // Apply update
  if (Object.keys(updates).length > 0 && !dry) {
    await payload.update({
      collection: 'benefits',
      id: benefit.id,
      data: updates,
      locale,
      overrideAccess: true,
      req: {
        context: {
          skipCompliance: true,
          skipComplianceReason: 'enrich-benefits-geo',
          skipModeration: true,
        },
      } as any,
    })
  }

  return { generated, skipped, errors, updateCount: Object.keys(updates).length }
}

/* ─── Route ───────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production.' }, { status: 403 })
  }
  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })
  if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({
      message:
        'Add ?confirm=yes to enrich. Supported params: ?slug=<slug> · ?dry=yes · ?from=<n>&to=<n> · ?locale=fr|en|both (default both)',
    })
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY missing' },
      { status: 503 },
    )
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
    collection: 'benefits',
    where,
    limit: 200,
    pagination: false,
    overrideAccess: true,
    sort: 'referenceNumber',
  })

  const slice = docs.slice(from, to)
  const locales: GeoLocale[] = localesParam === 'both' ? ['fr', 'en'] : [localesParam]

  const summary: Array<{
    slug: string
    referenceNumber?: string
    fr?: any
    en?: any
  }> = []

  for (const benefit of slice as any[]) {
    const entry: any = { slug: benefit.slug, referenceNumber: benefit.referenceNumber }
    for (const loc of locales) {
      try {
        entry[loc] = await enrichOne(payload, benefit, loc, dry, overwriteArrays)
      } catch (err: any) {
        entry[loc] = { error: err?.message || String(err) }
      }
    }
    summary.push(entry)
  }

  return NextResponse.json({
    total: slice.length,
    locales,
    dry,
    summary,
  })
}
