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
  bio: 'bg-success-bg text-success-text border-success-border',
  promo: 'bg-error-bg text-error-text border-error-border',
  nouveau: 'bg-info-bg text-info-text border-info-border',
  tisane: 'bg-neutral-50 text-neutral-400 border-neutral-200',
  poudre: 'bg-neutral-50 text-neutral-400 border-neutral-200',
  gelule: 'bg-neutral-50 text-neutral-400 border-neutral-200',
  vegan: 'bg-success-bg text-success-text border-success-border',
  'sans-gluten': 'bg-warning-bg text-warning-text border-warning-border',
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-ui text-caption font-medium px-xs py-[2px] rounded-pill border ${variantStyles[variant]}`}
    >
      {children}
    </span>
  )
}
