'use client'

import React from 'react'
import { CheckCircle2, Clock, ShieldCheck, Gauge, AlertCircle } from 'lucide-react'

type Kind = 'success' | 'warning' | 'neutral' | 'info'

const KIND_STYLES: Record<Kind, { bg: string; color: string; border: string }> = {
  success: { bg: '#ECFDF5', color: '#065F46', border: 'rgba(16, 185, 129, 0.25)' },
  warning: { bg: '#FEF3C7', color: '#92400E', border: 'rgba(208, 128, 44, 0.30)' },
  info: { bg: '#EFF6FF', color: '#1E40AF', border: 'rgba(59, 130, 246, 0.25)' },
  neutral: { bg: '#F3F4F6', color: '#374151', border: 'rgba(107, 114, 128, 0.25)' },
}

const Chip: React.FC<{
  kind: Kind
  icon?: React.ReactNode
  children: React.ReactNode
}> = ({ kind, icon, children }) => {
  const s = KIND_STYLES[kind]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </span>
  )
}

const GeoScoreChip: React.FC<{ score: number }> = ({ score }) => {
  const kind: Kind = score >= 70 ? 'success' : score >= 40 ? 'warning' : 'neutral'
  return (
    <Chip kind={kind} icon={<Gauge size={12} />}>
      GEO {score}/100
    </Chip>
  )
}

type Props = {
  statusLabel?: string
  statusKind: Kind
  complianceLabel?: string
  complianceKind: Kind
  updatedAt?: string
  factChecked?: string
  geoScore?: number
}

const DocHeaderChipClient: React.FC<Props> = ({
  statusLabel,
  statusKind,
  complianceLabel,
  complianceKind,
  updatedAt,
  factChecked,
  geoScore,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        marginBottom: 16,
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FEF9E9 100%)',
        border: '1px solid #DCD8C7',
        borderRadius: 12,
      }}
    >
      {statusLabel && (
        <Chip kind={statusKind} icon={<CheckCircle2 size={12} />}>
          {statusLabel}
        </Chip>
      )}
      {complianceLabel && (
        <Chip kind={complianceKind} icon={<ShieldCheck size={12} />}>
          Conformité · {complianceLabel}
        </Chip>
      )}
      {typeof geoScore === 'number' && <GeoScoreChip score={geoScore} />}
      {updatedAt && (
        <Chip kind="neutral" icon={<Clock size={12} />}>
          Modifié {updatedAt}
        </Chip>
      )}
      {factChecked && (
        <Chip kind="info" icon={<AlertCircle size={12} />}>
          Vérifié {factChecked}
        </Chip>
      )}
    </div>
  )
}

export default DocHeaderChipClient
