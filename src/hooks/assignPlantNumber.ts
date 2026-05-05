import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Assigns a stable, monotonically increasing `referenceNumber` (P-001, P-002, …)
 * on first create for plants. Backed by a Postgres SEQUENCE for atomic
 * uniqueness — same robust pattern as benefits (B-XXX).
 */
export const assignPlantNumber: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
  originalDoc,
}) => {
  if (operation !== 'create') return data
  if (originalDoc?.referenceNumber || data?.referenceNumber) return data

  const drizzle = (req.payload.db as any)?.drizzle
  if (!drizzle) return data

  try {
    await drizzle.execute(`CREATE SEQUENCE IF NOT EXISTS plant_ref_seq`)
    await drizzle.execute(`
      SELECT setval('plant_ref_seq', GREATEST(
        COALESCE((SELECT last_value FROM plant_ref_seq), 0),
        COALESCE((
          SELECT MAX(CAST(SUBSTRING(reference_number FROM 'P-(\\d+)') AS INTEGER))
          FROM wiki_entries
          WHERE reference_number ~ '^P-[0-9]+$'
        ), 0)
      ), true)
    `)

    const result: any = await drizzle.execute(
      `SELECT nextval('plant_ref_seq') AS n`,
    )
    const rows = result?.rows ?? result
    const n = parseInt(String(rows?.[0]?.n ?? '0'), 10)
    if (n > 0) {
      data.referenceNumber = `P-${String(n).padStart(3, '0')}`
    }
  } catch (err) {
    req.payload.logger.error?.(
      `assignPlantNumber sequence failed: ${(err as Error).message}`,
    )
  }
  return data
}
