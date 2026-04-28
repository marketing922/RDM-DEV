import type { Metadata } from 'next'
import { siteMetadataBase } from '@/lib/metadata'
import '@/styles/globals.css'

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  robots: { index: false, follow: false },
  title: 'Fiche plante — Impression',
}

export default function PlantPrintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
