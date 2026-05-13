import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs/promises'
import path from 'path'

import { authenticateSeedRoute } from '@/lib/seed-auth'
import {
  ExternalIngestSchema,
  runExternalIngest,
  type ExternalIngestInput,
} from '@/lib/external-ingest'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FILES = [
  { kind: 'blog' as const, file: 'Documentation/blog_post.ingest.json' },
  { kind: 'wiki' as const, file: 'Documentation/wiki_entry.ingest.json' },
]

async function loadAndValidate(file: string): Promise<
  | { ok: true; input: ExternalIngestInput }
  | { ok: false; error: string; details?: unknown }
> {
  const abs = path.join(process.cwd(), file)
  let raw: string
  try {
    raw = await fs.readFile(abs, 'utf8')
  } catch (err) {
    return { ok: false, error: `read_failed:${file}:${err instanceof Error ? err.message : String(err)}` }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    return { ok: false, error: `json_parse_failed:${file}:${err instanceof Error ? err.message : String(err)}` }
  }
  const validation = ExternalIngestSchema.safeParse(parsed)
  if (!validation.success) {
    return { ok: false, error: `schema_invalid:${file}`, details: validation.error.format() }
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
      message: 'Add ?confirm=yes to ingest Yi Mu Cao blog + wiki from Documentation/*.ingest.json',
      files: FILES.map((f) => f.file),
    })
  }

  const dryRun = req.nextUrl.searchParams.get('dry') === 'yes'
  const payload = await getPayload({ config: configPromise })
  const actorId = 'seed-yi-mu-cao'

  const results: Record<string, unknown> = {}
  for (const { kind, file } of FILES) {
    const loaded = await loadAndValidate(file)
    if (!loaded.ok) {
      results[kind] = loaded
      continue
    }
    if (loaded.input.kind !== kind) {
      results[kind] = {
        ok: false,
        error: `kind_mismatch`,
        message: `Expected kind=${kind} in ${file}, got ${loaded.input.kind}`,
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
