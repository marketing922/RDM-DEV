import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import {
  generateGeoField,
  type GeoContext,
  type GeoFieldType,
} from '@/lib/geoGenerator'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Body = {
  field: GeoFieldType
  context: GeoContext
}

const VALID_FIELDS: GeoFieldType[] = ['directAnswer', 'definition', 'keyTakeaways', 'faq']

export async function POST(req: NextRequest) {
  // Require authentication via Payload
  const payload = await getPayload({ config: configPromise })

  let user: any = null
  try {
    const auth = await payload.auth({ headers: req.headers })
    user = auth?.user
  } catch {
    user = null
  }

  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  const role = user.role
  if (role && !['admin', 'editor'].includes(role)) {
    return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { field, context } = body
  if (!field || !VALID_FIELDS.includes(field)) {
    return NextResponse.json({ error: 'Champ invalide' }, { status: 400 })
  }
  if (!context || typeof context !== 'object' || !context.kind) {
    return NextResponse.json({ error: 'Contexte manquant' }, { status: 400 })
  }
  if (!context.name) {
    return NextResponse.json(
      { error: 'Le nom/titre du document est requis pour générer du contenu' },
      { status: 400 },
    )
  }

  try {
    const result = await generateGeoField(field, context)
    return NextResponse.json(result)
  } catch (err: any) {
    const msg = err?.message || 'Erreur de génération'
    const status = msg.includes('GEMINI_API_KEY') ? 503 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
