import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// WHY: la table vit dans le schéma `rdm_ai` (pas `public`) pour que le
// drizzle-push de Payload (qui synchronise `public` avec le schéma déclaré)
// ne drop pas la table de rate-limit au boot dev. Payload ne déclare pas
// cette table — on la gère à la main, hors de son schéma.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS rdm_ai;`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rdm_ai.rate_limit_buckets (
      key TEXT PRIMARY KEY,
      window_start TIMESTAMPTZ NOT NULL,
      count INTEGER NOT NULL DEFAULT 0
    );
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS rate_limit_buckets_window_start_idx
      ON rdm_ai.rate_limit_buckets (window_start);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS rdm_ai.rate_limit_buckets_window_start_idx;`)
  await db.execute(sql`DROP TABLE IF EXISTS rdm_ai.rate_limit_buckets;`)
  // NE PAS drop le schéma rdm_ai (peut être réutilisé pour d'autres tables IA).
}
