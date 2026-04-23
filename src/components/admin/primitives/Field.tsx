'use client'
import React from 'react'
import { RM } from './tokens'
export function Field({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', marginBottom: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.5, color: RM.inkSoft, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
        {label}{required && <span style={{ color: RM.burgundy, marginLeft: 4 }}>*</span>}
      </div>
      {children}
      {hint && <div style={{ fontSize: 11, color: RM.inkSoft, marginTop: 4, fontStyle: 'italic' }}>{hint}</div>}
    </label>
  )
}
