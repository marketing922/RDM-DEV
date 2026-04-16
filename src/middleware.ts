import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MAINTENANCE_MODE = true

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow Payload admin and API routes through even in maintenance
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
    if (pathname.startsWith('/admin')) {
      return NextResponse.next()
    }
    return NextResponse.next()
  }

  // Redirect /{locale}/admin to /admin
  const localeAdminMatch = pathname.match(/^\/(fr|en)\/admin(\/.*)?$/)
  if (localeAdminMatch) {
    const rest = localeAdminMatch[2] || ''
    return NextResponse.redirect(new URL(`/admin${rest}`, request.url))
  }

  // Maintenance mode: redirect everything else to /maintenance
  if (MAINTENANCE_MODE && pathname !== '/maintenance') {
    return NextResponse.rewrite(new URL('/maintenance', request.url))
  }

  // Normal mode below (when MAINTENANCE_MODE = false)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/fr', request.url))
  }

  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self'; connect-src 'self' https://plausible.io; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  )

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|favicon\\.svg|apple-touch-icon\\.png|site\\.webmanifest|robots\\.txt|sitemap\\.xml).*)',
  ],
}
