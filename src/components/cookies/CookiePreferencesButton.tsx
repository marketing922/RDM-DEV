'use client'

/**
 * Footer link that re-opens the cookie preferences modal.
 * Relies on the global API mounted by `<CookieBanner />` (`window.rdmConsent.open`).
 *
 * Falls back to a deep-link to /politique-cookies if the banner has not yet
 * mounted (e.g. JS just loaded), since that page also documents how to manage
 * preferences.
 */

import { useCallback } from 'react'

type Props = {
  locale: string
  label: string
  className?: string
}

export function CookiePreferencesButton({ locale, label, className }: Props) {
  const onClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const api = typeof window !== 'undefined' ? window.rdmConsent : undefined
      if (api && typeof api.open === 'function') {
        e.preventDefault()
        api.open()
      } else {
        // Banner not mounted yet — let the browser fall through to the policy page.
        if (typeof window !== 'undefined') {
          window.location.href = `/${locale}/politique-cookies`
        }
      }
    },
    [locale],
  )

  return (
    <button
      type="button"
      onClick={onClick}
      className={className ?? 'hover:text-white transition-colors'}
    >
      {label}
    </button>
  )
}

export default CookiePreferencesButton
