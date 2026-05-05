import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// WHY: ces tables vivent dans le schéma `rdm_ai` (pas `public`) pour que le
// drizzle-push de Payload (qui synchronise `public` avec le schéma déclaré)
// ne les drop pas au boot dev. Payload ne déclare pas ces tables — on les
// gère à la main, hors de son schéma.
//
// Remplacement complet d'Upstash Redis par 3 tables Postgres internes :
//  - rdm_ai.kv_cache              → cache key/value avec TTL
//  - rdm_ai.locks                 → locks distribués
//  - rdm_ai.ingest_fingerprints   → dedup/idempotence ingest external

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS rdm_ai;`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rdm_ai.kv_cache (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      expires_at TIMESTAMPTZ
    );
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS kv_cache_expires_idx
      ON rdm_ai.kv_cache (expires_at);
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rdm_ai.locks (
      key TEXT PRIMARY KEY,
      holder TEXT NOT NULL,
      acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    );
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS locks_expires_idx
      ON rdm_ai.locks (expires_at);
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rdm_ai.ingest_fingerprints (
      fingerprint TEXT PRIMARY KEY,
      first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      metadata JSONB
    );
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS ingest_fingerprints_seen_idx
      ON rdm_ai.ingest_fingerprints (first_seen_at);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS rdm_ai.ingest_fingerprints_seen_idx;`)
  await db.execute(sql`DROP TABLE IF EXISTS rdm_ai.ingest_fingerprints;`)
  await db.execute(sql`DROP INDEX IF EXISTS rdm_ai.locks_expires_idx;`)
  await db.execute(sql`DROP TABLE IF EXISTS rdm_ai.locks;`)
  await db.execute(sql`DROP INDEX IF EXISTS rdm_ai.kv_cache_expires_idx;`)
  await db.execute(sql`DROP TABLE IF EXISTS rdm_ai.kv_cache;`)
  // NE PAS drop le schéma rdm_ai (partagé avec rate_limit_buckets).
}
