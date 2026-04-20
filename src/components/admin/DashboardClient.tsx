'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Leaf,
  Heart,
  FileText,
  Package,
  TrendingUp,
  Clock,
  User,
  Calendar,
} from 'lucide-react'

type StatProps = {
  title: string
  value: number | string
  icon: React.ElementType
  trend?: string
  color: string
}

type QuickAction = {
  label: string
  icon: React.ElementType
  href: string
  color: string
}

export type ActivityItem = {
  id: string
  type: string
  description: string
  timestamp: string
  user: string
}

const StatCard: React.FC<StatProps> = ({ title, value, icon: Icon, trend, color }) => (
  <motion.div
    whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(162, 33, 30, 0.12)' }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    style={{
      background: 'linear-gradient(135deg, #FFFFFF 0%, #FEF9E9 100%)',
      border: '1px solid #DCD8C7',
      borderRadius: '12px',
      padding: '24px',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div
      aria-hidden
      style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, opacity: 0.06 }}
    >
      <Icon size={100} style={{ color }} />
    </div>
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{title}</span>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#054A57', marginBottom: 6 }}>{value}</div>
      {trend && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: '#16a34a',
          }}
        >
          <TrendingUp size={14} />
          <span>{trend}</span>
        </div>
      )}
    </div>
  </motion.div>
)

const QuickActionButton: React.FC<QuickAction> = ({ label, icon: Icon, href, color }) => (
  <motion.a
    href={href}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 20,
      background: 'linear-gradient(135deg, #FFFFFF 0%, #FEF9E9 100%)',
      border: '1px solid #DCD8C7',
      borderRadius: 12,
      textDecoration: 'none',
      cursor: 'pointer',
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={24} style={{ color }} />
    </div>
    <span style={{ fontSize: 13, fontWeight: 600, color: '#054A57', textAlign: 'center' }}>
      {label}
    </span>
  </motion.a>
)

const ActivityRow: React.FC<{ activity: ActivityItem; index: number }> = ({
  activity,
  index,
}) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.08 }}
    style={{
      padding: 16,
      background: '#FEF9E9',
      borderRadius: 8,
      marginBottom: 10,
      border: '1px solid #DCD8C7',
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: 6,
        gap: 12,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: '#054A57' }}>{activity.type}</span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          color: '#9CA3AF',
          whiteSpace: 'nowrap',
        }}
      >
        <Clock size={11} />
        <span>{activity.timestamp}</span>
      </div>
    </div>
    <p style={{ fontSize: 13, color: '#374151', margin: '0 0 6px' }}>{activity.description}</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280' }}>
      <User size={11} />
      <span>{activity.user}</span>
    </div>
  </motion.div>
)

export type DashboardClientProps = {
  counts: { plants: number; benefits: number; articles: number; products: number }
  activities: ActivityItem[]
  userName?: string
}

const BURGUNDY = '#A2211E'
const TEAL = '#054A57'
const ORANGE = '#D0802C'

const DashboardClient: React.FC<DashboardClientProps> = ({ counts, activities, userName }) => {
  const [greeting, setGreeting] = useState('Bonjour')
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Bonjour')
    else if (h < 18) setGreeting('Bon après-midi')
    else setGreeting('Bonsoir')

    setCurrentDate(
      new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    )
  }, [])

  const stats: StatProps[] = [
    { title: 'Plantes', value: counts.plants, icon: Leaf, color: TEAL },
    { title: 'Bienfaits', value: counts.benefits, icon: Heart, color: BURGUNDY },
    { title: 'Articles', value: counts.articles, icon: FileText, color: ORANGE },
    { title: 'Produits', value: counts.products, icon: Package, color: TEAL },
  ]

  const actions: QuickAction[] = [
    {
      label: 'Nouvelle plante',
      icon: Leaf,
      href: '/admin/collections/wikiEntries/create',
      color: TEAL,
    },
    {
      label: 'Nouveau bienfait',
      icon: Heart,
      href: '/admin/collections/benefits/create',
      color: BURGUNDY,
    },
    {
      label: 'Nouvel article',
      icon: FileText,
      href: '/admin/collections/blogPosts/create',
      color: ORANGE,
    },
    {
      label: 'Nouveau produit',
      icon: Package,
      href: '/admin/collections/products/create',
      color: TEAL,
    },
  ]

  return (
    <div
      style={{
        padding: 32,
        background: 'linear-gradient(135deg, #FEF9E9 0%, #FFF5D5 100%)',
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: '#054A57', margin: 0 }}>
              {greeting}
              {userName ? `, ${userName}` : ''}
            </h1>
            <Leaf size={28} color="#D0802C" />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#6B7280',
              fontSize: 14,
            }}
          >
            <Calendar size={14} />
            <p style={{ margin: 0, textTransform: 'capitalize' }}>{currentDate}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 20,
            marginBottom: 36,
          }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <StatCard {...s} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          style={{ marginBottom: 36 }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#054A57', margin: '0 0 16px' }}>
            Actions rapides
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 14,
            }}
          >
            {actions.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.65 + i * 0.08 }}
              >
                <QuickActionButton {...a} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#054A57', margin: '0 0 16px' }}>
            Activité récente
          </h2>
          <div
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FEF9E9 100%)',
              border: '1px solid #DCD8C7',
              borderRadius: 12,
              padding: 20,
              maxHeight: 460,
              overflowY: 'auto',
            }}
          >
            {activities.length === 0 ? (
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0, textAlign: 'center' }}>
                Aucune activité récente.
              </p>
            ) : (
              <AnimatePresence>
                {activities.map((a, i) => (
                  <ActivityRow key={a.id} activity={a} index={i} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardClient
