'use client'

import { useState } from 'react'

type SearchClientProps = {
  dict: Record<string, any>
}

export function SearchClient({ dict }: SearchClientProps) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const allTabs = dict.search.tabs as Record<string, string>
  // Phase 1: exclude product-related tabs
  const { products, ...tabs } = allTabs

  return (
    <section className="py-16 bg-[#FFF5D5]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="font-heading text-4xl font-bold text-[#054A57] mb-6">
            {dict.search.title}
          </h1>

          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-5 top-1/2 -translate-y-1/2 text-[#DCD8C7]"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.search.placeholder}
              className="w-full h-14 pl-14 pr-5 text-lg bg-[#FEF9E9] border-2 border-[#DCD8C7] rounded-full font-body text-[#054A57] placeholder:text-[#DCD8C7] focus:outline-none focus:border-[#A2211E] focus:ring-2 focus:ring-[#A2211E]/20 transition-colors duration-200"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-3 mb-10">
          {Object.entries(tabs).map(([key, label]) => (
            <button
              key={String(key)}
              onClick={() => setActiveTab(key)}
              className={`
                px-5 py-2 rounded-full text-sm font-medium
                transition-all duration-200
                ${
                  activeTab === key
                    ? 'bg-[#A2211E] text-white'
                    : 'bg-[#FEF9E9] text-[#054A57] border border-[#DCD8C7] hover:border-[#A2211E] hover:text-[#A2211E]'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Results area */}
        <div className="text-center py-12">
          {query.trim() === '' ? (
            <div className="space-y-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#DCD8C7] mx-auto"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="font-body text-base text-[#712E2F]">
                {dict.search.placeholder}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#DCD8C7] mx-auto"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="15" x2="16" y2="15" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              <p className="font-body text-base text-[#712E2F]">
                {dict.search.noResults}{' '}
                <span className="font-medium text-[#054A57]">&ldquo;{query}&rdquo;</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
