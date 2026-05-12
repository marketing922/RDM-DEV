import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import crypto from 'node:crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/admin/api-console-proxy
 *
 * Proxy admin pour la page /monitoring/api-console. Permet à un admin
 * connecté de tester n'importe quel endpoint de /api/external/v1/* depuis
 * son navigateur sans manipuler la clé API ni le secret HMAC : on les lit
 * côté serveur dans les env vars.
 *
 * Body :
 *   { path: '/schema', method: 'GET', body: null }
 *   { path: '/ingest', method: 'POST', body: '<JSON string>' }
 *
 * Renvoie un wrapper :
 *   {
 *     upstreamStatus: 201,
 *     upstreamHeaders: { ... },
 *     upstreamBody: <parsed JSON ou string>
 *   }
 *
 * Sécurité : auth session admin obligatoire (cookie Payload). Aucun partenaire
 * externe ne peut atteindre cet endpoint.
 */
type Body = {
  path: string
  method: 'GET' | 'POST'
  body: string | null
}

export async function POST(req: NextRequest) {
  // 1. Auth admin
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: req.headers })
  const user = auth?.user as { role?: string } | null
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'admin_required' }, { status: 401 })
  }

  // 2. Parse + valide
  let input: Body
  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (!input?.path || typeof input.path !== 'string' || !input.path.startsWith('/')) {
    return NextResponse.json({ error: 'invalid_path' }, { status: 400 })
  }
  if (!['GET', 'POST'].includes(input.method)) {
    return NextResponse.json({ error: 'invalid_method' }, { status: 400 })
  }

  // 3. Récupère la 1ère clé API + le secret HMAC
  let apiKey: string | undefined
  try {
    const raw = process.env.AI_PIPELINE_API_KEYS || '[]'
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
      apiKey = parsed[0]
    }
  } catch {/* noop */}
  if (!apiKey) {
    return NextResponse.json({ error: 'no_api_key_configured' }, { status: 503 })
  }
  const hmacSecret = process.env.AI_PIPELINE_HMAC_SECRET

  // 4. Build target URL (sur le même host, pas de réseau externe)
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${req.nextUrl.protocol}//${req.nextUrl.host}`
  const targetUrl = `${baseUrl}/api/external/v1${input.path}`

  // 5. Headers d'auth (HMAC requis sur POST si secret présent)
  const headers: Record<string, string> = {
    'x-api-key': apiKey,
  }
  let bodyToSend: string | undefined
  if (input.method === 'POST') {
    bodyToSend = input.body || ''
    headers['Content-Type'] = 'application/json'
    if (hmacSecret) {
      const ts = Date.now().toString()
      const sig = crypto
        .createHmac('sha256', hmacSecret)
        .update(`${ts}.${bodyToSend}`)
        .digest('hex')
      headers['x-timestamp'] = ts
      headers['x-signature'] = sig
    }
  }

  // 6. Forward upstream
  let res: Response
  try {
    res = await fetch(targetUrl, {
      method: input.method,
      headers,
      body: bodyToSend,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'upstream_fetch_failed', message: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    )
  }

  // 7. Lit la réponse
  const upstreamText = await res.text()
  let upstreamBody: unknown = upstreamText
  try {
    upstreamBody = JSON.parse(upstreamText)
  } catch {/* keep as text */}

  const upstreamHeaders: Record<string, string> = {}
  res.headers.forEach((v, k) => {
    upstreamHeaders[k] = v
  })

  return NextResponse.json({
    upstreamStatus: res.status,
    upstreamHeaders,
    upstreamBody,
  })
}
