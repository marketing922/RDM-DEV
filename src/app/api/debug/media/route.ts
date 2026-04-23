import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const h = await getHeaders()
  const { user } = await payload.auth({ headers: h })
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const res = await payload.find({
    collection: 'media',
    limit: 3,
    depth: 0,
    overrideAccess: true,
  })
  return NextResponse.json({
    samples: res.docs.map((d: any) => ({
      id: d.id,
      filename: d.filename,
      mimeType: d.mimeType,
      url: d.url,
      thumbnailURL: d.thumbnailURL,
      sizes: d.sizes,
      width: d.width,
      height: d.height,
    })),
  })
}
