import type { AdminViewServerProps } from 'payload'
import React from 'react'
import AIUsageDashboard from './AIUsageDashboard'

/**
 * Server wrapper for the "Consommation IA" admin view. The real dashboard is
 * a client component that fetches the AuditLog REST endpoint to stay in sync
 * with any parallel work on the AI subsystem.
 */
const AIUsage = async (_props: AdminViewServerProps) => {
  return <AIUsageDashboard />
}

export default AIUsage
