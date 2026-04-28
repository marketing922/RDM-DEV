'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Heart, Share2, Download, Check } from 'lucide-react'
import { ShareButtons } from './ShareButtons'

type Props = {
  locale: string
  slug: string
  title: string
}

const STORAGE_PREFIX = 'rdm_liked_blog:'

const BlogActions: React.FC<Props> = ({ locale, slug, title }) => {
  const [liked, setLiked] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const key = `${STORAGE_PREFIX}${locale}:${slug}`
      const raw = localStorage.getItem(key)
      setLiked(raw === '1')
    } catch {
      /* localStorage unavailable */
    }
  }, [locale, slug])

  const toggleLike = useCallback(() => {
    setLiked((prev) => {
      const next = !prev
      try {
        const key = `${STORAGE_PREFIX}${locale}:${slug}`
        if (next) localStorage.setItem(key, '1')
        else localStorage.removeItem(key)
      } catch {
        /* ignore */
      }
      return next
    })
  }, [locale, slug])

  const onPrint = useCallback(() => {
    if (typeof window === 'undefined') return
    const printUrl = `/${locale}/blog/${slug}/print`
    window.open(printUrl, '_blank', 'noopener,noreferrer')
  }, [locale, slug])

  return (
    <div className="flex flex-wrap items-center gap-2 font-sans text-[11px]">
      <button
        type="button"
        suppressHydrationWarning
        aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        aria-pressed={liked}
        onClick={toggleLike}
        className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1.5 transition-colors ${
          mounted && liked
            ? 'bg-rm-burgundy text-white border-rm-burgundy'
            : 'border-rm-rule text-rm-burgundy hover:bg-rm-creamSoft'
        }`}
      >
        <Heart
          size={13}
          className={mounted && liked ? 'fill-current' : ''}
          aria-hidden
        />
        <span className="hidden sm:inline">
          {mounted && liked ? 'Aimé' : 'J’aime'}
        </span>
      </button>

      <span className="inline-flex items-center gap-1.5 text-rm-inkSoft/70 ml-1">
        <Share2 size={13} aria-hidden />
        Partager
      </span>
      <ShareButtons title={title} locale={locale} slug={slug} />

      <button
        type="button"
        onClick={onPrint}
        aria-label="Télécharger en PDF"
        className="inline-flex items-center gap-1.5 border border-rm-rule rounded-full px-3 py-1.5 text-rm-teal hover:bg-rm-creamSoft transition-colors"
      >
        <Download size={13} aria-hidden />
        <span className="hidden sm:inline">PDF</span>
      </button>
    </div>
  )
}

export default BlogActions
export { Check }
