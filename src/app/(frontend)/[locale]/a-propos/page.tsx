import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

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
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A2211E]">
      <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z" />
      <path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </svg>
  ),
  france: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A2211E]">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  ancestral: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A2211E]">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  quality: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#D0802C]">
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
      <section className="bg-[#FEF9E9] border-b border-[#DCD8C7]">
        <div className="max-w-7xl mx-auto px-6">
          <Breadcrumb
            items={[
              { label: dict.nav.home, href: `/${locale}` },
              { label: dict.about.title },
            ]}
          />
        </div>
      </section>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-[#FFF5D5] to-[#FEF9E9]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#054A57] mb-4">
            {dict.about.title}
          </h1>
          <p className="font-body text-lg text-[#712E2F]/70 max-w-2xl mx-auto">
            {dict.about.subtitle}
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-[#FEF9E9]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-heading text-3xl font-bold text-[#054A57] text-center mb-12">
            {dict.about.values.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((key) => (
              <div key={String(key)} className="bg-white rounded-2xl border border-[#DCD8C7] p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-[#FFF5D5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {valueIcons[key]}
                </div>
                <h3 className="font-semibold text-[#054A57] mb-2">
                  {dict.about.values[key].title}
                </h3>
                <p className="font-body text-sm text-[#712E2F]/70">
                  {dict.about.values[key].description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-[#FFF5D5]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-heading text-3xl font-bold text-[#054A57] text-center mb-12">
            {dict.about.timeline.title}
          </h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#DCD8C7] sm:left-6" />

            <div className="space-y-8">
              {timelineItems.map(
                (
                  item: { year: string; title: string; description: string },
                  index: number,
                ) => (
                  <div key={index} className="relative pl-12 sm:pl-16">
                    {/* Dot */}
                    <div className="absolute left-2.5 top-1 w-3 h-3 bg-[#A2211E] rounded-full border-2 border-[#FEF9E9] shadow sm:left-4.5" />
                    <div className="bg-[#FEF9E9] rounded-xl p-6 shadow-sm border border-[#DCD8C7]">
                      <span className="inline-block font-semibold text-sm text-[#A2211E] bg-[#FFF5D5] px-3 py-1 rounded-full mb-3">
                        {item.year}
                      </span>
                      <h3 className="font-semibold text-[#054A57] mb-1">
                        {item.title}
                      </h3>
                      <p className="font-body text-sm text-[#712E2F]/70">
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
      <section className="py-16 bg-[#FEF9E9]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-heading text-3xl font-bold text-[#054A57] text-center mb-12">
            {dict.about.team.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {teamMembers.map(
              (member: { name: string; role: string }, index: number) => (
                <div key={index} className="bg-white rounded-2xl border border-[#DCD8C7] p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                  {/* Avatar placeholder */}
                  <div className="w-20 h-20 bg-[#FFF5D5] rounded-full mx-auto mb-4 flex items-center justify-center">
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
                      className="text-[#D0802C]"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[#054A57] mb-1">
                    {member.name}
                  </h3>
                  <p className="font-body text-sm text-[#712E2F]/70">
                    {member.role}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Figures */}
      <section className="py-16 bg-[#054A57]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-heading text-3xl font-bold text-[#FEF9E9] text-center mb-12">
            {dict.about.figures.title}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {figureItems.map(
              (item: { value: string; label: string }, index: number) => (
                <div key={index} className="text-center">
                  <div className="font-heading text-4xl md:text-5xl font-bold text-[#FEF9E9] mb-2">
                    {item.value}
                  </div>
                  <div className="font-body text-base text-[#FEF9E9]/80">
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
