'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { RM, cmsBtn, cmsInput } from '@/components/admin/primitives'

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: RM.fSans,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 1.4,
  textTransform: 'uppercase',
  color: RM.inkSoft,
  marginBottom: 8,
}

const inputBase: React.CSSProperties = {
  ...cmsInput.base,
  background: '#fff',
  border: `1px solid ${RM.rule}`,
  padding: '11px 14px',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 120ms ease, box-shadow 120ms ease',
}

const LoginClient: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const redirectTarget = useMemo(() => {
    if (typeof window === 'undefined') return '/admin'
    try {
      const params = new URLSearchParams(window.location.search)
      const r = params.get('redirect')
      // Only allow same-origin redirects to avoid open-redirect.
      if (r && r.startsWith('/')) return r
    } catch {
      // ignore
    }
    return '/admin'
  }, [])

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (loading) return
      setError(null)
      setLoading(true)
      try {
        const res = await fetch('/api/auth/login-with-remember', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, rememberMe }),
        })
        if (!res.ok) {
          let message = 'Email ou mot de passe invalide'
          try {
            const json = await res.json()
            if (json?.message && typeof json.message === 'string') {
              message = json.message
            }
          } catch {
            // ignore non-JSON error bodies
          }
          setError(message)
          setLoading(false)
          return
        }
        window.location.href = redirectTarget
      } catch (err: any) {
        setError(err?.message || 'Erreur de connexion. Veuillez reessayer.')
        setLoading(false)
      }
    },
    [email, password, rememberMe, loading, redirectTarget],
  )

  return (
    <div
      style={{
        minHeight: '100%',
        background: RM.cream,
        padding: '40px 16px 80px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        fontFamily: RM.fSans,
      }}
    >
      <form
        onSubmit={onSubmit}
        autoComplete="on"
        style={{
          width: '100%',
          maxWidth: 400,
          background: RM.paper,
          border: `1px solid ${RM.rule}`,
          borderRadius: 12,
          padding: 32,
          boxShadow: '0 4px 18px rgba(30, 26, 22, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <img
            src="/assets/brand/rm-logo.png"
            alt="Les Remèdes de Mamie"
            width={180}
            height={129}
            style={{
              width: 180,
              height: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ height: 1, background: RM.inkSoft, opacity: 0.25, width: 40 }} />
            <span
              style={{
                fontFamily: RM.fSans,
                fontSize: 10,
                letterSpacing: 3,
                color: RM.teal,
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              Administration
            </span>
            <span style={{ height: 1, background: RM.inkSoft, opacity: 0.25, width: 40 }} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label htmlFor="rm-login-email" style={labelStyle}>
            Adresse email
          </label>
          <input
            id="rm-login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            style={{
              ...inputBase,
              borderColor: emailFocused ? RM.teal : RM.rule,
              boxShadow: emailFocused ? `0 0 0 3px rgba(5, 74, 87, 0.10)` : 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label htmlFor="rm-login-password" style={labelStyle}>
            Mot de passe
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="rm-login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              style={{
                ...inputBase,
                paddingRight: 44,
                borderColor: passwordFocused ? RM.teal : RM.rule,
                boxShadow: passwordFocused ? `0 0 0 3px rgba(5, 74, 87, 0.10)` : 'none',
              }}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute',
                top: '50%',
                right: 8,
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                padding: 6,
                cursor: 'pointer',
                color: RM.inkSoft,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 22,
            fontFamily: RM.fSans,
            fontSize: 13,
            color: RM.inkSoft,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{
              width: 16,
              height: 16,
              accentColor: RM.teal,
              cursor: 'pointer',
            }}
          />
          Se souvenir de moi
        </label>

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 18,
              padding: '10px 12px',
              borderRadius: 6,
              border: `1px solid ${RM.burgundy}`,
              background: 'rgba(162, 33, 30, 0.06)',
              color: RM.burgundy,
              fontFamily: RM.fSans,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...cmsBtn.primary,
            width: '100%',
            justifyContent: 'center',
            padding: '12px 16px',
            fontSize: 13,
            letterSpacing: 0.4,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'progress' : 'pointer',
          }}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        <div
          style={{
            marginTop: 20,
            textAlign: 'center',
            fontSize: 12,
            fontFamily: RM.fSans,
          }}
        >
          <a
            href="/admin/forgot"
            style={{
              color: RM.teal,
              textDecoration: 'none',
              borderBottom: `1px dotted ${RM.teal}`,
              paddingBottom: 1,
            }}
          >
            Mot de passe oublie ?
          </a>
        </div>
      </form>
    </div>
  )
}

export default LoginClient
