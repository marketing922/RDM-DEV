'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Leaf,
  Bookmark,
  Heart,
  Sprout,
  FileText,
  Package,
  Image as ImageIcon,
  Settings,
} from 'lucide-react'
import { RM, cmsBtn } from '@/components/admin/primitives/tokens'

export type QueueItem = {
  id: string
  collection: 'wikiEntries' | 'blogPosts' | 'benefits'
  title: string
  author: string
  action: string
  time: string
  href: string
}

export type ActivityItem = {
  id: string
  time: string
  who: string
  verb: string
  target: string
}

export type DashboardData = {
  userName: string
  greeting: string
  publishedWeek: { total: number; plants: number; articles: number; href: string }
  pendingReview: { total: number; urgent: number; href: string }
  newContent30d: {
    total: number
    plants: number
    articles: number
    products: number
    href: string
  }
  newsletter: {
    provider: 'none' | 'brevo'
    listId?: string
    configured: boolean
    href: string
  }
  queue: QueueItem[]
  activity: ActivityItem[]
}

export type DashboardClientProps = {
  data: DashboardData
}

const statCardBaseStyle: React.CSSProperties = {
  background: RM.paper,
  border: `1px solid ${RM.rule}`,
  borderRadius: 8,
  padding: '18px 20px',
  display: 'block',
  textDecoration: 'none',
  color: 'inherit',
  cursor: 'pointer',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: RM.inkSoft,
  fontFamily: RM.fSans,
  fontWeight: 600,
}

const statValueStyle: React.CSSProperties = {
  fontFamily: RM.fDisplay,
  fontSize: 38,
  color: RM.teal,
  lineHeight: 1,
  margin: '10px 0 8px',
}

const statSubStyle: React.CSSProperties = {
  fontSize: 11,
  color: RM.inkSoft,
  fontFamily: RM.fSans,
}

const panelStyle: React.CSSProperties = {
  background: RM.paper,
  border: `1px solid ${RM.rule}`,
  borderRadius: 10,
  overflow: 'hidden',
}

const panelHeaderStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: `1px solid ${RM.rule}`,
  background: RM.creamSoft,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

const panelTitleStyle: React.CSSProperties = {
  fontFamily: RM.fDisplay,
  fontSize: 20,
  color: RM.teal,
  margin: 0,
}

const iconSquareStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 6,
  background: RM.creamSoft,
  border: `1px solid ${RM.rule}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: RM.teal,
}

const QueueIcon: React.FC<{ collection: QueueItem['collection'] }> = ({ collection }) => {
  const Icon = collection === 'wikiEntries' ? Leaf : collection === 'blogPosts' ? Bookmark : Heart
  return (
    <div style={iconSquareStyle}>
      <Icon size={15} />
    </div>
  )
}

type StatCardProps = {
  label: string
  value: React.ReactNode
  sub: React.ReactNode
  subColor?: string
  href: string
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, subColor, href }) => {
  const [hover, setHover] = useState(false)
  const style: React.CSSProperties = {
    ...statCardBaseStyle,
    borderColor: hover ? RM.ruleStrong : RM.rule,
    boxShadow: hover ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
  }
  return (
    <Link
      href={href}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={statLabelStyle}>{label}</div>
      <div style={statValueStyle}>{value}</div>
      <div style={{ ...statSubStyle, ...(subColor ? { color: subColor } : null) }}>{sub}</div>
    </Link>
  )
}

type QuickAction = {
  icon: React.ComponentType<{ size?: number }>
  label: string
  hint: string
  href: string
}

const quickActions: QuickAction[] = [
  {
    icon: Sprout,
    label: 'Nouvelle plante',
    hint: 'Créer une fiche',
    href: '/admin/collections/wikiEntries/create',
  },
  {
    icon: FileText,
    label: 'Nouvel article',
    hint: 'Commencer un brouillon',
    href: '/admin/collections/blogPosts/create',
  },
  {
    icon: Heart,
    label: 'Nouveau bienfait',
    hint: 'Ajouter une entrée',
    href: '/admin/collections/benefits/create',
  },
  {
    icon: Package,
    label: 'Nouveau produit',
    hint: 'Référence boutique',
    href: '/admin/collections/products/create',
  },
  {
    icon: ImageIcon,
    label: 'Médiathèque',
    hint: 'Gérer les visuels',
    href: '/admin/collections/media',
  },
  {
    icon: Settings,
    label: 'Paramètres',
    hint: 'Config du site',
    href: '/admin/settings',
  },
]

const QuickActionTile: React.FC<{ action: QuickAction }> = ({ action }) => {
  const [hover, setHover] = useState(false)
  const Icon = action.icon
  return (
    <Link
      href={action.href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 12px',
        border: `1px solid ${hover ? RM.ruleStrong : RM.rule}`,
        borderRadius: 8,
        background: 'white',
        textDecoration: 'none',
        transition: 'all 0.15s',
        cursor: 'pointer',
        boxShadow: hover ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: RM.creamSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: RM.burgundy,
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: RM.fSans,
            fontSize: 13,
            color: RM.teal,
            fontWeight: 600,
          }}
        >
          {action.label}
        </div>
        <div style={{ fontSize: 11, color: RM.inkSoft }}>{action.hint}</div>
      </div>
    </Link>
  )
}

const DashboardClient: React.FC<DashboardClientProps> = ({ data }) => {
  const {
    greeting,
    publishedWeek,
    pendingReview,
    newContent30d,
    newsletter,
    queue,
    activity,
  } = data

  const newsletterValue = '—'
  const newsletterSub =
    newsletter.provider === 'brevo' && newsletter.configured
      ? `${newsletter.listId} · Brevo connecté`
      : 'À configurer →'

  const new30dSub = `${newContent30d.plants} plante${newContent30d.plants > 1 ? 's' : ''} · ${newContent30d.articles} article${newContent30d.articles > 1 ? 's' : ''} · ${newContent30d.products} produit${newContent30d.products > 1 ? 's' : ''}`

  return (
    <div
      style={{
        padding: 32,
        background: RM.cream,
        minHeight: 'calc(100vh - 60px)',
        fontFamily: RM.fSans,
        color: RM.ink,
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: 28 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: RM.inkSoft,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            {greeting}
          </div>
          <h1
            style={{
              fontFamily: RM.fDisplay,
              fontSize: 40,
              color: RM.teal,
              margin: '0 0 4px',
              lineHeight: 1.1,
            }}
          >
            Tableau de bord
          </h1>
          <p
            style={{
              fontFamily: RM.fSerif,
              fontStyle: 'italic',
              fontSize: 15,
              color: RM.inkSoft,
              margin: 0,
            }}
          >
            vue d&apos;ensemble de la rédaction
          </p>
        </header>

        {/* Stat cards */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard
            label="Publié cette semaine"
            value={publishedWeek.total}
            sub={`${publishedWeek.plants} plante${publishedWeek.plants > 1 ? 's' : ''} · ${publishedWeek.articles} article${publishedWeek.articles > 1 ? 's' : ''}`}
            href={publishedWeek.href}
          />
          <StatCard
            label="En attente de révision"
            value={pendingReview.total}
            sub={
              pendingReview.urgent > 0
                ? `${pendingReview.urgent} urgent${pendingReview.urgent > 1 ? 's' : ''}`
                : 'Aucun urgent'
            }
            subColor={pendingReview.urgent > 0 ? RM.burgundy : undefined}
            href={pendingReview.href}
          />
          <StatCard
            label="Nouveautés · 30 jours"
            value={newContent30d.total}
            sub={new30dSub}
            href={newContent30d.href}
          />
          <StatCard
            label="Abonnés newsletter"
            value={newsletterValue}
            sub={newsletterSub}
            href={newsletter.href}
          />
        </section>

        {/* Main grid */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: 20,
          }}
        >
          {/* LEFT — File de révision */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={panelTitleStyle}>File de révision</h2>
                <span
                  style={{
                    background: RM.burgundy,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    lineHeight: 1.4,
                  }}
                >
                  {pendingReview.total}
                </span>
              </div>
              <a
                href="/admin/collections/wikiEntries?where[_status][equals]=draft"
                style={{
                  fontSize: 12,
                  color: RM.teal,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Tout voir →
              </a>
            </div>
            <div>
              {queue.length === 0 ? (
                <div
                  style={{
                    padding: '28px 20px',
                    textAlign: 'center',
                    color: RM.inkSoft,
                    fontSize: 13,
                  }}
                >
                  Aucun document en attente. Bonne nouvelle.
                </div>
              ) : (
                queue.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr auto auto',
                      gap: 14,
                      alignItems: 'center',
                      padding: '14px 20px',
                      borderBottom:
                        idx === queue.length - 1 ? 'none' : `1px solid ${RM.rule}`,
                    }}
                  >
                    <QueueIcon collection={item.collection} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: RM.fDisplay,
                          fontSize: 15,
                          color: RM.teal,
                          lineHeight: 1.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: RM.inkSoft, marginTop: 2 }}>
                        {item.author} · {item.action}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: RM.inkSoft,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.time}
                    </div>
                    <a
                      href={item.href}
                      style={{ ...cmsBtn.ghost, textDecoration: 'none' }}
                    >
                      Ouvrir
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Activité du jour */}
            <div style={panelStyle}>
              <div style={panelHeaderStyle}>
                <h2 style={panelTitleStyle}>Activité du jour</h2>
              </div>
              <div>
                {activity.length === 0 ? (
                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: RM.inkSoft,
                      fontSize: 13,
                    }}
                  >
                    Aucune activité pour l&apos;instant.
                  </div>
                ) : (
                  activity.map((a, idx) => (
                    <div
                      key={a.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '48px 1fr',
                        gap: 12,
                        alignItems: 'start',
                        padding: '12px 20px',
                        borderBottom:
                          idx === activity.length - 1 ? 'none' : `1px solid ${RM.rule}`,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: RM.fMono,
                          fontSize: 12,
                          color: RM.inkSoft,
                          paddingTop: 2,
                        }}
                      >
                        {a.time}
                      </div>
                      <div style={{ fontSize: 13, color: RM.ink, lineHeight: 1.45 }}>
                        <span style={{ fontWeight: 600, color: RM.teal }}>{a.who}</span>{' '}
                        {a.verb} {a.target}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Raccourcis */}
            <div style={panelStyle}>
              <div style={panelHeaderStyle}>
                <h2 style={panelTitleStyle}>Raccourcis</h2>
              </div>
              <div
                style={{
                  padding: 14,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                {quickActions.map((a) => (
                  <QuickActionTile key={a.href} action={a} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default DashboardClient
