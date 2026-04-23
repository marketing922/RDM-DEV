/**
 * Seed script for the Products collection.
 *
 * Data source: scraped from https://www.remedes-mamie.com/api/products
 * and saved to src/seed/products-source.json (44 products).
 *
 * Usage: npx tsx seed-products.mjs
 *
 * Idempotent: skips products that already exist (matched by sku).
 */

import type { Payload } from 'payload'
import productsSource from './products-source.json'

type SourceProduct = {
  _id: string
  sku: string
  name: string
  composition: string
  effets: string
  poids: string
  prix: number
  product_img: string | null
  product_img2: string | null
  product_url: string | null
  utilisation: string
  vertus: string
}

function slugify(input: string): string {
  return input
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function detectFormat(name: string): 'tisane' | 'poudre' | 'gelule' | 'autre' {
  const n = name.toLowerCase()
  if (n.includes('poudre')) return 'poudre'
  if (n.includes('gelule') || n.includes('gélule') || n.includes('capsule')) return 'gelule'
  return 'tisane'
}

function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
}

/** Lexical richText doc from paragraphs / bullet lines */
function richTextFromVertus(vertus: string) {
  const lines = vertus
    .split(/<br\s*\/?>/i)
    .map((l) => l.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
  const children = lines.length
    ? lines.map((text) => ({
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
      }))
    : [
        {
          type: 'paragraph',
          children: [],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          version: 1,
          textFormat: 0,
          textStyle: '',
        },
      ]
  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

function richTextFromString(text: string) {
  return richTextFromVertus(text)
}

export async function seedProducts(
  payload: Payload,
): Promise<{ created: number; skipped: number; imagesUploaded: number }> {
  payload.logger.info('--- Seed Products: starting ---')

  const products: SourceProduct[] = productsSource as SourceProduct[]

  payload.logger.info(`Loaded ${products.length} products from source JSON.`)

  let created = 0
  let skipped = 0
  let imagesUploaded = 0

  for (const src of products) {
    if (!src.sku || !src.name) {
      payload.logger.warn(`  Skipping invalid entry (missing sku or name): ${src._id}`)
      skipped++
      continue
    }

    const slug = slugify(src.name)

    const existing = await payload.find({
      collection: 'products',
      where: { sku: { equals: src.sku } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      payload.logger.info(`  Product "${src.name}" (sku=${src.sku}) already exists, skipping.`)
      skipped++
      continue
    }

    const externalImageUrl = src.product_img || src.product_img2 || ''

    const doc = await payload.create({
      collection: 'products',
      locale: 'fr',
      overrideAccess: true,
      draft: true,
      data: {
        name: src.name,
        slug,
        sku: src.sku,
        price: src.prix,
        weight: src.poids,
        format: detectFormat(src.name),
        inStock: true,
        shortDescription: src.effets ? src.effets : stripHtml(src.vertus).slice(0, 200),
        ingredients: src.composition,
        usage: richTextFromString(src.utilisation),
        description: richTextFromVertus(src.vertus),
        externalImageUrl,
        temuUrl: src.product_url || '',
        amazonUrl: '',
        status: 'draft',
        _status: 'draft',
      } as any,
    })
    if (externalImageUrl) imagesUploaded++
    payload.logger.info(`  Created "${src.name}" (${doc.id})`)
    created++
  }

  payload.logger.info(
    `--- Seed Products done: ${created} created, ${skipped} skipped, ${imagesUploaded} images uploaded ---`,
  )
  return { created, skipped, imagesUploaded }
}
