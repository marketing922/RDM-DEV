import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'

/**
 * One-shot endpoint — auto-tags every Benefit with its most likely `bodyRegion`
 * by matching name + slug + shortDescription against a keyword list.
 *
 * Usage:
 *   GET /api/seed-body-regions                    → dry run (report only)
 *   GET /api/seed-body-regions?confirm=yes        → apply changes
 *   GET /api/seed-body-regions?confirm=yes&force=yes → overwrite existing tags
 *
 * Auth: requires an authenticated admin/editor user (Payload session cookie).
 */

const REGIONS: Array<{ id: string; keywords: string[] }> = [
  {
    id: 'tete',
    keywords: ['tête', 'crâne', 'migraine', 'céphalée', 'mémoire', 'concentration', 'mal de tête'],
  },
  {
    id: 'gorge',
    keywords: ['gorge', 'toux', 'voix', 'laryng', 'pharyng', 'enrouement'],
  },
  {
    id: 'respiration',
    keywords: [
      'respir',
      'poumon',
      'bronche',
      'rhume',
      'nez',
      'sinus',
      'asthme',
      'rhinit',
      'grippe',
    ],
  },
  {
    id: 'digestion',
    keywords: [
      'digest',
      'estomac',
      'intestin',
      'ballonnement',
      'transit',
      'nausée',
      'foie',
      'colon',
      'reflux',
      'constipation',
      'diarrhée',
    ],
  },
  {
    id: 'feminin',
    keywords: [
      'féminin',
      'règles',
      'menstru',
      'ménopause',
      'grossesse',
      'fertilité',
      'cycle',
      'prémenstru',
    ],
  },
  {
    id: 'circulation',
    keywords: [
      'circul',
      'veineux',
      'jambes',
      'varice',
      'hémorroïde',
      'œdèm',
      'oedem',
      'lourdeur',
    ],
  },
]

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function pickRegion(benefit: any): string | null {
  const haystack = normalize(
    [benefit?.name, benefit?.slug, benefit?.shortDescription]
      .filter(Boolean)
      .join(' '),
  )
  if (!haystack) return null
  // First match wins — regions are ordered so that more specific ones can be moved up if needed.
  for (const region of REGIONS) {
    for (const kw of region.keywords) {
      if (haystack.includes(normalize(kw))) return region.id
    }
  }
  return null
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const confirm = url.searchParams.get('confirm') === 'yes'
  const force = url.searchParams.get('force') === 'yes'

  const payload = await getPayload({ config: configPromise })

  // Auth check — require a logged-in admin/editor
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers: headers as any })
  if (!user || (user as any).role === 'viewer') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { docs: benefits } = await payload.find({
    collection: 'benefits',
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })

  const plan: Array<{
    id: any
    name: string
    slug: string
    currentRegion: string | null
    proposedRegion: string | null
    action: 'tag' | 'overwrite' | 'skip-tagged' | 'skip-no-match'
  }> = []

  for (const b of benefits as any[]) {
    const current = (b.bodyRegion as string | undefined) || null
    const proposed = pickRegion(b)
    let action: 'tag' | 'overwrite' | 'skip-tagged' | 'skip-no-match'
    if (!proposed) action = 'skip-no-match'
    else if (current && !force) action = 'skip-tagged'
    else if (current && force && current !== proposed) action = 'overwrite'
    else if (!current) action = 'tag'
    else action = 'skip-tagged' // same region, keep
    plan.push({
      id: b.id,
      name: b.name,
      slug: b.slug,
      currentRegion: current,
      proposedRegion: proposed,
      action,
    })
  }

  const stats = {
    total: plan.length,
    willTag: plan.filter((p) => p.action === 'tag').length,
    willOverwrite: plan.filter((p) => p.action === 'overwrite').length,
    alreadyTagged: plan.filter((p) => p.action === 'skip-tagged').length,
    noMatch: plan.filter((p) => p.action === 'skip-no-match').length,
  }

  if (!confirm) {
    return NextResponse.json({
      mode: 'dry-run',
      note: 'Add ?confirm=yes to apply. Add &force=yes to overwrite existing tags.',
      stats,
      plan,
    })
  }

  // Apply changes
  const results: Array<{ id: any; name: string; status: string; region?: string | null }> = []
  for (const item of plan) {
    if (item.action === 'tag' || item.action === 'overwrite') {
      try {
        await payload.update({
          collection: 'benefits',
          id: item.id,
          data: { bodyRegion: item.proposedRegion } as any,
          overrideAccess: true,
        })
        results.push({
          id: item.id,
          name: item.name,
          status: item.action === 'tag' ? 'tagged' : 'overwritten',
          region: item.proposedRegion,
        })
      } catch (e: any) {
        results.push({
          id: item.id,
          name: item.name,
          status: 'error',
          region: e?.message,
        })
      }
    } else {
      results.push({ id: item.id, name: item.name, status: item.action })
    }
  }

  return NextResponse.json({
    mode: 'applied',
    stats,
    results,
  })
}
