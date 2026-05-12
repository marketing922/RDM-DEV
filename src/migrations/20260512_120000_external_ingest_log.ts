import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// WHY: table dédiée au monitoring des ingests externes — qui a poussé quoi,
// quand, avec quel verdict. Vit dans le schéma `rdm_audit` à côté des
// worm_backups pour rester hors de la portée du push Drizzle.
//
// Indexée par actor_id (clé API hashée) + par created_at pour permettre
// au partenaire externe de récupérer son propre log via /ingest-log.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS rdm_audit;`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rdm_audit.external_ingest_log (
      id BIGSERIAL PRIMARY KEY,
      actor_id TEXT NOT NULL,
      api_key_hash TEXT NOT NULL,
      ip_hash TEXT,
      kind TEXT NOT NULL,
      locale TEXT NOT NULL,
      slug TEXT,
      doc_id TEXT,
      idempotency_key TEXT,
      status_code INTEGER NOT NULL,
      result TEXT NOT NULL,
      error_code TEXT,
      duration_ms INTEGER,
      payload_size_bytes INTEGER,
      compliance_verdict TEXT,
      webhook_url TEXT,
      webhook_status TEXT,
      webhook_response_code INTEGER,
      replayed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS external_ingest_log_actor_idx
      ON rdm_audit.external_ingest_log (actor_id, created_at DESC);
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS external_ingest_log_idempotency_idx
      ON rdm_audit.external_ingest_log (idempotency_key);
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS external_ingest_log_created_at_idx
      ON rdm_audit.external_ingest_log (created_at DESC);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS rdm_audit.external_ingest_log_created_at_idx;`)
  await db.execute(sql`DROP INDEX IF EXISTS rdm_audit.external_ingest_log_idempotency_idx;`)
  await db.execute(sql`DROP INDEX IF EXISTS rdm_audit.external_ingest_log_actor_idx;`)
  await db.execute(sql`DROP TABLE IF EXISTS rdm_audit.external_ingest_log;`)
}
