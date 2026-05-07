import type { CollectionAfterChangeHook } from 'payload'

// Liste des clés à masquer dans les snapshots before/after avant
// stockage : tokens, mots de passe, secrets, hash auth. Empêche un audit
// log d'exposer les credentials en clair en cas de fuite.
const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'token',
  'apikey',
  'secret',
  'salt',
  'hmac',
  'sessionid',
  'refreshtoken',
]

function redactSensitive(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) return value.map(redactSensitive)
  if (typeof value !== 'object') return value
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const lower = k.toLowerCase()
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      out[k] = '<redacted>'
    } else {
      out[k] = redactSensitive(v)
    }
  }
  return out
}

export const createAuditLog: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
  collection,
}) => {
  // Short-circuit si on est dans une cascade de hooks internes : un update
  // déclenché par un autre hook (ex: moderateContentHook qui réécrit
  // complianceLLM) ne doit pas générer un nouvel audit log — sinon on
  // double-log et on risque la boucle.
  if ((req.context as any)?.fromHook) return doc

  try {
    await req.payload.create({
      collection: 'auditLog',
      data: {
        action: operation,
        collection: collection.slug,
        documentId: doc.id,
        user: req.user?.id || null,
        before: previousDoc ? redactSensitive(JSON.parse(JSON.stringify(previousDoc))) : null,
        after: redactSensitive(JSON.parse(JSON.stringify(doc))),
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    req.payload.logger.error(`AuditLog error: ${error}`)
  }

  return doc
}
