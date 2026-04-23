import type React from 'react'

export const RM = {
  burgundy: '#A2211E',
  burgundyDark: '#712E2F',
  cream: '#FEF9E9',
  creamSoft: '#FFF5D5',
  stone: '#DCD8C7',
  teal: '#054A57',
  ochre: '#D0802C',
  ink: '#1E1A16',
  inkSoft: '#5A4F45',
  rule: '#E8E1C9',
  ruleStrong: '#C9C2AA',
  paper: '#FBF6E2',
  fDisplay: '"DM Serif Display", "Source Serif 4", Georgia, serif',
  fSerif: '"Source Serif 4", Georgia, serif',
  fSans: '"Inter Tight", "Inter", -apple-system, system-ui, sans-serif',
  fMono: '"JetBrains Mono", ui-monospace, monospace',
} as const
export const cmsBtn = {
  primary: { background: RM.burgundy, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: RM.fSans } as React.CSSProperties,
  ghost: { background: 'transparent', color: RM.teal, border: `1px solid ${RM.ruleStrong}`, borderRadius: 6, fontSize: 12, fontWeight: 600, padding: '8px 12px', cursor: 'pointer', fontFamily: RM.fSans } as React.CSSProperties,
  dark: { background: RM.teal, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: RM.fSans } as React.CSSProperties,
}
export const cmsInput = {
  base: { width: '100%', background: RM.paper, border: `1px solid ${RM.ruleStrong}`, borderRadius: 6, padding: '9px 12px', fontSize: 13, fontFamily: RM.fSans, color: RM.ink, boxSizing: 'border-box' as const },
  serif: { width: '100%', background: RM.paper, border: `1px solid ${RM.ruleStrong}`, borderRadius: 6, padding: '12px 14px', fontSize: 17, fontFamily: RM.fDisplay, color: RM.teal, boxSizing: 'border-box' as const },
}
