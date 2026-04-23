import React from 'react'
import { unstable_cache } from 'next/cache'
import type { ServerProps } from 'payload'

import BeforeLoginClient from './BeforeLoginClient'

const getLoginCounts = (payload: any) =>
  unstable_cache(
    async () => {
      const [plants, benefits, articles] = await Promise.all([
        payload.count({ collection: 'wikiEntries', overrideAccess: true }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'benefits', overrideAccess: true }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: 'blogPosts', overrideAccess: true }).catch(() => ({ totalDocs: 0 })),
      ])
      return {
        plants: plants.totalDocs ?? 0,
        benefits: benefits.totalDocs ?? 0,
        articles: articles.totalDocs ?? 0,
      }
    },
    ['before-login-counts'],
    { revalidate: 300 },
  )()

const BeforeLogin = async (props: ServerProps) => {
  const payload = (props as any)?.payload
  const counts = payload
    ? await getLoginCounts(payload)
    : { plants: 0, benefits: 0, articles: 0 }

  return (
    <BeforeLoginClient
      plantsCount={counts.plants}
      benefitsCount={counts.benefits}
      articlesCount={counts.articles}
    />
  )
}

export default BeforeLogin
