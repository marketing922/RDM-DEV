import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'

/**
 * POST /api/admin/pipeline/backfill-legacy
 *
 * One-shot cleanup for blog/wiki articles produced by the **first version**
 * of the IA pipeline that left two artefacts:
 *
 *  1. Lexical Upload nodes with `value: { id }` instead of `value: id`
 *     → makes the front-end refuse to render the image.
 *  2. Italic-paragraph captions like
 *     `Photo : <photographer> sur Unsplash (https://...)` inserted alongside
 *     the upload node, now redundant.
 *
 * Behaviour : iterates blogPosts + wikiEntries (limit 500 each), rewrites
 * the rich text in-place, persists with `skipModeration` + `skipCompliance`
 * so the existing publication state isn't disturbed.
 *
 * Idempotent : a doc that's already clean is left untouched.
 *
 * Auth : admin only.
 */

type LexicalNode = {
  type?: string
  value?: unknown
  children?: LexicalNode[]
  text?: string
  [key: string]: unknown
}

type LexicalRoot = {
  root?: { children?: LexicalNode[] }
}

const PHOTO_CAPTION_RE = /^\s*Photo\s*:/i
const KNOWN_LICENSE_HINTS_RE = /unsplash|wikimedia|wikipedia|commons|cc[\s_-]?by/i

function isLegacyPhotoCaptionParagraph(node: LexicalNode): boolean {
  if (!node || node.type !== 'paragraph') return false
  const kids = Array.isArray(node.children) ? node.children : []
  if (kids.length === 0) return false
  const text = kids
    .map((k) => (typeof k.text === 'string' ? k.text : ''))
    .join(' ')
    .trim()
  if (!text) return false
  return PHOTO_CAPTION_RE.test(text) && KNOWN_LICENSE_HINTS_RE.test(text)
}

/**
 * Returns a tuple [transformed, dirty] — `dirty` true if at least one node
 * was rewritten or removed.
 */
function transformContent(content: unknown): { content: unknown; dirty: boolean } {
  if (!content || typeof content !== 'object') return { content, dirty: false }
  const root = (content as LexicalRoot).root
  if (!root || !Array.isArray(root.children)) return { content, dirty: false }

  let dirty = false
  const newChildren: LexicalNode[] = []
  for (const child of root.children) {
    if (!child || typeof child !== 'object') {
      newChildren.push(child)
      continue
    }
    // 1. Drop legacy "Photo : ..." paragraphs.
    if (isLegacyPhotoCaptionParagraph(child)) {
      dirty = true
      continue
    }
    // 2. Fix upload nodes with object `value`.
    if (child.type === 'upload' && child.value && typeof child.value === 'object') {
      const v = child.value as { id?: unknown }
      if (typeof v.id === 'number' || typeof v.id === 'string') {
        newChildren.push({ ...child, value: v.id })
        dirty = true
        continue
      }
    }
    newChildren.push(child)
  }

  if (!dirty) return { content, dirty: false }
  return {
    content: {
      ...(content as Record<string, unknown>),
      root: {
        ...(root as Record<string, unknown>),
        children: newChildren,
      },
    },
    dirty: true,
  }
}

async function backfillCollection(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: 'blogPosts' | 'wikiEntries',
  contentField: 'content' | 'description',
  limit: number,
  dryRun: boolean,
): Promise<{ scanned: number; rewritten: number; errors: number }> {
  const result = await payload.find({
    collection,
    limit,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  })
  const docs = (result?.docs ?? []) as Array<{ id: string | number; [k: string]: unknown }>
  let scanned = 0
  let rewritten = 0
  let errors = 0

  for (const doc of docs) {
    scanned += 1
    const raw = (doc as Record<string, unknown>)[contentField]
    const { content, dirty } = transformContent(raw)
    if (!dirty) continue
    if (dryRun) {
      rewritten += 1
      continue
    }
    try {
      await payload.update({
        collection,
        id: doc.id,
        overrideAccess: true,
        context: { skipModeration: true, skipCompliance: true } as never,
        data: { [contentField]: content } as never,
      })
      rewritten += 1
    } catch {
      errors += 1
    }
  }
  return { scanned, rewritten, errors }
}

export async function POST(req: Request) {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  if (!user || (user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dry') === '1'
  const limit = Math.min(1000, Math.max(10, Number(url.searchParams.get('limit')) || 500))

  const t0 = Date.now()
  try {
    const blog = await backfillCollection(payload, 'blogPosts', 'content', limit, dryRun)
    const wiki = await backfillCollection(payload, 'wikiEntries', 'description', limit, dryRun)

    return NextResponse.json({
      ok: true,
      dryRun,
      durationMs: Date.now() - t0,
      blogPosts: blog,
      wikiEntries: wiki,
      total: {
        scanned: blog.scanned + wiki.scanned,
        rewritten: blog.rewritten + wiki.rewritten,
        errors: blog.errors + wiki.errors,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

export const GET = POST
