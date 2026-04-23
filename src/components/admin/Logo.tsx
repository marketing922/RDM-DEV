import React from 'react'

const RM = {
  teal: '#054A57',
  inkSoft: '#5A4F45',
  fSans: '"Inter Tight", "Inter", -apple-system, system-ui, sans-serif',
}

export default function Logo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '20px 0' }}>
      <img
        src="/assets/brand/rm-logo.png"
        alt="Les Remèdes de Mamie"
        width={260}
        height={186}
        style={{ width: 260, height: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ height: 1, background: RM.inkSoft, opacity: 0.25, width: 60 }} />
        <span style={{ fontFamily: RM.fSans, fontSize: 10, letterSpacing: 3, color: RM.teal, textTransform: 'uppercase', fontWeight: 500 }}>
          Administration
        </span>
        <span style={{ height: 1, background: RM.inkSoft, opacity: 0.25, width: 60 }} />
      </div>
    </div>
  )
}
