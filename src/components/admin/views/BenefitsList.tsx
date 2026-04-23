import React from 'react'
import type { ListViewServerProps } from 'payload'
import { RM } from '@/components/admin/primitives'

import BenefitsListClient, {
  type BenefitBucket,
  type BenefitRow,
} from './BenefitsListClient'

// Bucket grouping by first letter of `name` (benefits has no `family` field).
// Each bucket is a taxonomic family card. Counts are displayed per-bucket.
type BucketDef = {
  key: string
  label: string
  color: string
  test: (firstChar: string) => boolean
}

const BUCKETS: BucketDef[] = [
  { key: 'a-f', label: 'A — F', color: RM.teal, test: (c) => c >= 'A' && c <= 'F' },
  { key: 'g-l', label: 'G — L', color: RM.ochre, test: (c) => c >= 'G' && c <= 'L' },
  { key: 'm-r', label: 'M — R', color: RM.burgundy, test: (c) => c >= 'M' && c <= 'R' },
  { key: 's-z', label: 'S — Z', color: RM.teal, test: (c) => c >= 'S' && c <= 'Z' },
]

const normalizeFirst = (name: string): string => {
  const stripped = (name || '').trim().toUpperCase()
  if (!stripped) return 'Z'
  return stripped.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0)
}

type StatusKey = 'all' | 'published' | 'draft'

const BenefitsList: React.FC<ListViewServerProps> = async (props) => {
  const payload: any =
    (props as any)?.payload ??
    (props as any)?.req?.payload ??
    (props as any)?.initPageResult?.req?.payload ??
    null

  const searchParams: Record<string, any> =
    (props as any).searchParams ?? (props as any).req?.searchParams ?? {}

  const search = String(searchParams?.search ?? '').trim()
  const rawStatus = String(searchParams?.status ?? 'all')
  const status: StatusKey = (['all', 'published', 'draft'] as const).includes(
    rawStatus as StatusKey,
  )
    ? (rawStatus as StatusKey)
    : 'all'

  if (!payload) {
    return <div style={{ padding: 32, color: RM.inkSoft }}>Payload non disponible.</div>
  }

  const where: any = {}
  if (search) where.name = { contains: search }
  if (status === 'published') where._status = { equals: 'published' }
  else if (status === 'draft') where._status = { equals: 'draft' }

  // Total (unfiltered) count for the header summary.
  let totalDocs = 0
  try {
    const countRes = await payload.count({
      collection: 'benefits',
      overrideAccess: true,
    })
    totalDocs = countRes?.totalDocs ?? 0
  } catch {
    totalDocs = 0
  }

  const res = await payload
    .find({
      collection: 'benefits',
      where,
      limit: 500,
      depth: 0,
      sort: 'name',
      overrideAccess: true,
    })
    .catch(() => ({ docs: [] as any[], totalDocs: 0 }))

  const docs = (res.docs as any[]) ?? []
  const filteredCount = typeof res?.totalDocs === 'number' ? res.totalDocs : docs.length

  const rows: BenefitRow[] = docs.map((doc) => {
    const plants = Array.isArray(doc.relatedPlants) ? doc.relatedPlants.length : null
    return {
      id: String(doc.id),
      name: String(doc.name ?? `Bienfait ${doc.id}`),
      plantCount: plants,
      articleCount: null,
    }
  })

  const buckets: BenefitBucket[] = BUCKETS.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    color: bucket.color,
    rows: rows.filter((r) => bucket.test(normalizeFirst(r.name))),
  }))

  return (
    <BenefitsListClient
      buckets={buckets}
      totalDocs={totalDocs}
      filteredCount={filteredCount}
      initialSearch={search}
      initialStatus={status}
    />
  )
}

export default BenefitsList
