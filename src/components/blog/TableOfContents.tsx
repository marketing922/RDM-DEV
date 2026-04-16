'use client'

import { useMemo } from 'react'

type TableOfContentsProps = {
  content?: string
  locale: string
}

type TocItem = {
  id: string
  label: string
}

function extractHeadings(html: string): TocItem[] {
  const headings: TocItem[] = []
  // Match h2 tags and extract their id and text content
  const regex = /<h2[^>]*(?:id=["']([^"']*)["'])?[^>]*>(.*?)<\/h2>/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const id = match[1] || match[2].replace(/<[^>]*>/g, '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    const label = match[2].replace(/<[^>]*>/g, '').trim()
    if (label) {
      headings.push({ id, label })
    }
  }

  return headings
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const headings = useMemo(() => {
    if (!content) return []
    return extractHeadings(content)
  }, [content])

  if (headings.length === 0) {
    return (
      <nav>
        <ul className="space-y-2">
          <li>
            <span className="block text-sm text-[#712E2F]/40 py-1">
              Aucun sommaire disponible
            </span>
          </li>
        </ul>
      </nav>
    )
  }

  return (
    <nav>
      <ul className="space-y-1">
        {headings.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block text-sm text-[#712E2F]/60 hover:text-[#A2211E] transition-colors py-1.5 border-l-2 border-transparent hover:border-[#A2211E] pl-3 -ml-px"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
