import React from 'react'

export default function Icon() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 6,
      background: '#A2211E',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FEF9E9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/>
        <path d="M5 19l7-7"/>
      </svg>
    </div>
  )
}
