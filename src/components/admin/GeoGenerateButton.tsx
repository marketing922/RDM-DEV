'use client'

import React, { useState, useCallback } from 'react'
import { useField, useAllFormFields, useDocumentInfo } from '@payloadcms/ui'
import { Sparkles, Loader2 } from 'lucide-react'

type GeoFieldType = 'directAnswer' | 'definition' | 'keyTakeaways' | 'faq'

type Props = {
  path: string
}

const fieldTypeFromPath = (path: string): GeoFieldType | null => {
  const last = path.split('.').pop() ?? ''
  if (
    last === 'directAnswer' ||
    last === 'definition' ||
    last === 'keyTakeaways' ||
    last === 'faq'
  ) {
    return last
  }
  return null
}

const kindFromCollection = (slug?: string): 'plant' | 'benefit' | 'article' | 'page' => {
  switch (slug) {
    case 'wikiEntries':
      return 'plant'
    case 'benefits':
      return 'benefit'
    case 'blogPosts':
      return 'article'
    case 'pages':
    default:
      return 'page'
  }
}

const extractRichText = (value: unknown): string | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return undefined
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
  const joined = out.join(' ').replace(/\s+/g, ' ').trim()
  return joined || undefined
}

const getFieldValue = (fields: any, key: string): any => {
  const slot = fields?.[key]
  if (!slot) return undefined
  if ('value' in slot) return slot.value
  return undefined
}

const pickContext = (fields: any, collectionSlug?: string) => {
  const kind = kindFromCollection(collectionSlug)
  const name =
    getFieldValue(fields, 'name') ||
    getFieldValue(fields, 'title') ||
    getFieldValue(fields, 'label')
  const latinName = getFieldValue(fields, 'latinName')
  const shortDescription =
    getFieldValue(fields, 'shortDescription') || getFieldValue(fields, 'excerpt')
  const longDescription = extractRichText(
    getFieldValue(fields, 'longDescription') ?? getFieldValue(fields, 'description'),
  )
  const content = extractRichText(getFieldValue(fields, 'content'))
  const tags = getFieldValue(fields, 'tags')

  return {
    kind,
    name,
    latinName,
    shortDescription,
    longDescription,
    content,
    tags: Array.isArray(tags) ? tags.map((t: any) => (typeof t === 'object' ? t?.name : t)).filter(Boolean) : undefined,
  }
}

const BUTTON_LABEL: Record<GeoFieldType, string> = {
  directAnswer: 'Générer la réponse directe',
  definition: 'Générer la définition',
  keyTakeaways: 'Générer les points-clés',
  faq: 'Générer la FAQ',
}

const GeoGenerateButton: React.FC<Props> = ({ path }) => {
  const fieldType = fieldTypeFromPath(path)
  const { value, setValue } = useField<any>({ path })
  const [fields] = useAllFormFields()
  const { collectionSlug } = useDocumentInfo()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!fieldType) return
    setError(null)

    const hasValue =
      (typeof value === 'string' && value.trim().length > 0) ||
      (Array.isArray(value) && value.length > 0)

    if (hasValue) {
      const confirmed = window.confirm(
        `Le champ contient déjà du contenu. Le remplacer par une version générée par IA ?`,
      )
      if (!confirmed) return
    }

    const context = pickContext(fields, collectionSlug)
    if (!context.name) {
      setError(
        'Renseigne au minimum le nom/titre du document avant de générer.',
      )
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/geo/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: fieldType, context }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: null }))
        throw new Error(error || `Erreur ${res.status}`)
      }
      const data = await res.json()
      if (fieldType === 'directAnswer' || fieldType === 'definition') {
        setValue(data.text)
      } else if (fieldType === 'keyTakeaways') {
        setValue((data.items as string[]).map((takeaway) => ({ takeaway })))
      } else if (fieldType === 'faq') {
        setValue(data.items)
      }
    } catch (err: any) {
      setError(err?.message || 'Génération échouée')
    } finally {
      setLoading(false)
    }
  }, [fieldType, fields, collectionSlug, value, setValue])

  if (!fieldType) return null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        margin: '4px 0 10px',
      }}
    >
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          alignSelf: 'flex-start',
          padding: '7px 14px',
          borderRadius: 8,
          border: '1px solid rgba(162, 33, 30, 0.25)',
          background: loading
            ? '#FEF9E9'
            : 'linear-gradient(135deg, #FFF5D5 0%, #FEF9E9 100%)',
          color: '#A2211E',
          fontSize: 12.5,
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          transition: 'background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease',
          boxShadow: '0 2px 6px rgba(162, 33, 30, 0.08)',
        }}
      >
        {loading ? (
          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Sparkles size={13} />
        )}
        {loading ? 'Génération en cours…' : BUTTON_LABEL[fieldType]}
      </button>
      {error && (
        <span
          style={{
            fontSize: 11.5,
            color: '#B91C1C',
            background: '#FEF2F2',
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid rgba(239, 68, 68, 0.25)',
            alignSelf: 'flex-start',
          }}
        >
          ⚠ {error}
        </span>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default GeoGenerateButton
