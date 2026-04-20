import type { ReactNode } from 'react'

type BadgeVariant =
  | 'bio'
  | 'promo'
  | 'nouveau'
  | 'tisane'
  | 'poudre'
  | 'gelule'
  | 'vegan'
  | 'sans-gluten'

type BadgeProps = {
  variant: BadgeVariant
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  bio: 'bg-green-50 text-green-700 border-green-200',
  promo: 'bg-red-50 text-red-700 border-red-200',
  nouveau: 'bg-blue-50 text-blue-700 border-blue-200',
  tisane: 'bg-neutral-50 text-neutral-500 border-neutral-200',
  poudre: 'bg-neutral-50 text-neutral-500 border-neutral-200',
  gelule: 'bg-neutral-50 text-neutral-500 border-neutral-200',
  vegan: 'bg-green-50 text-green-700 border-green-200',
  'sans-gluten': 'bg-amber-50 text-amber-700 border-amber-200',
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-sans text-xs font-medium px-2 py-[2px] rounded-full border ${variantStyles[variant]}`}
    >
      {children}
    </span>
  )
}
