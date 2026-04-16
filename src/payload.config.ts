import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  Media,
  Authors,
  Categories,
  Tags,
  Benefits,
  Products,
  WikiEntries,
  BlogPosts,
  Pages,
  Users,
  AuditLog,
} from './collections'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [
    Media,
    Authors,
    Categories,
    Tags,
    Benefits,
    Products,
    WikiEntries,
    BlogPosts,
    Pages,
    Users,
    AuditLog,
  ],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
    push: process.env.PAYLOAD_PUSH !== 'false',
  }),
  localization: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
  },
  plugins: [
    seoPlugin({
      collections: ['benefits', 'wikiEntries', 'blogPosts', 'pages'],
      generateTitle: ({ doc }) => `${(doc as any)?.name || (doc as any)?.title || ''} | Les Remèdes de Mamie`,
      generateURL: ({ doc, collectionSlug }) => {
        const slug = (doc as any)?.slug || ''
        const prefixMap: Record<string, string> = {
          wikiEntries: '/plantes',
          blogPosts: '/blog',
          benefits: '/bienfaits',
          pages: '',
        }
        const prefix = prefixMap[collectionSlug || ''] ?? ''
        return `https://lesremedesdmamie.fr${prefix}/${slug}`
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'types/payload-types.ts'),
  },
  routes: {
    admin: '/admin',
  },
  secret: process.env.PAYLOAD_SECRET || 'CHANGE_ME_IN_PRODUCTION',
})
