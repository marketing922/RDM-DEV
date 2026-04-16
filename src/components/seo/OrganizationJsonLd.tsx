import { JsonLd } from './JsonLd'

export function OrganizationJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remedes-mamie.com'

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Les Remèdes de Mamie',
        legalName: 'SAS CALEBASSE',
        url: siteUrl,
        logo: `${siteUrl}/images/logo.png`,
        description: 'Compléments alimentaires naturels à base de plantes. Tisanes, poudres et gélules fabriquées en France.',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '15 rue de la Vistule',
          addressLocality: 'Paris',
          postalCode: '75013',
          addressCountry: 'FR',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+33145858800',
          contactType: 'customer service',
          availableLanguage: ['French', 'English'],
        },
        sameAs: [],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Les Remèdes de Mamie',
        url: siteUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/fr/recherche?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      }} />
    </>
  )
}
