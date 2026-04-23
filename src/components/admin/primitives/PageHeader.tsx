'use client'
import React from 'react'
import { RM } from './tokens'
export function PageHeader({ eyebrow, title, sub, right }: { eyebrow?: string; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, gap: 24 }}>
      <div>
        {eyebrow && <div style={{ fontSize: 11, letterSpacing: 2.5, color: RM.burgundy, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>{eyebrow}</div>}
        <h1 style={{ fontFamily: RM.fDisplay, fontSize: 40, color: RM.teal, margin: 0, fontWeight: 400, letterSpacing: -0.5 }}>
          {title} {sub && <span style={{ color: RM.inkSoft, fontSize: 22, fontStyle: 'italic' }}>{sub}</span>}
        </h1>
      </div>
      {right}
    </div>
  )
}
