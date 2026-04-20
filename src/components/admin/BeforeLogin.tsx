import React from 'react'
import type { ServerProps } from 'payload'

import BeforeLoginClient from './BeforeLoginClient'

const BeforeLogin = async (props: ServerProps) => {
  const payload = (props as any)?.payload

  let plantsCount = 0
  let benefitsCount = 0
  let articlesCount = 0

  if (payload) {
    const [plants, benefits, articles] = await Promise.all([
      payload.count({ collection: 'wikiEntries', overrideAccess: true }).catch(() => ({ totalDocs: 0 })),
      payload.count({ collection: 'benefits', overrideAccess: true }).catch(() => ({ totalDocs: 0 })),
      payload.count({ collection: 'blogPosts', overrideAccess: true }).catch(() => ({ totalDocs: 0 })),
    ])
    plantsCount = plants.totalDocs ?? 0
    benefitsCount = benefits.totalDocs ?? 0
    articlesCount = articles.totalDocs ?? 0
  }

  return (
    <BeforeLoginClient
      plantsCount={plantsCount}
      benefitsCount={benefitsCount}
      articlesCount={articlesCount}
    />
  )
}

export default BeforeLogin
