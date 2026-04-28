import type { AdminViewServerProps } from 'payload'
import React from 'react'
import NotificationsListClient from './NotificationsListClient'

/**
 * Server wrapper for the "Notifications" admin view. The real list is a
 * client component that fetches Payload's REST endpoint directly so it
 * stays in sync with any backend writes.
 */
const NotificationsList = async (_props: AdminViewServerProps) => {
  return <NotificationsListClient />
}

export default NotificationsList
