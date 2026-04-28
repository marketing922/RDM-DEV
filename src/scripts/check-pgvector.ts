/**
 * Vérification rapide de l'état pgvector + table embeddings.
 * Usage : npx tsx --env-file=.env.local src/scripts/check-pgvector.ts
 *
 * N'utilise pas Payload bootstrap (incompatible Node 24 actuellement),
 * connexion pg directe via DATABASE_URI.
 */

import { Pool } from 'pg'

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URI
  if (!connectionString) {
    console.error('[check-pgvector] DATABASE_URI manquante.')
    process.exitCode = 1
    return
  }
  const pool = new Pool({ connectionString })

  try {
    const ext = await pool.query<{ extversion: string }>(
      `SELECT extversion FROM pg_extension WHERE extname = 'vector';`,
    )
    console.log(
      ext.rows.length === 0
        ? '[check-pgvector] vector extension: NOT installed'
        : `[check-pgvector] vector extension: v${ext.rows[0].extversion}`,
    )

    const tableExists = await pool.query<{ e: boolean }>(
      `SELECT EXISTS(SELECT FROM pg_tables WHERE schemaname='rdm_ai' AND tablename = 'embeddings') AS e;`,
    )
    if (!tableExists.rows[0]?.e) {
      console.log('[check-pgvector] rdm_ai.embeddings table: NOT created. Run `npx tsx --env-file=.env.local src/scripts/run-pgvector-migration.ts`.')
      return
    }

    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM rdm_ai.embeddings;`,
    )
    console.log(`[check-pgvector] rdm_ai.embeddings rows: ${count.rows[0]?.count ?? '0'}`)

    const cols = await pool.query<{ column_name: string; data_type: string; udt_name: string }>(
      `SELECT column_name, data_type, udt_name
       FROM information_schema.columns
       WHERE table_schema = 'rdm_ai' AND table_name = 'embeddings'
       ORDER BY ordinal_position;`,
    )
    console.log('[check-pgvector] columns:')
    for (const c of cols.rows) console.log(`  ${c.column_name.padEnd(20)} ${c.data_type} (${c.udt_name})`)

    const idx = await pool.query<{ indexname: string; indexdef: string }>(
      `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='rdm_ai' AND tablename = 'embeddings';`,
    )
    console.log('[check-pgvector] indexes:')
    for (const i of idx.rows) console.log(`  ${i.indexname}`)
  } finally {
    try {
      await pool.end()
    } catch {
      /* noop */
    }
  }
}

main().catch((err) => {
  console.error('[check-pgvector] fatal:', err)
  process.exitCode = 1
})
