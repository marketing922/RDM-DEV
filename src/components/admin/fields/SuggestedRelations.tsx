'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useDocumentInfo, useField } from '@payloadcms/ui'
import { ArrowRight, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { RM } from '@/components/admin/primitives/tokens'

type Target = 'wikiEntries' | 'blogPosts' | 'benefits' | 'products'

type Hit = {
  type: string
  id: string | number
  slug?: string
  title: string
  excerpt?: string
  imageUrl?: string
  score: number
  url?: string
}

type SuggestionsPayload = {
  hits: Hit[]
  reason?: 'source-not-indexed' | string
}

type Props = {
  // Payload passes the field config under `field`; custom data is in `field.custom`.
  field?: {
    custom?: {
      target?: Target
      label?: string
      targetField?: string
    }
    label?: string | Record<string, string>
  }
  // Allow direct props usage too (non-wiring case).
  target?: Target
  label?: string
  targetField?: string
}

const DEFAULT_LABEL: Record<Target, string> = {
  wikiEntries: 'Plantes suggérées',
  blogPosts: 'Articles suggérés',
  benefits: 'Bienfaits suggérés',
  products: 'Produits suggérés',
}

/** A relationship hasMany value is normalized by Payload as either:
 *  - an array of ids (string | number)
 *  - an array of populated docs ({ id, ... })
 *  - or `null` / `undefined` when empty.
 */
type RelationshipItem = string | number | { id: string | number; [k: string]: unknown }
type RelationshipValue = RelationshipItem[] | null | undefined

const itemId = (item: RelationshipItem): string => {
  if (typeof item === 'string' || typeof item === 'number') return String(item)
  if (item && typeof item === 'object' && 'id' in item) return String(item.id)
  return ''
}

export const SuggestedRelations: React.FC<Props> = (props) => {
  const docInfo = useDocumentInfo() as { collectionSlug?: string; id?: string | number }
  const collection: string | undefined = docInfo?.collectionSlug
  const id: string | number | undefined = docInfo?.id

  const target: Target | undefined =
    props.target || (props.field?.custom?.target as Target | undefined)
  const label =
    props.label ||
    props.field?.custom?.label ||
    (target ? DEFAULT_LABEL[target] : 'Suggestions')
  const targetField: string | undefined =
    props.targetField || props.field?.custom?.targetField

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hits, setHits] = useState<Hit[]>([])
  const [reason, setReason] = useState<string | null>(null)
  const [refreshHover, setRefreshHover] = useState(false)
  const [hasAdded, setHasAdded] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const canFetch = Boolean(collection && id && target)

  const fetchSuggestions = useCallback(async () => {
    if (!canFetch) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError(null)
    setReason(null)

    try {
      const url =
        `/api/admin/suggestions?collection=${encodeURIComponent(String(collection))}` +
        `&id=${encodeURIComponent(String(id))}` +
        `&target=${encodeURIComponent(String(target))}` +
        `&limit=5`
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        signal: ctrl.signal,
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data: SuggestionsPayload = await res.json()
      if (ctrl.signal.aborted) return
      setHits(Array.isArray(data.hits) ? data.hits.slice(0, 5) : [])
      setReason(data.reason || null)
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      setError(msg)
      setHits([])
      setReason(null)
    } finally {
      if (!ctrl.signal.aborted) setLoading(false)
    }
  }, [canFetch, collection, id, target])

  useEffect(() => {
    if (!canFetch) return
    fetchSuggestions()
    return () => {
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, id, target])

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

  // Guard: no doc yet (create screen) -> render a subtle placeholder.
  if (!id) {
    return (
      <div style={containerStyle}>
        <Header label={String(label)} />
        <div style={{ fontSize: 12, color: RM.inkSoft }}>
          Les suggestions apparaîtront après la première sauvegarde du document.
        </div>
      </div>
    )
  }

  if (!target) {
    return (
      <div style={containerStyle}>
        <Header label={String(label)} />
        <div style={{ fontSize: 12, color: RM.burgundy }}>
          Configuration manquante : aucune cible (target) définie.
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Header label={String(label)} />
        <button
          type="button"
          onClick={fetchSuggestions}
          disabled={loading}
          aria-label="Rafraîchir les suggestions"
          onMouseEnter={() => setRefreshHover(true)}
          onMouseLeave={() => setRefreshHover(false)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 4,
            cursor: loading ? 'wait' : 'pointer',
            color: refreshHover ? RM.teal : RM.inkSoft,
            display: 'inline-flex',
            alignItems: 'center',
            opacity: loading ? 0.55 : 1,
            transition: 'color 0.12s ease, opacity 0.12s ease',
          }}
        >
          <RefreshCw
            size={12}
            style={{
              animation: loading ? 'rm-sr-spin 1s linear infinite' : undefined,
            }}
          />
        </button>
      </div>

      {loading && hits.length === 0 && <SkeletonRows />}

      {!loading && error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, color: RM.inkSoft }}>
            Impossible de charger les suggestions.
          </div>
          <button
            type="button"
            onClick={fetchSuggestions}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              color: RM.teal,
              border: `1px solid ${RM.ruleStrong}`,
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              fontFamily: RM.fSans,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && reason === 'source-not-indexed' && (
        <div style={{ fontSize: 12, color: RM.inkSoft, lineHeight: 1.45 }}>
          Ce document n'a pas encore été indexé. Sauvegarde-le pour générer
          l'embedding.
        </div>
      )}

      {!loading && !error && reason !== 'source-not-indexed' && hits.length === 0 && (
        <div style={{ fontSize: 12, color: RM.inkSoft }}>
          Aucune suggestion pour le moment.
        </div>
      )}

      {!error && hits.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {hits.map((hit) => (
            <HitCard
              key={`${hit.type}:${hit.id}`}
              hit={hit}
              target={target}
              targetField={targetField}
              onAdded={() => setHasAdded(true)}
            />
          ))}
        </ul>
      )}

      {hasAdded && (
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

      <style>{`@keyframes rm-sr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const Header: React.FC<{ label: string }> = ({ label }) => (
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
    <span>{label}</span>
  </div>
)

const SkeletonRows: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: 8,
          border: `1px solid ${RM.rule}`,
          borderRadius: 6,
          background: RM.cream,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: RM.rule,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 10, background: RM.rule, borderRadius: 3, width: '70%' }} />
          <div style={{ height: 8, background: RM.rule, borderRadius: 3, width: '40%' }} />
        </div>
      </div>
    ))}
  </div>
)

type HitCardProps = {
  hit: Hit
  target: Target
  targetField: string | undefined
  onAdded: () => void
}

const HitCard: React.FC<HitCardProps> = ({ hit, target, targetField, onAdded }) => {
  const href = `/admin/collections/${target}/${hit.id}`
  const scorePct = Math.max(0, Math.min(100, Math.round((hit.score ?? 0) * 100)))
  const [openHover, setOpenHover] = useState(false)
  const [addHover, setAddHover] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const justAddedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Always call useField — hooks must run unconditionally. When targetField is
  // missing or invalid, we treat the field as unresolved and disable the button.
  // We pass an empty string when missing; Payload returns no setValue/value in
  // that case, which we detect below.
  const fieldPath = targetField || '__rm_no_target__'
  const fieldApi = useField<RelationshipValue>({ path: fieldPath })

  const fieldResolved = Boolean(targetField) && typeof fieldApi.setValue === 'function'

  const currentValue: RelationshipValue = fieldResolved ? fieldApi.value : null

  const existingIds = useMemo<Set<string>>(() => {
    if (!Array.isArray(currentValue)) return new Set()
    const set = new Set<string>()
    for (const item of currentValue) {
      const id = itemId(item)
      if (id) set.add(id)
    }
    return set
  }, [currentValue])

  const hitId = String(hit.id)
  const alreadyAdded = existingIds.has(hitId)

  // Determine the shape of the array entries to preserve when appending.
  // If existing items are objects (populated), append as { id }; otherwise
  // append as the bare id string. Default to bare id when empty.
  const appendShape: 'object' | 'scalar' = useMemo(() => {
    if (Array.isArray(currentValue) && currentValue.length > 0) {
      const first = currentValue[0]
      if (first && typeof first === 'object') return 'object'
    }
    return 'scalar'
  }, [currentValue])

  useEffect(() => {
    return () => {
      if (justAddedTimer.current) clearTimeout(justAddedTimer.current)
    }
  }, [])

  const handleAdd = useCallback(() => {
    if (!fieldResolved || alreadyAdded) return
    const base: RelationshipItem[] = Array.isArray(currentValue) ? [...currentValue] : []
    const next: RelationshipItem[] =
      appendShape === 'object'
        ? [...base, { id: hit.id }]
        : [...base, hitId]
    fieldApi.setValue(next)
    setJustAdded(true)
    onAdded()
    if (justAddedTimer.current) clearTimeout(justAddedTimer.current)
    justAddedTimer.current = setTimeout(() => setJustAdded(false), 2000)
  }, [fieldResolved, alreadyAdded, currentValue, appendShape, hit.id, hitId, fieldApi, onAdded])

  const buttonState: 'noTarget' | 'added' | 'active' = !targetField || !fieldResolved
    ? 'noTarget'
    : alreadyAdded
      ? 'added'
      : 'active'

  const buttonLabel =
    buttonState === 'added' ? 'Déjà ajouté' : 'Ajouter'

  const buttonTitle =
    buttonState === 'noTarget'
      ? 'Pas de champ cible configuré'
      : buttonState === 'added'
        ? 'Cet élément est déjà dans la relation'
        : 'Ajouter à la relation'

  const buttonStyle: React.CSSProperties =
    buttonState === 'active'
      ? {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: addHover ? RM.burgundyDark : RM.burgundy,
          color: '#fff',
          border: 'none',
          padding: '3px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontFamily: RM.fSans,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 0.12s ease',
        }
      : buttonState === 'added'
        ? {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: RM.cream,
            color: RM.inkSoft,
            border: `1px solid ${RM.rule}`,
            padding: '2px 7px',
            borderRadius: 4,
            fontSize: 11,
            fontFamily: RM.fSans,
            fontWeight: 600,
            cursor: 'not-allowed',
            opacity: 0.7,
          }
        : {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            padding: '2px 4px',
            fontSize: 11,
            fontFamily: RM.fSans,
            fontWeight: 600,
            color: RM.inkSoft,
            cursor: 'not-allowed',
            opacity: 0.6,
          }

  return (
    <li
      style={{
        position: 'relative',
        display: 'flex',
        gap: 10,
        padding: 8,
        border: `1px solid ${RM.rule}`,
        borderRadius: 6,
        background: '#fff',
        alignItems: 'flex-start',
      }}
    >
      {justAdded && (
        <span
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            background: RM.teal,
            color: '#fff',
            fontSize: 10,
            fontFamily: RM.fSans,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 10,
            letterSpacing: '0.02em',
            animation: 'rm-sr-fade 2s ease forwards',
            pointerEvents: 'none',
          }}
        >
          Ajouté ✓
        </span>
      )}
      {hit.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hit.imageUrl}
          alt=""
          width={32}
          height={32}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            objectFit: 'cover',
            border: `1px solid ${RM.paper}`,
            flexShrink: 0,
            background: RM.paper,
          }}
        />
      ) : (
        <div
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: RM.paper,
            border: `1px solid ${RM.rule}`,
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            justifyContent: 'space-between',
          }}
        >
          <div
            title={hit.title}
            style={{
              fontFamily: RM.fSerif,
              fontSize: 14,
              lineHeight: 1.25,
              color: RM.ink,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
          >
            {hit.title || '(sans titre)'}
          </div>
          <span
            style={{
              flexShrink: 0,
              background: RM.cream,
              color: RM.teal,
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 10,
              fontFamily: RM.fSans,
              letterSpacing: '0.02em',
            }}
          >
            {scorePct}%
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            href={href}
            onMouseEnter={() => setOpenHover(true)}
            onMouseLeave={() => setOpenHover(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontFamily: RM.fSans,
              fontWeight: 600,
              color: openHover ? RM.burgundy : RM.teal,
              textDecoration: 'none',
              transition: 'color 0.12s ease',
            }}
          >
            <span>Ouvrir</span>
            <ArrowRight size={11} />
          </Link>
          <button
            type="button"
            title={buttonTitle}
            aria-label={buttonLabel}
            disabled={buttonState !== 'active'}
            onClick={buttonState === 'active' ? handleAdd : undefined}
            onMouseEnter={() => setAddHover(true)}
            onMouseLeave={() => setAddHover(false)}
            style={buttonStyle}
          >
            <Plus size={11} />
            <span>{buttonLabel}</span>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes rm-sr-fade {
          0% { opacity: 0; transform: translateY(-2px); }
          15% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </li>
  )
}

export default SuggestedRelations
