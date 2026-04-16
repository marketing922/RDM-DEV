/**
 * Standalone seed runner for "Les Remedes de Mamie"
 *
 * Usage:
 *   npx tsx seed.mjs
 *
 * Or add to package.json scripts:
 *   "seed": "npx tsx seed.mjs"
 *
 * Requires:
 *   - DATABASE_URI environment variable set (or .env file)
 *   - PAYLOAD_SECRET environment variable set (or .env file)
 */

import 'dotenv/config'

async function main() {
  console.log('Starting seed...')
  console.log('Loading Payload config...')

  // Import payload and config
  const { getPayload } = await import('payload')

  // Use dynamic import with the path — tsx will resolve TypeScript
  const { default: config } = await import('./src/payload.config.ts')

  const payload = await getPayload({ config })

  console.log('Payload initialized. Running seed...')

  const { seed } = await import('./src/seed.ts')
  const result = await seed(payload)

  console.log('Seed result:', JSON.stringify(result, null, 2))
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
