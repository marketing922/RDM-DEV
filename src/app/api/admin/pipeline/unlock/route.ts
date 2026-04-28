import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { listProductionLocks, releaseLock } from '@/lib/production-locks'

/**
 * Diagnostic + recovery for stuck pipeline locks.
 *
 *  GET  /api/admin/pipeline/unlock
 *    → list all active locks (key + holder).
 *
 *  POST /api/admin/pipeline/unlock
 *    body: { key?: string, all?: boolean }
 *      - key  : release one specific lock (e.g. "lock:produce:wiki:thym")
 *      - all  : release every `lock:produce:*` lock (use carefully)
 *
 * Auth : admin only.
 */
function isAdmin(user: unknown): boolean {
  const u = user as { role?: string } | null
  return Boolean(u && u.role === 'admin')
}

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const locks = await listProductionLocks()
    return NextResponse.json({ ok: true, count: locks.length, locks })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: { key?: unknown; all?: unknown } = {}
  try {
    body = (await req.json()) as { key?: unknown; all?: unknown }
  } catch {
    // empty body acceptable for ?all=1 query
  }
  const url = new URL(req.url)
  const all = body.all === true || url.searchParams.get('all') === '1'

  try {
    if (all) {
      const locks = await listProductionLocks()
      let released = 0
      for (const l of locks) {
        await releaseLock(l.key)
        released += 1
      }
      return NextResponse.json({ ok: true, released, scope: 'all' })
    }

    const key = typeof body.key === 'string' ? body.key.trim() : ''
    if (!key) {
      return NextResponse.json(
        { ok: false, error: 'missing_key', message: 'Pass body.key="lock:produce:..." or all=true.' },
        { status: 400 },
      )
    }
    if (!key.startsWith('lock:produce:')) {
      return NextResponse.json(
        { ok: false, error: 'invalid_key', message: 'Only `lock:produce:*` keys can be released here.' },
        { status: 400 },
      )
    }
    await releaseLock(key)
    return NextResponse.json({ ok: true, released: 1, key })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
