import React from 'react'
import type { BeforeDocumentControlsServerProps } from 'payload'

import DocHeaderChipClient from './DocHeaderChipClient'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  archived: 'Archivé',
  pending: 'En attente',
  submitted: 'Soumis',
  reviewed: 'Relu',
  approved: 'Approuvé',
}

const STATUS_KINDS: Record<string, 'success' | 'warning' | 'neutral' | 'info'> = {
  published: 'success',
  approved: 'success',
  reviewed: 'info',
  submitted: 'info',
  draft: 'warning',
  pending: 'warning',
  archived: 'neutral',
}

const formatRelative = (iso?: string): string | undefined => {
  if (!iso) return undefined
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} j`
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const DocHeaderChip: React.FC<BeforeDocumentControlsServerProps> = async (props) => {
  const { id, payload, collectionConfig } = props as any
  if (!id || !payload || !collectionConfig) return null

  let doc: any = null
  try {
    doc = await payload.findByID({
      collection: collectionConfig.slug,
      id,
      depth: 0,
      overrideAccess: true,
    })
  } catch {
    return null
  }

  if (!doc) return null

  const status: string | undefined = doc._status ?? doc.status
  const statusLabel = status ? STATUS_LABELS[status] ?? status : undefined
  const statusKind = status ? STATUS_KINDS[status] ?? 'neutral' : 'neutral'

  const complianceLabel = doc.complianceStatus
    ? STATUS_LABELS[doc.complianceStatus] ?? doc.complianceStatus
    : undefined
  const complianceKind = doc.complianceStatus
    ? STATUS_KINDS[doc.complianceStatus] ?? 'neutral'
    : 'neutral'

  const updatedAt = formatRelative(doc.updatedAt)
  const factChecked = formatRelative(doc.lastFactCheckedAt)
  const geoScore: number | undefined =
    typeof doc.geoReadinessScore === 'number' ? doc.geoReadinessScore : undefined

  return (
    <DocHeaderChipClient
      statusLabel={statusLabel}
      statusKind={statusKind}
      complianceLabel={complianceLabel}
      complianceKind={complianceKind}
      updatedAt={updatedAt}
      factChecked={factChecked}
      geoScore={geoScore}
    />
  )
}

export default DocHeaderChip
