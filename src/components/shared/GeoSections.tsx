import React from 'react'

type FaqItem = { question?: string; answer?: string }
type Takeaway = { takeaway?: string }
type Source = {
  title?: string
  publisher?: string
  year?: number
  url?: string
}

type GeoSectionsProps = {
  directAnswer?: string
  keyTakeaways?: Takeaway[]
  faq?: FaqItem[]
  sources?: Source[]
}

export function DirectAnswerBox({ text }: { text?: string }) {
  if (!text) return null
  return (
    <section
      className="mt-8 rounded-2xl border border-[#DCD8C7] bg-gradient-to-br from-[#FEF9E9] to-[#FFF5D5] p-6 sm:p-7"
      aria-label="Réponse directe"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#054A57]/10 text-[#054A57]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </span>
        <div className="flex-1">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#054A57]">
            En bref
          </p>
          <p className="text-base leading-relaxed text-[#1F2937]">{text}</p>
        </div>
      </div>
    </section>
  )
}

export function KeyTakeawaysBox({ items }: { items?: Takeaway[] }) {
  const list = (items ?? []).map((i) => i?.takeaway).filter(Boolean) as string[]
  if (list.length === 0) return null
  return (
    <section
      className="mt-8 rounded-2xl border border-[#DCD8C7] bg-white p-6 sm:p-7"
      aria-label="Points-clés"
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D0802C]/15 text-[#D0802C]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </span>
        <h2 className="text-xl font-bold text-[#054A57]">À retenir</h2>
      </div>
      <ul className="space-y-3">
        {list.map((t, i) => (
          <li key={i} className="flex items-start gap-3 text-[#1F2937]">
            <span
              aria-hidden
              className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#A2211E]"
            />
            <span className="leading-relaxed">{t}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function FaqAccordion({ items }: { items?: FaqItem[] }) {
  const list = (items ?? []).filter((i) => i?.question && i?.answer) as Array<{
    question: string
    answer: string
  }>
  if (list.length === 0) return null
  return (
    <section
      className="mt-10 rounded-2xl border border-[#DCD8C7] bg-white p-6 sm:p-8"
      aria-label="Questions fréquentes"
    >
      <div className="mb-6 flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#A2211E]/10 text-[#A2211E]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
        <h2 className="text-xl font-bold text-[#054A57]">Questions fréquentes</h2>
      </div>
      <div className="space-y-3">
        {list.map((f, i) => (
          <details
            key={i}
            className="group overflow-hidden rounded-xl border border-[#DCD8C7] bg-[#FEF9E9] transition-colors open:border-[#A2211E]/30"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 list-none [&::-webkit-details-marker]:hidden">
              <span className="font-semibold text-[#054A57]">{f.question}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0 text-[#A2211E] transition-transform duration-200 group-open:rotate-180"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="border-t border-[#DCD8C7] bg-white px-5 py-4 text-[15px] leading-relaxed text-[#374151]">
              {f.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

export function SourcesList({ items }: { items?: Source[] }) {
  const list = (items ?? []).filter((s) => s?.title || s?.url) as Source[]
  if (list.length === 0) return null
  return (
    <section
      className="mt-10 rounded-2xl border border-[#DCD8C7] bg-[#FEF9E9] p-6 sm:p-7"
      aria-label="Sources citées"
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6B7280]/10 text-[#054A57]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </span>
        <h2 className="text-base font-bold uppercase tracking-wider text-[#054A57]">
          Sources
        </h2>
      </div>
      <ol className="space-y-2 text-sm text-[#374151]">
        {list.map((s, i) => {
          const label = [s.title, s.publisher && `— ${s.publisher}`, s.year && `(${s.year})`]
            .filter(Boolean)
            .join(' ')
          return (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 font-semibold text-[#A2211E]">[{i + 1}]</span>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-[#054A57] underline decoration-[#DCD8C7] underline-offset-2 hover:text-[#A2211E] hover:decoration-[#A2211E]"
                >
                  {label || s.url}
                </a>
              ) : (
                <span>{label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default function GeoSections({
  directAnswer,
  keyTakeaways,
  faq,
  sources,
}: GeoSectionsProps) {
  return (
    <>
      <DirectAnswerBox text={directAnswer} />
      <KeyTakeawaysBox items={keyTakeaways} />
      <FaqAccordion items={faq} />
      <SourcesList items={sources} />
    </>
  )
}
