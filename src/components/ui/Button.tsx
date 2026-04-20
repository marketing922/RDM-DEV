import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'pill'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#A2211E] text-white hover:bg-[#712E2F] active:scale-[0.97] shadow-sm hover:shadow-md',
  secondary:
    'bg-transparent text-[#A2211E] border-2 border-[#A2211E] hover:bg-[#A2211E] hover:text-white active:scale-[0.97]',
  ghost:
    'bg-transparent text-neutral-500 hover:bg-neutral-50 active:bg-neutral-100',
  icon:
    'bg-transparent text-neutral-400 hover:bg-neutral-50 hover:text-[#A2211E] rounded-full active:scale-[0.93]',
  pill:
    'bg-[#FEF2F2] text-[#A2211E] hover:bg-[#A2211E] hover:text-white rounded-full active:scale-[0.97]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-[36px] px-4 text-sm',
  md: 'h-[44px] px-6 text-base',
  lg: 'h-[52px] px-8 text-lg',
}

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'w-[36px] h-[36px]',
  md: 'w-[44px] h-[44px]',
  lg: 'w-[52px] h-[52px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isIcon = variant === 'icon'

  return (
    <button
      className={`
        inline-flex items-center justify-center font-sans font-medium
        rounded-xl transition-all duration-200
        transform will-change-transform
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A2211E]/50 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:pointer-events-none
        ${variantStyles[variant]}
        ${isIcon ? iconSizeStyles[size] : sizeStyles[size]}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
