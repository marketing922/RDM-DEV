import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { DATA_POINTS_BY_SLUG } from './plants-datapoints'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 300

const CLOUDINARY_ROOT = 'https://res.cloudinary.com/laboratoire-calebasse/image/upload'
const CLOUDINARY_BASE = `${CLOUDINARY_ROOT}/rdm/plants`

// Cloudinary serves the same asset with or without the version segment
// (vXXXXXXXXXX). We test both folder layouts (rdm/plants vs root) because
// uploads were made through different flows.
const CLOUDINARY_BASES = [
  `${CLOUDINARY_ROOT}/rdm/plants`,
  `${CLOUDINARY_ROOT}`,
]

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'string') return v.trim().length === 0
  return false
}

const seedContext = {
  skipCompliance: true,
  skipComplianceReason: 'finalize-plants batch update',
  skipModeration: true,
}

async function fillDataPoints(payload: any, plant: any, force: boolean): Promise<number> {
  const points = DATA_POINTS_BY_SLUG[plant.slug]
  if (!points || points.length === 0) return 0
  if (!force && !isEmpty(plant.dataPoints)) return 0

  await payload.update({
    collection: 'wikiEntries',
    id: plant.id,
    data: { dataPoints: points },
    overrideAccess: true,
    req: { context: seedContext } as any,
  } as any)
  return points.length
}

/**
 * Detects additional gallery images on Cloudinary by HEAD-checking
 * `<slug>-2.png`, `<slug>-3.png`, `<slug>-tisane.png`, `<slug>-frais.png`.
 * Adds detected URLs to galleryUrls if missing.
 */
async function urlExists(url: string): Promise<boolean> {
  // Try HEAD first; some CDNs reject HEAD → fall back to a tiny GET range.
  try {
    const head = await fetch(url, { method: 'HEAD' })
    if (head.ok) return true
    if (head.status !== 405 && head.status !== 403) return false
  } catch {
    /* fall through */
  }
  try {
    const get = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
    })
    return get.ok || get.status === 206
  } catch {
    return false
  }
}

async function detectGallery(payload: any, plant: any): Promise<string[]> {
  const slug = plant.slug
  const suffixes = [
    '-2', '-3', '-4', '-5',
    '-tisane', '-infusion',
    '-frais', '-fresh',
    '-poudre', '-powder',
    '-huile', '-oil',
    '-fleur', '-flower',
    '-feuille', '-leaf',
    '-racine', '-root',
    '-baie', '-berry',
  ]
  const exts = ['png', 'jpg', 'jpeg', 'webp']
  const detected: string[] = []
  for (const suffix of suffixes) {
    let found: string | null = null
    for (const base of CLOUDINARY_BASES) {
      for (const ext of exts) {
        const url = `${base}/${slug}${suffix}.${ext}`
        if (await urlExists(url)) {
          found = url
          break
        }
      }
      if (found) break
    }
    if (found) detected.push(found)
  }
  if (detected.length === 0) return []

  const existingUrls: string[] = Array.isArray(plant.galleryUrls)
    ? plant.galleryUrls.map((g: any) => g?.url).filter(Boolean)
    : []
  const newUrls = detected.filter((u) => !existingUrls.includes(u))
  if (newUrls.length === 0) return []

  const allItems = [
    ...existingUrls.map((url) => ({ url })),
    ...newUrls.map((url) => ({ url })),
  ]
  await payload.update({
    collection: 'wikiEntries',
    id: plant.id,
    data: { galleryUrls: allItems },
    overrideAccess: true,
    req: { context: seedContext } as any,
  } as any)
  return newUrls
}

/**
 * Verifies that the externalImageUrl actually resolves on Cloudinary.
 * Returns true if HTTP 200, false otherwise.
 */
async function verifyMainImage(plant: any): Promise<boolean> {
  const url = plant.externalImageUrl as string | undefined
  if (!url) return false
  return urlExists(url)
}

/**
 * Aggressive image resolver. When verify fails, this tries common naming
 * variants (extensions, casing, separator changes) and updates the
 * externalImageUrl on the plant doc with the first variant that resolves.
 * Returns details on what was tried and what succeeded.
 */
async function resolveImage(payload: any, plant: any): Promise<
  | { status: 'unchanged'; url: string }
  | { status: 'fixed'; url: string; matched: string }
  | { status: 'still-missing'; tried: string[] }
> {
  const slug = plant.slug as string
  const current = plant.externalImageUrl as string | undefined

  // First, the current URL : if it already resolves, nothing to do.
  if (current && (await urlExists(current))) {
    return { status: 'unchanged', url: current }
  }

  // Build candidate variants.
  const slugNoDash = slug.replace(/-/g, '')
  const slugUnderscore = slug.replace(/-/g, '_')
  const slugCapital = slug.charAt(0).toUpperCase() + slug.slice(1)
  const slugSpaces = slug.replace(/-/g, ' ')

  const stems = Array.from(
    new Set([slug, slugNoDash, slugUnderscore, slugCapital, slugSpaces]),
  )
  const exts = ['png', 'jpg', 'jpeg', 'webp', 'PNG', 'JPG']

  const tried: string[] = []
  for (const base of CLOUDINARY_BASES) {
    for (const stem of stems) {
      for (const ext of exts) {
        const url = `${base}/${stem}.${ext}`
        tried.push(url)
        if (await urlExists(url)) {
          await payload.update({
            collection: 'wikiEntries',
            id: plant.id,
            data: { externalImageUrl: url },
            overrideAccess: true,
            req: { context: seedContext } as any,
          } as any)
          return { status: 'fixed', url, matched: url.replace(CLOUDINARY_ROOT + '/', '') }
        }
      }
    }
  }
  return { status: 'still-missing', tried: tried.slice(-15) }
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
        'Add ?confirm=yes to finalize plants. Params : ?slug=<slug> · ?from=<n>&to=<n> · ?force=yes (overwrite dataPoints) · ?step=dataPoints|gallery|verifyImages|all (default all)',
    })
  }

  const slugFilter = req.nextUrl.searchParams.get('slug') || ''
  const from = parseInt(req.nextUrl.searchParams.get('from') || '0', 10) || 0
  const to = parseInt(req.nextUrl.searchParams.get('to') || '999', 10) || 999
  const force = req.nextUrl.searchParams.get('force') === 'yes'
  const step = (req.nextUrl.searchParams.get('step') || 'all') as
    | 'dataPoints'
    | 'gallery'
    | 'verifyImages'
    | 'resolveImages'
    | 'all'

  const payload = await getPayload({ config: configPromise })
  const where: any = {}
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
  const summary: any[] = []

  for (const plant of slice as any[]) {
    const entry: any = { slug: plant.slug, referenceNumber: plant.referenceNumber }
    try {
      if (step === 'all' || step === 'dataPoints') {
        const n = await fillDataPoints(payload, plant, force)
        entry.dataPoints = n > 0 ? `${n} added` : 'unchanged'
      }
      if (step === 'all' || step === 'gallery') {
        const added = await detectGallery(payload, plant)
        entry.gallery = added.length > 0 ? `${added.length} added` : 'none'
      }
      if (step === 'all' || step === 'verifyImages') {
        const ok = await verifyMainImage(plant)
        entry.mainImage = ok ? 'ok' : 'missing on Cloudinary'
      }
      if (step === 'resolveImages') {
        const r = await resolveImage(payload, plant)
        entry.resolve = r
      }
    } catch (err: any) {
      entry.error =
        (err?.cause as any)?.message ||
        (err?.message || String(err)).slice(0, 200)
    }
    summary.push(entry)
  }

  return NextResponse.json({ total: slice.length, step, force, summary })
}
