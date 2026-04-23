import type { Metadata } from 'next'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'
import configPromise from '@payload-config'
import { importMap } from './admin/importMap'
import '@payloadcms/next/css'
import './custom.scss'
import { siteMetadataBase } from '@/lib/metadata'

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  title: 'Admin — Les Remèdes de Mamie',
}

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config: configPromise,
    importMap,
  })
}

const Layout = ({ children }: Args) =>
  RootLayout({
    children,
    config: configPromise,
    importMap,
    serverFunction,
  })

export default Layout
