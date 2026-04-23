'use client'
import React from 'react'
import { RM } from './tokens'
export function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: RM.paper, border: `1px solid ${RM.rule}`, borderRadius: 10 }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${RM.rule}`, fontSize: 10, letterSpacing: 2, color: RM.inkSoft, textTransform: 'uppercase', fontWeight: 600 }}>{title}</div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}
export function SideRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px dashed ${RM.rule}` }}>
      <span style={{ fontSize: 11, color: RM.inkSoft, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>{label}</span>
      {children}
    </div>
  )
}
