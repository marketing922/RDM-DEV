import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Custom login endpoint that adds an explicit "remember me" toggle on top of
 * Payload's default login flow. The Payload-native /api/users/login route is
 * left untouched for retro-compat; this one is wired into the custom Login
 * admin view and lets us extend the cookie lifetime when the user opts in.
 *
 * Request body: { email, password, rememberMe? }
 * Response 200: { user, exp } (token is returned in the HttpOnly cookie only)
 * Response 401: { error: 'invalid_credentials', message }
 */

const COOKIE_NAME = 'payload-token'

// 30 days when remember-me is checked, 1 day otherwise.
const MAX_AGE_REMEMBER_SECONDS = 60 * 60 * 24 * 30 // 2_592_000
const MAX_AGE_DEFAULT_SECONDS = 60 * 60 * 24 // 86_400

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const rememberMe = body?.rememberMe === true

  if (!email || !password) {
    return NextResponse.json(
      { error: 'invalid_credentials', message: 'Email ou mot de passe invalide' },
      { status: 401 },
    )
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    if (!result?.token || !result?.user) {
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Email ou mot de passe invalide' },
        { status: 401 },
      )
    }

    const maxAge = rememberMe ? MAX_AGE_REMEMBER_SECONDS : MAX_AGE_DEFAULT_SECONDS
    const isProd = process.env.NODE_ENV === 'production'
    const cookieParts = [
      `${COOKIE_NAME}=${result.token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${maxAge}`,
    ]
    if (isProd) cookieParts.push('Secure')
    const cookieValue = cookieParts.join('; ')

    const response = NextResponse.json({ user: result.user, exp: result.exp })
    response.headers.set('Set-Cookie', cookieValue)
    return response
  } catch (err: any) {
    // payload.login throws on invalid credentials / locked accounts. We map
    // anything that isn't an internal server hiccup to a 401 with a generic
    // message so we don't leak which side of the credential pair was wrong.
    const message = String(err?.message || '')
    const looksLikeAuthError =
      /credentials|password|locked|user|email|verification/i.test(message)

    if (looksLikeAuthError) {
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Email ou mot de passe invalide' },
        { status: 401 },
      )
    }

    return NextResponse.json(
      { error: 'internal', message: 'Erreur interne. Veuillez reessayer.' },
      { status: 500 },
    )
  }
}
