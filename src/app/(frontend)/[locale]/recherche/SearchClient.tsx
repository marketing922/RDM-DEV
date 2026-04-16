'use client'

import { useState } from 'react'

type SearchClientProps = {
  dict: Record<string, any>
}

export function SearchClient({ dict }: SearchClientProps) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const tabs = dict.search.tabs as Record<string, string>

  return (
    <section className="py-4xl">
      <div className="max-w-3xl mx-auto px-lg">
        <div className="text-center mb-2xl">
          <h1 className="font-heading text-display text-neutral-600 mb-lg">
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
              className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.search.placeholder}
              className="w-full h-14 pl-14 pr-5 text-lg bg-white border-2 border-neutral-200 rounded-full font-body text-neutral-600 placeholder:text-neutral-300 focus:outline-none focus:border-brand focus:ring-0 transition-colors duration-200"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-sm mb-2xl">
          {Object.entries(tabs).map(([key, label]) => (
            <button
              key={String(key)}
              onClick={() => setActiveTab(key)}
              className={`
                px-lg py-sm rounded-full font-ui text-body-sm font-medium
                transition-all duration-200
                ${
                  activeTab === key
                    ? 'bg-brand text-white'
                    : 'bg-white text-neutral-400 border border-neutral-200 hover:border-brand hover:text-brand'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Results area */}
        <div className="text-center py-3xl">
          {query.trim() === '' ? (
            <div className="space-y-md">
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
                className="text-neutral-200 mx-auto"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="font-body text-body text-neutral-300">
                {dict.search.placeholder}
              </p>
            </div>
          ) : (
            <div className="space-y-md">
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
                className="text-neutral-200 mx-auto"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="15" x2="16" y2="15" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              <p className="font-body text-body text-neutral-400">
                {dict.search.noResults}{' '}
                <span className="font-medium text-neutral-600">&ldquo;{query}&rdquo;</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
