// Table des prix IA en EUR (approximation USD × 0.92)
// Source : Google AI pricing + Anthropic pricing, relevé 2026-04
// Les tarifs sont exprimés par million de tokens.

export type AiModel =
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-embedding-001'
  | 'text-embedding-004'
  | 'claude-haiku-4-5-20251001'
  | 'claude-opus-4-7'

export const AI_PRICING_EUR: Record<
  AiModel,
  { inputPerMillion: number; outputPerMillion: number }
> = {
  'gemini-2.5-flash-lite': { inputPerMillion: 0.092, outputPerMillion: 0.368 },
  'gemini-2.5-flash': { inputPerMillion: 0.276, outputPerMillion: 2.3 },
  'gemini-2.5-pro': { inputPerMillion: 1.15, outputPerMillion: 9.2 },
  'gemini-embedding-001': { inputPerMillion: 0.138, outputPerMillion: 0 },
  'text-embedding-004': { inputPerMillion: 0.023, outputPerMillion: 0 },
  'claude-haiku-4-5-20251001': { inputPerMillion: 0.92, outputPerMillion: 4.6 },
  'claude-opus-4-7': { inputPerMillion: 13.8, outputPerMillion: 69.0 },
}

export function calcCostEur(args: {
  model: AiModel
  promptTokens?: number
  completionTokens?: number
}): number {
  const pricing = AI_PRICING_EUR[args.model]
  if (!pricing) return 0
  const inputTokens = args.promptTokens ?? 0
  const outputTokens = args.completionTokens ?? 0
  const cost =
    (inputTokens / 1_000_000) * pricing.inputPerMillion +
    (outputTokens / 1_000_000) * pricing.outputPerMillion
  return Math.round(cost * 1_000_000) / 1_000_000
}
