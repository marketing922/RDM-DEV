type DisclaimerProps = {
  variant: 'full' | 'short' | 'minimal'
  dict: any
}

export function Disclaimer({ variant, dict }: DisclaimerProps) {
  if (variant === 'full') {
    return (
      <section className="bg-amber-50 border border-amber-200 rounded-xl p-8 my-12 max-w-4xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-[44px] h-[44px] flex items-center justify-center bg-amber-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <p className="text-base text-amber-700">
            {dict.legal.disclaimer.full}
          </p>
        </div>
      </section>
    )
  }

  if (variant === 'short') {
    return (
      <div className="bg-amber-50/60 border border-amber-200/40 rounded-lg px-4 py-3">
        <p className="font-sans text-xs text-amber-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {dict.legal.disclaimer.short}
        </p>
      </div>
    )
  }

  // minimal
  return (
    <div className="bg-neutral-50 border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <p className="font-sans text-xs text-neutral-400 text-center">
          {dict.legal.disclaimer.minimal}
        </p>
      </div>
    </div>
  )
}
