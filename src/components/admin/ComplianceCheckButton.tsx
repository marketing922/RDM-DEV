'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useAllFormFields, useDocumentInfo } from '@payloadcms/ui'
import { ShieldCheck, AlertTriangle, ShieldAlert, Copy, Check, Loader2 } from 'lucide-react'
import { RM, cmsBtn } from '@/components/admin/primitives/tokens'

type Verdict = 'ok' | 'risk' | 'block'
type Target = 'wikiEntries' | 'blogPosts' | 'benefits' | 'products'

type ApiResponse = {
  verdict?: Verdict
  confidence?: number
  matchedClaims?: string[]
  reason?: string
  suggestion?: string
  model?: string
  error?: string
  message?: string
}

type Props = {
  field?: {
    custom?: {
      collection?: Target
      fields?: string[]
    }
  }
  collection?: Target
  fields?: string[]
}

const extractRichText = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return ''
  const stack: any[] = [value]
  const out: string[] = []
  while (stack.length) {
    const n = stack.pop()
    if (!n) continue
    if (typeof n === 'string') {
      out.push(n)
      continue
    }
    if (Array.isArray(n)) {
      for (let i = n.length - 1; i >= 0; i--) stack.push(n[i])
      continue
    }
    if (typeof n === 'object') {
      if (typeof n.text === 'string') out.push(n.text)
      if (n.children) stack.push(n.children)
      if (n.root) stack.push(n.root)
    }
  }
  return out.join(' ').replace(/\s+/g, ' ').trim()
}

const readField = (formFields: any, key: string): string => {
  const slot = formFields?.[key]
  if (!slot || !('value' in slot)) return ''
  const v = slot.value
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'object') return extractRichText(v)
  return ''
}

const VERDICT_BADGE: Record<Verdict, { label: string; bg: string; fg: string; icon: React.ReactNode }> = {
  ok: {
    label: 'Conforme',
    bg: '#E8F1EE',
    fg: RM.teal,
    icon: <ShieldCheck size={14} />,
  },
  risk: {
    label: 'À relire',
    bg: RM.creamSoft,
    fg: RM.ochre,
    icon: <AlertTriangle size={14} />,
  },
  block: {
    label: 'Bloqué',
    bg: '#F4DDDC',
    fg: RM.burgundy,
    icon: <ShieldAlert size={14} />,
  },
}

const ComplianceCheckButton: React.FC<Props> = (props) => {
  const collection: Target | undefined =
    props.collection || (props.field?.custom?.collection as Target | undefined)
  const fieldList: string[] = useMemo(() => {
    const fromProps = props.fields
    const fromConfig = props.field?.custom?.fields
    if (Array.isArray(fromProps) && fromProps.length) return fromProps
    if (Array.isArray(fromConfig) && fromConfig.length) return fromConfig
    return []
  }, [props.fields, props.field?.custom?.fields])

  const [formFields] = useAllFormFields()
  const { id } = useDocumentInfo() as any

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCheck = useCallback(async () => {
    setError(null)
    setResult(null)
    if (!collection || fieldList.length === 0) {
      setError('Configuration manquante (collection ou fields).')
      return
    }
    const parts: string[] = []
    for (const f of fieldList) {
      const v = readField(formFields, f)
      if (v) parts.push(v)
    }
    const text = parts.join('\n\n').slice(0, 6000)
    if (!text) {
      setError('Aucun contenu à vérifier dans les champs configurés.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-moderate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          locale: 'fr',
          context: {
            collection,
            field: fieldList.join(','),
            ...(id != null ? { id } : {}),
          },
        }),
      })
      const data = (await res.json().catch(() => ({}))) as ApiResponse
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || `Erreur HTTP ${res.status}`,
        )
      }
      setResult(data)
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [collection, fieldList, formFields, id])

  const handleCopySuggestion = useCallback(async () => {
    if (!result?.suggestion) return
    try {
      await navigator.clipboard.writeText(result.suggestion)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }, [result?.suggestion])

  const containerStyle: React.CSSProperties = {
    background: RM.paper,
    border: `1px solid ${RM.rule}`,
    borderRadius: 8,
    padding: 16,
    fontFamily: RM.fSans,
    color: RM.ink,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 12,
  }

  const verdict = result?.verdict
  const badge = verdict ? VERDICT_BADGE[verdict] : null
  const confidencePct =
    typeof result?.confidence === 'number'
      ? Math.round(result.confidence * 100)
      : null

  return (
    <div style={containerStyle}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          fontFamily: RM.fSans,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: RM.teal,
        }}
      >
        <ShieldCheck size={12} style={{ color: RM.ochre }} />
        <span>Vérification conformité IA</span>
      </div>

      <button
        type="button"
        onClick={handleCheck}
        disabled={loading}
        style={{
          ...cmsBtn.dark,
          opacity: loading ? 0.65 : 1,
          cursor: loading ? 'wait' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {loading ? <Loader2 size={12} className="rm-spin" /> : <ShieldCheck size={12} />}
        <span>{loading ? 'Analyse…' : 'Vérifier la conformité IA'}</span>
      </button>

      {!id && (
        <div style={{ fontSize: 11, color: RM.inkSoft, lineHeight: 1.45 }}>
          Astuce : sauvegarde le document au moins une fois pour des résultats
          plus fiables.
        </div>
      )}

      {error && (
        <div
          style={{
            fontSize: 12,
            color: RM.burgundy,
            background: '#F4DDDC',
            border: `1px solid ${RM.rule}`,
            borderRadius: 6,
            padding: '8px 10px',
          }}
        >
          {error}
        </div>
      )}

      {result && badge && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            border: `1px solid ${RM.rule}`,
            borderRadius: 6,
            background: '#fff',
            padding: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: badge.bg,
                color: badge.fg,
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 10,
                fontFamily: RM.fSans,
              }}
            >
              {badge.icon}
              <span>{badge.label}</span>
            </span>
            {confidencePct != null && (
              <span style={{ fontSize: 11, color: RM.inkSoft }}>
                Confiance : {confidencePct}%
              </span>
            )}
          </div>

          {result.reason && (
            <div
              style={{
                fontSize: 12,
                color: RM.ink,
                lineHeight: 1.5,
                fontFamily: RM.fSerif,
              }}
            >
              {result.reason}
            </div>
          )}

          {Array.isArray(result.matchedClaims) && result.matchedClaims.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: RM.inkSoft,
                }}
              >
                Phrases détectées
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: RM.ink }}>
                {result.matchedClaims.map((claim, i) => (
                  <li key={i} style={{ lineHeight: 1.45 }}>{claim}</li>
                ))}
              </ul>
            </div>
          )}

          {result.suggestion && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                background: RM.cream,
                border: `1px solid ${RM.rule}`,
                borderRadius: 6,
                padding: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: RM.teal,
                  }}
                >
                  Reformulation suggérée
                </span>
                <button
                  type="button"
                  onClick={handleCopySuggestion}
                  style={{
                    ...cmsBtn.ghost,
                    padding: '4px 8px',
                    fontSize: 11,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  <span>{copied ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: RM.ink,
                  lineHeight: 1.5,
                  fontFamily: RM.fSerif,
                }}
              >
                {result.suggestion}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes rm-cc-spin { to { transform: rotate(360deg); } } .rm-spin { animation: rm-cc-spin 1s linear infinite; }`}</style>
    </div>
  )
}

export default ComplianceCheckButton
