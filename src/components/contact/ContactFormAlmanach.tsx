'use client'
import React, { useState } from 'react'

type Props = { locale: string }

type Status = 'idle' | 'loading' | 'success' | 'error' | 'invalid' | 'disabled'

const SUBJECTS = [
  'Question botanique',
  'Suggestion',
  'Presse',
  'Partenariat',
  'Autre',
] as const

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] tracking-[0.12em] text-rm-inkSoft uppercase font-semibold mb-2">
      {children}
    </div>
  )
}

export default function ContactFormAlmanach({ locale }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: SUBJECTS[0] as string,
    message: '',
    consent: false,
    honeypot: '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [feedback, setFeedback] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<any>) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'loading') return

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('invalid')
      setFeedback('Merci de remplir tous les champs.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setStatus('invalid')
      setFeedback('Adresse email invalide.')
      return
    }
    if (!form.consent) {
      setStatus('invalid')
      setFeedback('Merci d\'accepter le traitement de votre demande.')
      return
    }

    setStatus('loading')
    setFeedback('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          honeypot: form.honeypot,
          locale,
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok && data?.ok) {
        setStatus('success')
        setFeedback(
          'Merci — votre message a bien été envoyé. Nous revenons vers vous sous 48 h.',
        )
        setForm({
          name: '',
          email: '',
          subject: SUBJECTS[0],
          message: '',
          consent: false,
          honeypot: '',
        })
        return
      }
      if (data?.error === 'brevo_not_configured') {
        setStatus('disabled')
        setFeedback(
          'Formulaire temporairement indisponible — écrivez-nous à bonjour@remedes-de-mamie.fr.',
        )
        return
      }
      if (data?.error === 'invalid_email') {
        setStatus('invalid')
        setFeedback('Adresse email invalide.')
        return
      }
      setStatus('error')
      setFeedback('Une erreur est survenue. Merci de réessayer plus tard.')
    } catch {
      setStatus('error')
      setFeedback('Erreur réseau. Merci de réessayer plus tard.')
    }
  }

  const isLocked = status === 'loading' || status === 'success'
  const feedbackColor =
    status === 'success'
      ? 'text-rm-teal'
      : status === 'disabled'
        ? 'text-rm-inkSoft'
        : 'text-rm-burgundy'

  return (
    <form onSubmit={onSubmit} noValidate>
      {/* honeypot */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-[-9999px] opacity-0 pointer-events-none"
      >
        <label>
          Ne pas remplir
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.honeypot}
            onChange={set('honeypot')}
          />
        </label>
      </div>

      {/* Nom + email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <Label>Nom</Label>
          <input
            suppressHydrationWarning
            type="text"
            required
            disabled={isLocked}
            placeholder="Louise Moreau"
            value={form.name}
            onChange={set('name')}
            autoComplete="name"
            className="w-full bg-rm-paper border border-rm-ruleStrong px-3.5 py-3 text-[15px] font-serif text-rm-ink placeholder:text-rm-inkSoft placeholder:italic focus:outline-none focus:border-rm-burgundy transition-colors disabled:opacity-60"
          />
        </div>
        <div>
          <Label>Courriel</Label>
          <input
            suppressHydrationWarning
            type="email"
            required
            disabled={isLocked}
            placeholder="louise@exemple.fr"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            className="w-full bg-rm-paper border border-rm-ruleStrong px-3.5 py-3 text-[15px] font-serif text-rm-ink placeholder:text-rm-inkSoft placeholder:italic focus:outline-none focus:border-rm-burgundy transition-colors disabled:opacity-60"
          />
        </div>
      </div>

      {/* Sujet chips */}
      <div className="mb-4">
        <Label>Sujet</Label>
        <div className="flex gap-2 flex-wrap">
          {SUBJECTS.map((s) => {
            const isActive = form.subject === s
            return (
              <button
                suppressHydrationWarning
                key={s}
                type="button"
                disabled={isLocked}
                onClick={() => setForm((f) => ({ ...f, subject: s }))}
                className={`px-3.5 py-2 rounded-full text-[12px] font-medium font-sans transition-colors border disabled:opacity-60 ${
                  isActive
                    ? 'bg-rm-burgundy text-white border-rm-burgundy'
                    : 'bg-transparent text-rm-teal border-rm-ruleStrong hover:border-rm-burgundy hover:text-rm-burgundy'
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Message */}
      <div className="mb-6">
        <Label>Votre message</Label>
        <textarea
          suppressHydrationWarning
          required
          disabled={isLocked}
          rows={6}
          maxLength={5000}
          value={form.message}
          onChange={set('message')}
          placeholder="Bonjour, je me demandais si la camomille romaine pouvait se substituer à la matricaire pour les digestions difficiles…"
          className="w-full bg-rm-paper border border-rm-ruleStrong px-3.5 sm:px-[18px] py-3 sm:py-4 text-[15px] sm:text-[16px] font-serif leading-[1.55] sm:leading-[1.6] text-rm-ink placeholder:text-rm-inkSoft placeholder:italic focus:outline-none focus:border-rm-burgundy transition-colors resize-vertical disabled:opacity-60"
        />
      </div>

      {/* Consent */}
      <label className="flex items-start gap-3 mb-7 cursor-pointer">
        <input
          suppressHydrationWarning
          type="checkbox"
          disabled={isLocked}
          checked={form.consent}
          onChange={set('consent')}
          className="mt-0.5 w-[18px] h-[18px] accent-rm-burgundy cursor-pointer"
        />
        <span className="text-[13px] text-rm-inkSoft font-serif leading-[1.55]">
          J'accepte que mon message soit conservé pour le traitement de ma
          demande.{' '}
          <a
            href={`/${locale}/politique-confidentialite`}
            className="text-rm-burgundy underline underline-offset-2 decoration-rm-burgundy/40 hover:decoration-rm-burgundy"
          >
            Voir notre politique
          </a>
          .
        </span>
      </label>

      {/* Submit + feedback */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
        <button
          suppressHydrationWarning
          type="submit"
          disabled={isLocked}
          className="inline-flex items-center justify-center gap-2 bg-rm-burgundy text-white font-sans text-[14px] font-semibold px-6 sm:px-[26px] py-3.5 hover:bg-rm-burgundy/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {status === 'loading' ? 'Envoi…' : 'Envoyer le message'}
          <span aria-hidden="true">→</span>
        </button>

        {feedback && (
          <p
            role="status"
            aria-live="polite"
            className={`text-[13px] sm:text-[14px] font-serif italic ${feedbackColor}`}
          >
            {feedback}
          </p>
        )}
      </div>
    </form>
  )
}
