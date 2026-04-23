import { getPayload } from 'payload'
import configPromise from '@payload-config'

export type SitePageDoc = {
  id: string | number
  slug?: string
  title?: string
  intro?: string
  layout?: any[]
  _status?: string
}

export async function getSitePageBySlug(
  slug: string,
  locale = 'fr',
): Promise<SitePageDoc | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'sitePages' as any,
      where: {
        and: [
          { slug: { equals: slug } },
          { _status: { equals: 'published' } },
        ],
      },
      limit: 1,
      depth: 1,
      locale: locale as any,
    })
    return (result.docs?.[0] as SitePageDoc) ?? null
  } catch {
    return null
  }
}
