/**
 * Standalone runner for the Products seed.
 *
 * Usage:
 *   npx tsx seed-products.mjs
 *
 * Requires:
 *   - DATABASE_URI and PAYLOAD_SECRET set (via .env)
 *   - src/seed/products-source.json present
 */

async function main() {
  console.log('Starting products seed...')
  const { getPayload } = await import('payload')
  const { default: config } = await import('./src/payload.config.ts')
  const payload = await getPayload({ config })

  console.log('Payload initialized. Seeding products...')
  const { seedProducts } = await import('./src/seed/products.ts')
  const result = await seedProducts(payload)

  console.log('Result:', JSON.stringify(result, null, 2))
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed products failed:', err)
  process.exit(1)
})
