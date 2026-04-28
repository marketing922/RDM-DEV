/**
 * Test rapide de la brique web-research.
 * Usage : npx tsx --env-file=.env.local src/scripts/test-research.ts [query] [plant|topic]
 *
 * Ce script peut être supprimé une fois la validation faite.
 */

import { researchWeb } from '../lib/web-research'

async function main(): Promise<void> {
  const query = process.argv[2] ?? 'Camomille'
  const kindArg = (process.argv[3] ?? 'plant') as 'plant' | 'topic'
  console.log(`[test-research] Query: "${query}"  Kind: ${kindArg}`)

  const t0 = Date.now()
  const res = await researchWeb({ query, kind: kindArg })
  const t1 = Date.now()

  console.log('\n=== STRUCTURED ===')
  console.log(JSON.stringify(res.structured ?? null, null, 2))

  console.log('\n=== FACTS (first 3) ===')
  for (const f of res.facts.slice(0, 3)) {
    console.log(`- [${f.source}] ${f.title}`)
    console.log(`  ${f.snippet}`)
    if (f.url) console.log(`  ${f.url}`)
  }
  console.log(`(total facts: ${res.facts.length})`)

  console.log('\n=== IMAGES (first 3) ===')
  for (const img of res.imageCandidates.slice(0, 3)) {
    console.log(`- ${img.fileName ?? '?'}  ${img.width ?? '?'}x${img.height ?? '?'}`)
    console.log(`  url:        ${img.url}`)
    console.log(`  thumb:      ${img.thumbUrl ?? '-'}`)
    console.log(`  license:    ${img.license}`)
    console.log(`  attribution: ${img.attribution}`)
  }
  console.log(`(total images: ${res.imageCandidates.length})`)

  console.log('\n=== META ===')
  console.log(`Cost (EUR):    ${res.totalCostEur}`)
  console.log(`Internal duration (ms): ${res.totalDurationMs}`)
  console.log(`Wall duration (ms):     ${t1 - t0}`)
  console.log(`Warnings:`)
  for (const w of res.warnings) console.log(`  - ${w}`)
}

main().catch((err) => {
  console.error('[test-research] fatal:', err)
  process.exitCode = 1
})
