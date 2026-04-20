'use client'

import React, { useEffect, useState } from 'react'
import { Leaf, Sprout, BookOpen, Heart } from 'lucide-react'

type StatPillProps = {
  icon: React.ReactNode
  value: string
  label: string
  delay: number
}

const StatPill: React.FC<StatPillProps> = ({ icon, value, label, delay }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 18px',
        backgroundColor: '#FFF5D5',
        borderRadius: '24px',
        border: '1px solid #DCD8C7',
        boxShadow: '0 2px 8px rgba(162, 33, 30, 0.06)',
      }}
    >
      <div style={{ color: '#A2211E', display: 'flex', alignItems: 'center' }}>{icon}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#054A57', lineHeight: 1 }}>
          {value}
        </span>
        <span style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1 }}>{label}</span>
      </div>
    </div>
  )
}

export type BeforeLoginClientProps = {
  plantsCount: number
  benefitsCount: number
  articlesCount: number
}

const BeforeLoginClient: React.FC<BeforeLoginClientProps> = ({
  plantsCount,
  benefitsCount,
  articlesCount,
}) => {
  const [titleVisible, setTitleVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setTitleVisible(true), 150)
    return () => clearTimeout(t)
  }, [])

  const format = (n: number) => n.toLocaleString('fr-FR')

  const stats = [
    { icon: <Sprout size={18} />, value: format(plantsCount), label: 'Plantes' },
    { icon: <Heart size={18} />, value: format(benefitsCount), label: 'Bienfaits' },
    { icon: <BookOpen size={18} />, value: format(articlesCount), label: 'Articles' },
  ]

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        padding: '40px 40px 28px',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Feuilles décoratives sur toute la fenêtre */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {[
          { top: '6%', left: '5%', size: 180, rot: -25, color: '#054A57', opacity: 0.08 },
          { top: '10%', right: '8%', size: 220, rot: 35, color: '#A2211E', opacity: 0.07 },
          { top: '38%', left: '2%', size: 140, rot: 60, color: '#D0802C', opacity: 0.06 },
          { top: '50%', right: '4%', size: 160, rot: -40, color: '#054A57', opacity: 0.06 },
          { bottom: '8%', left: '10%', size: 200, rot: 20, color: '#A2211E', opacity: 0.08 },
          { bottom: '12%', right: '12%', size: 170, rot: -55, color: '#D0802C', opacity: 0.07 },
          { bottom: '42%', left: '45%', size: 80, rot: 15, color: '#054A57', opacity: 0.05 },
          { top: '22%', left: '38%', size: 70, rot: -10, color: '#A2211E', opacity: 0.04 },
        ].map((l, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: l.top,
              bottom: l.bottom,
              left: l.left,
              right: l.right,
              opacity: l.opacity,
              transform: `rotate(${l.rot}deg)`,
            }}
          >
            <Leaf size={l.size} color={l.color} />
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          backgroundColor: '#A2211E',
          borderRadius: '50%',
          marginBottom: '18px',
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'scale(1) rotate(0deg)' : 'scale(0.6) rotate(-45deg)',
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 8px 20px rgba(162, 33, 30, 0.25)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Leaf size={32} color="#FEF9E9" />
      </div>

      <h1
        style={{
          fontSize: '26px',
          fontWeight: 700,
          color: '#054A57',
          margin: '0 0 10px',
          lineHeight: 1.25,
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s ease-out 0.15s',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Bienvenue dans l&rsquo;Administration
      </h1>

      <p
        style={{
          fontSize: '14px',
          color: '#6B7280',
          margin: '0 0 28px',
          lineHeight: 1.55,
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s ease-out 0.25s',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Les Remèdes de Mamie &mdash; Encyclopédie des plantes médicinales
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {stats.map((s, i) => (
          <StatPill key={s.label} {...s} delay={500 + i * 120} />
        ))}
      </div>

      <div
        style={{
          marginTop: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          opacity: titleVisible ? 1 : 0,
          transition: 'opacity 0.6s ease-out 1s',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ width: '40px', height: '1px', backgroundColor: '#DCD8C7' }} />
        <Leaf size={14} color="#D0802C" />
        <div style={{ width: '40px', height: '1px', backgroundColor: '#DCD8C7' }} />
      </div>
    </div>
  )
}

export default BeforeLoginClient
