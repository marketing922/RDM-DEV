/**
 * Types partagés par la brique "web-research" (Wikipedia / Commons / Gemini grounding).
 * Pas de "server-only" ici — fichier de types pur, importable côté serveur uniquement
 * via les modules qui le consomment.
 */

export type ResearchSource = 'wikipedia' | 'gemini-grounding' | 'wiki-commons'

export type ResearchFact = {
  source: ResearchSource
  title: string
  /** 100-500 caractères — fragment factuel court, sourcé. */
  snippet: string
  url?: string
}

export type ImageCandidate = {
  source: 'wiki-commons' | 'unsplash'
  /** URL directe vers l'image originale. */
  url: string
  /** URL d'une vignette (320 px max si possible). */
  thumbUrl?: string
  /** Ex. "CC-BY-SA-4.0", "CC-BY-3.0", "Public domain", "Unsplash License". */
  license: string
  /** Ex. "Photo by X — CC BY-SA via Wikimedia Commons". 200 chars max. */
  attribution: string
  width?: number
  height?: number
  fileName?: string
  /** Optional MIME hint when known from the source API. */
  mime?: string
  /** Page where the image was found (Wikipedia file page, Unsplash photo page). */
  sourcePage?: string
}

export type StructuredPlantData = {
  name?: string
  /** Ex. "Matricaria chamomilla". */
  latinName?: string
  /** Ex. "Astéracées". */
  family?: string
  /** Ex. "Europe, Asie occidentale". */
  origin?: string
  /** Ex. "Fleurs, capitules". */
  partsUsed?: string
  /** Ex. "Chamazulène, alpha-bisabolol, flavonoïdes". */
  activeCompounds?: string
  /** Ex. "Mai à août". */
  harvest?: string
  /** Ex. "Bocal hermétique, à l'abri de la lumière". */
  conservation?: string
  /** Ex. "Tisane, infusion, huile essentielle". */
  form?: string
  /** 1-2 phrases factuelles. */
  shortDescription?: string
  /** 3-6 paragraphes, factuel, sourcé. */
  longDescription?: string
  /** Contre-indications connues. */
  precautionsText?: string
}

export type ResearchResult = {
  facts: ResearchFact[]
  imageCandidates: ImageCandidate[]
  /** Présent uniquement pour kind='plant'. Sinon undefined. */
  structured?: StructuredPlantData
  totalCostEur: number
  totalDurationMs: number
  warnings: string[]
}
