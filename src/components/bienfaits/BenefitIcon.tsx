import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function pascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join('')
}

type Props = {
  name?: string | null
  className?: string
  strokeWidth?: number
  ariaLabel?: string
}

export default function BenefitIcon({
  name,
  className = 'h-6 w-6',
  strokeWidth = 1.6,
  ariaLabel,
}: Props) {
  const key = name ? pascalCase(name) : 'Leaf'
  const Icon =
    ((LucideIcons as unknown as Record<string, LucideIcon>)[key] as
      | LucideIcon
      | undefined) ?? LucideIcons.Leaf
  return (
    <Icon
      className={className}
      strokeWidth={strokeWidth}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    />
  )
}
