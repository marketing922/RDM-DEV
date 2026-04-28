import type { AdminViewServerProps } from 'payload'
import React from 'react'
import LoginClient from './LoginClient'

/**
 * Server wrapper for the custom Payload login view. The actual form lives in
 * the client component because it owns interactive state (password visibility,
 * remember-me, request lifecycle).
 */
const Login = async (_props: AdminViewServerProps) => {
  return <LoginClient />
}

export default Login
