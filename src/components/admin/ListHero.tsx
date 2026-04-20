import React from 'react'
import type { BeforeListServerProps } from 'payload'

import ListHeroClient from './ListHeroClient'

const ICON_BY_SLUG: Record<string, { icon: string; accent: string }> = {
  wikiEntries: { icon: 'sprout', accent: '#054A57' },
  benefits: { icon: 'heart', accent: '#A2211E' },
  blogPosts: { icon: 'file-text', accent: '#D0802C' },
  products: { icon: 'package', accent: '#054A57' },
  pages: { icon: 'layout', accent: '#054A57' },
  media: { icon: 'image', accent: '#D0802C' },
  categories: { icon: 'folder-tree', accent: '#054A57' },
  tags: { icon: 'tag', accent: '#A2211E' },
  authors: { icon: 'user-pen', accent: '#054A57' },
  users: { icon: 'users', accent: '#A2211E' },
  auditLog: { icon: 'activity', accent: '#6B7280' },
}

const ListHero = async (props: BeforeListServerProps) => {
  const { collectionConfig } = props
  const payload = (props as any)?.payload
  if (!collectionConfig) return null

  const slug = collectionConfig.slug
  const iconMeta = ICON_BY_SLUG[slug] ?? { icon: 'book-open', accent: '#054A57' }

  let totalDocs = 0
  let publishedDocs: number | null = null
  let draftDocs: number | null = null

  if (payload) {
    const total = await payload
      .count({ collection: slug, overrideAccess: true })
      .catch(() => ({ totalDocs: 0 }))
    totalDocs = total.totalDocs ?? 0

    const hasDrafts = Boolean((collectionConfig as any).versions?.drafts)
    if (hasDrafts) {
      const [published, drafts] = await Promise.all([
        payload
          .count({
            collection: slug,
            where: { _status: { equals: 'published' } },
            overrideAccess: true,
          })
          .catch(() => ({ totalDocs: 0 })),
        payload
          .count({
            collection: slug,
            where: { _status: { equals: 'draft' } },
            overrideAccess: true,
          })
          .catch(() => ({ totalDocs: 0 })),
      ])
      publishedDocs = published.totalDocs ?? 0
      draftDocs = drafts.totalDocs ?? 0
    }
  }

  const labelPlural =
    (typeof collectionConfig.labels?.plural === 'string'
      ? collectionConfig.labels.plural
      : undefined) || slug

  const description =
    typeof collectionConfig.admin?.description === 'string'
      ? collectionConfig.admin.description
      : undefined

  return (
    <ListHeroClient
      label={labelPlural}
      description={description}
      iconName={iconMeta.icon}
      accent={iconMeta.accent}
      total={totalDocs}
      published={publishedDocs}
      drafts={draftDocs}
    />
  )
}

export default ListHero
