import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled in production' }, { status: 403 })
  }

  const payload = await getPayload({ config: configPromise })
  const db = payload.db as any
  const mediaCol = (payload as any).collections?.media

  // Inspect what the client receives via /api/access endpoint or the schema dump
  return NextResponse.json({
    defaultIDType: db?.defaultIDType,
    mediaCustomIDType: mediaCol?.customIDType,
    mediaConfigIdField: mediaCol?.config?.fields?.find((f: any) => f.name === 'id'),
    payloadVersion: (payload as any).version,
  })
}
