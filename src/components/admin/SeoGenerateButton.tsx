'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useAllFormFields, useDocumentInfo, useField } from '@payloadcms/ui'
import { Loader2, Sparkles, Check, X, AlertTriangle } from 'lucide-react'
import { RM, cmsBtn } from '@/components/admin/primitives/tokens'

type Collection = 'wikiEntries' | 'blogPosts' | 'benefits' | 'products'

type SeoApiResponse = {
  title?: string
  description?: string
  keywords?: string[]
  model?: string
  promptTokens?: number
  completionTokens?: number
  promptVersion?: string
  error?: string
  message?: string
}

type Props = {
  field?: {
    custom?: {
      collection?: Collection
    }
  }
  collection?: Collection
}

const TITLE_MAX = 60
const DESC_MAX = 155

const extractRichText = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return ''
  const stack: unknown[] = [value]
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
      const obj = n as { text?: unknown; children?: unknown; root?: unknown }
      if (typeof obj.text === 'string') out.push(obj.text)
      if (obj.children) stack.push(obj.children)
      if (obj.root) stack.push(obj.root)
    }
  }
  return out.join(' ').replace(/\s+/g, ' ').trim()
}

const readField = (formFields: Record<string, unknown> | undefined, key: string): string => {
  const slot = formFields?.[key] as { value?: unknown } | undefined
  if (!slot || !('value' in (slot as object))) return ''
  const v = slot.value
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'object' && v !== null) return extractRichText(v)
  return ''
}

const readArrayOfStrings = (
  formFields: Record<string, unknown> | undefined,
  key: string,
): string[] => {
  const slot = formFields?.[key] as { value?: unknown } | undefined
  const v = slot?.value
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const item of v) {
    if (typeof item === 'string' && item.trim()) {
      out.push(item.trim())
      continue
    }
    if (item && typeof item === 'object') {
      const obj = item as { name?: unknown; title?: unknown }
      if (typeof obj.name === 'string' && obj.name.trim()) out.push(obj.name.trim())
      else if (typeof obj.title === 'string' && obj.title.trim()) out.push(obj.title.trim())
    }
  }
  return out
}

const SeoGenerateButton: React.FC<Props> = (props) => {
  const collection: Collection | undefined =
    props.collection || (props.field?.custom?.collection as Collection | undefined)

  const [formFields] = useAllFormFields()
  const { id } = useDocumentInfo() as { id?: string | number }

  // Pre-bind to the SEO meta fields managed by the seoPlugin.
  const metaTitleApi = useField<string>({ path: 'meta.title' })
  const metaDescriptionApi = useField<string>({ path: 'meta.description' })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SeoApiResponse | null>(null)
  const [applied, setApplied] = useState(false)
  const [hint, setHint] = useState('')

  const ff = formFields as unknown as Record<string, unknown>

  const handleGenerate = useCallback(async () => {
    setError(null)
    setResult(null)
    setApplied(false)

    if (!collection) {
      setError('Configuration manquante (collection).')
      return
    }

    const ctx = {
      name: readField(ff, 'name') || undefined,
      title: readField(ff, 'title') || undefined,
      latinName: readField(ff, 'latinName') || undefined,
      shortDescription: readField(ff, 'shortDescription') || undefined,
      longDescription:
        readField(ff, 'longDescription') ||
        readField(ff, 'description') ||
        readField(ff, 'content') ||
        undefined,
      excerpt: readField(ff, 'excerpt') || undefined,
      category: readField(ff, 'category') || undefined,
      bodyRegion: readField(ff, 'bodyRegion') || undefined,
      tags: readArrayOfStrings(ff, 'tags'),
    }

    const cleanedCtx: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(ctx)) {
      if (v == null) continue
      if (Array.isArray(v) && v.length === 0) continue
      cleanedCtx[k] = v
    }
    if (id != null) cleanedCtx.id = id

    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-seo', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection,
          context: cleanedCtx,
          locale: 'fr',
          hint: hint.trim() || undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as SeoApiResponse
      if (!res.ok) {
        throw new Error(data?.message || data?.error || `Erreur HTTP ${res.status}`)
      }
      setResult(data)
    } catch (e) {
      const err = e as { message?: string }
      setError(err?.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [collection, ff, hint])

  const currentMetaTitle =
    typeof metaTitleApi.value === 'string' ? metaTitleApi.value : ''
  const currentMetaDescription =
    typeof metaDescriptionApi.value === 'string' ? metaDescriptionApi.value : ''

  const handleApply = useCallback(() => {
    if (!result) return
    const hasExisting =
      (currentMetaTitle && currentMetaTitle.trim().length > 0) ||
      (currentMetaDescription && currentMetaDescription.trim().length > 0)
    if (hasExisting) {
      const ok = typeof window !== 'undefined'
        ? window.confirm('Remplacer le SEO actuel ?')
        : true
      if (!ok) return
    }
    if (typeof result.title === 'string' && typeof metaTitleApi.setValue === 'function') {
      metaTitleApi.setValue(result.title)
    }
    if (typeof result.description === 'string' && typeof metaDescriptionApi.setValue === 'function') {
      metaDescriptionApi.setValue(result.description)
    }
    setApplied(true)
  }, [result, currentMetaTitle, currentMetaDescription, metaTitleApi, metaDescriptionApi])

  const handleCancel = useCallback(() => {
    setResult(null)
    setApplied(false)
  }, [])

  const containerStyle: React.CSSProperties = useMemo(
    () => ({
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
    }),
    [],
  )

  const titleLen = result?.title?.length ?? 0
  const descLen = result?.description?.length ?? 0
  const titleOver = titleLen > TITLE_MAX
  const descOver = descLen > DESC_MAX

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
        <Sparkles size={12} style={{ color: RM.ochre }} />
        <span>Pack SEO IA</span>
      </div>

      <label
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          fontSize: 11,
          color: RM.inkSoft,
        }}
      >
        <span style={{ fontWeight: 600 }}>Indication (facultatif)</span>
        <input
          type="text"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="Ex. : mets en avant la digestion"
          maxLength={300}
          style={{
            width: '100%',
            background: '#fff',
            border: `1px solid ${RM.ruleStrong}`,
            borderRadius: 6,
            padding: '6px 9px',
            fontSize: 12,
            fontFamily: RM.fSans,
            color: RM.ink,
            boxSizing: 'border-box',
          }}
        />
      </label>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !collection}
        style={{
          ...cmsBtn.dark,
          opacity: loading || !collection ? 0.65 : 1,
          cursor: loading ? 'wait' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {loading ? <Loader2 size={12} className="rm-seo-spin" /> : <Sparkles size={12} />}
        <span>{loading ? 'Génération…' : 'Générer pack SEO'}</span>
      </button>

      {!id && (
        <div style={{ fontSize: 11, color: RM.inkSoft, lineHeight: 1.45 }}>
          Astuce : remplis les champs principaux (nom, description) pour un meilleur résultat.
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
            display: 'inline-flex',
            alignItems: 'flex-start',
            gap: 6,
          }}
        >
          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {result && (
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
          <PreviewRow
            label="Title"
            value={result.title || ''}
            len={titleLen}
            max={TITLE_MAX}
            over={titleOver}
          />
          <PreviewRow
            label="Description"
            value={result.description || ''}
            len={descLen}
            max={DESC_MAX}
            over={descOver}
          />

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
              Mots-clés
            </div>
            {Array.isArray(result.keywords) && result.keywords.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {result.keywords.map((kw, i) => (
                  <span
                    key={`${kw}-${i}`}
                    style={{
                      background: RM.cream,
                      border: `1px solid ${RM.rule}`,
                      color: RM.teal,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: 10,
                      fontFamily: RM.fSans,
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: RM.inkSoft, fontStyle: 'italic' }}>
                Aucun mot-clé proposé.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleApply}
              disabled={applied || (!result.title && !result.description)}
              style={{
                ...cmsBtn.primary,
                opacity:
                  applied || (!result.title && !result.description) ? 0.65 : 1,
                cursor:
                  applied || (!result.title && !result.description) ? 'not-allowed' : 'pointer',
              }}
            >
              <Check size={12} />
              <span>{applied ? 'Appliqué' : 'Appliquer aux champs SEO'}</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                ...cmsBtn.ghost,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <X size={12} />
              <span>Annuler</span>
            </button>
          </div>

          {applied && (
            <div
              style={{
                fontSize: 11,
                color: RM.inkSoft,
                fontStyle: 'italic',
                borderTop: `1px solid ${RM.rule}`,
                paddingTop: 8,
              }}
            >
              N'oublie pas de sauvegarder.
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes rm-seo-spin { to { transform: rotate(360deg); } } .rm-seo-spin { animation: rm-seo-spin 1s linear infinite; }`}</style>
    </div>
  )
}

const PreviewRow: React.FC<{
  label: string
  value: string
  len: number
  max: number
  over: boolean
}> = ({ label, value, len, max, over }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
          color: RM.inkSoft,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 10,
          fontFamily: RM.fMono,
          color: over ? RM.burgundy : RM.inkSoft,
        }}
      >
        {len}/{max}
      </span>
    </div>
    <div
      style={{
        fontSize: 12,
        color: RM.ink,
        lineHeight: 1.45,
        fontFamily: RM.fSerif,
        background: RM.paper,
        border: `1px solid ${RM.rule}`,
        borderRadius: 4,
        padding: '6px 8px',
        wordBreak: 'break-word',
      }}
    >
      {value || <em style={{ color: RM.inkSoft }}>(vide)</em>}
    </div>
  </div>
)

export default SeoGenerateButton
