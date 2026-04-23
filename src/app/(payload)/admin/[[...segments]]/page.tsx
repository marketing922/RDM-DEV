import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { importMap } from '../importMap'
import { siteMetadataBase } from '@/lib/metadata'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}

export const generateMetadata = async ({ params, searchParams }: Args): Promise<Metadata> => {
  const meta = await generatePageMetadata({ config: configPromise, params, searchParams })
  return { ...meta, metadataBase: siteMetadataBase() }
}

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config: configPromise, params, searchParams, importMap })

export default Page
