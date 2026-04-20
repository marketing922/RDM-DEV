'use client'

import React from 'react'
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Clock,
  Pencil,
  LogOut,
  ExternalLink,
  Leaf,
} from 'lucide-react'

type Props = {
  name: string
  email: string
  role?: string
  createdAt?: string
  updatedAt?: string
  editUrl: string
}

const BURGUNDY = '#A2211E'
const TEAL = '#054A57'
const ORANGE = '#D0802C'

const InfoRow: React.FC<{
  icon: React.ComponentType<{ size?: number; color?: string }>
  label: string
  value?: string
}> = ({ icon: Icon, label, value }) => {
  if (!value) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 18px',
        borderBottom: '1px solid #DCD8C7',
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${TEAL}10`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={TEAL} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {label}
        </div>
        <div style={{ fontSize: 14, color: '#374151', fontWeight: 500, marginTop: 2, wordBreak: 'break-word' }}>
          {value}
        </div>
      </div>
    </div>
  )
}

const AccountClient: React.FC<Props> = ({
  name,
  email,
  role,
  createdAt,
  updatedAt,
  editUrl,
}) => {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .filter(Boolean)
    .join('') || 'U'

  return (
    <div
      style={{
        padding: 32,
        background: 'linear-gradient(135deg, #FEF9E9 0%, #FFF5D5 100%)',
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: TEAL, margin: 0 }}>
              Mon compte
            </h1>
            <Leaf size={22} color={ORANGE} />
          </div>
          <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
            Paramètres du profil et préférences utilisateur
          </p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #DCD8C7',
            boxShadow: '0 4px 14px rgba(5, 74, 87, 0.05)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '32px 28px',
              background: `linear-gradient(135deg, ${BURGUNDY} 0%, #712E2F 100%)`,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: -20,
                right: -10,
                opacity: 0.12,
                transform: 'rotate(-15deg)',
                pointerEvents: 'none',
              }}
            >
              <Leaf size={140} color="#FEF9E9" />
            </div>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: ORANGE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: 28,
                fontWeight: 700,
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                flexShrink: 0,
                zIndex: 1,
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, zIndex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#FFFFFF' }}>{name}</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(254,249,233,0.85)' }}>
                {email}
              </p>
              {role && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 10,
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: ORANGE,
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  <Shield size={11} />
                  {role}
                </span>
              )}
            </div>
          </div>

          <div>
            <InfoRow icon={UserIcon} label="Nom" value={name} />
            <InfoRow icon={Mail} label="Email" value={email} />
            {role && <InfoRow icon={Shield} label="Rôle" value={role} />}
            <InfoRow icon={Calendar} label="Membre depuis" value={createdAt} />
            <InfoRow icon={Clock} label="Dernière mise à jour" value={updatedAt} />
          </div>

          <div
            style={{
              padding: '18px 22px',
              background: '#FEF9E9',
              borderTop: '1px solid #DCD8C7',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <a
              href={editUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: BURGUNDY,
                color: '#FFFFFF',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: '0 4px 10px rgba(162, 33, 30, 0.22)',
              }}
            >
              <Pencil size={15} />
              Modifier mon profil
            </a>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: '#FFFFFF',
                color: TEAL,
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                border: `1px solid #DCD8C7`,
              }}
            >
              <ExternalLink size={15} />
              Voir le site
            </a>
            <a
              href="/admin/logout"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: 'transparent',
                color: BURGUNDY,
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                border: `1px solid ${BURGUNDY}30`,
                marginLeft: 'auto',
              }}
            >
              <LogOut size={15} />
              Déconnexion
            </a>
          </div>
        </div>

        <p
          style={{
            marginTop: 18,
            fontSize: 12,
            color: '#9CA3AF',
            textAlign: 'center',
          }}
        >
          Pour modifier votre mot de passe ou vos préférences détaillées, cliquez sur
          « Modifier mon profil ».
        </p>
      </div>
    </div>
  )
}

export default AccountClient
