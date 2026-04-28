// Vision (alt-text) prompt builder. The prompt is parameterised by an optional
// `hint`, so we expose a builder rather than a static string.
//
// Each version exposes a `build(hint?: string): string` returning the full
// prompt text.

import type { Locale } from './system-instructions'

export type VisionPromptEntry = {
  version: string
  locale: Locale
  role: 'vision-alt-text'
  build: (hint?: string) => string
}

export const VISION_PROMPTS: Record<
  Locale,
  Record<string, VisionPromptEntry>
> = {
  fr: {
    v1: {
      version: 'v1',
      locale: 'fr',
      role: 'vision-alt-text',
      build: (hint?: string) => {
        const trimmed = hint?.trim()
        const hintLine = trimmed ? ` Indice contextuel : ${trimmed}.` : ''
        return [
          "Décris cette image en une phrase précise et factuelle de 12 à 25 mots en français,",
          "adaptée comme attribut `alt` d'une image sur un site de phytothérapie.",
          "N'invente rien, décris uniquement ce qui est visible. Évite les mots promotionnels.",
          "Si c'est une plante, nomme-la précisément si identifiable." + hintLine,
          'Et propose une légende courte de 5 à 10 mots à usage éditorial.',
          'Retourne strictement un objet JSON de la forme { "alt": "...", "caption": "..." } et rien d\'autre.',
        ].join(' ')
      },
    },
  },
  en: {
    v1: {
      version: 'v1',
      locale: 'en',
      role: 'vision-alt-text',
      build: (hint?: string) => {
        const trimmed = hint?.trim()
        const hintLine = trimmed ? ` Contextual hint: ${trimmed}.` : ''
        return [
          'Describe this image in a single precise, factual sentence of 12 to 25 words in English,',
          'suitable as an `alt` attribute for an image on a phytotherapy website.',
          'Invent nothing, describe only what is visible. Avoid promotional wording.',
          'If it is a plant, name it precisely if identifiable.' + hintLine,
          'Also propose a short caption of 5 to 10 words for editorial use.',
          'Return strictly a JSON object with shape { "alt": "...", "caption": "..." } and nothing else.',
        ].join(' ')
      },
    },
  },
}
