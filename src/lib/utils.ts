import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, locale = 'fr-FR', currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trimEnd() + '...'
}

export function calculateReadingTime(text: string, wordsPerMinute = 200): number {
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

/** Extract plain text from a Payload Lexical richText field (or return string as-is) */
export function richTextToPlain(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'root' in value) {
    const extractText = (node: any): string => {
      if (node.text) return node.text
      if (node.children) return node.children.map(extractText).join(' ')
      return ''
    }
    return extractText((value as any).root).trim()
  }
  return String(value)
}
