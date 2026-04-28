'use client'
import React, { useState } from 'react'
import { useField, useForm, useDocumentInfo } from '@payloadcms/ui'
import type { TextareaFieldClientComponent } from 'payload'
import { Sparkles, Loader2 } from 'lucide-react'
import { RM } from '@/components/admin/primitives/tokens'
import { generateFieldValue } from '@/lib/ai'

export const AIGenerateTextareaField: TextareaFieldClientComponent = (props: any) => {
  const path = props.path || props.name
  const field = props.field || {}
  const { value, setValue } = useField<string>({ path })
  const form = useForm()
  const docInfo = useDocumentInfo() as any
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const collection =
    docInfo?.collectionSlug ||
    (props as any).collectionSlug ||
    (props as any).collection?.slug ||
    deriveCollectionFromUrl() ||
    ''

  async function generate() {
    if (!collection) {
      setErr('Collection introuvable — rechargez la page.')
      return
    }
    setLoading(true)
    setErr(null)
    try {
      const fullData = (form as any).getData?.() || {}
      const docId = docInfo?.id
      const contextWithId =
        docId != null && fullData.id == null ? { ...fullData, id: docId } : fullData
      const res = await generateFieldValue({
        collection,
        field: String(path),
        fieldType: 'textarea',
        context: contextWithId,
        locale: (props.locale as string) || undefined,
        targetLength: field?.admin?.targetLength,
      })
      setValue(res.text)
    } catch (e: any) {
      setErr(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const label =
    typeof field.label === 'string' ? field.label : field.label?.fr || String(path)
  const inputId = `rm-ai-textarea-${String(path).replace(/\W/g, '-')}`

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <label
          htmlFor={inputId}
          style={{ fontSize: 12, fontWeight: 600, color: RM.inkSoft }}
        >
          {label}
          {field.required && <span style={{ color: RM.burgundy, marginLeft: 4 }}>*</span>}
        </label>
        <AIGenerateButton loading={loading} onClick={generate} />
      </div>
      <textarea
        id={inputId}
        aria-label={label}
        placeholder={field?.admin?.placeholder || ''}
        rows={4}
        value={value ?? ''}
        onChange={(e) => setValue(e.target.value)}
        suppressHydrationWarning
        style={{
          width: '100%',
          padding: '8px 10px',
          fontSize: 13,
          border: `1px solid ${RM.ruleStrong}`,
          borderRadius: 6,
          background: 'white',
          fontFamily: RM.fSans,
          resize: 'vertical',
          lineHeight: 1.5,
        }}
      />
      {field?.admin?.description && (
        <div style={{ fontSize: 11, color: RM.inkSoft, marginTop: 3, fontStyle: 'italic' }}>
          {field.admin.description}
        </div>
      )}
      {err && <div style={{ fontSize: 11, color: RM.burgundy, marginTop: 4 }}>{err}</div>}
    </div>
  )
}

function AIGenerateButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      suppressHydrationWarning
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: 'transparent',
        border: 'none',
        padding: '2px 4px',
        fontSize: 11,
        fontFamily: RM.fSans,
        fontWeight: 500,
        color: hover ? RM.teal : RM.inkSoft,
        opacity: loading ? 0.55 : hover ? 1 : 0.7,
        cursor: loading ? 'wait' : 'pointer',
        transition: 'color 0.12s ease, opacity 0.12s ease',
      }}
    >
      {loading ? (
        <Loader2 size={11} style={{ animation: 'rm-ai-spin 1s linear infinite' }} />
      ) : (
        <Sparkles size={11} />
      )}
      <span>{loading ? 'génération…' : 'auto-générer'}</span>
      <style>{`@keyframes rm-ai-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}

function deriveCollectionFromUrl(): string {
  if (typeof window === 'undefined') return ''
  const m = window.location.pathname.match(/\/admin\/collections\/([^/?#]+)/)
  return m?.[1] || ''
}

export default AIGenerateTextareaField
