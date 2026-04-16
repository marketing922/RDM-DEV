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
    <>
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-lg">
          <Breadcrumb
            items={[
              { label: dict.nav.home, href: `/${locale}` },
              { label: dict.faq.title },
            ]}
          />
        </div>
      </section>

      <section className="py-4xl">
        <div className="max-w-3xl mx-auto px-lg">
          <div className="text-center mb-2xl">
            <h1 className="font-heading text-display text-neutral-600 mb-xs">
              {dict.faq.title}
            </h1>
            <p className="font-body text-body-lg text-neutral-400 max-w-2xl mx-auto">
              {dict.faq.subtitle}
            </p>
          </div>

          {/* Search bar */}
          <div className="mb-xl">
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
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={dict.faq.searchPlaceholder}
                className="w-full h-12 pl-12 pr-4 bg-white border border-neutral-200 rounded-full font-body text-body text-neutral-600 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200"
              />
            </div>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-sm mb-xl">
            {Object.entries(categories).map(([key, label]) => (
              <button
                key={String(key)}
                onClick={() => setActiveCategory(key)}
                className={`
                  px-lg py-sm rounded-full font-ui text-body-sm font-medium
                  transition-all duration-200
                  ${
                    activeCategory === key
                      ? 'bg-brand text-white'
                      : 'bg-white text-neutral-400 border border-neutral-200 hover:border-brand hover:text-brand'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Accordion items */}
          <div className="space-y-sm">
            {filteredItems.map((item, index) => {
              const isOpen = openIndex === index

              return (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-neutral-100 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-lg text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-ui font-medium text-neutral-600 pr-md">
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
                      className={`text-neutral-300 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
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
                    <div className="px-lg pb-lg">
                      <p className="font-body text-body text-neutral-400 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="h-14 lg:hidden" />
    </>
  )
}
