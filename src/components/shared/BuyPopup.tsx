'use client'

import { useEffect, useRef } from 'react'

type BuyPopupProps = {
  open: boolean
  onClose: () => void
  productName: string
  amazonUrl?: string
  temuUrl?: string
}

const FALLBACK_AMAZON = 'https://www.amazon.fr/stores/page/calebasse'
const FALLBACK_TEMU = 'https://www.temu.com/search.html?search_key=remedes+mamie'

export function BuyPopup({ open, onClose, productName, amazonUrl, temuUrl }: BuyPopupProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const amazon = amazonUrl?.trim() || FALLBACK_AMAZON
  const temu = temuUrl?.trim() || FALLBACK_TEMU

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="buy-popup-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <button
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-[#712E2F] hover:bg-[#FEF9E9] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="flex items-start gap-3">
          <span className="text-3xl shrink-0" aria-hidden="true">&#128717;</span>
          <h2 id="buy-popup-title" className="text-xl font-bold text-[#A2211E] leading-tight">
            Notre boutique en ligne est en d&eacute;veloppement
          </h2>
        </div>

        <p className="mt-4 text-sm text-[#712E2F]">
          En attendant, retrouvez <span className="font-medium">{productName}</span> sur&nbsp;:
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <a
            href={amazon}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#DCD8C7] px-4 text-sm font-semibold text-[#712E2F] hover:bg-[#c9c5b2] transition-colors"
          >
            Amazon
          </a>
          <a
            href={temu}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#D0802C] px-4 text-sm font-semibold text-[#FEF9E9] hover:bg-[#b86f24] transition-colors"
          >
            Temu
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-[#712E2F]/70">
          Merci de votre compr&eacute;hension <span aria-hidden="true">&#129505;</span>
        </p>
      </div>
    </div>
  )
}
