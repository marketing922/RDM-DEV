import 'server-only'
import type { Payload } from 'payload'
import crypto from 'node:crypto'

/**
 * Helpers de monitoring + callback webhook pour /api/external/v1/ingest.
 *
 * - logIngest()    → INSERT dans rdm_audit.external_ingest_log
 * - fireWebhook()  → POST signé HMAC vers l'URL fournie par le partenaire
 *                    Fire-and-forget — retries gérés côté serveur (1 try),
 *                    le partenaire doit avoir sa propre idempotency.
 */

export type IngestLogEntry = {
  actorId: string
  apiKeyHash: string
  ipHash?: string
  kind: 'wiki' | 'blog'
  locale: string
  slug?: string
  docId?: string | number
  idempotencyKey?: string
  statusCode: number
  result: 'created' | 'replayed' | 'validation_failed' | 'rejected' | 'error'
  errorCode?: string
  durationMs: number
  payloadSizeBytes?: number
  complianceVerdict?: string
  webhookUrl?: string
  webhookStatus?: 'pending' | 'success' | 'failed' | 'skipped'
  webhookResponseCode?: number
  replayed?: boolean
}

export async function logIngest(payload: Payload, entry: IngestLogEntry): Promise<void> {
  const pool = (payload.db as any).pool
  if (!pool) {
    payload.logger?.warn?.('[ingest-log] pool unavailable, skipping log')
    return
  }
  try {
    await pool.query(
      `INSERT INTO rdm_audit.external_ingest_log (
        actor_id, api_key_hash, ip_hash, kind, locale, slug, doc_id,
        idempotency_key, status_code, result, error_code, duration_ms,
        payload_size_bytes, compliance_verdict, webhook_url, webhook_status,
        webhook_response_code, replayed
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )`,
      [
        entry.actorId,
        entry.apiKeyHash,
        entry.ipHash ?? null,
        entry.kind,
        entry.locale,
        entry.slug ?? null,
        entry.docId != null ? String(entry.docId) : null,
        entry.idempotencyKey ?? null,
        entry.statusCode,
        entry.result,
        entry.errorCode ?? null,
        entry.durationMs,
        entry.payloadSizeBytes ?? null,
        entry.complianceVerdict ?? null,
        entry.webhookUrl ?? null,
        entry.webhookStatus ?? null,
        entry.webhookResponseCode ?? null,
        entry.replayed ?? false,
      ],
    )
  } catch (err) {
    // Fail-soft : si le log échoue, on continue, l'ingest principal a déjà
    // été persisté.
    payload.logger?.warn?.(`[ingest-log] insert failed: ${(err as Error)?.message}`)
  }
}

/**
 * Validation préalable des URLs de webhook fournies par le partenaire.
 * Bloque les URLs internes / privées (SSRF) et les schémas non-HTTPS.
 */
export function isAllowedWebhookUrl(raw: string): boolean {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return false
  }
  if (u.protocol !== 'https:') return false
  const host = u.hostname.toLowerCase()
  // Bloque les hosts internes / loopback / link-local / private ranges.
  if (host === 'localhost' || host.endsWith('.local')) return false
  if (/^127\./.test(host) || host === '0.0.0.0' || host === '::1') return false
  if (/^10\./.test(host)) return false
  if (/^192\.168\./.test(host)) return false
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) return false
  if (/^169\.254\./.test(host)) return false
  if (/^fe80:/i.test(host) || /^fc[0-9a-f]{2}:/i.test(host)) return false
  return true
}

type WebhookPayload = {
  event: 'ingest.success' | 'ingest.replayed' | 'ingest.failed'
  kind: 'wiki' | 'blog'
  slug?: string
  id?: string | number
  idempotencyKey?: string
  locale: string
  publishedAt?: string
  url?: string // URL publique de la fiche/article créés
  error?: { code: string; message?: string }
  timestamp: string
}

type FireWebhookResult = {
  status: 'success' | 'failed' | 'skipped'
  responseCode?: number
}

const WEBHOOK_TIMEOUT_MS = 5000

/**
 * Envoie un POST signé HMAC au webhook du partenaire. Fire-and-forget :
 * un échec ne bloque pas l'ingest principal.
 *
 * Le partenaire vérifie la signature avec :
 *   HMAC-SHA256(`${x-timestamp}.${rawBody}`, AI_PIPELINE_HMAC_SECRET) === x-signature
 */
export async function fireWebhook(
  url: string,
  payload: WebhookPayload,
  hmacSecret: string,
): Promise<FireWebhookResult> {
  if (!isAllowedWebhookUrl(url)) {
    return { status: 'skipped' }
  }
  if (!hmacSecret) {
    return { status: 'skipped' }
  }

  const body = JSON.stringify(payload)
  const timestamp = Date.now().toString()
  const signature = crypto
    .createHmac('sha256', hmacSecret)
    .update(`${timestamp}.${body}`)
    .digest('hex')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rdm-event': payload.event,
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body,
      signal: controller.signal,
    })
    clearTimeout(timer)
    return {
      status: res.ok ? 'success' : 'failed',
      responseCode: res.status,
    }
  } catch {
    clearTimeout(timer)
    return { status: 'failed' }
  }
}
