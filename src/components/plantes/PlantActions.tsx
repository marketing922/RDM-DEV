'use client'

import React, { useCallback, useState } from 'react'
import { Download, Share2, Check } from 'lucide-react'

type Props = {
  title: string
  description?: string
  printUrl?: string
}

const baseBtn =
  'w-full font-sans text-[12px] text-rm-ink border border-rm-rule rounded-full px-4 py-2 hover:border-rm-burgundy hover:text-rm-burgundy transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed'

const PlantActions: React.FC<Props> = ({ title, description, printUrl }) => {
  const [shared, setShared] = useState<'idle' | 'copied' | 'error'>('idle')

  const onPrint = useCallback(() => {
    if (typeof window === 'undefined') return
    if (printUrl) {
      window.open(printUrl, '_blank', 'noopener,noreferrer')
      return
    }
    window.print()
  }, [printUrl])

  const onShare = useCallback(async () => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    const text = description || `Fiche : ${title}`
    try {
      const nav: any = navigator
      if (typeof nav.share === 'function') {
        await nav.share({ title, text, url })
        return
      }
    } catch {
      /* user cancelled or share failed — fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(url)
      setShared('copied')
      setTimeout(() => setShared('idle'), 2200)
    } catch {
      setShared('error')
      setTimeout(() => setShared('idle'), 2500)
    }
  }, [title, description])

  return (
    <div className="mt-5 flex flex-col gap-2 print:hidden">
      <button type="button" onClick={onPrint} className={baseBtn}>
        <Download size={14} aria-hidden />
        Télécharger le PDF
      </button>
      <button type="button" onClick={onShare} className={baseBtn}>
        {shared === 'copied' ? (
          <>
            <Check size={14} aria-hidden />
            Lien copié
          </>
        ) : shared === 'error' ? (
          <>
            <Share2 size={14} aria-hidden />
            Copie impossible
          </>
        ) : (
          <>
            <Share2 size={14} aria-hidden />
            Partager la fiche
          </>
        )}
      </button>
    </div>
  )
}

export default PlantActions
