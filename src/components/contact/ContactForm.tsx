'use client'
import React, { useState } from 'react'

type Labels = {
  name: string
  email: string
  subject: string
  message: string
  send: string
}

type Props = {
  labels: Labels
  locale: string
  successMessage?: string
  errorMessage?: string
  unavailableMessage?: string
}

type Status = 'idle' | 'loading' | 'success' | 'error' | 'invalid' | 'disabled'

export default function ContactForm({
  labels,
  locale,
  successMessage = 'Merci — votre message a bien été envoyé. Nous revenons vers vous sous 48 h.',
  errorMessage = 'Une erreur est survenue. Merci de réessayer plus tard.',
  unavailableMessage = 'Formulaire temporairement indisponible — écrivez-nous directement à contact@remedes-mamie.com.',
}: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '', // bots fill this, real users don't (hidden)
  })
  const [status, setStatus] = useState<Status>('idle')
  const [feedback, setFeedback] = useState('')

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<any>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'loading') return

    // Client-side pre-validation
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setStatus('invalid')
      setFeedback('Merci de remplir tous les champs.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setStatus('invalid')
      setFeedback('Adresse email invalide.')
      return
    }

    setStatus('loading')
    setFeedback('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok && data?.ok) {
        setStatus('success')
        setFeedback(successMessage)
        setForm({ name: '', email: '', subject: '', message: '', honeypot: '' })
        return
      }

      if (data?.error === 'brevo_not_configured') {
        setStatus('disabled')
        setFeedback(unavailableMessage)
        return
      }
      if (data?.error === 'invalid_email') {
        setStatus('invalid')
        setFeedback('Adresse email invalide.')
        return
      }
      if (data?.error === 'missing_fields') {
        setStatus('invalid')
        setFeedback('Merci de remplir tous les champs.')
        return
      }
      setStatus('error')
      setFeedback(errorMessage)
    } catch {
      setStatus('error')
      setFeedback(errorMessage)
    }
  }

  const isLocked = status === 'loading' || status === 'success'
  const feedbackColor =
    status === 'success'
      ? 'text-[#054A57]'
      : status === 'disabled'
        ? 'text-[#712E2F]/80'
        : 'text-[#A2211E]'

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      {/* Honeypot (hidden from real users, bots will fill it) */}
      <div className="absolute left-[-9999px] top-[-9999px] opacity-0 pointer-events-none" aria-hidden="true">
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

      {/* Name */}
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-[#712E2F] mb-1.5"
        >
          {labels.name}
        </label>
        <input
          suppressHydrationWarning
          id="contact-name"
          type="text"
          required
          disabled={isLocked}
          value={form.name}
          onChange={set('name')}
          autoComplete="name"
          className="w-full h-11 px-3.5 bg-white border border-[#DCD8C7] rounded-lg text-[#054A57] placeholder:text-[#DCD8C7] focus:outline-none focus:ring-2 focus:ring-[#A2211E]/20 focus:border-[#A2211E] transition-all duration-200 disabled:opacity-60"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-medium text-[#712E2F] mb-1.5"
        >
          {labels.email}
        </label>
        <input
          suppressHydrationWarning
          id="contact-email"
          type="email"
          required
          disabled={isLocked}
          value={form.email}
          onChange={set('email')}
          autoComplete="email"
          className="w-full h-11 px-3.5 bg-white border border-[#DCD8C7] rounded-lg text-[#054A57] placeholder:text-[#DCD8C7] focus:outline-none focus:ring-2 focus:ring-[#A2211E]/20 focus:border-[#A2211E] transition-all duration-200 disabled:opacity-60"
        />
      </div>

      {/* Subject */}
      <div>
        <label
          htmlFor="contact-subject"
          className="block text-sm font-medium text-[#712E2F] mb-1.5"
        >
          {labels.subject}
        </label>
        <input
          suppressHydrationWarning
          id="contact-subject"
          type="text"
          required
          disabled={isLocked}
          value={form.subject}
          onChange={set('subject')}
          className="w-full h-11 px-3.5 bg-white border border-[#DCD8C7] rounded-lg text-[#054A57] placeholder:text-[#DCD8C7] focus:outline-none focus:ring-2 focus:ring-[#A2211E]/20 focus:border-[#A2211E] transition-all duration-200 disabled:opacity-60"
        />
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-[#712E2F] mb-1.5"
        >
          {labels.message}
        </label>
        <textarea
          suppressHydrationWarning
          id="contact-message"
          rows={6}
          required
          disabled={isLocked}
          value={form.message}
          onChange={set('message')}
          maxLength={5000}
          className="w-full px-3.5 py-3 bg-white border border-[#DCD8C7] rounded-lg text-[#054A57] placeholder:text-[#DCD8C7] focus:outline-none focus:ring-2 focus:ring-[#A2211E]/20 focus:border-[#A2211E] transition-all duration-200 resize-vertical disabled:opacity-60"
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <button
          suppressHydrationWarning
          type="submit"
          disabled={isLocked}
          className="px-8 py-3 bg-[#A2211E] text-white font-medium rounded-lg hover:bg-[#712E2F] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Envoi…' : labels.send}
        </button>

        {feedback && (
          <p
            role="status"
            aria-live="polite"
            className={`text-sm font-serif italic ${feedbackColor}`}
          >
            {feedback}
          </p>
        )}
      </div>
    </form>
  )
}
