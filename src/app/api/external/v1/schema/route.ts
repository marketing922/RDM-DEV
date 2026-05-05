import { NextRequest, NextResponse } from 'next/server'
import { authenticateExternal } from '@/lib/external-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/external/v1/schema
 *
 * Returns the API contract description so the external content factory can
 * validate its payload before submission. Hand-rolled (not auto-generated)
 * to keep the doc human-readable and stable.
 */
export async function GET(req: NextRequest) {
  const auth = authenticateExternal(req)
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  return NextResponse.json(
    {
      version: 'v1',
      docs: 'https://github.com/calebasse-verte/RDM/blob/main/Documentation/api-external.md',
      ingest: {
        endpoint: 'POST /api/external/v1/ingest',
        validate: 'POST /api/external/v1/validate',
        auth: { header: 'x-api-key', envKey: 'AI_PIPELINE_API_KEYS' },
      },
      discovery: {
        taxonomy: 'GET /api/external/v1/taxonomy',
        plants: 'GET /api/external/v1/plants',
        benefits: 'GET /api/external/v1/benefits',
        products: 'GET /api/external/v1/products',
      },
      bodyShape: {
        kind: { type: 'string', enum: ['blog', 'wiki'] },
        locale: { type: 'string', enum: ['fr', 'en'], default: 'fr' },
        publish: { type: 'boolean', default: true },
        idempotencyKey: { type: 'string', format: 'uuid', required: true },
        data: '— see kind-specific shape below —',
      },
      blogShape: {
        slug: { type: 'string', pattern: '^[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?$', required: true },
        title: { type: 'string', minLength: 3, maxLength: 200, required: true },
        excerpt: { type: 'string', minLength: 40, maxLength: 400, required: true },
        content: { type: 'object', description: 'Lexical root JSON (Payload format)', required: true },
        seo: {
          title: { type: 'string', maxLength: 70, required: true },
          description: { type: 'string', maxLength: 180, required: true },
          keywords: { type: 'array', items: 'string', minItems: 3, maxItems: 15, required: true },
        },
        geo: 'see geoShape',
        images: 'see imagesShape',
        relations: {
          categorySlug: 'string?',
          tagSlugs: 'string[]?',
          plantSlugs: 'string[]?',
          benefitSlugs: 'string[]?',
          productSlugs: 'string[]?',
        },
      },
      wikiShape: {
        slug: { type: 'string', pattern: 'kebab-case', required: true },
        title: { type: 'string', description: 'plant name', required: true },
        excerpt: { type: 'string', description: 'shortDescription, 40-400 chars', required: true },
        content: { type: 'object', description: 'Lexical root JSON for longDescription', required: true },
        latinName: { type: 'string', required: true },
        family: 'string?',
        origin: 'string?',
        partsUsed: 'string?',
        activeCompounds: 'string?',
        harvest: 'string?',
        form: 'string?',
        conservation: 'string?',
        precautionsText: 'string?',
        seo: 'see seoShape',
        geo: 'see geoShape',
        images: 'see imagesShape',
        relations: {
          benefitSlugs: 'string[]?',
          productSlugs: 'string[]?',
          relatedPostSlugs: 'string[]?',
        },
      },
      geoShape: {
        directAnswer: { type: 'string', minLength: 80, maxLength: 800, description: '40-60 words, citable verbatim' },
        definition: { type: 'string', minLength: 60, maxLength: 600, description: '"<term> est/sont …" 25-50 words' },
        keyTakeaways: { type: 'array', items: { takeaway: 'string' }, minItems: 3, maxItems: 5 },
        quotableStatements: { type: 'array', items: { statement: 'string', source: 'string' }, minItems: 1, maxItems: 5 },
        dataPoints: { type: 'array', items: { metric: 'string', value: 'string', unit: 'string?', source: 'string?' }, minItems: 3, maxItems: 10 },
        faq: { type: 'array', items: { question: 'string', answer: 'string' }, minItems: 3, maxItems: 10 },
        targetAIQueries: { type: 'array', items: { query: 'string' }, minItems: 3, maxItems: 10 },
        authoritySignals: { type: 'string', minLength: 20, maxLength: 1000 },
        sources: { type: 'array', items: { title: 'string', publisher: 'string?', year: 'number?', url: 'string?' }, minItems: 3, maxItems: 20 },
        lastFactCheckedAt: { type: 'string', format: 'iso-datetime' },
      },
      imagesShape: {
        type: 'array',
        minItems: 1,
        maxItems: 6,
        item: {
          url: { type: 'string', format: 'https-url', maxBytes: 5_242_880 },
          alt: { type: 'string', minLength: 1, maxLength: 200 },
          role: { type: 'string', enum: ['featured', 'section'] },
          sectionIndex: 'number? (for role=section)',
        },
      },
      compliance: {
        regex: 'EU 1924/2006 forbidden patterns (guérir, soigner, traiter, prévenir, médicament, etc.)',
        moderation: 'LLM judge — verdict ok | risk | block ; block or risk≥0.7 → 422',
        suggestion:
          "use cultural / traditional / sensory framing (utilisée traditionnellement, selon la tradition X, associée à la culture Y, parfum, couleur, terroir). NEVER link a plant to a symptom or physiological function.",
      },
      errorCodes: {
        '400': 'invalid_body',
        '401': 'unauthorized',
        '409': 'slug_conflict',
        '422': 'moderation_blocked | unknown_relation_slug | forbidden_claim | image_failed',
        '503': 'ai_disabled',
      },
    },
    { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } },
  )
}
