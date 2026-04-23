import type { SitePageDoc } from '@/lib/queries/sitePage'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import Reveal from '@/components/ui/Reveal'

type Props = {
  page: SitePageDoc
  locale: string
  homeLabel?: string
}

// Label affiché comme "eyebrow" au-dessus du titre — mappé par slug.
const EYEBROW_BY_SLUG: Record<string, string> = {
  'a-propos': 'Notre maison',
  contact: 'Nous écrire',
  faq: "En marge",
  cgv: 'Conditions',
  'mentions-legales': 'Mentions',
  'politique-confidentialite': 'Confidentialité',
  'politique-cookies': 'Cookies',
  'avertissement-sante': 'Avertissement',
  accessibilite: 'Accessibilité',
}

export function SitePageRenderer({ page, locale, homeLabel = 'Accueil' }: Props) {
  const blocks = Array.isArray(page.layout) ? page.layout : []
  const eyebrow = EYEBROW_BY_SLUG[page.slug as string] || 'Institutionnel'

  // Split title at word boundary to italicize the last word (almanach style).
  const renderTitle = (title: string) => {
    const parts = title.trim().split(' ')
    if (parts.length < 2) {
      return <>{title}</>
    }
    const last = parts.pop()!
    return (
      <>
        {parts.join(' ')}{' '}
        <em className="italic text-rm-burgundy">{last}</em>
      </>
    )
  }

  return (
    <main className="min-h-screen bg-rm-cream">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-6">
        <Breadcrumb
          items={[
            { label: homeLabel, href: `/${locale}` },
            { label: page.title || '' },
          ]}
        />

        {/* Header almanach */}
        <Reveal>
          <header className="mt-10 md:mt-14 mb-10 md:mb-14 text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-5">
              <span className="block w-7 h-px bg-rm-burgundy" />
              <span className="font-sans text-[11px] tracking-[0.25em] text-rm-burgundy uppercase">
                {eyebrow}
              </span>
              <span className="block w-7 h-px bg-rm-burgundy" />
            </div>
            {page.title && (
              <h1 className="font-display font-normal text-rm-teal leading-[1.05] tracking-[-0.02em] text-[36px] sm:text-[48px] md:text-[56px]">
                {renderTitle(page.title)}
              </h1>
            )}
            {page.intro && (
              <p className="font-serif italic text-[17px] md:text-[19px] leading-[1.55] text-rm-inkSoft mt-5">
                {page.intro}
              </p>
            )}
          </header>
        </Reveal>

        <div className="border-t border-dashed border-rm-rule mb-10 md:mb-14" />

        {/* Blocks content */}
        {blocks.length > 0 ? (
          <div className="space-y-10 md:space-y-14">
            <BlockRenderer blocks={blocks} locale={locale} />
          </div>
        ) : (
          <div className="border border-dashed border-rm-ruleStrong bg-rm-paper p-10 md:p-16 text-center max-w-2xl mx-auto">
            <p className="font-serif italic text-[16px] leading-[1.55] text-rm-inkSoft">
              Cette page est en cours de rédaction.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
