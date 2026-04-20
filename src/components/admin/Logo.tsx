import React from 'react'

export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <img
        src="https://res.cloudinary.com/laboratoire-calebasse/image/upload/v1761315097/RM_logo_2297718b45.png"
        alt="Les Remèdes de Mamie"
        style={{ width: '48px', height: '48px', objectFit: 'contain' }}
      />
      <div>
        <p style={{ fontSize: '18px', fontWeight: 700, color: '#A2211E', margin: 0, lineHeight: 1.2 }}>
          Les Remèdes de Mamie
        </p>
        <p style={{ fontSize: '12px', color: '#712E2F', margin: 0, opacity: 0.7 }}>
          Administration
        </p>
      </div>
    </div>
  )
}
