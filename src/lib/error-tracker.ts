import 'server-only'
import { createHash } from 'node:crypto'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export type ErrorLevel = 'info' | 'warning' | 'error' | 'critical'

export type ErrorSubsystem =
  | 'ai-generate'
  | 'ai-geo'
  | 'ai-seo'
  | 'ai-pipeline'
  | 'ai-embedding'
  | 'ai-vision'
  | 'ai-research'
  | 'content-orchestrator'
  | 'auth'
  | 'payload'
  | 'api'
  | 'frontend'
  | 'hook'
  | 'webhook'
  | 'other'

export type CaptureContext = {
  subsystem?: ErrorSubsystem
  level?: ErrorLevel
  route?: string
  userId?: string
  ipHash?: string
  context?: Record<string, unknown>
}

const MSG_MAX = 500
const STACK_MAX = 3000

const LEVEL_ORDER: Record<ErrorLevel, number> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
}

function truncate(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined
  return value.length > max ? value.slice(0, max) : value
}

function normalizeMessage(message: string): string {
  // Replace common volatile tokens so dedup groups related errors.
  return message
    .replace(/0x[0-9a-fA-F]+/g, '0x?')
    .replace(/\b\d{4,}\b/g, 'N')
    .replace(/["'][^"']{8,}["']/g, 'S')
    .replace(/\s+/g, ' ')
    .trim()
}

function topStackLines(stack: string | undefined, n: number): string {
  if (!stack) return ''
  const lines = stack.split('\n').map((l) => l.trim()).filter(Boolean)
  return lines.slice(0, n).join('\n')
}

function extractFields(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    return { name: err.name || 'Error', message: err.message || '', stack: err.stack }
  }
  if (typeof err === 'string') {
    return { name: 'StringError', message: err }
  }
  if (err && typeof err === 'object') {
    const obj = err as { name?: unknown; message?: unknown; stack?: unknown }
    return {
      name: typeof obj.name === 'string' ? obj.name : 'UnknownError',
      message: typeof obj.message === 'string' ? obj.message : JSON.stringify(err),
      stack: typeof obj.stack === 'string' ? obj.stack : undefined,
    }
  }
  return { name: 'UnknownError', message: String(err) }
}

export function signatureOf(err: unknown): string {
  const { name, message, stack } = extractFields(err)
  const key = `${name}|${normalizeMessage(message)}|${topStackLines(stack, 3)}`
  return createHash('sha256').update(key).digest('hex')
}

function maxLevel(a: ErrorLevel | undefined, b: ErrorLevel | undefined): ErrorLevel {
  const aa = a ?? 'error'
  const bb = b ?? 'error'
  return LEVEL_ORDER[aa] >= LEVEL_ORDER[bb] ? aa : bb
}

export async function captureError(
  err: unknown,
  ctx?: CaptureContext,
): Promise<string | null> {
  try {
    const { name, message, stack } = extractFields(err)
    const signature = signatureOf(err)
    const level: ErrorLevel = ctx?.level ?? 'error'
    const subsystem: ErrorSubsystem = ctx?.subsystem ?? 'other'
    const now = new Date()

    const payload = await getPayload({ config: configPromise })

    // errorLog slug is not yet in generated types until payload types are regenerated.
    const existing = await payload.find({
      collection: 'errorLog' as 'auditLog',
      where: { signature: { equals: signature } },
      limit: 1,
      depth: 0,
    })

    const doc = existing.docs[0] as { id: string | number; count?: number; level?: ErrorLevel } | undefined

    if (doc) {
      const nextLevel = maxLevel(doc.level, level)
      const updated = await payload.update({
        collection: 'errorLog' as 'auditLog',
        id: doc.id,
        data: {
          count: (doc.count ?? 1) + 1,
          lastSeenAt: now.toISOString(),
          level: nextLevel,
          resolved: false,
        } as Record<string, unknown>,
      })
      return String((updated as { id: string | number }).id)
    }

    const created = await payload.create({
      collection: 'errorLog' as 'auditLog',
      data: {
        signature,
        level,
        subsystem,
        name,
        message: truncate(message, MSG_MAX),
        stack: truncate(stack, STACK_MAX),
        route: ctx?.route,
        userId: ctx?.userId,
        ipHash: ctx?.ipHash,
        context: ctx?.context ?? {},
        count: 1,
        firstSeenAt: now.toISOString(),
        lastSeenAt: now.toISOString(),
        resolved: false,
      } as Record<string, unknown>,
    })
    return String((created as { id: string | number }).id)
  } catch (selfErr) {
    console.error('[error-tracker] self-failure', selfErr)
    return null
  }
}
