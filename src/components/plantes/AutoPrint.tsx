'use client'

import { useEffect } from 'react'

const AutoPrint: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Slight delay so images can lay out before the print dialog snapshots the page.
    const t = window.setTimeout(() => {
      try {
        window.print()
      } catch {
        /* noop */
      }
    }, 350)
    return () => window.clearTimeout(t)
  }, [])
  return null
}

export default AutoPrint
