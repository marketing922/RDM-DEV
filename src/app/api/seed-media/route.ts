import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

const CLOUDINARY_BASE = 'https://res.cloudinary.com/laboratoire-calebasse/image/upload'

const IMAGES = [
  // Brand
  { url: `${CLOUDINARY_BASE}/v1761315097/RM_logo_2297718b45.png`, alt: 'Logo Les Remèdes de Mamie', name: 'rm-logo.png', category: 'brand' },
  { url: `${CLOUDINARY_BASE}/v1761315098/RM_9133bc1749.png`, alt: 'Illustration Hero', name: 'rm-hero-illustration.png', category: 'brand' },
  { url: `${CLOUDINARY_BASE}/v1761638875/100_naturel_et_pur_a729474982.png`, alt: 'Icône 100% Naturel', name: 'icon-100-naturel.png', category: 'brand' },
  { url: `${CLOUDINARY_BASE}/v1761638875/fabrique_en_France_c8918f0126.png`, alt: 'Icône Fabriqué en France', name: 'icon-fabrique-france.png', category: 'brand' },
  { url: `${CLOUDINARY_BASE}/v1761638874/savoir_faire_ancestral_b831db15f3.png`, alt: 'Icône Savoir-faire Ancestral', name: 'icon-savoir-faire.png', category: 'brand' },
  { url: `${CLOUDINARY_BASE}/v1759908829/timeline_9ddc59cec1.jpg`, alt: 'Timeline histoire', name: 'timeline.jpg', category: 'brand' },

  // Certification badges
  { url: `${CLOUDINARY_BASE}/v1759917732/bio_1_Photoroom_83979e4d37.png`, alt: 'Badge Agriculture Bio', name: 'badge-bio.png', category: 'certification' },
  { url: `${CLOUDINARY_BASE}/v1759917732/pharmacopee_1_Photoroom_f8d2c169cf.png`, alt: 'Badge Pharmacopée', name: 'badge-pharmacopee.png', category: 'certification' },
  { url: `${CLOUDINARY_BASE}/v1759917732/vegan_1_Photoroom_5c36156877.png`, alt: 'Badge Vegan', name: 'badge-vegan.png', category: 'certification' },
  { url: `${CLOUDINARY_BASE}/v1759917732/metaux_lourds_1_Photoroom_6dd6ec51b6.png`, alt: 'Badge Sans Métaux Lourds', name: 'badge-metaux-lourds.png', category: 'certification' },

  // Default images
  { url: `${CLOUDINARY_BASE}/v1761295312/Chat_GPT_Image_Oct_24_2025_10_38_36_AM_1_a78649daf4.png`, alt: 'Image plante par défaut', name: 'default-plant.png', category: 'default' },
]

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; mimetype: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') || 'image/png'
  return { buffer: Buffer.from(arrayBuffer), mimetype: contentType }
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production.' }, { status: 403 })
  }
  if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({ message: `Add ?confirm=yes to import ${IMAGES.length} images from Cloudinary into Payload Media.` })
  }

  const payload = await getPayload({ config: configPromise })
  const results: Record<string, string> = {}
  const errors: Record<string, string> = {}

  for (const img of IMAGES) {
    try {
      // Check if already exists by alt text
      const existing = await payload.find({
        collection: 'media',
        where: { alt: { equals: img.alt } },
        limit: 1,
        overrideAccess: true,
      })
      if (existing.docs.length > 0) {
        results[img.name] = 'already exists'
        continue
      }

      // Fetch image from Cloudinary
      const { buffer, mimetype } = await fetchImageBuffer(img.url)

      // Create media entry
      await payload.create({
        collection: 'media',
        overrideAccess: true,
        data: {
          alt: img.alt,
          caption: img.category,
        },
        file: {
          data: buffer,
          mimetype,
          name: img.name,
          size: buffer.length,
        },
      })
      results[img.name] = 'imported'
    } catch (e: any) {
      errors[img.name] = e.message
    }
  }

  const hasErrors = Object.keys(errors).length > 0
  return NextResponse.json(
    { message: hasErrors ? 'Import partial' : 'Import complete', results, errors },
    { status: hasErrors ? 207 : 200 },
  )
}
