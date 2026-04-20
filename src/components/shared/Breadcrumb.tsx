import Link from 'next/link'

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbProps = {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="py-3">
        <ol className="flex items-center text-sm gap-0">
          {items.map((item, index) => {
            const isLast = index === items.length - 1

            return (
              <li key={index} className="flex items-center whitespace-nowrap">
                {index > 0 && (
                  <span className="text-[#DCD8C7] mx-2">/</span>
                )}
                {isLast || !item.href ? (
                  <span className="text-[#054A57] font-medium" aria-current={isLast ? 'page' : undefined}>
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-[#712E2F]/50 hover:text-[#A2211E] transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
