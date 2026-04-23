import type { Metadata } from 'next'
import { siteMetadataBase } from '@/lib/metadata'

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
