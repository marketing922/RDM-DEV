#!/usr/bin/env node
/**
 * Wipe the entire `public` schema and recreate it empty.
 * Payload (`push: true`) will rebuild every table on next boot.
 *
 * Usage:
 *   node --env-file=.env.local scripts/db-reset.mjs --confirm
 */

import pg from 'pg'

const { Client } = pg

const args = new Set(process.argv.slice(2))
const confirmed = args.has('--confirm')

const uri = process.env.DATABASE_URI
if (!uri) {
  console.error('DATABASE_URI is not set. Run with --env-file=.env.local')
  process.exit(1)
}

const masked = uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@')
console.log('Target DB:', masked)

if (!confirmed) {
  console.log('\nDry run. Re-run with --confirm to actually drop schema public.')
  process.exit(0)
}

const client = new Client({ connectionString: uri })
await client.connect()

try {
  console.log('\nListing current tables in schema "public"...')
  const before = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
  )
  console.log(`  ${before.rowCount} tables found.`)
  for (const r of before.rows) console.log('   -', r.tablename)

  console.log('\nDropping schema public CASCADE...')
  await client.query('DROP SCHEMA public CASCADE')
  console.log('Recreating empty schema public...')
  await client.query('CREATE SCHEMA public')
  await client.query('GRANT ALL ON SCHEMA public TO public')

  const after = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  )
  console.log(`\nDone. ${after.rowCount} tables remain (should be 0).`)
  console.log('Boot the app with PAYLOAD_PUSH=true (default) to rebuild schema.')
} finally {
  await client.end()
}
