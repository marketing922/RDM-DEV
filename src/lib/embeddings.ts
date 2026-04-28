import 'server-only'
import { createHash } from 'node:crypto'

/**
 * Embedding generation helper.
 *
 * Thin wrapper around Gemini `gemini-embedding-001`. This module is intentionally
 * scoped to the low-level concern of "text in, vector out" — budget, rate
 * limiting and auditing are the caller's responsibility (see embed-orchestrator).
 *
 * The model defaults to 3072 dimensions; we explicitly request 768 via
 * `outputDimensionality` to match the pgvector(768) column in the embeddings table.
 */

export const EMBEDDING_MODEL = 'gemini-embedding-001' as const
export const EMBEDDING_DIMENSIONS = 768

// Gemini embedding models cap around 2048 tokens of input.
// 8000 chars is a safe upper bound (~2k tokens worst case for French/English).
const INPUT_CHAR_LIMIT = 8000

export type EmbeddingResult = {
  vector: number[]
  model: typeof EMBEDDING_MODEL
  dimensions: typeof EMBEDDING_DIMENSIONS
  promptTokens?: number
}

/**
 * Normalize text before hashing so cosmetic rewrites (extra spaces, case
 * changes) do not invalidate cached embeddings.
 */
function normalizeForHash(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function sourceHashOf(text: string): string {
  return createHash('sha256').update(normalizeForHash(text)).digest('hex')
}

function truncateForModel(text: string): string {
  if (text.length <= INPUT_CHAR_LIMIT) return text
  return text.slice(0, INPUT_CHAR_LIMIT)
}

export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('[embeddings] GEMINI_API_KEY not configured')
  }

  const safeInput = truncateForModel(text)
  if (!safeInput.trim()) {
    throw new Error('[embeddings] generateEmbedding: empty input text')
  }

  // Dynamic import keeps the Gemini SDK out of any client bundle that might
  // transitively touch this file (mirrors the pattern used in src/lib/ai.ts).
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL })

  // Cast: the SDK's embedContent overload typing does not expose
  // `outputDimensionality` directly; the underlying REST API does support it.
  type EmbedContentFn = (req: {
    content: { role: string; parts: Array<{ text: string }> }
    outputDimensionality?: number
  }) => Promise<{ embedding?: { values?: number[] } }>

  let response: { embedding?: { values?: number[] } }
  try {
    response = await (model.embedContent as unknown as EmbedContentFn)({
      content: { role: 'user', parts: [{ text: safeInput }] },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`[embeddings] Gemini embedContent failed: ${message}`)
  }

  const values = response?.embedding?.values
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('[embeddings] Gemini returned an empty embedding')
  }
  if (values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `[embeddings] unexpected embedding dimension: got ${values.length}, expected ${EMBEDDING_DIMENSIONS}`,
    )
  }

  // The embedContent API does not expose token usage today. We approximate
  // using 1 token ≈ 4 chars, which is good enough for cost bookkeeping and
  // lines up with Gemini's tokenizer behaviour on Latin-script text.
  const promptTokens = Math.max(1, Math.ceil(safeInput.length / 4))

  return {
    vector: values,
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    promptTokens,
  }
}
