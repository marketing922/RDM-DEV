import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'
import tailwindcssTypography from '@tailwindcss/typography'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#A2211E', dark: '#712E2F', light: '#FEF2F2', alt: '#A5281D' },
        page: '#FEF9E9',
        card: '#DCD8C7',
        neutral: { 50: '#F3F4F6', 100: '#E5E7EB', 200: '#D1D5DB', 300: '#9CA3AF', 400: '#6B7280', 500: '#374151', 600: '#1F2937' },
        warning: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
        success: { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
        info: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
        error: { bg: '#FEF2F2', border: '#EF4444', text: '#B91C1C' },
        footer: { bg: '#1F2937', heading: '#FEF9E9', text: '#9CA3AF' },
      },
      fontFamily: {
        heading: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        body: ['var(--font-lora)', 'Georgia', 'serif'],
        ui: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['48px', { lineHeight: '56px', fontWeight: '700' }],
        h2: ['36px', { lineHeight: '44px', fontWeight: '700' }],
        h3: ['28px', { lineHeight: '36px', fontWeight: '600' }],
        h4: ['22px', { lineHeight: '28px', fontWeight: '600' }],
        h5: ['18px', { lineHeight: '24px', fontWeight: '600' }],
        h6: ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        body: ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        overline: ['11px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.14em' }],
        price: ['20px', { lineHeight: '24px', fontWeight: '700' }],
      },
      spacing: {
        '2xs': '4px', xs: '8px', sm: '12px', md: '16px', lg: '24px', xl: '32px', '2xl': '48px', '3xl': '64px', '4xl': '96px', '5xl': '128px',
      },
      borderRadius: {
        sm: '4px', DEFAULT: '8px', lg: '12px', xl: '16px', '2xl': '24px', pill: '9999px',
      },
      boxShadow: {
        sm: '0 1px 4px rgba(0,0,0,0.04)',
        DEFAULT: '0 4px 16px rgba(0,0,0,0.08)',
        lg: '0 8px 16px rgba(0,0,0,0.1)',
        xl: '0 12px 24px rgba(0,0,0,0.15)',
        nav: '0 2px 8px rgba(0,0,0,0.06)',
      },
      transitionDuration: { fast: '150ms', DEFAULT: '200ms', slow: '300ms' },
      zIndex: { dropdown: '30', sticky: '40', overlay: '50', modal: '60', toast: '70' },
    },
  },
  plugins: [tailwindcssAnimate, tailwindcssTypography],
}
export default config
