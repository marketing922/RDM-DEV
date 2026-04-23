import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { callAI, type AIGenerateRequest } from '@/lib/ai'

export async function POST(req: Request) {
  try {
    // Auth: require a logged-in admin user
    const payload = await getPayload({ config: configPromise })
    const h = await getHeaders()
    const { user } = await payload.auth({ headers: h })
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = (await req.json()) as AIGenerateRequest
    if (!body?.collection || !body?.field || !body?.fieldType) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 })
    }

    // Guard: GEMINI_API_KEY
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: 'AI_NOT_CONFIGURED',
          message: 'Variable GEMINI_API_KEY manquante. Configurez-la dans .env.local.',
        },
        { status: 503 },
      )
    }

    try {
      const result = await callAI(body)
      return NextResponse.json(result)
    } catch (aiErr: any) {
      console.error('[AI route] callAI failed', {
        message: aiErr?.message,
        name: aiErr?.name,
        stack: aiErr?.stack,
        collection: body.collection,
        field: body.field,
      })
      return NextResponse.json(
        { error: 'generation_failed', message: aiErr?.message || 'Erreur Gemini' },
        { status: 502 },
      )
    }
  } catch (err: any) {
    console.error('[AI route] fatal', err)
    return NextResponse.json(
      { error: err?.name || 'internal_error', message: err?.message || 'generation failed' },
      { status: 500 },
    )
  }
}
