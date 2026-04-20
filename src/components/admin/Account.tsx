import React from 'react'
import type { AdminViewServerProps } from 'payload'

import AccountClient from './AccountClient'

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  editor: 'Éditeur',
  author: 'Auteur',
  viewer: 'Lecteur',
}

const Account: React.FC<AdminViewServerProps> = ({ initPageResult }) => {
  const { req } = initPageResult
  const user = req.user as any

  if (!user) {
    return (
      <div style={{ padding: 32 }}>
        <p style={{ color: '#6B7280' }}>Utilisateur non trouvé.</p>
      </div>
    )
  }

  const name =
    user.name || (user.email ? String(user.email).split('@')[0] : 'Utilisateur')
  const email = user.email || ''
  const role = user.role ? roleLabels[user.role] ?? user.role : undefined
  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : undefined
  const updatedAt = user.updatedAt
    ? new Date(user.updatedAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : undefined

  const editUrl = `/admin/collections/users/${user.id}`

  return (
    <AccountClient
      name={name}
      email={email}
      role={role}
      createdAt={createdAt}
      updatedAt={updatedAt}
      editUrl={editUrl}
    />
  )
}

export default Account
