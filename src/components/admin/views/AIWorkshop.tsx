import type { AdminViewServerProps } from 'payload'
import React from 'react'
import AIWorkshopClient from './AIWorkshopClient'

/**
 * Server wrapper for the "Atelier IA" admin view. The real workshop is
 * a client component that drives `/api/ai-pipeline/produce` and polls the
 * Payload REST endpoint for the productionRun collection.
 */
const AIWorkshop = async (_props: AdminViewServerProps) => {
  return <AIWorkshopClient />
}

export default AIWorkshop
