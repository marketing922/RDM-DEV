import 'server-only'

/**
 * Builder pour produire un richText Lexical compatible Payload 3.x à partir
 * d'une structure simple `sections[]`. Couvre les besoins V1 de l'orchestrateur
 * de production de contenu blog (sections h2 + paragraphes).
 *
 * Le format produit suit le schéma Lexical attendu par Payload :
 * ```
 * {
 *   root: {
 *     type: 'root',
 *     format: '', indent: 0, version: 1,
 *     direction: 'ltr',
 *     children: [ ...nodes ]
 *   }
 * }
 * ```
 */

export type LexicalSection = {
  heading?: string
  paragraphs: string[]
  /** Optional media id to render as an upload node *between* heading and paragraphs. */
  imageId?: string | number | null
  /** Optional caption for the image (rendered as italic paragraph below). */
  imageCaption?: string
}

export type LexicalRichText = {
  root: {
    type: 'root'
    format: ''
    indent: 0
    version: 1
    direction: 'ltr' | null
    children: LexicalNode[]
  }
}

type LexicalTextNode = {
  type: 'text'
  text: string
  format: number
  detail: 0
  mode: 'normal'
  style: ''
  version: 1
}

type LexicalParagraphNode = {
  type: 'paragraph'
  format: ''
  indent: 0
  version: 1
  direction: 'ltr' | null
  textFormat: number
  textStyle: ''
  children: LexicalTextNode[]
}

type LexicalHeadingNode = {
  type: 'heading'
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  format: ''
  indent: 0
  version: 1
  direction: 'ltr' | null
  children: LexicalTextNode[]
}

type LexicalUploadNode = {
  type: 'upload'
  relationTo: 'media'
  value: string | number
  format: ''
  version: 3
  fields: null
}

type LexicalNode = LexicalParagraphNode | LexicalHeadingNode | LexicalUploadNode

function textNode(text: string): LexicalTextNode {
  return {
    type: 'text',
    text,
    format: 0,
    detail: 0,
    mode: 'normal',
    style: '',
    version: 1,
  }
}

function paragraphNode(text: string): LexicalParagraphNode {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    textFormat: 0,
    textStyle: '',
    children: [textNode(text)],
  }
}

function headingNode(
  text: string,
  tag: LexicalHeadingNode['tag'] = 'h2',
): LexicalHeadingNode {
  return {
    type: 'heading',
    tag,
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [textNode(text)],
  }
}

function uploadNode(id: string | number): LexicalUploadNode {
  return {
    type: 'upload',
    relationTo: 'media',
    value: id,
    format: '',
    version: 3,
    fields: null,
  }
}

function captionNode(text: string): LexicalParagraphNode {
  // Italic via Lexical text format bitmask (1 = bold, 2 = italic).
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    textFormat: 2,
    textStyle: '',
    children: [
      {
        type: 'text',
        text,
        format: 2,
        detail: 0,
        mode: 'normal',
        style: '',
        version: 1,
      },
    ],
  }
}

export function buildRichText(opts: {
  sections: LexicalSection[]
}): LexicalRichText {
  const children: LexicalNode[] = []
  for (const section of opts.sections) {
    if (section.heading && section.heading.trim()) {
      children.push(headingNode(section.heading.trim()))
    }
    if (section.imageId !== undefined && section.imageId !== null) {
      children.push(uploadNode(section.imageId))
      if (section.imageCaption && section.imageCaption.trim()) {
        children.push(captionNode(section.imageCaption.trim()))
      }
    }
    for (const para of section.paragraphs) {
      const trimmed = (para ?? '').trim()
      if (!trimmed) continue
      children.push(paragraphNode(trimmed))
    }
  }
  // Ensure at least one paragraph so Payload's Lexical editor doesn't reject
  // an empty root (rare in our pipelines but defensive).
  if (children.length === 0) {
    children.push(paragraphNode(''))
  }
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children,
    },
  }
}

/**
 * Extrait le texte plain d'un richText Lexical (utile pour modération /
 * comptage de temps de lecture). Concatène tous les `text` des nodes texte
 * descendants, séparés par des sauts de ligne aux frontières de blocs.
 */
export function lexicalToPlainText(rt: LexicalRichText | unknown): string {
  if (!rt || typeof rt !== 'object') return ''
  const root = (rt as LexicalRichText).root
  if (!root || !Array.isArray(root.children)) return ''
  const parts: string[] = []
  for (const child of root.children as Array<{
    type?: string
    children?: Array<{ type?: string; text?: string }>
  }>) {
    if (!child || !Array.isArray(child.children)) continue
    const buf: string[] = []
    for (const tn of child.children) {
      if (tn && tn.type === 'text' && typeof tn.text === 'string') {
        buf.push(tn.text)
      }
    }
    if (buf.length) parts.push(buf.join(''))
  }
  return parts.join('\n\n').trim()
}

/**
 * Estimation du temps de lecture (minutes, arrondi haut, min 1) à 200 mots/min.
 */
export function estimateReadingTimeMinutes(text: string): number {
  if (!text) return 1
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return 1
  return Math.max(1, Math.ceil(words / 200))
}
