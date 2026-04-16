import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views'
import type { Metadata } from 'next'
import configPromise from '@/payload.config'
import { importMap } from '../importMap'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config: configPromise, params, searchParams })

const NotFound = ({ params, searchParams }: Args) =>
  NotFoundPage({ config: configPromise, params, searchParams, importMap })

export default NotFound
