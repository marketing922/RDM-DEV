'use client'

import React from 'react'
import {
  Sprout,
  Heart,
  FileText,
  Package,
  Layout,
  Image as ImageIcon,
  FolderTree,
  Tag,
  UserPen,
  Users,
  Activity,
  BookOpen,
} from 'lucide-react'

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  sprout: Sprout,
  heart: Heart,
  'file-text': FileText,
  package: Package,
  layout: Layout,
  image: ImageIcon,
  'folder-tree': FolderTree,
  tag: Tag,
  'user-pen': UserPen,
  users: Users,
  activity: Activity,
  'book-open': BookOpen,
}

type Props = {
  label: string
  description?: string
  iconName: string
  accent: string
  total: number
  published?: number | null
  drafts?: number | null
}

const ListHeroClient: React.FC<Props> = ({
  label,
  description,
  iconName,
  accent,
  total,
  published,
  drafts,
}) => {
  const Icon = ICONS[iconName] ?? BookOpen
  const fmt = (n: number) => n.toLocaleString('fr-FR')

  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 20,
        padding: '20px 24px',
        borderRadius: 16,
        background: `linear-gradient(135deg, #FFFFFF 0%, #FEF9E9 60%, #FFF5D5 100%)`,
        border: '1px solid #DCD8C7',
        boxShadow: '0 4px 14px rgba(5, 74, 87, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -30,
          right: -20,
          opacity: 0.08,
          transform: 'rotate(-12deg)',
          pointerEvents: 'none',
        }}
      >
        <Icon size={140} color={accent} />
      </div>

      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: `${accent}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Icon size={28} color={accent} />
      </div>

      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#054A57',
              lineHeight: 1.2,
            }}
          >
            {label}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: accent,
              background: `${accent}12`,
              padding: '3px 10px',
              borderRadius: 999,
            }}
          >
            {fmt(total)} entrée{total > 1 ? 's' : ''}
          </span>
          {typeof published === 'number' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: '#065F46',
                background: '#ECFDF5',
                padding: '3px 10px',
                borderRadius: 999,
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#10B981',
                }}
              />
              {fmt(published)} publié{published > 1 ? 's' : ''}
            </span>
          )}
          {typeof drafts === 'number' && drafts > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: '#92400E',
                background: '#FEF3C7',
                padding: '3px 10px',
                borderRadius: 999,
                border: '1px solid rgba(208, 128, 44, 0.25)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#D0802C',
                }}
              />
              {fmt(drafts)} brouillon{drafts > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {description && (
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 13,
              color: '#6B7280',
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

export default ListHeroClient
