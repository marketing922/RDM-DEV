import { NextResponse } from 'next/server'

/**
 * POST /api/contact
 * Body: { name, email, subject, message, honeypot?, locale? }
 *
 * Sends a notification email to CONTACT_TO_EMAIL via Brevo transactional API.
 * Requires BREVO_API_KEY env. CONTACT_TO_EMAIL defaults to
 * "contact@remedes-mamie.com". CONTACT_FROM_EMAIL defaults to the same
 * address (Brevo requires a verified sender domain).
 *
 * Anti-spam: honeypot field `honeypot` must be empty.
 */

const BREVO_API = 'https://api.brevo.com/v3'

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // Honeypot — must be empty (bots fill it)
  if (typeof body?.honeypot === 'string' && body.honeypot.trim() !== '') {
    // Silent accept — appear successful to bot while discarding
    return NextResponse.json({ ok: true, mode: 'silent' })
  }

  const name = String(body?.name || '').trim()
  const email = String(body?.email || '').trim().toLowerCase()
  const subject = String(body?.subject || '').trim()
  const message = String(body?.message || '').trim()

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: 'message_too_long' }, { status: 400 })
  }
  if (name.length > 200 || subject.length > 200) {
    return NextResponse.json({ error: 'field_too_long' }, { status: 400 })
  }

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'brevo_not_configured',
        detail: 'BREVO_API_KEY env var missing',
      },
      { status: 503 },
    )
  }

  const toEmail = process.env.CONTACT_TO_EMAIL || 'contact@remedes-mamie.com'
  const fromEmail = process.env.CONTACT_FROM_EMAIL || toEmail
  const fromName = 'Les Remèdes de Mamie'

  const htmlBody = `
    <div style="font-family: Inter, sans-serif; color: #2A3B40; line-height: 1.5;">
      <h2 style="color: #054A57; margin: 0 0 16px;">Nouveau message — Remèdes de Mamie</h2>
      <p style="margin: 0 0 6px;"><strong>De :</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <p style="margin: 0 0 6px;"><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
      <hr style="border: 0; border-top: 1px dashed #d9d3c1; margin: 16px 0;" />
      <div style="white-space: pre-wrap;">${escapeHtml(message)}</div>
      <hr style="border: 0; border-top: 1px dashed #d9d3c1; margin: 16px 0;" />
      <p style="font-size: 12px; color: #5F6F72; margin: 0;">
        Envoyé depuis le formulaire de contact du site.
      </p>
    </div>
  `.trim()

  const payloadBody = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: toEmail }],
    replyTo: { email, name },
    subject: `[Contact site] ${subject}`,
    htmlContent: htmlBody,
    textContent: `De: ${name} <${email}>\nSujet: ${subject}\n\n${message}`,
  }

  try {
    const res = await fetch(`${BREVO_API}/smtp/email`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadBody),
    })
    if (res.ok || res.status === 201) {
      return NextResponse.json({ ok: true, mode: 'sent' })
    }
    let detail: any = null
    try {
      detail = await res.json()
    } catch {
      detail = await res.text()
    }
    return NextResponse.json(
      { error: 'brevo_error', status: res.status, detail },
      { status: 502 },
    )
  } catch (e: any) {
    return NextResponse.json(
      { error: 'network_error', detail: e?.message || String(e) },
      { status: 502 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/contact',
    method: 'POST',
    body: {
      name: 'string',
      email: 'string (valid email)',
      subject: 'string',
      message: 'string (≤5000 chars)',
      honeypot: 'string (must be empty)',
    },
    requires: ['BREVO_API_KEY', 'CONTACT_TO_EMAIL (optional)', 'CONTACT_FROM_EMAIL (optional)'],
  })
}
