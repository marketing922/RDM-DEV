import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { Card } from '@/components/ui/Card'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return {
    title: dict.about.title,
    description: dict.about.subtitle,
  }
}

const valueIcons: Record<string, ReactNode> = {
  natural: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
      <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z" />
      <path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </svg>
  ),
  france: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  ancestral: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  quality: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const values = ['natural', 'france', 'ancestral', 'quality'] as const
  const timelineItems = dict.about.timeline.items || []
  const teamMembers = dict.about.team.members || []
  const figureItems = dict.about.figures.items || []

  return (
    <>
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-lg">
          <Breadcrumb
            items={[
              { label: dict.nav.home, href: `/${locale}` },
              { label: dict.about.title },
            ]}
          />
        </div>
      </section>

      {/* Hero */}
      <section className="py-5xl bg-gradient-to-b from-page to-white">
        <div className="max-w-7xl mx-auto px-lg text-center">
          <h1 className="font-heading text-display text-neutral-600 mb-md">
            {dict.about.title}
          </h1>
          <p className="font-body text-body-lg text-neutral-400 max-w-2xl mx-auto">
            {dict.about.subtitle}
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-4xl bg-white">
        <div className="max-w-7xl mx-auto px-lg">
          <h2 className="font-heading text-h2 text-neutral-600 text-center mb-2xl">
            {dict.about.values.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
            {values.map((key) => (
              <Card key={String(key)} className="p-xl text-center hover:translate-y-0">
                <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-md">
                  {valueIcons[key]}
                </div>
                <h3 className="font-ui font-medium text-neutral-600 mb-xs">
                  {dict.about.values[key].title}
                </h3>
                <p className="font-body text-body-sm text-neutral-400">
                  {dict.about.values[key].description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-4xl bg-page">
        <div className="max-w-3xl mx-auto px-lg">
          <h2 className="font-heading text-h2 text-neutral-600 text-center mb-2xl">
            {dict.about.timeline.title}
          </h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200 sm:left-6" />

            <div className="space-y-xl">
              {timelineItems.map(
                (
                  item: { year: string; title: string; description: string },
                  index: number,
                ) => (
                  <div key={index} className="relative pl-12 sm:pl-16">
                    {/* Dot */}
                    <div className="absolute left-2.5 top-1 w-3 h-3 bg-brand rounded-full border-2 border-white shadow sm:left-4.5" />
                    <div className="bg-white rounded-xl p-lg shadow-sm">
                      <span className="inline-block font-ui text-body-sm font-medium text-brand bg-brand-light px-md py-xs rounded-full mb-sm">
                        {item.year}
                      </span>
                      <h3 className="font-ui font-medium text-neutral-600 mb-xs">
                        {item.title}
                      </h3>
                      <p className="font-body text-body-sm text-neutral-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-4xl bg-white">
        <div className="max-w-7xl mx-auto px-lg">
          <h2 className="font-heading text-h2 text-neutral-600 text-center mb-2xl">
            {dict.about.team.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg max-w-3xl mx-auto">
            {teamMembers.map(
              (member: { name: string; role: string }, index: number) => (
                <Card key={index} className="p-xl text-center hover:translate-y-0">
                  {/* Avatar placeholder */}
                  <div className="w-20 h-20 bg-neutral-100 rounded-full mx-auto mb-md flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-neutral-300"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h3 className="font-ui font-medium text-neutral-600 mb-xs">
                    {member.name}
                  </h3>
                  <p className="font-body text-body-sm text-neutral-400">
                    {member.role}
                  </p>
                </Card>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Figures */}
      <section className="py-4xl bg-brand">
        <div className="max-w-7xl mx-auto px-lg">
          <h2 className="font-heading text-h2 text-white text-center mb-2xl">
            {dict.about.figures.title}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg">
            {figureItems.map(
              (item: { value: string; label: string }, index: number) => (
                <div key={index} className="text-center">
                  <div className="font-heading text-display text-white mb-xs">
                    {item.value}
                  </div>
                  <div className="font-ui text-body text-white/80">
                    {item.label}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <div className="h-14 lg:hidden" />
    </>
  )
}
