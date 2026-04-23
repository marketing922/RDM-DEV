'use client'
import React from 'react'
import { RM } from './tokens'
export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange?: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${RM.rule}`, marginBottom: 24 }}>
      {tabs.map((t, i) => (
        <button key={i} type="button" onClick={() => onChange?.(t)} style={{
          padding: '10px 18px', fontSize: 13, fontWeight: t === active ? 600 : 500,
          color: t === active ? RM.teal : RM.inkSoft,
          borderBottom: t === active ? `2px solid ${RM.burgundy}` : '2px solid transparent',
          marginBottom: -1, cursor: 'pointer', background: 'transparent', border: 'none', fontFamily: RM.fSans,
        }}>{t}</button>
      ))}
    </div>
  )
}
