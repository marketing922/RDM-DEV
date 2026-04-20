'use client'

import { useState, useMemo } from 'react'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type FaqItem = {
  question: string
  answer: string
  category: string
}

type FaqClientProps = {
  dict: Record<string, any>
  locale: string
}

export function FaqClient({ dict, locale }: FaqClientProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = dict.faq.categories as Record<string, string>
  const items = (dict.faq.items || []) as FaqItem[]

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      const matchesSearch =
        searchQuery === '' ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [items, activeCategory, searchQuery])

  return (
    <main className="min-h-screen bg-[#FEF9E9]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <Breadcrumb
          items={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: dict.faq.title },
          ]}
        />

        {/* Header */}
        <div className="text-center mt-10 mb-10">
          <h1 className="text-4xl font-bold text-[#054A57]">
            {dict.faq.title}
          </h1>
          <p className="mt-3 text-lg text-[#712E2F]/70 max-w-2xl mx-auto">
            {dict.faq.subtitle}
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-8">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#712E2F]/40"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={dict.faq.searchPlaceholder}
              className="w-full h-12 pl-12 pr-4 bg-white border border-[#DCD8C7] rounded-full text-[#054A57] placeholder:text-[#712E2F]/40 focus:outline-none focus:ring-2 focus:ring-[#A2211E]/20 focus:border-[#A2211E] transition-all"
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(categories).map(([key, label]) => (
            <button
              type="button"
              key={String(key)}
              onClick={() => setActiveCategory(key)}
              className={`inline-flex items-center h-9 px-5 rounded-full text-sm font-medium transition-all ${
                activeCategory === key
                  ? 'bg-[#A2211E] text-white shadow-sm'
                  : 'bg-white text-[#054A57] border border-[#DCD8C7] hover:border-[#A2211E] hover:text-[#A2211E]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Accordion items */}
        <div className="space-y-3">
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#712E2F]/50 text-lg">Aucun r&eacute;sultat trouv&eacute;</p>
            </div>
          )}
          {filteredItems.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <div
                key={index}
                className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
                  isOpen ? 'border-[#A2211E] shadow-md' : 'border-[#DCD8C7]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                  aria-expanded={isOpen ? 'true' : 'false'}
                >
                  <span
                    className={`font-semibold pr-4 ${
                      isOpen ? 'text-[#A2211E]' : 'text-[#054A57]'
                    }`}
                  >
                    {item.question}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-[#A2211E]' : 'text-[#DCD8C7]'
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-5 pb-5">
                    <div className="border-t border-[#DCD8C7]/50 pt-4">
                      <p className="text-[#712E2F]/70 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
