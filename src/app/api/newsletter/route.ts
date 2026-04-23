import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * POST /api/newsletter
 * Body: { email: string, locale?: string }
 *
 * Reads newsletter config from SiteSettings global (provider + listId),
 * submits the email to Brevo. If a `doiTemplateId` + `doiRedirectionUrl`
 * are set, uses the double opt-in endpoint (RGPD-friendly). Otherwise
 * falls back to a straight contact create — Brevo list-level DOI settings
 * still apply if enabled in the Brevo dashboard.
 *
 * Env:
 *   BREVO_API_KEY            — required
 *   BREVO_DOI_TEMPLATE_ID    — optional, numeric template id in Brevo
 *   BREVO_DOI_REDIRECT_URL   — optional, full URL user is redirected to after confirm
 */

const BREVO_API = 'https://api.brevo.com/v3'

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const email = String(body?.email || '').trim().toLowerCase()
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'brevo_not_configured', detail: 'BREVO_API_KEY env var missing' },
      { status: 503 },
    )
  }

  // Pull provider + listId from SiteSettings
  let listId: number | undefined
  try {
    const payload = await getPayload({ config: configPromise })
    const settings: any = await payload.findGlobal({ slug: 'siteSettings' })
    const provider = settings?.newsletter?.provider
    if (provider !== 'brevo') {
      return NextResponse.json(
        { error: 'provider_disabled', detail: 'newsletter.provider must be "brevo"' },
        { status: 503 },
      )
    }
    const raw = settings?.newsletter?.listId
    const parsed = raw ? Number(raw) : NaN
    if (Number.isFinite(parsed) && parsed > 0) listId = parsed
  } catch (e) {
    // SiteSettings fetch failure is non-fatal — we can still try without listId
    console.warn('[newsletter] failed to read SiteSettings', e)
  }

  const doiTemplateId = Number(process.env.BREVO_DOI_TEMPLATE_ID || '')
  const doiRedirectUrl = process.env.BREVO_DOI_REDIRECT_URL

  const headers = {
    'api-key': apiKey,
    accept: 'application/json',
    'content-type': 'application/json',
  }

  // Path 1 — proper double opt-in (recommended, RGPD)
  if (
    listId &&
    Number.isFinite(doiTemplateId) &&
    doiTemplateId > 0 &&
    doiRedirectUrl
  ) {
    const res = await fetch(`${BREVO_API}/contacts/doubleOptinConfirmation`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        includeListIds: [listId],
        templateId: doiTemplateId,
        redirectionUrl: doiRedirectUrl,
      }),
    })
    if (res.status === 204 || res.ok) {
      return NextResponse.json({ ok: true, mode: 'double-opt-in' })
    }
    let detail: any = null
    try {
      detail = await res.json()
    } catch {
      detail = await res.text()
    }
    // 400 when contact already confirmed — treat as soft-success
    if (res.status === 400 && detail?.code === 'duplicate_parameter') {
      return NextResponse.json({ ok: true, mode: 'already-subscribed' })
    }
    return NextResponse.json(
      { error: 'brevo_error', status: res.status, detail },
      { status: 502 },
    )
  }

  // Path 2 — simple contact create (Brevo list DOI setting still applies if enabled in dashboard)
  const createRes = await fetch(`${BREVO_API}/contacts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      listIds: listId ? [listId] : [],
      updateEnabled: true,
    }),
  })
  if (createRes.ok || createRes.status === 201 || createRes.status === 204) {
    return NextResponse.json({ ok: true, mode: 'list-subscribe' })
  }
  let detail: any = null
  try {
    detail = await createRes.json()
  } catch {
    detail = await createRes.text()
  }
  if (createRes.status === 400 && detail?.code === 'duplicate_parameter') {
    return NextResponse.json({ ok: true, mode: 'already-subscribed' })
  }
  return NextResponse.json(
    { error: 'brevo_error', status: createRes.status, detail },
    { status: 502 },
  )
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/newsletter',
    method: 'POST',
    body: { email: 'string', locale: 'string (optional)' },
    note: 'Submit an email to subscribe via Brevo. Requires BREVO_API_KEY env + SiteSettings.newsletter.provider="brevo" + listId.',
  })
}
