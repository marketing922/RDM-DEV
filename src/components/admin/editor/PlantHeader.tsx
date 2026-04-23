import React from 'react'
import type { ViewDescriptionServerProps } from 'payload'

import { RM, StatusPill } from '@/components/admin/primitives'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  archived: 'Archivé',
}

const formatRelative = (iso?: string): string => {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

const buildRef = (id: unknown): string => {
  const raw = id == null ? '' : String(id)
  const slice = raw.slice(-3).padStart(3, '0').toUpperCase()
  return `P-${slice || '000'}`
}

const PlantHeader: React.FC<ViewDescriptionServerProps> = async (props) => {
  const { payload, id, collectionSlug } = props as any
  if (!payload || !id || !collectionSlug) return null

  let doc: any = null
  try {
    doc = await payload.findByID({
      collection: collectionSlug,
      id,
      depth: 0,
      overrideAccess: true,
    })
  } catch {
    return null
  }
  if (!doc) return null

  const status: string | undefined = doc._status ?? doc.status
  const statusLabel = status ? STATUS_LABELS[status] ?? status : 'Brouillon'
  const reference = buildRef(doc.id)
  const title: string = doc.name || doc.title || 'Sans titre'

  const subtitleParts: string[] = []
  if (doc.latinName) subtitleParts.push(String(doc.latinName))
  if (doc.family) subtitleParts.push(String(doc.family))
  const subtitle = subtitleParts.join(' · ')

  const relativeTime = formatRelative(doc.updatedAt)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 20,
        paddingBottom: 18,
        borderBottom: `1px solid ${RM.rule}`,
        marginBottom: 22,
      }}
    >
      <div
        style={{
          fontFamily: RM.fMono,
          fontSize: 14,
          color: RM.burgundy,
          letterSpacing: 1,
        }}
      >
        N° {reference}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: RM.fDisplay,
            fontSize: 38,
            color: RM.teal,
            lineHeight: 1,
            letterSpacing: -0.5,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontFamily: RM.fSerif,
              fontStyle: 'italic',
              fontSize: 16,
              color: RM.burgundy,
              marginTop: 4,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      <StatusPill label={statusLabel} />
      {relativeTime ? (
        <div style={{ fontSize: 11, color: RM.inkSoft, fontFamily: RM.fSans }}>
          mis à jour {relativeTime}
        </div>
      ) : null}
    </div>
  )
}

export default PlantHeader
