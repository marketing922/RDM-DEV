/**
 * Applique la migration pgvector sans passer par la CLI `payload migrate`
 * (qui crashe sur Node 24 à cause d'un import de dossier ESM strict)
 * et sans Payload bootstrap (loadEnv.js incompatible Node 24).
 *
 * Usage :
 *   npx tsx --env-file=.env.local src/scripts/run-pgvector-migration.ts
 *
 * Idempotent : ré-exécution sans risque (CREATE EXTENSION/TABLE/INDEX IF NOT EXISTS).
 */

import { Pool } from 'pg'

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URI
  if (!connectionString) {
    console.error('[pgvector-migration] DATABASE_URI manquante. Lance avec --env-file=.env.local.')
    process.exitCode = 1
    return
  }

  const pool = new Pool({ connectionString })

  // WHY: la table vit dans le schéma rdm_ai (et non public) pour que Drizzle/Payload
  // ne la drop pas au boot — Drizzle ne gère que le schéma `public` configuré par Payload.
  const steps: Array<{ label: string; sql: string }> = [
    {
      label: '1/6 CREATE EXTENSION vector',
      sql: 'CREATE EXTENSION IF NOT EXISTS vector;',
    },
    {
      label: '2/6 CREATE SCHEMA rdm_ai',
      sql: 'CREATE SCHEMA IF NOT EXISTS rdm_ai;',
    },
    {
      label: '3/6 CREATE TABLE rdm_ai.embeddings',
      sql: `CREATE TABLE IF NOT EXISTS rdm_ai.embeddings (
        id BIGSERIAL PRIMARY KEY,
        collection_slug TEXT NOT NULL,
        entry_id TEXT NOT NULL,
        locale TEXT NOT NULL DEFAULT 'fr',
        model TEXT NOT NULL,
        dimensions INTEGER NOT NULL,
        source_hash TEXT NOT NULL,
        vector vector(768) NOT NULL,
        meta JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );`,
    },
    {
      label: '4/6 CREATE UNIQUE INDEX rdm_ai.embeddings_unique_entry_idx',
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS embeddings_unique_entry_idx
        ON rdm_ai.embeddings (collection_slug, entry_id, locale, model);`,
    },
    {
      label: '5/6 CREATE INDEX embeddings_vector_cosine_idx (ivfflat)',
      sql: `CREATE INDEX IF NOT EXISTS embeddings_vector_cosine_idx
        ON rdm_ai.embeddings USING ivfflat (vector vector_cosine_ops) WITH (lists = 100);`,
    },
    {
      label: '6/6 CREATE INDEX embeddings_collection_idx',
      sql: `CREATE INDEX IF NOT EXISTS embeddings_collection_idx
        ON rdm_ai.embeddings (collection_slug);`,
    },
  ]

  console.log('[pgvector-migration] applying migration...')

  try {
    for (const step of steps) {
      try {
        await pool.query(step.sql)
        console.log(`  [OK] ${step.label}`)
      } catch (err) {
        const e = err as { code?: string; message?: string }
        console.error(`  [FAIL] ${step.label} — ${e.code || ''} ${e.message || err}`)
        throw err
      }
    }

    const ext = await pool.query<{ extversion: string }>(
      `SELECT extversion FROM pg_extension WHERE extname = 'vector';`,
    )
    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM rdm_ai.embeddings;`,
    )
    console.log(
      `[pgvector-migration] done. vector v${ext.rows[0]?.extversion ?? '?'} · rdm_ai.embeddings rows: ${count.rows[0]?.count ?? '0'}`,
    )
  } finally {
    try {
      await pool.end()
    } catch {
      /* noop */
    }
  }
}

main().catch((err) => {
  console.error('[pgvector-migration] fatal:', err)
  process.exitCode = 1
})
