import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Assigns a stable, monotonically increasing `referenceNumber` (B-001, B-002, …)
 * on first create. Backed by a Postgres SEQUENCE for atomic uniqueness — no
 * race condition between concurrent creates, no double-fire issue with
 * Payload's draft+publish hook chain.
 *
 * The sequence auto-catches up to the highest B-NNN in the table on each
 * call, so seeded numbers (B-001…B-039) are respected without manual
 * sequence priming.
 */
export const assignBenefitNumber: CollectionBeforeChangeHook = async ({
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
    // Idempotent sequence creation
    await drizzle.execute(`CREATE SEQUENCE IF NOT EXISTS benefit_ref_seq`)

    // Catch up sequence to MAX(B-NNN) in benefits table — guarantees we
    // never collide with seeded or manually-set numbers.
    await drizzle.execute(`
      SELECT setval('benefit_ref_seq', GREATEST(
        COALESCE((SELECT last_value FROM benefit_ref_seq), 0),
        COALESCE((
          SELECT MAX(CAST(SUBSTRING(reference_number FROM 'B-(\\d+)') AS INTEGER))
          FROM benefits
          WHERE reference_number ~ '^B-[0-9]+$'
        ), 0)
      ), true)
    `)

    const result: any = await drizzle.execute(
      `SELECT nextval('benefit_ref_seq') AS n`,
    )
    const rows = result?.rows ?? result
    const n = parseInt(String(rows?.[0]?.n ?? '0'), 10)
    if (n > 0) {
      data.referenceNumber = `B-${String(n).padStart(3, '0')}`
    }
  } catch (err) {
    req.payload.logger.error?.(
      `assignBenefitNumber sequence failed: ${(err as Error).message}`,
    )
  }
  return data
}
