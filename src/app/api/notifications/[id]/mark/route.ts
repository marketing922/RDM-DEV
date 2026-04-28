import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'

type MarkAction = 'read' | 'dismiss'

type NotificationDoc = {
  id: string | number
  readBy?: Array<{ userId?: string } | string | null> | null
  dismissedBy?: Array<{ userId?: string } | string | null> | null
}

function toUserIds(
  arr: NotificationDoc['readBy'] | NotificationDoc['dismissedBy'],
): string[] {
  if (!Array.isArray(arr)) return []
  const out: string[] = []
  for (const entry of arr) {
    if (!entry) continue
    if (typeof entry === 'string') {
      out.push(entry)
    } else if (typeof entry === 'object' && typeof entry.userId === 'string') {
      out.push(entry.userId)
    }
  }
  return out
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

    const payload = await getPayload({ config: configPromise })
    const h = await getHeaders()
    const { user } = await payload.auth({ headers: h })
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const role = (user as any)?.role
    if (role !== 'admin' && role !== 'editor') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    let body: { action?: MarkAction } = {}
    try {
      body = (await req.json()) as { action?: MarkAction }
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }
    const action = body.action
    if (action !== 'read' && action !== 'dismiss') {
      return NextResponse.json({ error: 'invalid_action' }, { status: 400 })
    }

    const userId = String((user as any).id ?? '')
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const existing = (await payload.findByID({
      collection: 'notifications' as any,
      id,
      depth: 0,
    })) as NotificationDoc | null
    if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const field = action === 'read' ? 'readBy' : 'dismissedBy'
    const current = toUserIds(existing[field] as NotificationDoc['readBy'])
    if (current.includes(userId)) {
      return NextResponse.json({ ok: true, alreadySet: true })
    }
    const next = [...current, userId].map((uid) => ({ userId: uid }))

    await payload.update({
      collection: 'notifications' as any,
      id,
      data: {
        [field]: next,
      } as any,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[notifications/mark] failed', err)
    return NextResponse.json(
      { error: err?.message || 'failed' },
      { status: 500 },
    )
  }
}
