// GEO field prompts (directAnswer, definition, keyTakeaways, faq) per locale.
// Each entry is versioned. The instruction + schemaHint pair forms one prompt.

import type { Locale } from './system-instructions'

export type GeoFieldType =
  | 'directAnswer'
  | 'definition'
  | 'keyTakeaways'
  | 'faq'

export type GeoPromptEntry = {
  version: string
  locale: Locale
  role: 'geo-field'
  field: GeoFieldType
  instruction: string
  schemaHint: string
}

export const GEO_PROMPTS: Record<
  GeoFieldType,
  Record<Locale, Record<string, GeoPromptEntry>>
> = {
  directAnswer: {
    fr: {
      v1: {
        version: 'v1',
        locale: 'fr',
        role: 'geo-field',
        field: 'directAnswer',
        instruction: `Rédige une "réponse directe" de 40 à 60 mots, en français, optimisée pour extraction par les IA (Google AI Overviews, ChatGPT, Perplexity).

Règles strictes :
- Commence par la réponse, pas par du contexte ("Dans cet article…" est INTERDIT)
- Auto-portante : compréhensible sans le reste de la page
- Factuelle et neutre (pas de promesses thérapeutiques)
- Intègre le nom du sujet dès la première phrase`,
        schemaHint: `Retourne UNIQUEMENT un objet JSON : { "text": "…" }`,
      },
    },
    en: {
      v1: {
        version: 'v1',
        locale: 'en',
        role: 'geo-field',
        field: 'directAnswer',
        instruction: `Write a "direct answer" of 40 to 60 words, in English, optimised for extraction by AI engines (Google AI Overviews, ChatGPT, Perplexity).

Strict rules:
- Start with the answer, not with context ("In this article…" is FORBIDDEN)
- Self-contained: understandable without the rest of the page
- Factual and neutral (no therapeutic promises)
- Include the subject name in the first sentence`,
        schemaHint: `Return ONLY a JSON object: { "text": "…" }`,
      },
    },
  },
  definition: {
    fr: {
      v1: {
        version: 'v1',
        locale: 'fr',
        role: 'geo-field',
        field: 'definition',
        instruction: `Rédige une définition standalone de 25 à 50 mots, en français.

Règles strictes :
- Format obligatoire : "[Nom du sujet] est/sont une/un …"
- Commence toujours par le terme défini
- Factuelle, neutre, vérifiable
- Si plante : inclure nom latin entre parenthèses + famille botanique`,
        schemaHint: `Retourne UNIQUEMENT un objet JSON : { "text": "…" }`,
      },
    },
    en: {
      v1: {
        version: 'v1',
        locale: 'en',
        role: 'geo-field',
        field: 'definition',
        instruction: `Write a stand-alone definition of 25 to 50 words, in English.

Strict rules:
- Required format: "[Subject name] is/are a/an …"
- Always start with the defined term
- Factual, neutral, verifiable
- If plant: include Latin name in parentheses + botanical family`,
        schemaHint: `Return ONLY a JSON object: { "text": "…" }`,
      },
    },
  },
  keyTakeaways: {
    fr: {
      v1: {
        version: 'v1',
        locale: 'fr',
        role: 'geo-field',
        field: 'keyTakeaways',
        instruction: `Génère entre 3 et 5 points-clés auto-portants en français.

Règles strictes :
- Chaque point est COMPRÉHENSIBLE SANS LES AUTRES (pas de "il", "cette plante", "ce bienfait" — répéter le nom)
- Un fait précis par point
- Court (≤ 20 mots), factuel, neutre
- Pas de promesses thérapeutiques, pas d'impératifs commerciaux`,
        schemaHint: `Retourne UNIQUEMENT un objet JSON : { "items": ["…", "…", "…"] }`,
      },
    },
    en: {
      v1: {
        version: 'v1',
        locale: 'en',
        role: 'geo-field',
        field: 'keyTakeaways',
        instruction: `Generate 3 to 5 self-contained key takeaways in English.

Strict rules:
- Each point must be UNDERSTANDABLE ON ITS OWN (no "it", "this plant", "this benefit" — repeat the name)
- One precise fact per point
- Short (≤ 20 words), factual, neutral
- No therapeutic promises, no commercial imperatives`,
        schemaHint: `Return ONLY a JSON object: { "items": ["…", "…", "…"] }`,
      },
    },
  },
  faq: {
    fr: {
      v1: {
        version: 'v1',
        locale: 'fr',
        role: 'geo-field',
        field: 'faq',
        instruction: `Génère 4 à 6 paires question/réponse en français, alignées avec les requêtes que poseraient de vrais utilisateurs à ChatGPT ou Google.

Règles strictes :
- Questions formulées comme un utilisateur (pas comme un SEO)
- Réponses concises (2 à 4 phrases), auto-portantes, factuelles
- Pas d'allégation thérapeutique non reconnue (EFSA/EMA)
- Varier les angles : utilisation, précautions, bienfaits, préparation, interactions`,
        schemaHint: `Retourne UNIQUEMENT un objet JSON : { "items": [{ "question": "…", "answer": "…" }] }`,
      },
    },
    en: {
      v1: {
        version: 'v1',
        locale: 'en',
        role: 'geo-field',
        field: 'faq',
        instruction: `Generate 4 to 6 question/answer pairs in English, aligned with the real queries users would ask ChatGPT or Google.

Strict rules:
- Questions phrased like a user (not like an SEO)
- Concise answers (2 to 4 sentences), self-contained, factual
- No unapproved therapeutic claim (EFSA/EMA)
- Vary the angles: usage, precautions, benefits, preparation, interactions`,
        schemaHint: `Return ONLY a JSON object: { "items": [{ "question": "…", "answer": "…" }] }`,
      },
    },
  },
}
