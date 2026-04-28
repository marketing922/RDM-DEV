import 'server-only'
import type { Payload } from 'payload'
import { logAiCall } from './ai-audit'
import { hasForbiddenClaim } from './claims-whitelist'
import { generateEmbedding, EMBEDDING_MODEL } from './embeddings'
import { semanticSearch } from './embeddings-db'
import { proposeTaxonomy } from './taxonomy-proposer'
import { proposeBenefits } from './benefits-proposer'
import { slugify } from './slugify'

const HELPER_MODEL = 'gemini-2.5-flash-lite' as const

/** Fire-and-forget audit log for a relations-matcher LLM helper call. */
function auditHelper(
  payload: Payload,
  startedAt: number,
  fieldTarget: string,
  tokens: { promptTokens?: number; completionTokens?: number },
  collectionTarget: string,
): void {
  void logAiCall(
    payload,
    {
      subsystem: 'ai-relations',
      model: HELPER_MODEL,
      collectionTarget,
      fieldTarget,
    },
    startedAt,
    {
      promptTokens: tokens.promptTokens,
      completionTokens: tokens.completionTokens,
    },
    null,
  ).catch(() => undefined)
}

/**
 * Auto-match relations for newly produced wiki / blog content.
 *
 * Strategies:
 *  - Semantic: embed the source text and look up similar already-indexed
 *    documents in pgvector (benefits, products, plants).
 *  - Lexical: scan known taxonomy entries (tags, categories) and keep those
 *    whose name/slug appears in the source text.
 *  - LLM-backed: when lexical matches are too thin, ask the LLM for 3–6 tag
 *    candidates and 1 category candidate derived from the article's actual
 *    topic. We then create those that don't yet exist (slug-deduped) so blog
 *    posts always get their own thematically-correct tags + category.
 *
 * All operations are best-effort; failures are non-blocking.
 */

export type WikiRelations = {
  benefits: Array<number | string>
  relatedProducts: Array<number | string>
  relatedPosts: Array<number | string>
}

export type BlogRelations = {
  relatedPlants: Array<number | string>
  relatedProducts: Array<number | string>
  relatedBenefits: Array<number | string>
  tags: Array<number | string>
  category?: number | string
}

const SEMANTIC_MIN_SCORE = 0.6
const TAGS_LIMIT = 6
const RELATED_LIMIT = 5

// Hard caps on **NEW** docs created during a single matchBlogRelations /
// matchWikiRelations call. Prevents a runaway pipeline from polluting the
// taxonomy when the proposers misbehave or the article subject is too broad.
const MAX_NEW_TAGS_PER_CALL = 4
const MAX_NEW_CATEGORIES_PER_CALL = 1
const MAX_NEW_BENEFITS_PER_CALL = 4

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function containsCi(haystack: string, needle: string): boolean {
  if (!needle) return false
  return normalize(haystack).includes(normalize(needle))
}

function coerceId(raw: string | number): number | string {
  if (typeof raw === 'number') return raw
  const n = Number(raw)
  return Number.isFinite(n) ? n : raw
}

/**
 * Lexical scan : load all docs of a content collection (wikiEntries, products,
 * benefits) and return the IDs whose `name` (or `latinName` for plants) is
 * mentioned in the text. Cap at 200 docs — beyond that we'd need a search
 * index. Best-effort.
 */
async function lexicalContentScan(
  payload: Payload,
  collection: 'wikiEntries' | 'products' | 'benefits',
  text: string,
  limit: number,
): Promise<Array<{ id: number | string; name: string; slug: string }>> {
  if (!text.trim()) return []
  const haystack = normalize(text)
  try {
    const result = await payload.find({
      collection: collection as never,
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })
    const docs = (result?.docs ?? []) as Array<{
      id: number | string
      name?: string
      latinName?: string
      slug?: string
    }>
    const matched: Array<{ id: number | string; name: string; slug: string; score: number }> = []
    for (const doc of docs) {
      const candidates: string[] = []
      if (doc.name && doc.name.trim().length >= 3) candidates.push(doc.name)
      if (doc.latinName && doc.latinName.trim().length >= 3) candidates.push(doc.latinName)
      let score = 0
      for (const cand of candidates) {
        const norm = normalize(cand)
        if (!norm) continue
        // Match either as a whole word or hyphen-tolerant substring.
        const re = new RegExp(`\\b${escapeRegex(norm)}\\b`, 'i')
        if (re.test(haystack)) {
          score += cand === doc.latinName ? 1 : 2 // common name weights more
        }
      }
      if (score > 0) {
        matched.push({
          id: coerceId(doc.id),
          name: doc.name ?? '',
          slug: doc.slug ?? '',
          score,
        })
      }
    }
    matched.sort((a, b) => b.score - a.score)
    return matched.slice(0, limit)
  } catch {
    return []
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function semanticMatchIds(opts: {
  payload?: Payload
  text: string
  collection: 'wikiEntries' | 'benefits' | 'products' | 'blogPosts'
  locale: 'fr' | 'en'
  limit: number
  excludeId?: string | number
}): Promise<Array<number | string>> {
  try {
    const { vector } = await generateEmbedding(opts.text.slice(0, 4000))
    const hits = await semanticSearch({
      queryVector: vector,
      collectionSlugs: [opts.collection],
      locale: opts.locale,
      model: EMBEDDING_MODEL,
      limit: opts.limit + 5,
      minScore: SEMANTIC_MIN_SCORE,
    })
    const candidates: Array<number | string> = []
    for (const h of hits) {
      const id = coerceId(h.entry_id)
      if (opts.excludeId !== undefined && String(id) === String(opts.excludeId)) continue
      candidates.push(id)
    }
    // Validate against the actual collection — pgvector may keep embeddings
    // for documents that have since been deleted (orphan IDs would cause FK
    // violations on insert into the rels table).
    if (opts.payload && candidates.length > 0) {
      try {
        const verified = await opts.payload.find({
          collection: opts.collection as never,
          where: { id: { in: candidates } } as never,
          limit: candidates.length,
          depth: 0,
          overrideAccess: true,
        })
        const existingIds = new Set(
          ((verified?.docs ?? []) as Array<{ id: string | number }>).map((d) => String(d.id)),
        )
        return candidates
          .filter((id) => existingIds.has(String(id)))
          .slice(0, opts.limit)
      } catch {
        // If validation itself fails, fall back to the unverified list.
        return candidates.slice(0, opts.limit)
      }
    }
    return candidates.slice(0, opts.limit)
  } catch {
    return []
  }
}

async function matchTaxonomy(
  payload: Payload,
  collection: 'tags' | 'categories',
  text: string,
  limit: number,
): Promise<Array<{ id: number | string; name: string; slug: string; score: number }>> {
  try {
    const result = await payload.find({
      collection: collection as never,
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })
    const docs = (result?.docs ?? []) as Array<{
      id: number | string
      name?: string
      slug?: string
    }>
    const matched: Array<{ id: number | string; name: string; slug: string; score: number }> = []
    for (const tag of docs) {
      let score = 0
      if (tag.name && containsCi(text, tag.name)) score += 2
      if (tag.slug && containsCi(text, tag.slug.replace(/-/g, ' '))) score += 1
      if (score > 0) {
        matched.push({
          id: coerceId(tag.id),
          name: tag.name ?? '',
          slug: tag.slug ?? '',
          score,
        })
      }
    }
    matched.sort((a, b) => b.score - a.score)
    return matched.slice(0, limit)
  } catch {
    return []
  }
}

async function findOrCreateTaxonomy(
  payload: Payload,
  collection: 'tags' | 'categories',
  name: string,
): Promise<number | string | null> {
  const trimmed = name.trim()
  if (!trimmed) return null
  // Reject any LLM-proposed name that contains a forbidden EFSA-flagged
  // pattern (ex: "Soigne la migraine", "Traitement digestion"). The LLM
  // prompt asks for non-clinical names but we don't trust it blindly.
  if (hasForbiddenClaim(trimmed)) return null
  const slug = slugify(trimmed)
  if (!slug) return null
  try {
    const existing = await payload.find({
      collection: collection as never,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const docs = (existing?.docs ?? []) as Array<{ id: string | number }>
    if (docs.length > 0) return coerceId(docs[0].id)
  } catch {
    // fall through to create
  }
  try {
    const created = (await payload.create({
      collection: collection as never,
      overrideAccess: true,
      data: {
        name: trimmed,
        slug,
      } as never,
    })) as { id: string | number }
    return coerceId(created.id)
  } catch {
    return null
  }
}

/**
 * Find-or-create a Benefit by slug. New benefits are auto-published with
 * complianceStatus='approved' (the name is non-claim by definition — the
 * proposer enforces this). Pipeline context skips the moderation/compliance
 * hooks so the doc is immediately usable as a relation target.
 */
async function findOrCreateBenefit(
  payload: Payload,
  name: string,
): Promise<number | string | null> {
  const trimmed = name.trim()
  if (!trimmed) return null
  // Same EFSA gate as taxonomy — never auto-create a benefit page whose
  // name itself constitutes a health claim.
  if (hasForbiddenClaim(trimmed)) return null
  const slug = slugify(trimmed)
  if (!slug) return null
  try {
    const existing = await payload.find({
      collection: 'benefits',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const docs = (existing?.docs ?? []) as Array<{ id: string | number }>
    if (docs.length > 0) return coerceId(docs[0].id)
  } catch {
    // fall through to create
  }
  try {
    const created = (await payload.create({
      collection: 'benefits',
      overrideAccess: true,
      // skipEmbed: a freshly auto-created benefit has only a placeholder
      // shortDescription. Indexing it now would pollute the semantic search
      // (every empty benefit looks similar to every other empty benefit).
      // It will get re-indexed naturally when an editor enriches its content.
      context: { skipModeration: true, skipCompliance: true, skipEmbed: true } as never,
      data: {
        name: trimmed,
        slug,
        shortDescription: `Bienfaits liés à ${trimmed.toLowerCase()}.`,
        status: 'published',
        complianceStatus: 'approved',
      } as never,
    })) as { id: string | number }
    return coerceId(created.id)
  } catch {
    return null
  }
}

export async function matchWikiRelations(opts: {
  payload: Payload
  name: string
  latinName?: string
  shortDescription: string
  longDescription: string
  locale: 'fr' | 'en'
  excludeId?: string | number
}): Promise<WikiRelations> {
  const text = [opts.name, opts.latinName, opts.shortDescription, opts.longDescription]
    .filter(Boolean)
    .join(' ')

  // Run benefits / products / blog matchers in parallel. Each combines a
  // semantic search with a lexical scan against the existing docs' names.
  const [
    semanticBenefits,
    lexicalBenefits,
    semanticProducts,
    lexicalProducts,
    semanticPosts,
    lexicalPosts,
  ] = await Promise.all([
    semanticMatchIds({
      payload: opts.payload,
      text,
      collection: 'benefits',
      locale: opts.locale,
      limit: RELATED_LIMIT,
    }),
    lexicalContentScan(opts.payload, 'benefits', text, RELATED_LIMIT),
    semanticMatchIds({
      payload: opts.payload,
      text,
      collection: 'products',
      locale: opts.locale,
      limit: 4,
    }),
    lexicalContentScan(opts.payload, 'products', text, 4),
    semanticMatchIds({
      payload: opts.payload,
      text,
      collection: 'blogPosts',
      locale: opts.locale,
      limit: RELATED_LIMIT,
    }),
    blogPostsMatchByName(opts.payload, [opts.name, opts.latinName].filter(Boolean) as string[], RELATED_LIMIT),
  ])

  const mergeIds = (
    semantic: Array<number | string>,
    lexical: Array<{ id: number | string }>,
    cap: number,
  ): Array<number | string> => {
    const out: Array<number | string> = []
    const seen = new Set<string>()
    for (const item of lexical) {
      const k = String(item.id)
      if (!seen.has(k)) {
        seen.add(k)
        out.push(item.id)
        if (out.length >= cap) return out
      }
    }
    for (const id of semantic) {
      const k = String(id)
      if (!seen.has(k)) {
        seen.add(k)
        out.push(id)
        if (out.length >= cap) return out
      }
    }
    return out
  }

  let benefitIds = mergeIds(semanticBenefits, lexicalBenefits, RELATED_LIMIT + 2)
  const productIds = mergeIds(semanticProducts, lexicalProducts, 4)
  const postIds = mergeIds(semanticPosts, lexicalPosts, RELATED_LIMIT)

  // Auto-create missing benefits proposed by the LLM for this plant.
  try {
    const existingNames = lexicalBenefits.map((b) => b.name).filter(Boolean)
    const t0 = Date.now()
    const proposalRes = await proposeBenefits({
      title: opts.name,
      excerpt: opts.shortDescription,
      contentPlain: opts.longDescription.slice(0, 3000),
      locale: opts.locale,
      existingBenefits: existingNames,
    })
    auditHelper(opts.payload, t0, 'benefits-proposer', proposalRes, 'wikiEntries')
    const proposed = proposalRes.benefits
    const seenBenefits = new Set(benefitIds.map(String))
    let createdThisCall = 0
    for (const name of proposed) {
      if (createdThisCall >= MAX_NEW_BENEFITS_PER_CALL) break
      if (benefitIds.length >= RELATED_LIMIT + 3) break
      const slug = slugify(name)
      if (!slug) continue
      // Detect "create vs find" : look up first to know if findOrCreate
      // creates a new doc — so we can apply MAX_NEW_BENEFITS_PER_CALL.
      const before = await opts.payload
        .find({
          collection: 'benefits',
          where: { slug: { equals: slug } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => null)
      const wouldCreate = !before || (before.docs ?? []).length === 0
      if (wouldCreate && createdThisCall >= MAX_NEW_BENEFITS_PER_CALL) continue
      const id = await findOrCreateBenefit(opts.payload, name)
      if (id !== null && !seenBenefits.has(String(id))) {
        seenBenefits.add(String(id))
        benefitIds = [...benefitIds, id]
        if (wouldCreate) createdThisCall += 1
      }
    }
  } catch {
    // non-blocking
  }

  return {
    benefits: benefitIds,
    relatedProducts: productIds,
    relatedPosts: postIds,
  }
}

/**
 * Lookup blog posts whose title or excerpt mentions any of the plant names
 * provided (common name + latin). Cap at 200 docs scanned. Best-effort.
 */
async function blogPostsMatchByName(
  payload: Payload,
  names: string[],
  limit: number,
): Promise<Array<{ id: number | string }>> {
  const cleanedNames = names
    .map((n) => n.trim())
    .filter((n) => n.length >= 3)
  if (cleanedNames.length === 0) return []
  try {
    const result = await payload.find({
      collection: 'blogPosts',
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })
    const docs = (result?.docs ?? []) as Array<{
      id: number | string
      title?: string
      excerpt?: string
    }>
    const matched: Array<{ id: number | string; score: number }> = []
    for (const doc of docs) {
      const haystack = normalize([doc.title || '', doc.excerpt || ''].join(' '))
      let score = 0
      for (const name of cleanedNames) {
        const re = new RegExp(`\\b${escapeRegex(normalize(name))}\\b`, 'i')
        if (re.test(haystack)) score += 1
      }
      if (score > 0) matched.push({ id: coerceId(doc.id), score })
    }
    matched.sort((a, b) => b.score - a.score)
    return matched.slice(0, limit).map(({ id }) => ({ id }))
  } catch {
    return []
  }
}

export async function matchBlogRelations(opts: {
  payload: Payload
  title: string
  excerpt: string
  contentPlain: string
  locale: 'fr' | 'en'
  excludeId?: string | number
}): Promise<BlogRelations> {
  const text = [opts.title, opts.excerpt, opts.contentPlain].filter(Boolean).join(' ')

  // Run all matchers in parallel: semantic (similarity ≥ 0.6) + lexical
  // (whole-word match against the doc's name/latinName) for plants/products/
  // benefits, plus tags/categories taxonomy lookup.
  const [
    semanticPlants,
    semanticProducts,
    semanticBenefits,
    lexicalPlants,
    lexicalProducts,
    lexicalBenefits,
    tagsLexical,
    categoriesLexical,
  ] = await Promise.all([
    semanticMatchIds({
      payload: opts.payload,
      text,
      collection: 'wikiEntries',
      locale: opts.locale,
      limit: RELATED_LIMIT,
    }),
    semanticMatchIds({
      payload: opts.payload,
      text,
      collection: 'products',
      locale: opts.locale,
      limit: 4,
    }),
    semanticMatchIds({
      payload: opts.payload,
      text,
      collection: 'benefits',
      locale: opts.locale,
      limit: RELATED_LIMIT,
    }),
    lexicalContentScan(opts.payload, 'wikiEntries', text, RELATED_LIMIT + 2),
    lexicalContentScan(opts.payload, 'products', text, 4),
    lexicalContentScan(opts.payload, 'benefits', text, RELATED_LIMIT),
    matchTaxonomy(opts.payload, 'tags', text, TAGS_LIMIT),
    matchTaxonomy(opts.payload, 'categories', text, 1),
  ])

  const mergeIds = (
    semantic: Array<number | string>,
    lexical: Array<{ id: number | string }>,
    cap: number,
  ): Array<number | string> => {
    const out: Array<number | string> = []
    const seen = new Set<string>()
    // Lexical hits first — they're literal mentions, more reliable signal.
    for (const item of lexical) {
      const k = String(item.id)
      if (!seen.has(k)) {
        seen.add(k)
        out.push(item.id)
        if (out.length >= cap) return out
      }
    }
    for (const id of semantic) {
      const k = String(id)
      if (!seen.has(k)) {
        seen.add(k)
        out.push(id)
        if (out.length >= cap) return out
      }
    }
    return out
  }

  const relatedPlants = mergeIds(semanticPlants, lexicalPlants, RELATED_LIMIT + 2)
  const relatedProducts = mergeIds(semanticProducts, lexicalProducts, 4)
  let relatedBenefits = mergeIds(semanticBenefits, lexicalBenefits, RELATED_LIMIT + 2)

  // Auto-create benefits the article should be linked to but that don't
  // exist yet — uses a dedicated LLM proposer (non-claim names enforced).
  try {
    const existingNames = lexicalBenefits.map((b) => b.name).filter(Boolean)
    const t0 = Date.now()
    const proposalRes = await proposeBenefits({
      title: opts.title,
      excerpt: opts.excerpt,
      contentPlain: opts.contentPlain.slice(0, 3000),
      locale: opts.locale,
      existingBenefits: existingNames,
    })
    auditHelper(opts.payload, t0, 'benefits-proposer', proposalRes, 'blogPosts')
    const proposed = proposalRes.benefits
    const seenBenefits = new Set(relatedBenefits.map(String))
    let createdThisCall = 0
    for (const name of proposed) {
      if (relatedBenefits.length >= RELATED_LIMIT + 3) break
      if (createdThisCall >= MAX_NEW_BENEFITS_PER_CALL) break
      const slug = slugify(name)
      if (!slug) continue
      const before = await opts.payload
        .find({
          collection: 'benefits',
          where: { slug: { equals: slug } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => null)
      const wouldCreate = !before || (before.docs ?? []).length === 0
      if (wouldCreate && createdThisCall >= MAX_NEW_BENEFITS_PER_CALL) continue
      const id = await findOrCreateBenefit(opts.payload, name)
      if (id !== null && !seenBenefits.has(String(id))) {
        seenBenefits.add(String(id))
        relatedBenefits = [...relatedBenefits, id]
        if (wouldCreate) createdThisCall += 1
      }
    }
  } catch {
    // non-blocking
  }

  // Topic-derived tag/category proposal — fills the gap when no existing
  // taxonomy matches the article's actual subject.
  let proposedTagNames: string[] = []
  let proposedCategoryName: string | undefined
  try {
    const t0 = Date.now()
    const proposal = await proposeTaxonomy({
      title: opts.title,
      excerpt: opts.excerpt,
      contentPlain: opts.contentPlain.slice(0, 3000),
      locale: opts.locale,
      existingTags: tagsLexical.map((t) => t.name).filter(Boolean),
      existingCategories: categoriesLexical.map((c) => c.name).filter(Boolean),
    })
    auditHelper(opts.payload, t0, 'taxonomy-proposer', proposal, 'blogPosts')
    proposedTagNames = proposal.tags
    proposedCategoryName = proposal.category
  } catch {
    // non-blocking
  }

  // Resolve tags: lexical hits first, then proposed (find-or-create), deduped.
  const tagIds: Array<number | string> = []
  const seenTagSlugs = new Set<string>()
  for (const t of tagsLexical) {
    if (t.slug && !seenTagSlugs.has(t.slug)) {
      seenTagSlugs.add(t.slug)
      tagIds.push(t.id)
    }
  }
  let createdTagsThisCall = 0
  for (const name of proposedTagNames) {
    if (tagIds.length >= TAGS_LIMIT) break
    if (createdTagsThisCall >= MAX_NEW_TAGS_PER_CALL) break
    const slug = slugify(name)
    if (!slug || seenTagSlugs.has(slug)) continue
    seenTagSlugs.add(slug)
    const before = await opts.payload
      .find({
        collection: 'tags',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => null)
    const wouldCreate = !before || (before.docs ?? []).length === 0
    if (wouldCreate && createdTagsThisCall >= MAX_NEW_TAGS_PER_CALL) continue
    const id = await findOrCreateTaxonomy(opts.payload, 'tags', name)
    if (id !== null) {
      tagIds.push(id)
      if (wouldCreate) createdTagsThisCall += 1
    }
  }

  // Category: prefer the strongest lexical hit, otherwise create the proposed one.
  let categoryId: number | string | undefined
  if (categoriesLexical[0]) {
    categoryId = categoriesLexical[0].id
  } else if (proposedCategoryName) {
    const id = await findOrCreateTaxonomy(opts.payload, 'categories', proposedCategoryName)
    if (id !== null) categoryId = id
  }

  return {
    relatedPlants,
    relatedProducts,
    relatedBenefits,
    tags: tagIds,
    category: categoryId,
  }
}
