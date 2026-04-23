import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verifyHMAC } from '@/lib/hmac'
import { z } from 'zod'

// Schemas Zod pour chaque type de draft
const BaseDraftSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.any(), // Lexical JSON — will be sanitized server-side
  locale: z.enum(['fr', 'en']).default('fr'),
})

const WikiDraftSchema = BaseDraftSchema.extend({
  collection: z.literal('wikiEntries'),
  latinName: z.string().optional(),
  family: z.string().optional(),
})

const BlogDraftSchema = BaseDraftSchema.extend({
  collection: z.literal('blogPosts'),
  excerpt: z.string().max(500).optional(),
  category: z.string().optional(),
})

const BenefitDraftSchema = BaseDraftSchema.extend({
  collection: z.literal('benefits'),
  shortDescription: z.string().max(300).optional(),
})

const DraftSchema = z.discriminatedUnion('collection', [
  WikiDraftSchema,
  BlogDraftSchema,
  BenefitDraftSchema,
])

// Rate limit simple in-memory (pour Phase 1 sans Upstash)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 60 // requests per minute
const DAILY_LIMIT = 1000

function checkRateLimit(apiKey: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(apiKey)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(apiKey, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check API Key
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing X-API-Key header' }, { status: 401 })
    }

    // Validate API key against env (JSON array of allowed keys)
    const allowedKeys = JSON.parse(process.env.AI_PIPELINE_API_KEYS || '[]')
    if (!allowedKeys.includes(apiKey)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // 2. Rate limit
    if (!checkRateLimit(apiKey)) {
      return NextResponse.json({ error: 'Rate limit exceeded (60/min)' }, { status: 429 })
    }

    // 3. Read body + verify HMAC signature
    const body = await request.text()
    const signature = request.headers.get('x-signature')
    const hmacSecret = process.env.AI_PIPELINE_HMAC_SECRET

    if (!signature || !hmacSecret) {
      return NextResponse.json({ error: 'Missing X-Signature header' }, { status: 401 })
    }

    if (!verifyHMAC(body, signature, hmacSecret)) {
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 })
    }

    // 4. Parse and validate with Zod
    let parsed
    try {
      const json = JSON.parse(body)
      parsed = DraftSchema.parse(json)
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err instanceof z.ZodError ? err.issues : 'JSON parse error' },
        { status: 400 }
      )
    }

    // 5. Force draft status (server override — never trust client)
    const { collection, ...fields } = parsed

    // 6. Create draft via Payload
    const payload = await getPayload({ config: configPromise })

    const doc = await payload.create({
      collection: collection as any,
      data: {
        ...fields,
        name: fields.title, // map title to name for wiki/benefits
        status: 'draft', // FORCED server-side
        complianceStatus: 'pending', // FORCED — will be auto-processed by scanForbiddenClaims hook
      },
      locale: parsed.locale,
    })

    // 7. Log to AuditLog
    await payload.create({
      collection: 'auditLog',
      data: {
        action: 'ai_pipeline_create',
        collection,
        documentId: doc.id,
        after: { apiKey: apiKey.substring(0, 8) + '...', collection, title: fields.title },
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json(
      { success: true, id: doc.id, collection, status: 'draft', complianceStatus: doc.complianceStatus || 'pending' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('AI Pipeline error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

// Only POST allowed
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
