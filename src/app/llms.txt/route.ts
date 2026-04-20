import { NextResponse } from 'next/server'
import { getWikiEntries, getBenefits, getBlogPosts } from '@/lib/queries'

export const revalidate = 3600

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://remedes-mamie.com'

const SITE_TITLE = 'Les Remèdes de Mamie'
const SITE_DESCRIPTION =
  'Marque française de compléments alimentaires naturels à base de plantes (tisanes, poudres, gélules), fabriqués en France. Site e-commerce + encyclopédie des plantes médicinales, fondée sur les monographies EMA/HMPC et la littérature ethnobotanique vérifiée.'

type Doc = {
  slug?: string
  name?: string
  title?: string
  directAnswer?: string
  definition?: string
  shortDescription?: string
  excerpt?: string
}

const line = (href: string, title: string, blurb?: string) =>
  `- [${title}](${href})${blurb ? `: ${blurb}` : ''}`

const firstSentence = (text?: string, max = 180) => {
  if (!text) return undefined
  const clean = String(text).replace(/\s+/g, ' ').trim()
  if (!clean) return undefined
  const stop = clean.search(/[.?!](\s|$)/)
  const sentence = stop > 0 ? clean.slice(0, stop + 1) : clean
  return sentence.length > max ? `${sentence.slice(0, max).trim()}…` : sentence
}

const blurbFor = (doc: Doc) =>
  firstSentence(doc.directAnswer) ||
  firstSentence(doc.definition) ||
  firstSentence(doc.shortDescription) ||
  firstSentence(doc.excerpt)

export async function GET() {
  const [{ docs: plants }, { docs: benefits }, { docs: posts }] = await Promise.all([
    getWikiEntries({ limit: 500 }).catch(() => ({ docs: [] as any[] })),
    getBenefits({ limit: 500 }).catch(() => ({ docs: [] as any[] })),
    getBlogPosts({ limit: 500 }).catch(() => ({ docs: [] as any[] })),
  ])

  const body: string[] = [
    `# ${SITE_TITLE}`,
    `> ${SITE_DESCRIPTION}`,
    '',
    '## À propos',
    `- [Accueil](${SITE_URL}/fr): Portail d'entrée`,
    `- [Avertissement santé](${SITE_URL}/fr/avertissement-sante): Disclaimer médical officiel`,
    `- [À propos](${SITE_URL}/fr/a-propos): Mission, équipe éditoriale, méthodologie`,
    '',
  ]

  if (plants.length) {
    body.push('## Plantes médicinales')
    for (const p of plants as Doc[]) {
      if (!p.slug || !p.name) continue
      body.push(line(`${SITE_URL}/fr/plantes/${p.slug}`, p.name, blurbFor(p)))
    }
    body.push('')
  }

  if (benefits.length) {
    body.push('## Bienfaits')
    for (const b of benefits as Doc[]) {
      if (!b.slug || !b.name) continue
      body.push(line(`${SITE_URL}/fr/bienfaits/${b.slug}`, b.name, blurbFor(b)))
    }
    body.push('')
  }

  if (posts.length) {
    body.push('## Articles du blog')
    for (const a of posts as Doc[]) {
      if (!a.slug || !a.title) continue
      body.push(line(`${SITE_URL}/fr/blog/${a.slug}`, a.title, blurbFor(a)))
    }
    body.push('')
  }

  body.push(
    '## Faits clés',
    `- Contenus vérifiés selon les monographies EMA/HMPC et la littérature scientifique`,
    `- Chaque fiche inclut contre-indications, précautions et disclaimer médical`,
    `- Langues disponibles : français (source), anglais`,
    `- Licence : contenu éditorial propriétaire, usage non commercial avec attribution`,
    '',
    '## Conformité réglementaire',
    `- Les compléments alimentaires ne sont pas des médicaments`,
    `- Allégations santé conformes au Règlement (CE) 1924/2006 et Règlement (UE) 432/2012 (registre EFSA)`,
    `- Aucune allégation thérapeutique`,
    '',
    '## Crawlers',
    `- Autorisés : GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, anthropic-ai`,
    `- Voir ${SITE_URL}/robots.txt pour la configuration détaillée`,
    '',
    '## Contact',
    `SAS CALEBASSE — 15 rue de la Vistule, 75013 Paris`,
    `contact@remedes-mamie.com`,
    '',
  )

  return new NextResponse(body.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
