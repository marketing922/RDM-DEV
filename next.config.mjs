import { withPayload } from '@payloadcms/next/withPayload'

const csp = [
  "default-src 'self'",
  // 'unsafe-eval' retiré : CustomCodeBlock n'évalue plus de JS utilisateur.
  // 'unsafe-inline' conservé tant que tous les <style> ne sont pas migrés en
  // CSS module / nonce-based — étape suivante du hardening.
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.cloudinary.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
  "connect-src 'self' https://*.brevo.com https://api.anthropic.com https://api.openai.com https://res.cloudinary.com",
  "frame-ancestors 'self'",
  "frame-src 'self' https://js.stripe.com https://www.youtube.com https://player.vimeo.com",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withPayload(nextConfig)
