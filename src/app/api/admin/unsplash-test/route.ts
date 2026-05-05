import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { searchUnsplashImages } from '@/lib/unsplash-images'

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if ((user as any).role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || 'camomille').trim()

    const hasKey = Boolean(process.env.UNSPLASH_ACCESS_KEY)
    if (!hasKey) {
      return NextResponse.json(
        {
          ok: false,
          envVar: 'UNSPLASH_ACCESS_KEY',
          hasKey: false,
          message:
            "UNSPLASH_ACCESS_KEY n'est pas défini dans l'environnement. Ajoute la clé Access Key dans .env.local puis redémarre le dev server.",
        },
        { status: 200 },
      )
    }

    const t0 = Date.now()
    const results = await searchUnsplashImages(q, { limit: 3, locale: 'fr' })
    const durationMs = Date.now() - t0

    return NextResponse.json({
      ok: results.length > 0,
      query: q,
      hasKey: true,
      count: results.length,
      durationMs,
      results: results.map((r) => ({
        url: r.url,
        thumbUrl: r.thumbUrl,
        width: r.width,
        height: r.height,
        license: r.license,
        attribution: r.attribution,
        sourcePage: r.sourcePage,
      })),
      message:
        results.length > 0
          ? `Clé valide. ${results.length} image(s) renvoyée(s) en ${durationMs}ms.`
          : `Clé présente mais 0 résultat — possible 401 (clé invalide), 403 (quota) ou requête trop spécifique. Vérifie le terminal Next.js pour le log "[unsplash] HTTP …".`,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
