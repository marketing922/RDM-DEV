import { DM_Serif_Display, Source_Serif_4, Inter_Tight, JetBrains_Mono } from 'next/font/google'

export const displayFont = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--ff-display',
  display: 'swap',
})

export const serifFont = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--ff-serif',
  display: 'swap',
})

export const sansFont = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--ff-sans',
  display: 'swap',
})

export const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--ff-mono',
  display: 'swap',
})

export const fontVariables = `${displayFont.variable} ${serifFont.variable} ${sansFont.variable} ${monoFont.variable}`
