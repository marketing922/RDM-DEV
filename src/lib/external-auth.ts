import 'server-only'
import type { NextRequest } from 'next/server'
import { hashIp } from './ai-audit'
import { verifyHMAC } from './hmac'

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

/** Fenêtre acceptable de dérive du timestamp HMAC (anti-replay). */
const HMAC_TIMESTAMP_WINDOW_MS = 5 * 60 * 1000

/**
 * Auth synchrone : valide uniquement la clé API. À utiliser sur les routes
 * READ-ONLY (GET /api/external/v1/plants etc.). Pour POST/PUT, utiliser
 * `authenticateExternalSigned` qui exige aussi une signature HMAC.
 */
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

/**
 * Auth pour les routes destructives (POST /api/external/v1/ingest…). Exige :
 *
 *   1. `x-api-key` valide (cf. `authenticateExternal`),
 *   2. `x-timestamp` (epoch ms) dans une fenêtre de ±5 min (anti-replay),
 *   3. `x-signature` = HMAC-SHA256(`<timestamp>.<rawBody>`, AI_PIPELINE_HMAC_SECRET).
 *
 * Si `AI_PIPELINE_HMAC_SECRET` n'est pas défini en env, l'auth retombe sur
 * la clé API simple — utile en dev local. En production, configurer le
 * secret pour activer la signature.
 *
 * IMPORTANT : `rawBody` doit être lu UNE seule fois et passé tel quel ici
 * (pas re-stringifié). Sinon la signature ne match plus.
 */
export async function authenticateExternalSigned(
  req: NextRequest,
  rawBody: string,
): Promise<{ ok: true; auth: ExternalAuth } | { ok: false; reason: string; status: number }> {
  const auth = authenticateExternal(req)
  if (!auth) return { ok: false, reason: 'invalid_api_key', status: 401 }

  const secret = process.env.AI_PIPELINE_HMAC_SECRET
  if (!secret || secret.length < 16) {
    // Dev/staging fallback : clé API seule. En prod, configurer le secret.
    return { ok: true, auth }
  }

  const ts = req.headers.get('x-timestamp')
  const sig = req.headers.get('x-signature')
  if (!ts || !sig) return { ok: false, reason: 'missing_signature_headers', status: 401 }

  const tsNum = Number(ts)
  if (!Number.isFinite(tsNum)) return { ok: false, reason: 'invalid_timestamp', status: 401 }
  const drift = Math.abs(Date.now() - tsNum)
  if (drift > HMAC_TIMESTAMP_WINDOW_MS) {
    return { ok: false, reason: 'timestamp_drift', status: 401 }
  }

  const ok = verifyHMAC(`${ts}.${rawBody}`, sig, secret)
  if (!ok) return { ok: false, reason: 'invalid_signature', status: 401 }

  return { ok: true, auth }
}
