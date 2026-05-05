import 'server-only'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Auth gate for destructive seed/finalize/enrich routes. Accepts either:
 *   (a) header `x-api-key` matching one of `AI_PIPELINE_API_KEYS`
 *       (JSON array env, same format as external-auth.ts), OR
 *   (b) authenticated admin session (cookie) with `user.role === 'admin'`.
 *
 * Routes also typically gate on NODE_ENV !== 'production' before calling
 * this; this helper is the second layer ensuring no anonymous trigger.
 */

export type SeedAuthResult =
  | { ok: true }
  | { ok: false; status: number; reason: string }

function loadApiKeys(): string[] {
  const raw = process.env.AI_PIPELINE_API_KEYS || ''
  if (!raw.trim()) return []
  // Support both JSON array (existing convention) and comma-separated.
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((k): k is string => typeof k === 'string' && k.length > 0)
    }
  } catch {
    /* fallthrough to comma-split */
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

export async function authenticateSeedRoute(req: Request): Promise<SeedAuthResult> {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey) {
    const allowed = loadApiKeys()
    if (allowed.length > 0 && allowed.includes(apiKey)) {
      return { ok: true }
    }
    return { ok: false, status: 401, reason: 'invalid_api_key' }
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const auth = await payload.auth({ headers: req.headers })
    const user = auth?.user as { role?: string } | null
    if (!user) {
      return { ok: false, status: 401, reason: 'unauthorized' }
    }
    if (user.role !== 'admin') {
      return { ok: false, status: 403, reason: 'forbidden_role' }
    }
    return { ok: true }
  } catch {
    return { ok: false, status: 401, reason: 'unauthorized' }
  }
}
