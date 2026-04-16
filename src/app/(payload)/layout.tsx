import type { Metadata } from 'next'
import { RootLayout } from '@payloadcms/next/layouts'
import configPromise from '@/payload.config'
import { importMap } from './admin/importMap'
import '@payloadcms/next/css'

export const metadata: Metadata = {
  title: 'Admin — Les Remèdes de Mamie',
}

type Args = {
  children: React.ReactNode
}

const serverFunction = async (args: any) => {
  'use server'
  const { handleServerFunctions } = await import('@payloadcms/next/layouts')
  return handleServerFunctions(args)
}

const Layout = ({ children }: Args) =>
  RootLayout({
    children,
    config: configPromise,
    importMap,
    serverFunction,
  })

export default Layout
