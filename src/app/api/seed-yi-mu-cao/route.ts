import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { authenticateSeedRoute } from '@/lib/seed-auth'
import {
  ExternalIngestSchema,
  runExternalIngest,
  type ExternalIngestInput,
} from '@/lib/external-ingest'

// Imports JSON inlinés au build → bundlés par Next.js dans le runtime
// Vercel (sinon ENOENT car /var/task ne contient pas les fichiers du repo).
import blogJson from '@/seed/yi-mu-cao/blog_post.ingest.json'
import wikiJson from '@/seed/yi-mu-cao/wiki_entry.ingest.json'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FILES: Array<{ kind: 'blog' | 'wiki'; data: unknown }> = [
  { kind: 'blog', data: blogJson },
  { kind: 'wiki', data: wikiJson },
]

function validate(raw: unknown):
  | { ok: true; input: ExternalIngestInput }
  | { ok: false; error: string; details?: unknown } {
  const validation = ExternalIngestSchema.safeParse(raw)
  if (!validation.success) {
    return { ok: false, error: 'schema_invalid', details: validation.error.format() }
  }
  return { ok: true, input: validation.data }
}

export async function GET(req: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_SEED_IN_PROD !== 'true'
  ) {
    return NextResponse.json(
      { error: 'Disabled in production. Set ALLOW_SEED_IN_PROD=true to enable.' },
      { status: 403 },
    )
  }

  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })

  if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({
      message: 'Add ?confirm=yes to ingest Yi Mu Cao blog + wiki (bundled JSON).',
    })
  }

  const dryRun = req.nextUrl.searchParams.get('dry') === 'yes'
  const payload = await getPayload({ config: configPromise })
  const actorId = 'seed-yi-mu-cao'

  const results: Record<string, unknown> = {}
  for (const { kind, data } of FILES) {
    const loaded = validate(data)
    if (!loaded.ok) {
      results[kind] = loaded
      continue
    }
    if (loaded.input.kind !== kind) {
      results[kind] = {
        ok: false,
        error: 'kind_mismatch',
        message: `Expected kind=${kind}, got ${loaded.input.kind}`,
      }
      continue
    }
    const res = await runExternalIngest({
      payload,
      input: loaded.input,
      dryRun,
      actorId,
    })
    results[kind] = res
  }

  return NextResponse.json({ dry: dryRun, results })
}

export const POST = GET
