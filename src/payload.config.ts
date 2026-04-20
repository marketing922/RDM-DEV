import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
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
    meta: {
      titleSuffix: ' — Les Remèdes de Mamie',
      icons: [
        {
          url: 'https://res.cloudinary.com/laboratoire-calebasse/image/upload/v1761315097/RM_logo_2297718b45.png',
        },
      ],
      openGraph: {
        title: 'Admin — Les Remèdes de Mamie',
        description: 'Panneau d\'administration du site Les Remèdes de Mamie',
      },
    },
    avatar: 'default',
    components: {
      graphics: {
        Logo: '@/components/admin/Logo.tsx#default',
        Icon: '@/components/admin/Icon.tsx#default',
      },
      Nav: '@/components/admin/Nav.tsx#default',
      beforeLogin: ['@/components/admin/BeforeLogin.tsx#default'],
      views: {
        dashboard: {
          Component: '@/components/admin/Dashboard.tsx#default',
        },
      },
    },
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
    ...(process.env.BLOB_READ_WRITE_TOKEN
      ? [vercelBlobStorage({ collections: { media: true }, token: process.env.BLOB_READ_WRITE_TOKEN })]
      : []),
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
  secret: process.env.PAYLOAD_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('PAYLOAD_SECRET is required in production') })() : 'dev-secret-not-for-production'),
})
