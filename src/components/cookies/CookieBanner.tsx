'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  type ConsentCategories,
  type ConsentCategory,
  CONSENT_VERSION,
  DEFAULT_CONSENT_CATEGORIES,
  clearConsent,
  hasConsent as hasConsentLib,
  readConsent,
  writeConsent,
} from '@/lib/cookie-consent'

type Locale = 'fr' | 'en'

type Copy = {
  bannerTitle: string
  bannerBody: string
  rejectAll: string
  customize: string
  acceptAll: string
  policyLink: string
  modalTitle: string
  modalIntro: string
  saveChoices: string
  closeAria: string
  categories: Record<
    ConsentCategory,
    { title: string; description: string; required?: string }
  >
}

const COPY: Record<Locale, Copy> = {
  fr: {
    bannerTitle: 'Vos preferences cookies',
    bannerBody:
      'Nous utilisons des cookies pour assurer le fonctionnement du site, mesurer l\'audience et personnaliser nos communications. Vous pouvez accepter, refuser ou personnaliser vos choix a tout moment.',
    rejectAll: 'Tout refuser',
    customize: 'Personnaliser',
    acceptAll: 'Tout accepter',
    policyLink: 'Politique de cookies',
    modalTitle: 'Personnaliser mes preferences',
    modalIntro:
      'Choisissez les categories de cookies que vous souhaitez activer. Les cookies essentiels sont indispensables et toujours actifs.',
    saveChoices: 'Enregistrer mes choix',
    closeAria: 'Fermer',
    categories: {
      essential: {
        title: 'Essentiels',
        description:
          'Indispensables au fonctionnement du site (panier, securite, preferences de langue, consentement).',
        required: 'Toujours actif',
      },
      analytics: {
        title: 'Analytique',
        description:
          'Aide a comprendre comment notre site est utilise pour l\'ameliorer (Plausible Analytics, sans vente de donnees ni partage tiers).',
      },
      marketing: {
        title: 'Marketing',
        description:
          'Permet de personnaliser nos communications (newsletter Brevo, promotions ciblees). Aucun retargeting publicitaire externe.',
      },
    },
  },
  en: {
    bannerTitle: 'Your cookie preferences',
    bannerBody:
      'We use cookies to keep the site running, measure audience and personalise our communications. You can accept, refuse or customise your choices at any time.',
    rejectAll: 'Reject all',
    customize: 'Customise',
    acceptAll: 'Accept all',
    policyLink: 'Cookie policy',
    modalTitle: 'Customise my preferences',
    modalIntro:
      'Choose which cookie categories you want to enable. Essential cookies are always on as they are required for the site to work.',
    saveChoices: 'Save my choices',
    closeAria: 'Close',
    categories: {
      essential: {
        title: 'Essential',
        description:
          'Required for the site to work (cart, security, language preference, consent storage).',
        required: 'Always on',
      },
      analytics: {
        title: 'Analytics',
        description:
          'Helps us understand how the site is used so we can improve it (Plausible Analytics, no data sale or third-party sharing).',
      },
      marketing: {
        title: 'Marketing',
        description:
          'Lets us tailor our communications (Brevo newsletter, targeted promotions). No external ad retargeting.',
      },
    },
  },
}

function detectLocaleFromPath(pathname: string | null): Locale {
  if (!pathname) return 'fr'
  if (pathname.startsWith('/en')) return 'en'
  return 'fr'
}

export function CookieBanner() {
  const pathname = usePathname()
  const locale = detectLocaleFromPath(pathname)
  const t = COPY[locale]

  const [mounted, setMounted] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState<ConsentCategories>(DEFAULT_CONSENT_CATEGORIES)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  // Mount + initial consent read.
  useEffect(() => {
    setMounted(true)
    const stored = readConsent()
    if (stored) {
      setDraft(stored.categories)
    } else {
      setBannerVisible(true)
    }
  }, [])

  // Expose the global API on window so 3rd-party scripts and footer link can use it.
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.rdmConsent = {
      has: (cat: ConsentCategory) => hasConsentLib(cat),
      open: () => {
        const stored = readConsent()
        setDraft(stored ? stored.categories : DEFAULT_CONSENT_CATEGORIES)
        setBannerVisible(false)
        setModalOpen(true)
      },
      reset: () => {
        clearConsent()
        setDraft(DEFAULT_CONSENT_CATEGORIES)
        setModalOpen(true)
        setBannerVisible(false)
      },
    }
    return () => {
      if (window.rdmConsent) {
        delete window.rdmConsent
      }
    }
  }, [])

  // Esc key support on the modal (still requires explicit save/refuse to dismiss the banner;
  // pressing Esc just collapses the modal back to the compact banner without recording a choice).
  useEffect(() => {
    if (!modalOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalOpen(false)
        if (!readConsent()) setBannerVisible(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  const policyHref = useMemo(() => `/${locale}/politique-cookies`, [locale])

  const acceptAll = useCallback(() => {
    writeConsent({ analytics: true, marketing: true })
    setBannerVisible(false)
    setModalOpen(false)
  }, [])

  const rejectAll = useCallback(() => {
    writeConsent({ analytics: false, marketing: false })
    setBannerVisible(false)
    setModalOpen(false)
  }, [])

  const saveChoices = useCallback(() => {
    writeConsent({ analytics: draft.analytics, marketing: draft.marketing })
    setBannerVisible(false)
    setModalOpen(false)
  }, [draft])

  const openCustomize = useCallback(() => {
    setModalOpen(true)
  }, [])

  if (!mounted) return null
  if (!bannerVisible && !modalOpen) return null

  return (
    <>
      {bannerVisible && !modalOpen && (
        <div
          role="region"
          aria-label={t.bannerTitle}
          className="fixed inset-x-0 bottom-0 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="bg-rm-paper border-t border-rm-rule shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-base sm:text-lg text-rm-ink mb-1">
                  {t.bannerTitle}
                </h2>
                <p className="font-sans text-sm text-rm-inkSoft leading-relaxed">
                  {t.bannerBody}{' '}
                  <a
                    href={policyHref}
                    className="underline decoration-rm-rule underline-offset-2 hover:text-rm-burgundy hover:decoration-rm-burgundy transition-colors"
                  >
                    {t.policyLink}
                  </a>
                  .
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:flex-shrink-0">
                <button
                  type="button"
                  onClick={rejectAll}
                  className="font-sans font-medium text-sm h-10 px-4 rounded-lg text-rm-inkSoft hover:bg-rm-rule/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rm-burgundy/40"
                >
                  {t.rejectAll}
                </button>
                <button
                  type="button"
                  onClick={openCustomize}
                  className="font-sans font-medium text-sm h-10 px-4 rounded-lg border border-rm-rule text-rm-ink hover:border-rm-ruleStrong hover:bg-rm-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rm-burgundy/40"
                >
                  {t.customize}
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="font-sans font-medium text-sm h-10 px-5 rounded-lg bg-rm-burgundy text-white hover:bg-[#712E2F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rm-burgundy/50 focus-visible:ring-offset-2 shadow-sm"
                >
                  {t.acceptAll}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rdm-cookie-modal-title"
        >
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          <div
            ref={dialogRef}
            className="relative w-full max-w-[560px] bg-rm-paper rounded-xl shadow-xl max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6 sm:p-8">
              <h2
                id="rdm-cookie-modal-title"
                className="font-serif text-xl sm:text-2xl text-rm-ink mb-2"
              >
                {t.modalTitle}
              </h2>
              <p className="font-sans text-sm text-rm-inkSoft leading-relaxed mb-6">
                {t.modalIntro}{' '}
                <a
                  href={policyHref}
                  className="underline decoration-rm-rule underline-offset-2 hover:text-rm-burgundy hover:decoration-rm-burgundy transition-colors"
                >
                  {t.policyLink}
                </a>
                .
              </p>

              <ul className="space-y-4 mb-6">
                {(['essential', 'analytics', 'marketing'] as ConsentCategory[]).map((cat) => {
                  const meta = t.categories[cat]
                  const isEssential = cat === 'essential'
                  const checked = isEssential ? true : draft[cat]
                  return (
                    <li
                      key={cat}
                      className="border border-rm-rule rounded-lg p-4 bg-rm-cream/40"
                    >
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isEssential}
                          onChange={(e) => {
                            if (isEssential) return
                            setDraft((prev) => ({ ...prev, [cat]: e.target.checked }))
                          }}
                          className="mt-1 h-4 w-4 rounded border-rm-ruleStrong text-rm-burgundy focus:ring-rm-burgundy/40 disabled:opacity-60 disabled:cursor-not-allowed"
                          aria-describedby={`rdm-cookie-${cat}-desc`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-serif text-base text-rm-ink">
                              {meta.title}
                            </span>
                            {isEssential && meta.required && (
                              <span className="font-sans text-[11px] uppercase tracking-wider text-rm-ochre bg-rm-ochre/10 px-2 py-0.5 rounded-full">
                                {meta.required}
                              </span>
                            )}
                          </div>
                          <p
                            id={`rdm-cookie-${cat}-desc`}
                            className="font-sans text-sm text-rm-inkSoft leading-relaxed"
                          >
                            {meta.description}
                          </p>
                        </div>
                      </label>
                    </li>
                  )
                })}
              </ul>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-rm-rule">
                <button
                  type="button"
                  onClick={rejectAll}
                  className="font-sans font-medium text-sm h-11 px-5 rounded-lg text-rm-inkSoft hover:bg-rm-rule/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rm-burgundy/40"
                >
                  {t.rejectAll}
                </button>
                <button
                  type="button"
                  onClick={saveChoices}
                  className="font-sans font-medium text-sm h-11 px-6 rounded-lg bg-rm-burgundy text-white hover:bg-[#712E2F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rm-burgundy/50 focus-visible:ring-offset-2 shadow-sm"
                >
                  {t.saveChoices}
                </button>
              </div>
              <p className="mt-4 text-[11px] font-mono text-rm-inkSoft/70 text-right">
                v{CONSENT_VERSION}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CookieBanner
