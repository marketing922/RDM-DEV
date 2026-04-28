import type { AdminViewServerProps } from 'payload'
import React from 'react'
import ErrorsDashboard from './ErrorsDashboard'

const Errors = async (_props: AdminViewServerProps) => {
  return <ErrorsDashboard />
}

export default Errors
