import type { ReactNode } from 'react'
import Link from 'next/link'

type CardProps = {
  className?: string
  children: ReactNode
  href?: string
}

export function Card({ className = '', children, href }: CardProps) {
  const cardClasses = `
    bg-white rounded-xl shadow overflow-hidden
    transition-all duration-slow
    hover:-translate-y-1 hover:shadow-lg
    ${className}
  `.trim()

  if (href) {
    return (
      <Link href={href} className={`block ${cardClasses}`}>
        {children}
      </Link>
    )
  }

  return (
    <div className={cardClasses}>
      {children}
    </div>
  )
}
