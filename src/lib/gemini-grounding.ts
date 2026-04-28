import 'server-only'

/**
 * Wrapper Gemini avec Google Search grounding.
 * Utilise gemini-2.5-flash (le grounding nécessite la version full, pas flash-lite).
 *
 * Renvoie le texte généré + la liste des citations extraites de
 * `groundingMetadata.groundingChunks`.
 *
 * Si le grounding échoue (modèle/SDK incompatible), fallback sans tools
 * (signalé dans `warnings` côté caller).
 */

export type GroundingCitation = {
  title: string
  uri: string
}

export type GroundedSearchResult = {
  text: string
  citations: GroundingCitation[]
  promptTokens?: number
  completionTokens?: number
  model: 'gemini-2.5-flash'
  /** True si le grounding a réussi, false si fallback sans tools. */
  grounded: boolean
}

export async function groundedSearch(opts: {
  query: string
  instruction?: string
  maxOutputTokens?: number
}): Promise<GroundedSearchResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = await import(
    '@google/generative-ai'
  )
  const client = new GoogleGenerativeAI(apiKey)

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ]

  const systemInstruction =
    opts.instruction ??
    "Tu es un assistant de recherche factuelle pour un site de phytothérapie. " +
      'Ne formule jamais d’allégations santé. Utilise uniquement des sources fiables. ' +
      'Réponds en français, en restant concis et neutre.'

  const generationConfig = {
    temperature: 0.3,
    maxOutputTokens: Math.min(Math.max(opts.maxOutputTokens ?? 1200, 256), 4096),
  }

  const prompt = opts.query

  // Try grounded call first.
  try {
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction,
      safetySettings,
      generationConfig,
      // The SDK accepts `tools: [{ googleSearch: {} }]` — typed loosely so
      // older SDK shapes don't break the build.
      tools: [{ googleSearch: {} } as unknown as object] as any,
    } as any)

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const usage = result.response.usageMetadata
    const candidate = result.response.candidates?.[0]
    const groundingMeta = (candidate as any)?.groundingMetadata as
      | {
          groundingChunks?: Array<{
            web?: { uri?: string; title?: string }
          }>
        }
      | undefined

    const citations: GroundingCitation[] = []
    const seen = new Set<string>()
    for (const chunk of groundingMeta?.groundingChunks ?? []) {
      const uri = chunk?.web?.uri
      const title = chunk?.web?.title ?? uri ?? ''
      if (!uri || seen.has(uri)) continue
      seen.add(uri)
      citations.push({ title, uri })
    }

    return {
      text,
      citations,
      promptTokens: usage?.promptTokenCount,
      completionTokens: usage?.candidatesTokenCount,
      model: 'gemini-2.5-flash',
      grounded: true,
    }
  } catch (groundingErr) {
    console.warn(
      '[gemini-grounding] grounded call failed, fallback to plain generate',
      String(groundingErr),
    )
    // Fallback without tools.
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction,
      safetySettings,
      generationConfig,
    })
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const usage = result.response.usageMetadata
    return {
      text,
      citations: [],
      promptTokens: usage?.promptTokenCount,
      completionTokens: usage?.candidatesTokenCount,
      model: 'gemini-2.5-flash',
      grounded: false,
    }
  }
}
