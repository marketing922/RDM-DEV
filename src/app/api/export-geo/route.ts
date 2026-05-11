import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { authenticateSeedRoute } from '@/lib/seed-auth'
import { GEO_FIELDS, GEO_COLLECTIONS, type GeoCollection } from '@/lib/geo-fields'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET /api/export-geo?collection=plants|benefits|blogPosts|all
 *
 * Lit l'état courant des champs GEO en BD (FR + EN) et renvoie un JSON
 * prêt à être commité sous src/seed/geo/<collection>-geo.json.
 *
 * Le but : pouvoir snapshot le contenu GEO enrichi (via Gemini ou édité
 * à la main) et le reposer en seed pour les futures migrations, sans avoir
 * à re-payer du temps de génération IA.
 *
 * Pas d'écriture filesystem côté Vercel (read-only) — c'est l'utilisateur
 * qui doit rediriger la réponse vers un fichier local et la commit :
 *
 *   curl "https://.../api/export-geo?collection=benefits" \
 *     -H "x-api-key: ..." > src/seed/geo/benefits-geo.json
 *
 * Schéma de sortie :
 * {
 *   collection: "benefits",
 *   exportedAt: "2026-05-11T...",
 *   count: 39,
 *   docs: [
 *     {
 *       slug: "sommeil",
 *       id: 12,
 *       fr: { directAnswer, keyTakeaways, faq, ... },
 *       en: { directAnswer, keyTakeaways, faq, ... }
 *     },
 *     ...
 *   ]
 * }
 */

const COLLECTION_ALIASES: Record<string, GeoCollection> = {
  plants: 'wikiEntries',
  wikiEntries: 'wikiEntries',
  benefits: 'benefits',
  blogPosts: 'blogPosts',
  articles: 'blogPosts',
}

function pickGeo(doc: any): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of GEO_FIELDS) {
    if (doc[f] !== undefined && doc[f] !== null) {
      out[f] = doc[f]
    }
  }
  return out
}

async function exportCollection(payload: any, collection: GeoCollection) {
  const [frRes, enRes] = await Promise.all([
    payload.find({
      collection,
      limit: 500,
      pagination: false,
      locale: 'fr',
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection,
      limit: 500,
      pagination: false,
      locale: 'en',
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const enById = new Map<string | number, any>()
  for (const d of (enRes.docs as any[]) || []) enById.set(d.id, d)

  const docs = ((frRes.docs as any[]) || []).map((fr) => {
    const en = enById.get(fr.id)
    return {
      id: fr.id,
      slug: fr.slug,
      fr: pickGeo(fr),
      en: en ? pickGeo(en) : {},
    }
  })

  return {
    collection,
    exportedAt: new Date().toISOString(),
    count: docs.length,
    docs,
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

  const collectionParam = req.nextUrl.searchParams.get('collection') || 'all'
  const payload = await getPayload({ config: configPromise })

  if (collectionParam === 'all') {
    const parts = await Promise.all(
      GEO_COLLECTIONS.map((c) => exportCollection(payload, c)),
    )
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      collections: parts,
    })
  }

  const target = COLLECTION_ALIASES[collectionParam]
  if (!target) {
    return NextResponse.json(
      {
        error: 'unknown_collection',
        valid: Object.keys(COLLECTION_ALIASES),
      },
      { status: 400 },
    )
  }

  const result = await exportCollection(payload, target)
  return NextResponse.json(result)
}
