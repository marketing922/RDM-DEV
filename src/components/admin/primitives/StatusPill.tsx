'use client'
import React from 'react'
import { RM } from './tokens'

const MAP: Record<string, { bg: string; fg: string }> = {
  'Publié': { bg: '#E8F0EE', fg: RM.teal },
  'Révision': { bg: '#FDEFE0', fg: RM.ochre },
  'Brouillon': { bg: RM.creamSoft, fg: RM.inkSoft },
  'Archivé': { bg: '#EEE7E3', fg: RM.burgundyDark },
  'Planifié': { bg: '#E7E0F0', fg: '#5A4A7A' },
}

export function StatusPill({ label }: { label?: string }) {
  const key = label && MAP[label] ? label : 'Brouillon'
  const { bg, fg } = MAP[key]
  return (
    <span
      style={{
        background: bg,
        color: fg,
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 9px',
        borderRadius: 999,
        fontFamily: RM.fSans,
        display: 'inline-block',
      }}
    >
      {key}
    </span>
  )
}

export default StatusPill
