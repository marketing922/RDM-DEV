import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'

const NAVIGATION_SEED = {
  brand: { wordmark: 'Les Remèdes de Mamie', tagline: 'Est. Paris · 2024' },
  links: [
    { label: 'Plantes', href: '/plantes', openInNewTab: false },
    { label: 'Bienfaits', href: '/bienfaits', openInNewTab: false },
    { label: 'Produits', href: '/produits', openInNewTab: false },
    { label: 'Journal', href: '/blog', openInNewTab: false },
    { label: 'À propos', href: '/a-propos', openInNewTab: false },
  ],
  ctaButton: { enabled: false, label: 'Boutique', href: '/produits', style: 'primary' },
}

const FOOTER_SEED = {
  columns: [
    { title: 'Encyclopédie', links: [
      { label: 'Plantes', href: '/plantes', openInNewTab: false },
      { label: 'Bienfaits', href: '/bienfaits', openInNewTab: false },
      { label: 'Journal', href: '/blog', openInNewTab: false },
    ] },
    { title: 'Boutique', links: [
      { label: 'Tous les produits', href: '/produits', openInNewTab: false },
      { label: 'Tisanes', href: '/produits?filter=tisanes', openInNewTab: false },
    ] },
    { title: 'La maison', links: [
      { label: 'À propos', href: '/a-propos', openInNewTab: false },
      { label: 'Contact', href: '/contact', openInNewTab: false },
      { label: 'FAQ', href: '/faq', openInNewTab: false },
    ] },
  ],
  socialLinks: [
    { platform: 'instagram', url: 'https://instagram.com/lesremedesdemamie' },
  ],
  legalLinks: [
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: 'CGV', href: '/cgv' },
    { label: 'Confidentialité', href: '/politique-confidentialite' },
    { label: 'Cookies', href: '/politique-cookies' },
    { label: 'Accessibilité', href: '/accessibilite' },
  ],
  copyright: '© 2026 Les Remèdes de Mamie. Tous droits réservés.',
  newsletter: {
    enabled: true,
    heading: 'Recevez nos remèdes',
    subheading: 'Un e-mail mensuel avec des conseils, de nouvelles fiches et des recettes.',
    ctaLabel: "S'inscrire",
    placeholder: 'Votre adresse e-mail',
  },
}

export async function GET(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const h = await getHeaders()
    const { user } = await payload.auth({ headers: h })
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    if (url.searchParams.get('confirm') !== 'yes') {
      return NextResponse.json({
        info: 'Dry run — ajoutez ?confirm=yes pour semer navigation + footer avec les valeurs par défaut.',
        willSeed: ['navigation', 'footer'],
      })
    }

    // Idempotent: only update if the current global has no links/columns
    const results: any = {}
    try {
      const navCurrent = (await payload.findGlobal({ slug: 'navigation' as any })) as any
      if (!Array.isArray(navCurrent?.links) || navCurrent.links.length === 0) {
        const updated = await payload.updateGlobal({
          slug: 'navigation' as any,
          data: NAVIGATION_SEED as any,
          overrideAccess: true,
        })
        results.navigation = { status: 'seeded', id: (updated as any)?.id }
      } else {
        results.navigation = { status: 'skipped (already populated)' }
      }
    } catch (e: any) {
      results.navigation = { error: e?.message }
    }

    try {
      const footerCurrent = (await payload.findGlobal({ slug: 'footer' as any })) as any
      if (!Array.isArray(footerCurrent?.columns) || footerCurrent.columns.length === 0) {
        const updated = await payload.updateGlobal({
          slug: 'footer' as any,
          data: FOOTER_SEED as any,
          overrideAccess: true,
        })
        results.footer = { status: 'seeded', id: (updated as any)?.id }
      } else {
        results.footer = { status: 'skipped (already populated)' }
      }
    } catch (e: any) {
      results.footer = { error: e?.message }
    }

    return NextResponse.json(results)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'seed failed' }, { status: 500 })
  }
}
