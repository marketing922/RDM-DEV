import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs'
import path from 'path'

import { authenticateSeedRoute } from '@/lib/seed-auth'
import { GEO_COLLECTIONS, type GeoCollection } from '@/lib/geo-fields'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET /api/seed-geo
 *   ?collection=plants|benefits|blogPosts|all  (default: all)
 *   ?from=<n>&to=<n>                            (slicing pour Hobby 60s cap)
 *   ?overwrite=yes                              (sinon : ne patch que les champs vides)
 *   ?confirm=yes                                (requis pour exécuter en prod)
 *   ?dry=yes                                    (preview, n'écrit pas)
 *
 * Lit les snapshots GEO commités sous `src/seed/geo/<collection>-geo.json`
 * (produits par /api/export-geo) et les applique aux documents existants
 * en BD via match par `slug`.
 *
 * Comportement par défaut (sans overwrite=yes) : ne touche un champ que
 * s'il est vide en BD — préserve les édits manuels post-snapshot.
 * Avec overwrite=yes : force la valeur du snapshot (utile après un reseed
 * complet sur une BD vierge).
 */

const COLLECTION_ALIASES: Record<string, GeoCollection> = {
  plants: 'wikiEntries',
  wikiEntries: 'wikiEntries',
  benefits: 'benefits',
  blogPosts: 'blogPosts',
  articles: 'blogPosts',
}

const FILE_BY_COLLECTION: Record<GeoCollection, string> = {
  wikiEntries: 'plants-geo.json',
  benefits: 'benefits-geo.json',
  blogPosts: 'blog-posts-geo.json',
}

type SnapshotDoc = {
  id?: string | number
  slug: string
  fr?: Record<string, unknown>
  en?: Record<string, unknown>
}

type Snapshot = {
  collection: GeoCollection
  exportedAt: string
  count: number
  docs: SnapshotDoc[]
}

function loadSnapshot(collection: GeoCollection): Snapshot | null {
  const file = path.join(process.cwd(), 'src', 'seed', 'geo', FILE_BY_COLLECTION[collection])
  if (!fs.existsSync(file)) return null
  try {
    const raw = fs.readFileSync(file, 'utf-8')
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.docs)) return null
    return parsed
  } catch {
    return null
  }
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value as object).length === 0
  return false
}

/** Construit le patch à appliquer pour une locale donnée. */
function buildPatch(
  snapshotFields: Record<string, unknown>,
  currentDoc: any,
  overwrite: boolean,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(snapshotFields)) {
    if (isEmpty(value)) continue
    if (overwrite || isEmpty(currentDoc?.[key])) {
      patch[key] = value
    }
  }
  return patch
}

async function seedCollection(
  payload: any,
  collection: GeoCollection,
  opts: { from: number; to: number; overwrite: boolean; dry: boolean },
) {
  const snapshot = loadSnapshot(collection)
  if (!snapshot) {
    return {
      collection,
      error: `Snapshot file missing: src/seed/geo/${FILE_BY_COLLECTION[collection]}. Run /api/export-geo first and commit the result.`,
    }
  }

  const docs = snapshot.docs.slice(opts.from, opts.to)
  const summary: any[] = []

  for (const snap of docs) {
    if (!snap.slug) {
      summary.push({ slug: '(missing)', action: 'skip (no slug)' })
      continue
    }
    try {
      // Find current doc by slug (FR locale is canonical for slugs)
      const found = await payload.find({
        collection,
        where: { slug: { equals: snap.slug } },
        limit: 1,
        locale: 'fr',
        depth: 0,
        overrideAccess: true,
      })
      const current = found.docs?.[0]
      if (!current) {
        summary.push({ slug: snap.slug, action: 'skip (not found in DB)' })
        continue
      }

      const frPatch = buildPatch(snap.fr || {}, current, opts.overwrite)

      // Fetch EN snapshot of current doc to compare for non-overwrite mode
      const enCurrentRes = await payload.find({
        collection,
        where: { slug: { equals: snap.slug } },
        limit: 1,
        locale: 'en',
        depth: 0,
        overrideAccess: true,
      })
      const enCurrent = enCurrentRes.docs?.[0] || {}
      const enPatch = buildPatch(snap.en || {}, enCurrent, opts.overwrite)

      const actions: string[] = []
      if (Object.keys(frPatch).length > 0) {
        if (!opts.dry) {
          await payload.update({
            collection,
            id: current.id,
            locale: 'fr',
            data: frPatch,
            overrideAccess: true,
          })
        }
        actions.push(`fr:${Object.keys(frPatch).length}`)
      }
      if (Object.keys(enPatch).length > 0) {
        if (!opts.dry) {
          await payload.update({
            collection,
            id: current.id,
            locale: 'en',
            data: enPatch,
            overrideAccess: true,
          })
        }
        actions.push(`en:${Object.keys(enPatch).length}`)
      }

      summary.push({
        slug: snap.slug,
        action: actions.length > 0 ? actions.join(' / ') : 'skip (no changes)',
      })
    } catch (err: any) {
      summary.push({ slug: snap.slug, error: err?.message || String(err) })
    }
  }

  return {
    collection,
    total: snapshot.docs.length,
    from: opts.from,
    to: opts.to,
    processed: docs.length,
    summary,
  }
}

export async function GET(req: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_SEED_IN_PROD !== 'true'
  ) {
    return NextResponse.json(
      { error: 'Disabled in production. Set ALLOW_SEED_IN_PROD=true to enable.' },
      { status: 403 },
    )
  }
  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })

  if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({
      message:
        'Add ?confirm=yes to apply. Params: ?collection=plants|benefits|blogPosts|all · ?from=N&to=M · ?overwrite=yes · ?dry=yes',
    })
  }

  const collectionParam = req.nextUrl.searchParams.get('collection') || 'all'
  const from = parseInt(req.nextUrl.searchParams.get('from') || '0', 10) || 0
  const to = parseInt(req.nextUrl.searchParams.get('to') || '9999', 10) || 9999
  const overwrite = req.nextUrl.searchParams.get('overwrite') === 'yes'
  const dry = req.nextUrl.searchParams.get('dry') === 'yes'

  const payload = await getPayload({ config: configPromise })

  if (collectionParam === 'all') {
    const results: any[] = []
    for (const c of GEO_COLLECTIONS) {
      results.push(await seedCollection(payload, c, { from, to, overwrite, dry }))
    }
    return NextResponse.json({ dry, overwrite, results })
  }

  const target = COLLECTION_ALIASES[collectionParam]
  if (!target) {
    return NextResponse.json(
      { error: 'unknown_collection', valid: Object.keys(COLLECTION_ALIASES) },
      { status: 400 },
    )
  }

  const result = await seedCollection(payload, target, { from, to, overwrite, dry })
  return NextResponse.json({ dry, overwrite, ...result })
}
