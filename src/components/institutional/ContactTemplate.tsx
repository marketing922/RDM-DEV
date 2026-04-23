import React from 'react'
import Reveal from '@/components/ui/Reveal'
import { InstitBreadcrumb, InstitHeader } from './primitives'
import ContactFormAlmanach from '@/components/contact/ContactFormAlmanach'

type Props = { locale: string; homeLabel: string }

const COORDS = [
  {
    k: 'Courriel',
    v: 'contact@remedes-mamie.com',
    href: 'mailto:contact@remedes-mamie.com',
  },
  { k: 'Téléphone', v: '01 45 85 88 00', href: 'tel:+33145858800' },
] as const

export default function ContactTemplate({ locale, homeLabel }: Props) {
  return (
    <main className="min-h-screen bg-rm-cream text-rm-ink font-sans">
      <InstitBreadcrumb
        crumbs={[{ label: homeLabel, href: `/${locale}` }, { label: 'Contact' }]}
        locale={locale}
      />
      <InstitHeader
        chapter="Correspondance"
        title="Écrivez-nous."
        intro="Question botanique, suggestion de plante, demande presse — nous lisons tout, nous répondons sous 48h."
      />

      <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-16 md:py-20 pb-24 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16">
        {/* ── Formulaire ── */}
        <Reveal>
          <div>
            <div className="font-mono text-[11px] text-rm-burgundy tracking-[0.15em] mb-2">
              FORMULAIRE · N° 01
            </div>
            <h2 className="font-display text-[32px] md:text-[38px] text-rm-teal font-normal m-0 mb-7 tracking-[-0.01em]">
              Votre message
            </h2>
            <ContactFormAlmanach locale={locale} />
          </div>
        </Reveal>

        {/* ── Card coordonnées ── */}
        <Reveal delay={150}>
          <aside className="bg-rm-paper border border-rm-rule px-7 md:px-8 py-8 md:py-9 h-fit">
            <div className="font-mono text-[11px] text-rm-burgundy tracking-[0.15em] mb-2">
              COORDONNÉES
            </div>
            <h3 className="font-display text-[24px] md:text-[28px] text-rm-teal font-normal m-0 mb-6">
              La maison d'édition
            </h3>

            <dl className="border-t border-rm-rule pt-[18px]">
              {COORDS.map((r) => (
                <div
                  key={r.k}
                  className="py-3 border-b border-dashed border-rm-rule flex justify-between items-baseline gap-4"
                >
                  <dt className="text-[11px] tracking-[0.12em] text-rm-inkSoft uppercase font-semibold">
                    {r.k}
                  </dt>
                  <dd className="font-serif text-[14px] text-rm-teal text-right">
                    <a
                      href={r.href}
                      className="hover:text-rm-burgundy transition-colors"
                    >
                      {r.v}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="font-mono text-[11px] text-rm-burgundy tracking-[0.15em] mt-7 mb-2">
              Siège social
            </div>
            <address className="font-serif text-[15px] leading-[1.7] text-rm-ink not-italic">
              SAS CALEBASSE
              <br />
              15 rue de la Vistule
              <br />
              75013 Paris · France
            </address>

            <div className="font-mono text-[11px] text-rm-burgundy tracking-[0.15em] mt-5 mb-2">
              Adresse postale
            </div>
            <address className="font-serif text-[15px] leading-[1.7] text-rm-ink not-italic">
              Les Remèdes de Mamie
              <br />
              58 rue Etienne Dolet
              <br />
              92240 Malakoff · France
            </address>

            <div className="font-mono text-[11px] text-rm-burgundy tracking-[0.15em] mt-7 mb-2.5">
              DÉLAI DE RÉPONSE
            </div>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="block w-2.5 h-2.5 rounded-full bg-[#6A9A5E]"
              />
              <span className="text-[13px] text-rm-ink">
                Sous <strong>48 heures ouvrées</strong> en moyenne.
              </span>
            </div>
          </aside>
        </Reveal>
      </div>
    </main>
  )
}
