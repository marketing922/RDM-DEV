import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// WHY: la table vit dans le schéma `rdm_ai` (pas `public`) pour que le
// drizzle-push de Payload (qui synchronise `public` avec le schéma déclaré)
// ne drop pas la table d'embeddings au boot dev. Payload n'a pas de notion
// du type pgvector — on gère cette table à la main, hors de son schéma.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`)
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS rdm_ai;`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rdm_ai.embeddings (
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
    );
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS embeddings_unique_entry_idx
      ON rdm_ai.embeddings (collection_slug, entry_id, locale, model);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS embeddings_vector_cosine_idx
      ON rdm_ai.embeddings USING ivfflat (vector vector_cosine_ops)
      WITH (lists = 100);
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS embeddings_collection_idx
      ON rdm_ai.embeddings (collection_slug);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS rdm_ai.embeddings_vector_cosine_idx;`)
  await db.execute(sql`DROP INDEX IF EXISTS rdm_ai.embeddings_unique_entry_idx;`)
  await db.execute(sql`DROP INDEX IF EXISTS rdm_ai.embeddings_collection_idx;`)
  await db.execute(sql`DROP TABLE IF EXISTS rdm_ai.embeddings;`)
  // NE PAS drop le schéma rdm_ai (peut être réutilisé pour d'autres tables IA).
  // NE PAS drop l'extension vector (potentiellement partagée).
}
