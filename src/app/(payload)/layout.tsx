import type { Metadata } from 'next'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import configPromise from '@/payload.config'
import { importMap } from './admin/importMap'
// @ts-expect-error — Payload CSS import has no type declarations
import '@payloadcms/next/css'

export const metadata: Metadata = {
  title: 'Admin — Les Remèdes de Mamie',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return RootLayout({
    children,
    config: configPromise,
    importMap,
    serverFunction: handleServerFunctions as any,
  })
}
