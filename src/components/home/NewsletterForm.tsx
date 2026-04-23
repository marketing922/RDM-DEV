'use client'
import React, { useState } from 'react'

type Props = {
  placeholder: string
  cta: string
  locale: string
}

export default function NewsletterForm({ placeholder, cta, locale }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'duplicate' | 'error' | 'disabled' | 'invalid'
  >('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'loading') return
    if (!email.trim()) {
      setStatus('invalid')
      setMessage('Entrez votre adresse email.')
      return
    }
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), locale }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.ok) {
        if (data.mode === 'already-subscribed') {
          setStatus('duplicate')
          setMessage('Vous êtes déjà inscrit(e). Merci !')
        } else if (data.mode === 'double-opt-in') {
          setStatus('success')
          setMessage('Vérifiez votre boîte mail pour confirmer votre inscription.')
        } else {
          setStatus('success')
          setMessage('Merci — inscription enregistrée.')
        }
        setEmail('')
        return
      }
      if (data?.error === 'invalid_email') {
        setStatus('invalid')
        setMessage('Adresse email invalide.')
        return
      }
      if (
        data?.error === 'brevo_not_configured' ||
        data?.error === 'provider_disabled'
      ) {
        setStatus('disabled')
        setMessage('Newsletter temporairement indisponible — revenez bientôt.')
        return
      }
      setStatus('error')
      setMessage('Une erreur est survenue. Merci de réessayer plus tard.')
    } catch {
      setStatus('error')
      setMessage('Erreur réseau. Merci de réessayer plus tard.')
    }
  }

  const isLocked = status === 'loading' || status === 'success' || status === 'duplicate'
  const showMessage = status !== 'idle' && status !== 'loading'
  const messageColor =
    status === 'success' || status === 'duplicate'
      ? 'text-rm-teal'
      : status === 'disabled'
        ? 'text-rm-inkSoft'
        : 'text-rm-burgundy'

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
        noValidate
      >
        <input
          suppressHydrationWarning
          type="email"
          required
          disabled={isLocked}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="flex-1 h-12 px-5 text-base font-serif text-rm-teal bg-rm-cream border border-rm-ruleStrong placeholder:text-rm-inkSoft/50 focus:outline-none focus:border-rm-burgundy transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <button
          suppressHydrationWarning
          type="submit"
          disabled={isLocked}
          className="h-12 px-8 bg-rm-burgundy hover:bg-rm-burgundy/90 text-white font-sans text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Envoi…' : cta}
        </button>
      </form>

      {showMessage && (
        <p
          role="status"
          aria-live="polite"
          className={`font-serif italic text-[14px] mt-4 ${messageColor}`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
