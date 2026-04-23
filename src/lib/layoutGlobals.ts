import type { Payload } from 'payload'

export type NavigationData = {
  brand: { wordmark?: string; tagline?: string }
  links: Array<{ label: string; href: string; openInNewTab?: boolean }>
  ctaButton: { enabled: boolean; label?: string; href?: string; style?: 'primary' | 'ghost' }
}

export type FooterData = {
  columns: Array<{
    title: string
    links: Array<{ label: string; href: string; openInNewTab?: boolean }>
  }>
  socialLinks: Array<{ platform: string; url: string }>
  legalLinks: Array<{ label: string; href: string }>
  copyright: string
  newsletter: {
    enabled: boolean
    heading?: string
    subheading?: string
    ctaLabel?: string
    placeholder?: string
  }
}

export const DEFAULT_NAVIGATION: NavigationData = {
  brand: { wordmark: 'Les Remèdes de Mamie', tagline: 'Est. Paris · 2024' },
  links: [
    { label: 'Plantes', href: '/plantes' },
    { label: 'Bienfaits', href: '/bienfaits' },
    { label: 'Produits', href: '/produits' },
    { label: 'Journal', href: '/blog' },
    { label: 'À propos', href: '/a-propos' },
  ],
  ctaButton: { enabled: false },
}

export const DEFAULT_FOOTER: FooterData = {
  columns: [
    {
      title: 'Encyclopédie',
      links: [
        { label: 'Plantes', href: '/plantes' },
        { label: 'Bienfaits', href: '/bienfaits' },
        { label: 'Journal', href: '/blog' },
      ],
    },
    {
      title: 'Boutique',
      links: [{ label: 'Tous les produits', href: '/produits' }],
    },
    {
      title: 'La maison',
      links: [
        { label: 'À propos', href: '/a-propos' },
        { label: 'Contact', href: '/contact' },
        { label: 'FAQ', href: '/faq' },
      ],
    },
  ],
  socialLinks: [],
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
    subheading: 'Un e-mail mensuel avec des conseils.',
    ctaLabel: "S'inscrire",
    placeholder: 'Votre adresse e-mail',
  },
}

// Deep-merge with defaults for safety (localized fields may come as objects)
function localizedString(v: any, locale: string): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') {
    if (typeof v[locale] === 'string') return v[locale]
    if (typeof v.fr === 'string') return v.fr
    if (typeof v.en === 'string') return v.en
  }
  return ''
}

function normalizeLinks(
  raw: any,
  locale: string,
): Array<{ label: string; href: string; openInNewTab?: boolean }> {
  if (!Array.isArray(raw)) return []
  return raw
    .map((l: any) => ({
      label: localizedString(l?.label, locale),
      href: String(l?.href || ''),
      openInNewTab: Boolean(l?.openInNewTab),
    }))
    .filter((l) => l.label && l.href)
}

export async function loadNavigation(payload: Payload, locale = 'fr'): Promise<NavigationData> {
  try {
    const doc = (await payload.findGlobal({
      slug: 'navigation' as never,
      locale: locale as any,
      depth: 0,
    })) as any
    const normalizedLinks = normalizeLinks(doc?.links, locale)
    return {
      brand: {
        wordmark:
          localizedString(doc?.brand?.wordmark, locale) || DEFAULT_NAVIGATION.brand.wordmark,
        tagline: localizedString(doc?.brand?.tagline, locale) || DEFAULT_NAVIGATION.brand.tagline,
      },
      links: normalizedLinks.length > 0 ? normalizedLinks : DEFAULT_NAVIGATION.links,
      ctaButton: {
        enabled: Boolean(doc?.ctaButton?.enabled),
        label: localizedString(doc?.ctaButton?.label, locale) || 'Boutique',
        href: String(doc?.ctaButton?.href || '/produits'),
        style: (doc?.ctaButton?.style as 'primary' | 'ghost' | undefined) || 'primary',
      },
    }
  } catch {
    return DEFAULT_NAVIGATION
  }
}

export async function loadFooter(payload: Payload, locale = 'fr'): Promise<FooterData> {
  try {
    const doc = (await payload.findGlobal({
      slug: 'footer' as never,
      locale: locale as any,
      depth: 0,
    })) as any
    const columns = Array.isArray(doc?.columns)
      ? doc.columns
          .map((c: any) => ({
            title: localizedString(c?.title, locale),
            links: normalizeLinks(c?.links, locale),
          }))
          .filter((c: any) => c.title && c.links.length > 0)
      : []
    const socialLinks = Array.isArray(doc?.socialLinks)
      ? doc.socialLinks
          .map((s: any) => ({
            platform: String(s?.platform || ''),
            url: String(s?.url || ''),
          }))
          .filter((s: any) => s.platform && s.url)
      : []
    const legalLinks = normalizeLinks(doc?.legalLinks, locale)
    return {
      columns: columns.length ? columns : DEFAULT_FOOTER.columns,
      socialLinks,
      legalLinks: legalLinks.length ? legalLinks : DEFAULT_FOOTER.legalLinks,
      copyright: localizedString(doc?.copyright, locale) || DEFAULT_FOOTER.copyright,
      newsletter: {
        enabled: doc?.newsletter?.enabled !== false,
        heading:
          localizedString(doc?.newsletter?.heading, locale) || DEFAULT_FOOTER.newsletter.heading,
        subheading:
          localizedString(doc?.newsletter?.subheading, locale) ||
          DEFAULT_FOOTER.newsletter.subheading,
        ctaLabel:
          localizedString(doc?.newsletter?.ctaLabel, locale) || DEFAULT_FOOTER.newsletter.ctaLabel,
        placeholder:
          localizedString(doc?.newsletter?.placeholder, locale) ||
          DEFAULT_FOOTER.newsletter.placeholder,
      },
    }
  } catch {
    return DEFAULT_FOOTER
  }
}
