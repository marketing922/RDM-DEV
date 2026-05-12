'use client'

import { useState } from 'react'

type Endpoint = {
  id: string
  label: string
  method: 'GET' | 'POST'
  path: string
  needsBody: boolean
  template?: string
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'schema',
    label: 'GET /schema (contrat self-documented)',
    method: 'GET',
    path: '/schema',
    needsBody: false,
  },
  {
    id: 'taxonomy',
    label: 'GET /taxonomy (slugs valides)',
    method: 'GET',
    path: '/taxonomy',
    needsBody: false,
  },
  {
    id: 'plants',
    label: 'GET /plants (catalogue plantes)',
    method: 'GET',
    path: '/plants?limit=10',
    needsBody: false,
  },
  {
    id: 'benefits',
    label: 'GET /benefits (catalogue bienfaits)',
    method: 'GET',
    path: '/benefits?limit=10',
    needsBody: false,
  },
  {
    id: 'products',
    label: 'GET /products (catalogue produits)',
    method: 'GET',
    path: '/products?limit=10',
    needsBody: false,
  },
  {
    id: 'ingest-log',
    label: 'GET /ingest-log (votre historique)',
    method: 'GET',
    path: '/ingest-log?limit=20',
    needsBody: false,
  },
  {
    id: 'validate-wiki',
    label: 'POST /validate (wiki — dry-run, zéro écriture)',
    method: 'POST',
    path: '/validate',
    needsBody: true,
    template: 'wiki',
  },
  {
    id: 'validate-blog',
    label: 'POST /validate (blog — dry-run, zéro écriture)',
    method: 'POST',
    path: '/validate',
    needsBody: true,
    template: 'blog',
  },
  {
    id: 'ingest-wiki',
    label: 'POST /ingest (wiki — ⚠️ écrit en BD)',
    method: 'POST',
    path: '/ingest',
    needsBody: true,
    template: 'wiki',
  },
  {
    id: 'ingest-blog',
    label: 'POST /ingest (blog — ⚠️ écrit en BD)',
    method: 'POST',
    path: '/ingest',
    needsBody: true,
    template: 'blog',
  },
]

const WIKI_TEMPLATE = `{
  "kind": "wiki",
  "locale": "fr",
  "publish": false,
  "idempotencyKey": "${crypto.randomUUID?.() || '550e8400-e29b-41d4-a716-446655440000'}",
  "data": {
    "slug": "test-plante-console",
    "title": "Test plante console",
    "excerpt": "Description courte de la plante pour test depuis la console admin. Au moins 40 caractères.",
    "content": {
      "root": {
        "type": "root",
        "children": [
          {
            "type": "paragraph",
            "children": [
              { "type": "text", "text": "Paragraphe descriptif pour la plante de test." }
            ]
          }
        ]
      }
    },
    "latinName": "Testus consolus",
    "family": "asteraceae",
    "origin": "Test laboratoire",
    "partsUsed": "Feuilles",
    "activeCompounds": "Composé A, Composé B",
    "seo": {
      "title": "Test plante console | RDM",
      "description": "Description SEO pour test depuis la console admin.",
      "keywords": ["test", "console", "admin"]
    },
    "geo": {
      "directAnswer": "Test plante console est une plante de test utilisée uniquement pour valider l'intégration depuis la console admin. Aucune valeur médicinale réelle.",
      "definition": "Test plante console est une entité fictive servant à valider l'API d'ingestion externe.",
      "keyTakeaways": [
        { "takeaway": "Sert à valider les payloads avant transmission au partenaire" },
        { "takeaway": "Aucune valeur thérapeutique réelle" },
        { "takeaway": "Peut être supprimée après test" }
      ],
      "quotableStatements": [
        { "statement": "Cette plante est purement fictive et destinée aux tests.", "source": "Console admin RDM" }
      ],
      "dataPoints": [
        { "metric": "Test indicator A", "value": "42", "unit": "%", "source": "test" },
        { "metric": "Test indicator B", "value": "100", "unit": "ml" },
        { "metric": "Test indicator C", "value": "1" }
      ],
      "faq": [
        { "question": "Est-ce une vraie plante ?", "answer": "Non, c'est une plante de test pour la console admin." },
        { "question": "Puis-je la supprimer ?", "answer": "Oui, après vérification du test." },
        { "question": "Pourquoi existe-t-elle ?", "answer": "Pour valider l'API d'ingestion externe avant transmission au partenaire." }
      ],
      "targetAIQueries": [
        { "query": "test plante console RDM" },
        { "query": "comment supprimer test plante" },
        { "query": "api ingestion console admin" }
      ],
      "authoritySignals": "Source unique : console admin RDM. Aucune autorité externe.",
      "sources": [
        { "title": "Documentation interne RDM", "publisher": "RDM", "year": 2026 },
        { "title": "Guide API partenaire", "publisher": "RDM", "year": 2026 },
        { "title": "Schémas wiki/article", "publisher": "RDM", "year": 2026 }
      ],
      "lastFactCheckedAt": "${new Date().toISOString()}"
    },
    "images": [
      {
        "url": "https://res.cloudinary.com/laboratoire-calebasse/image/upload/rdm/plants/agripaume.png",
        "alt": "Image de test",
        "role": "featured"
      }
    ],
    "relations": {}
  }
}`

const BLOG_TEMPLATE = `{
  "kind": "blog",
  "locale": "fr",
  "publish": false,
  "idempotencyKey": "${crypto.randomUUID?.() || '550e8400-e29b-41d4-a716-446655440001'}",
  "data": {
    "slug": "test-article-console",
    "title": "Test article console",
    "excerpt": "Article de test poussé depuis la console admin pour valider l'intégration. Au moins 40 caractères ici.",
    "content": {
      "root": {
        "type": "root",
        "children": [
          {
            "type": "heading",
            "tag": "h2",
            "children": [{ "type": "text", "text": "Première section" }]
          },
          {
            "type": "paragraph",
            "children": [{ "type": "text", "text": "Paragraphe de la première section." }]
          },
          {
            "type": "heading",
            "tag": "h2",
            "children": [{ "type": "text", "text": "Deuxième section" }]
          },
          {
            "type": "paragraph",
            "children": [{ "type": "text", "text": "Paragraphe de la deuxième section." }]
          }
        ]
      }
    },
    "seo": {
      "title": "Test article console | RDM",
      "description": "Article de test pour la console admin.",
      "keywords": ["test", "console", "admin"]
    },
    "geo": {
      "directAnswer": "Test article console est un article de test publié depuis la console admin pour valider l'intégration avec le partenaire. Aucun contenu éditorial réel.",
      "definition": "Test article console est un brouillon de validation API, non destiné à la publication publique.",
      "keyTakeaways": [
        { "takeaway": "Article de validation de l'API d'ingestion" },
        { "takeaway": "Aucun contenu éditorial significatif" },
        { "takeaway": "À supprimer après test" }
      ],
      "quotableStatements": [
        { "statement": "Cet article ne contient que des données de test.", "source": "Console admin RDM" }
      ],
      "dataPoints": [
        { "metric": "Test data A", "value": "42" },
        { "metric": "Test data B", "value": "100", "unit": "%" },
        { "metric": "Test data C", "value": "1" }
      ],
      "faq": [
        { "question": "Pourquoi cet article existe ?", "answer": "Pour tester l'API depuis la console admin." },
        { "question": "Est-il publié ?", "answer": "Non, en draft par défaut depuis la console." },
        { "question": "Puis-je le supprimer ?", "answer": "Oui, après test." }
      ],
      "targetAIQueries": [
        { "query": "test article console RDM" },
        { "query": "comment valider api ingestion" },
        { "query": "console admin api externe" }
      ],
      "authoritySignals": "Console admin RDM. Pas de source externe.",
      "sources": [
        { "title": "Documentation API", "publisher": "RDM", "year": 2026 },
        { "title": "Guide partenaire", "publisher": "RDM", "year": 2026 },
        { "title": "Console admin", "publisher": "RDM", "year": 2026 }
      ],
      "lastFactCheckedAt": "${new Date().toISOString()}"
    },
    "images": [
      {
        "url": "https://res.cloudinary.com/laboratoire-calebasse/image/upload/rdm/plants/agripaume.png",
        "alt": "Image de test",
        "role": "featured"
      }
    ],
    "relations": {}
  }
}`

type ResponseState = {
  status: number
  durationMs: number
  headers: Record<string, string>
  body: string
} | null

export default function ApiConsoleClient() {
  const [selectedId, setSelectedId] = useState<string>('schema')
  const [body, setBody] = useState<string>('')
  const [response, setResponse] = useState<ResponseState>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const endpoint = ENDPOINTS.find((e) => e.id === selectedId) || ENDPOINTS[0]

  function handleEndpointChange(id: string) {
    setSelectedId(id)
    setResponse(null)
    setErrorMsg(null)
    const ep = ENDPOINTS.find((e) => e.id === id)
    if (ep?.needsBody) {
      setBody(ep.template === 'blog' ? BLOG_TEMPLATE : WIKI_TEMPLATE)
    } else {
      setBody('')
    }
  }

  async function handleExecute() {
    setLoading(true)
    setErrorMsg(null)
    setResponse(null)
    const started = Date.now()
    try {
      const res = await fetch('/api/admin/api-console-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: endpoint.path,
          method: endpoint.method,
          body: endpoint.needsBody ? body : null,
        }),
      })
      const json = await res.json()
      setResponse({
        status: json.upstreamStatus || res.status,
        durationMs: Date.now() - started,
        headers: json.upstreamHeaders || {},
        body: typeof json.upstreamBody === 'string'
          ? json.upstreamBody
          : JSON.stringify(json.upstreamBody, null, 2),
      })
    } catch (e: any) {
      setErrorMsg(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const responseColor =
    !response ? '#9ca3af' :
    response.status >= 200 && response.status < 300 ? '#10b981' :
    response.status >= 400 && response.status < 500 ? '#f59e0b' :
    '#ef4444'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16 }}>
      {/* ─── Sidebar : sélection endpoint ─── */}
      <aside
        style={{
          background: '#151b23',
          border: '1px solid #1f2933',
          borderRadius: 8,
          padding: 16,
          alignSelf: 'start',
        }}
      >
        <h3 style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>
          Endpoint
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ENDPOINTS.map((ep) => (
            <button
              key={ep.id}
              onClick={() => handleEndpointChange(ep.id)}
              style={{
                background: selectedId === ep.id ? '#1f2933' : 'transparent',
                color: selectedId === ep.id ? '#e5e9f0' : '#9ca3af',
                border: '1px solid ' + (selectedId === ep.id ? '#374151' : 'transparent'),
                borderRadius: 4,
                padding: '8px 10px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'system-ui',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: 'monospace',
                  background: ep.method === 'GET' ? '#1e3a5f' : '#5b2c2c',
                  color: ep.method === 'GET' ? '#7dd3fc' : '#fca5a5',
                  padding: '1px 6px',
                  borderRadius: 3,
                  fontSize: 10,
                  marginRight: 8,
                  fontWeight: 600,
                }}
              >
                {ep.method}
              </span>
              {ep.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleExecute}
          disabled={loading}
          style={{
            marginTop: 16,
            width: '100%',
            background: '#0ea5e9',
            color: '#fff',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 4,
            cursor: loading ? 'wait' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Exécution…' : `▶ Exécuter ${endpoint.method} ${endpoint.path}`}
        </button>

        {errorMsg && (
          <div style={{ marginTop: 12, color: '#ef4444', fontSize: 12 }}>
            Erreur client : {errorMsg}
          </div>
        )}
      </aside>

      {/* ─── Body editor + response ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {endpoint.needsBody && (
          <div>
            <h3 style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>
              Body (JSON)
            </h3>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
              style={{
                width: '100%',
                minHeight: 320,
                background: '#0b0f14',
                color: '#e5e9f0',
                border: '1px solid #1f2933',
                borderRadius: 6,
                padding: 12,
                fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
                fontSize: 12,
                lineHeight: 1.5,
                resize: 'vertical',
              }}
            />
          </div>
        )}

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
              Réponse
            </h3>
            {response && (
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                <span style={{ color: responseColor, fontWeight: 600 }}>{response.status}</span>
                {' · '}
                <span>{response.durationMs} ms</span>
              </div>
            )}
          </div>

          {!response && !loading && (
            <div
              style={{
                background: '#151b23',
                border: '1px dashed #1f2933',
                borderRadius: 6,
                padding: 32,
                textAlign: 'center',
                color: '#6b7280',
                fontSize: 13,
              }}
            >
              Choisis un endpoint à gauche et clique « Exécuter ».
            </div>
          )}

          {response && (
            <>
              {/* Headers de throttling */}
              {Object.keys(response.headers).filter((h) => h.toLowerCase().startsWith('x-rdm-')).length > 0 && (
                <div
                  style={{
                    background: '#151b23',
                    border: '1px solid #1f2933',
                    borderRadius: 6,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <p style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 6px' }}>
                    Headers throttling
                  </p>
                  <table style={{ fontSize: 11, fontFamily: 'monospace', width: '100%' }}>
                    <tbody>
                      {Object.entries(response.headers)
                        .filter(([h]) => h.toLowerCase().startsWith('x-rdm-'))
                        .map(([h, v]) => (
                          <tr key={h}>
                            <td style={{ color: '#9ca3af', padding: '2px 0' }}>{h}</td>
                            <td style={{ color: '#e5e9f0', textAlign: 'right' }}>{v}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              <pre
                style={{
                  background: '#0b0f14',
                  border: '1px solid #1f2933',
                  borderRadius: 6,
                  padding: 16,
                  margin: 0,
                  fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: '#e5e9f0',
                  maxHeight: 600,
                  overflow: 'auto',
                }}
              >
                {response.body}
              </pre>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
