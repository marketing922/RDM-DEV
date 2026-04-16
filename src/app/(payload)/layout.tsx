import type { Metadata } from 'next'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import configPromise from '@/payload.config'
import { importMap } from './admin/importMap'
import '@payloadcms/next/css'

export const metadata: Metadata = {
  title: 'Admin — Les Remèdes de Mamie',
}

type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) =>
  RootLayout({
    children,
    config: configPromise,
    importMap,
    serverFunction: handleServerFunctions as any,
  })

export default Layout
