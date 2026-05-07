import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// WHY: WORM backup stocké en BD au lieu du filesystem (FS éphémère sur
// Vercel serverless). Schéma rdm_audit dédié pour ne pas mélanger avec les
// tables Payload — drizzle-push de Payload synchronise uniquement le schéma
// public, donc rdm_audit reste sous notre contrôle manuel.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS rdm_audit;`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rdm_audit.worm_backups (
      id BIGSERIAL PRIMARY KEY,
      collection TEXT NOT NULL,
      document_id TEXT NOT NULL,
      snapshot JSONB NOT NULL,
      hash TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS worm_backups_collection_doc_idx
      ON rdm_audit.worm_backups (collection, document_id, created_at DESC);
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS worm_backups_created_at_idx
      ON rdm_audit.worm_backups (created_at DESC);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS rdm_audit.worm_backups_created_at_idx;`)
  await db.execute(sql`DROP INDEX IF EXISTS rdm_audit.worm_backups_collection_doc_idx;`)
  await db.execute(sql`DROP TABLE IF EXISTS rdm_audit.worm_backups;`)
}
