import { NextRequest, NextResponse } from 'next/server'
import { getBlogPostBySlug } from '@/lib/queries'

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled in production' }, { status: 403 })
  }

  const slug = req.nextUrl.searchParams.get('slug')
  const locale = req.nextUrl.searchParams.get('locale') || 'fr'
  if (!slug) {
    return NextResponse.json({ error: 'missing slug' }, { status: 400 })
  }

  const post = (await getBlogPostBySlug(slug, locale).catch(() => null)) as any
  if (!post) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const root = post?.content?.root
  const kids: any[] = Array.isArray(root?.children) ? root.children : []
  const summary = kids.map((n, i) => ({
    idx: i,
    type: n?.type,
    tag: n?.tag,
    format: n?.format,
    childCount: Array.isArray(n?.children) ? n.children.length : 0,
    firstChildType: n?.children?.[0]?.type,
    firstChildFormat: n?.children?.[0]?.format,
    textPreview: (n?.children?.[0]?.text || '').slice(0, 80),
  }))

  return NextResponse.json({
    slug,
    locale,
    contentType: typeof post.content,
    rootType: root?.type,
    childCount: kids.length,
    children: summary,
  })
}
