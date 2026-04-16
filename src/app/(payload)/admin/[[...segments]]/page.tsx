/* eslint-disable */
// @ts-nocheck — Payload v3 generates this file; types depend on internal API
import { RenderServerComponent } from '@payloadcms/next/utilities'
import { importMap } from '../importMap'
import configPromise from '@/payload.config'

export { generatePageMetadata as generateMetadata } from '@payloadcms/next/utilities'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}

const Page = async ({ params, searchParams }: Args) => {
  const config = await configPromise
  const { AdminPage } = await import('@payloadcms/next/views')
  return AdminPage({ config, params, searchParams, importMap })
}

export default Page
