import 'server-only'
import type { NextRequest } from 'next/server'
import { hashIp } from './ai-audit'

/**
 * Auth helper for `/api/external/v1/*`. Accepts an `x-api-key` header that
 * must appear in env `AI_PIPELINE_API_KEYS` (JSON array). Returns a stable
 * actor id (hashed key) for audit logs, or null if rejected.
 */

export type ExternalAuth = {
  actorId: string
  apiKeyHash: string
  ipHash?: string
}

export function authenticateExternal(req: NextRequest): ExternalAuth | null {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) return null

  let allowed: string[] = []
  try {
    const raw = process.env.AI_PIPELINE_API_KEYS || '[]'
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) allowed = parsed.filter((k) => typeof k === 'string')
  } catch {
    allowed = []
  }
  if (!allowed.includes(apiKey)) return null

  const apiKeyHash = hashIp(apiKey).slice(0, 12)
  const ipRaw =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    ''
  const ipHash = ipRaw ? hashIp(ipRaw) : undefined

  return {
    actorId: `external:${apiKeyHash}`,
    apiKeyHash,
    ipHash,
  }
}
