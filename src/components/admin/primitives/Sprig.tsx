'use client'
import React from 'react'
import { RM } from './tokens'
export function Sprig({ size = 80, color = RM.teal, style = {} }: { size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.55, ...style }}
    >
      <path d="M50 95 C 50 70, 48 50, 52 25 C 54 12, 56 6, 58 4" />
      <path d="M52 70 C 45 65, 38 62, 30 62 C 33 68, 40 72, 50 72" />
      <path d="M51 55 C 58 52, 65 52, 72 55 C 68 60, 60 62, 50 60" />
      <path d="M50 42 C 43 38, 36 38, 30 42 C 35 47, 43 48, 50 46" />
      <path d="M55 30 C 62 27, 68 27, 74 30 C 70 35, 62 37, 53 34" />
      <path d="M57 18 C 52 14, 49 12, 45 14 C 47 18, 52 20, 56 19" />
    </svg>
  )
}
