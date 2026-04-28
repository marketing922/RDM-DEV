'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  type Consent,
  type ConsentCategories,
  type ConsentCategory,
  clearConsent,
  hasConsent as hasConsentLib,
  readConsent,
  writeConsent,
} from '@/lib/cookie-consent'

/**
 * Client hook to read and update the cookie consent state.
 *
 * Subscribes to `rdm:consent-change` window events (dispatched by
 * writeConsent / clearConsent) so any component using the hook re-renders
 * whenever the user updates their preferences anywhere on the page.
 */
export function useConsent(): {
  consent: Consent | null
  hasConsent: (cat: ConsentCategory) => boolean
  decide: (cats: Partial<ConsentCategories>) => void
  reset: () => void
} {
  const [consent, setConsent] = useState<Consent | null>(null)

  useEffect(() => {
    setConsent(readConsent())

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<Consent | null>).detail
      setConsent(detail ?? readConsent())
    }
    window.addEventListener('rdm:consent-change', onChange as EventListener)
    return () => window.removeEventListener('rdm:consent-change', onChange as EventListener)
  }, [])

  const decide = useCallback((cats: Partial<ConsentCategories>) => {
    const updated = writeConsent(cats)
    setConsent(updated)
  }, [])

  const reset = useCallback(() => {
    clearConsent()
    setConsent(null)
  }, [])

  const has = useCallback(
    (cat: ConsentCategory) => {
      if (cat === 'essential') return true
      if (!consent) return hasConsentLib(cat)
      return Boolean(consent.categories[cat])
    },
    [consent],
  )

  return { consent, hasConsent: has, decide, reset }
}
