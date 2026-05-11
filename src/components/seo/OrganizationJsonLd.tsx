import { JsonLd } from './JsonLd'

/**
 * Schema.org Organization graph — single source of truth for structured data.
 *
 * Modèle : la SAS Calebasse (entité juridique mère) chapeaute deux marques :
 *   - Les Remèdes de Mamie (ce site, e-commerce phytothérapie)
 *   - Flore de France (marque sœur)
 * Le CEO est modélisé en `Person` reliée à Calebasse via `worksFor` + `founder`.
 *
 * À COMPLÉTER MANUELLEMENT (cherche `__TODO__` dans ce fichier) :
 *   - Nom du CEO et son URL LinkedIn
 *   - URL LinkedIn de Calebasse
 *   - URL LinkedIn de Les Remèdes de Mamie (si existe)
 *   - URL LinkedIn de Flore de France (si existe)
 *   - SIREN/SIRET, numéro de TVA
 *   - Date de fondation (foundingDate)
 */

const CLOUDINARY = 'https://res.cloudinary.com/laboratoire-calebasse/image/upload'

// IDs canoniques (réutilisés à travers le graph pour les références).
const ID = {
  calebasse: 'https://calebasse.com/#org',
  ceo: 'https://calebasse.com/#ceo',
  rdmBrand: 'https://www.lesremedesdmamie.fr/#brand',
  rdmOrg: 'https://www.lesremedesdmamie.fr/#org',
  flore: 'https://floredefrance.com/#org',
} as const

// Adresse postale partagée par les entités du groupe.
const SHARED_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: '15 rue de la Vistule',
  addressLocality: 'Paris',
  postalCode: '75013',
  addressCountry: 'FR',
} as const

// Email de contact général.
const CONTACT_EMAIL = 'communication@calebasse.com'

export function OrganizationJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lesremedesdmamie.fr'
  const logo = `${CLOUDINARY}/v1761315097/RM_logo_2297718b45.png`

  const graph = [
    // ── Société mère ───────────────────────────────────────────
    {
      '@type': 'Organization',
      '@id': ID.calebasse,
      name: 'Calebasse',
      legalName: 'SAS Calebasse',
      url: 'https://calebasse.com',
      logo: 'https://calebasse.com/logo.png', // __TODO__ remplacer par le vrai logo Calebasse si différent
      description:
        "Holding française qui édite des marques santé naturelle et bien-être autour des plantes — Laboratoire calebasse, Les Remèdes de Mamie, Flore de France.",
      address: SHARED_ADDRESS,
      email: CONTACT_EMAIL,
      foundingDate: '1997',
      // taxID: '__TODO__numéro de TVA intracommunautaire',
      // vatID: '__TODO__numéro de TVA intracommunautaire',
      // identifier: { '@type': 'PropertyValue', propertyID: 'SIREN', value: '__TODO__9 chiffres SIREN' },
      founder: { '@id': ID.ceo },
      employee: [{ '@id': ID.ceo }],
      subOrganization: [
        { '@id': ID.rdmBrand },
        { '@id': ID.flore },
      ],
      sameAs: [
        'https://www.linkedin.com/in/laboratoire-calebasse-1b254932b/'
      ],
    },

    // ── Dirigeant ──────────────────────────────────────────────
    {
      '@type': 'Person',
      '@id': ID.ceo,
      name: 'Ruosi WU',
      jobTitle: 'Président',
      worksFor: { '@id': ID.calebasse },
      sameAs: [
        // __TODO__ 'https://www.linkedin.com/in/<slug-ceo>'
      ],
    },

    // ── Marque éditée par ce site (Les Remèdes de Mamie) ──────
    {
      '@type': 'Organization',
      '@id': ID.rdmOrg,
      name: 'Les Remèdes de Mamie',
      legalName: 'SAS Calebasse',
      url: siteUrl,
      logo,
      image: logo,
      description:
        "Encyclopédie botanique et compléments alimentaires naturels à base de plantes. Tisanes, poudres et gélules fabriquées en France, plantes certifiées biologiques et conformes à la Pharmacopée européenne.",
      address: SHARED_ADDRESS,
      email: CONTACT_EMAIL,
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: CONTACT_EMAIL,
          availableLanguage: ['French', 'English'],
          areaServed: ['FR', 'EU'],
        },
      ],
      parentOrganization: { '@id': ID.calebasse },
      brand: { '@id': ID.rdmBrand },
      sameAs: [
        // __TODO__ 'https://www.linkedin.com/company/les-remedes-de-mamie'
        // __TODO__ 'https://www.instagram.com/lesremedesdemamie'
        // __TODO__ 'https://www.facebook.com/lesremedesdemamie'
      ],
    },

    // ── Brand alias (réutilisable depuis Product, Article…) ──
    {
      '@type': 'Brand',
      '@id': ID.rdmBrand,
      name: 'Les Remèdes de Mamie',
      logo,
      url: siteUrl,
      parentOrganization: { '@id': ID.calebasse },
    },

    // ── Marque sœur (Flore de France) ─────────────────────────
    {
      '@type': 'Organization',
      '@id': ID.flore,
      name: 'Flore de France',
      url: 'https://floredefrance.com',
      description: 'Marque sœur du groupe Calebasse, dédiée à la flore française traditionnelle.',
      address: SHARED_ADDRESS,
      parentOrganization: { '@id': ID.calebasse },
      sameAs: [
        // __TODO__ 'https://www.linkedin.com/company/flore-de-france'
      ],
    },

    // ── WebSite (search action conservée) ─────────────────────
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'Les Remèdes de Mamie',
      url: siteUrl,
      publisher: { '@id': ID.rdmOrg },
      inLanguage: ['fr-FR', 'en'],
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/fr/recherche?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ]

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': graph,
      }}
    />
  )
}
