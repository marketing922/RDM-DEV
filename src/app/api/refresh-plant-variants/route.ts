import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 60

/**
 * Refresh du manifest `wikiEntries.detectedVariants` à partir de probes
 * Cloudinary. Migre la détection live (qui faisait 128 HEAD requests par
 * page render au cold start Vercel) vers un job admin déclenché à la demande.
 *
 * Mode : ?slug=<slug> pour rafraîchir UNE plante (exécution rapide), ou
 * sans param pour rafraîchir toutes les plantes (paginé : 20 plantes par
 * invocation, retourne `hasMore: true` si reste).
 *
 * Pas idéal en cron — c'est appelé manuellement après un upload Cloudinary
 * massif (cf. /api/seed-plants).
 */

const CLOUDINARY_ROOT = 'https://res.cloudinary.com/laboratoire-calebasse/image/upload'
const CLOUDINARY_BASES = [`${CLOUDINARY_ROOT}/rdm/plants`, CLOUDINARY_ROOT]

const SUFFIXES = [
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
const EXTS = ['png', 'jpg', 'jpeg', 'webp']

async function urlExists(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) })
    if (head.ok) return true
    if (head.status !== 405 && head.status !== 403) return false
  } catch {
    /* fall through */
  }
  try {
    const get = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      signal: AbortSignal.timeout(3000),
    })
    return get.ok || get.status === 206
  } catch {
    return false
  }
}

async function detectVariants(slug: string): Promise<string[]> {
  const found: string[] = []
  await Promise.all(
    SUFFIXES.map(async (suffix) => {
      for (const base of CLOUDINARY_BASES) {
        for (const ext of EXTS) {
          const url = `${base}/${slug}${suffix}.${ext}`
          if (await urlExists(url)) {
            found.push(url)
            return
          }
        }
      }
    }),
  )
  // Stable order (Promise.all may finish out of order)
  const order = new Map(SUFFIXES.map((s, i) => [s, i]))
  return found.sort((a, b) => {
    const sa = SUFFIXES.find((s) => a.includes(`${slug}${s}.`)) || ''
    const sb = SUFFIXES.find((s) => b.includes(`${slug}${s}.`)) || ''
    return (order.get(sa) ?? 0) - (order.get(sb) ?? 0)
  })
}

const seedReq = () => ({
  context: {
    skipCompliance: true,
    skipComplianceReason: 'refresh-plant-variants',
    skipModeration: true,
    skipEmbed: true,
    fromHook: true,
  },
})

export async function GET(req: NextRequest) {
  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })

  const url = new URL(req.url)
  const targetSlug = url.searchParams.get('slug')
  const cursor = Math.max(1, Number(url.searchParams.get('page')) || 1)
  // pageSize configurable (?pageSize=N) pour s'adapter au cap 60s Vercel Hobby
  // si les HEAD Cloudinary sont lents. Default 20, max 50, min 1.
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize')) || 20))

  const payload = await getPayload({ config: configPromise })

  let plants: any[]
  let totalPages = 1

  if (targetSlug) {
    const r = await payload.find({
      collection: 'wikiEntries',
      where: { slug: { equals: targetSlug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    plants = r.docs
    if (plants.length === 0) {
      return NextResponse.json({ error: 'plant_not_found' }, { status: 404 })
    }
  } else {
    const r = await payload.find({
      collection: 'wikiEntries',
      limit: pageSize,
      page: cursor,
      depth: 0,
      overrideAccess: true,
    })
    plants = r.docs
    totalPages = r.totalPages || 1
  }

  const summary: any[] = []
  for (const plant of plants) {
    const slug = String(plant.slug || '')
    if (!slug) {
      summary.push({ id: plant.id, error: 'no_slug' })
      continue
    }
    try {
      const variants = await detectVariants(slug)
      await payload.update({
        collection: 'wikiEntries',
        id: plant.id,
        data: { detectedVariants: variants.map((u) => ({ url: u })) } as any,
        overrideAccess: true,
        req: seedReq() as any,
      } as any)
      summary.push({ slug, variants: variants.length })
    } catch (err: any) {
      summary.push({ slug, error: err?.message || String(err) })
    }
  }

  return NextResponse.json({
    ok: true,
    page: cursor,
    totalPages,
    hasMore: !targetSlug && cursor < totalPages,
    nextPage: !targetSlug && cursor < totalPages ? cursor + 1 : null,
    processed: plants.length,
    summary,
  })
}
