import { unstable_cache } from 'next/cache'

const CLOUDINARY_ROOT = 'https://res.cloudinary.com/laboratoire-calebasse/image/upload'
const CLOUDINARY_BASES = [`${CLOUDINARY_ROOT}/rdm/plants`, CLOUDINARY_ROOT]

const SUFFIXES = [
  '-2', '-3', '-4', '-5',
  '-tisane', '-infusion',
  '-frais', '-fresh',
  '-poudre', '-powder',
  '-huile', '-oil',
  '-fleur', '-flower',
  '-feuille', '-leaf',
  '-racine', '-root',
  '-baie', '-berry',
]
const EXTS = ['png', 'jpg', 'jpeg', 'webp']

async function urlExists(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: 'HEAD' })
    if (head.ok) return true
    if (head.status !== 405 && head.status !== 403) return false
  } catch {
    /* fall through */
  }
  try {
    const get = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
    })
    return get.ok || get.status === 206
  } catch {
    return false
  }
}

async function detect(slug: string): Promise<string[]> {
  const found: string[] = []
  await Promise.all(
    SUFFIXES.map(async (suffix) => {
      for (const base of CLOUDINARY_BASES) {
        for (const ext of EXTS) {
          const url = `${base}/${slug}${suffix}.${ext}`
          if (await urlExists(url)) {
            found.push(url)
            return
          }
        }
      }
    }),
  )
  // Preserve suffix order (Promise.all may finish out of order)
  const order = new Map(SUFFIXES.map((s, i) => [s, i]))
  return found.sort((a, b) => {
    const sa = SUFFIXES.find((s) => a.includes(`${slug}${s}.`)) || ''
    const sb = SUFFIXES.find((s) => b.includes(`${slug}${s}.`)) || ''
    return (order.get(sa) ?? 0) - (order.get(sb) ?? 0)
  })
}

export const getPlantVariants = (slug: string) =>
  unstable_cache(() => detect(slug), ['plant-variants', slug], {
    revalidate: 3600,
    tags: ['plant-variants', `plant-variants:${slug}`],
  })()
