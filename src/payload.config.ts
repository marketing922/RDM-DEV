import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import sharp from 'sharp'
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
  SitePages,
  Users,
  AuditLog,
  ErrorLog,
  Notifications,
  ProductionRun,
} from './collections'
import { SiteSettings } from './globals/SiteSettings'
import { Navigation } from './globals/Navigation'
import { Footer } from './globals/Footer'
import {
  BRAND,
  TAGLINES_BY_COLLECTION,
  fitTitle,
  fitDescription,
  resolveDescriptionSource,
  resolveImageId,
} from './lib/seo-helpers'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  sharp,
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
      views: {
        dashboard: {
          Component: '@/components/admin/Dashboard.tsx#default',
        },
        account: {
          Component: '@/components/admin/Account.tsx#default',
        },
        login: {
          Component: '@/components/admin/views/Login.tsx#default',
        },
        settings: {
          Component: '@/components/admin/views/Settings.tsx#default',
          path: '/settings',
          exact: true,
          meta: { title: 'Paramètres' },
        },
        aiUsage: {
          Component: '@/components/admin/views/AIUsage.tsx#default',
          path: '/ai-usage',
          exact: true,
          meta: { title: 'IA — Consommation' },
        },
        errors: {
          Component: '@/components/admin/views/Errors.tsx#default',
          path: '/errors',
          exact: true,
          meta: { title: 'Erreurs système' },
        },
        notifications: {
          Component: '@/components/admin/views/NotificationsList.tsx#default',
          path: '/notifications',
          exact: true,
          meta: { title: 'Notifications' },
        },
        aiWorkshop: {
          Component: '@/components/admin/views/AIWorkshop.tsx#default',
          path: '/ai-workshop',
          exact: true,
          meta: { title: 'Atelier IA' },
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
    SitePages,
    Users,
    AuditLog,
    ErrorLog,
    Notifications,
    ProductionRun,
  ],
  globals: [SiteSettings, Navigation, Footer],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
    push: process.env.PAYLOAD_PUSH !== 'false',
    migrationDir: path.resolve(dirname, 'migrations'),
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
      collections: ['benefits', 'wikiEntries', 'blogPosts', 'pages', 'sitePages', 'products'],
      generateTitle: ({ doc, collectionSlug }) => {
        const d = doc as any
        const base = String(d?.name || d?.title || '')
        const tagline =
          TAGLINES_BY_COLLECTION[collectionSlug || 'pages'] || BRAND
        return fitTitle(base, BRAND, tagline)
      },
      generateDescription: ({ doc, locale, collectionSlug }: any) => {
        const source = resolveDescriptionSource(doc as any, collectionSlug, locale)
        return fitDescription(String(source || ''))
      },
      generateImage: ({ doc }) => {
        const id = resolveImageId(doc as any)
        return id as any
      },
      generateURL: ({ doc, collectionSlug, locale }) => {
        const slug = (doc as any)?.slug || ''
        const loc = locale || 'fr'
        const prefixMap: Record<string, string> = {
          wikiEntries: '/plantes',
          blogPosts: '/blog',
          benefits: '/bienfaits',
          products: '/produits',
          pages: '', // Pages live at the root: /{locale}/{slug}
          sitePages: '', // Static site pages live at the root: /{locale}/{slug}
        }
        const prefix = prefixMap[collectionSlug || ''] ?? ''
        const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://lesremedesdmamie.fr'
        return `${base}/${loc}${prefix}/${slug}`
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
