import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { PLANTS, type PlantSeed, type PlantCategory } from './plants-data'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 300

const CLOUDINARY_BASE =
  'https://res.cloudinary.com/laboratoire-calebasse/image/upload/rdm/plants'

function imageUrlForSlug(slug: string): string {
  return `${CLOUDINARY_BASE}/${slug}.png`
}

/* ─── Lexical richText helper ────────────────────────────────────── */
function richText(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        children: [
          { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
        ],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
      })),
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

/* ─── Templates per category (description, precautions, contraindications) ── */

type Lang = 'fr' | 'en'

const CATEGORY_INTRO: Record<PlantCategory, Record<Lang, string>> = {
  nervous: {
    fr: 'Les plantes nervines occupent une place de choix dans la pharmacopée européenne. Issues de traditions herboristiques séculaires et d\'études cliniques contemporaines, elles soutiennent l\'équilibre du système nerveux dans le respect des rythmes naturels du corps.',
    en: 'Nervine plants hold a prime place in the European pharmacopoeia. Born of centuries-old herbalist traditions and contemporary clinical studies, they support nervous-system balance while respecting the body\'s natural rhythms.',
  },
  digestive: {
    fr: 'La sphère digestive est l\'un des terrains les plus richement documentés de la phytothérapie. Plantes amères, carminatives, mucilagineuses ou cholérétiques, chaque famille apporte une réponse adaptée aux différents inconforts.',
    en: 'The digestive sphere is one of the most richly documented fields of phytotherapy. Bitter, carminative, mucilaginous or choleretic plants — each family offers a tailored response to different discomforts.',
  },
  respiratory: {
    fr: 'Les voies respiratoires bénéficient d\'un arsenal végétal européen et asiatique riche : plantes balsamiques, expectorantes, mucilagineuses ou immunostimulantes, accompagnant les saisons froides depuis des générations.',
    en: 'The respiratory tract benefits from a rich European and Asian botanical arsenal: balsamic, expectorant, mucilaginous or immunostimulant plants, accompanying cold seasons for generations.',
  },
  female: {
    fr: 'La sphère féminine est l\'un des champs historiques de la médecine des femmes. De la phytothérapie hippocratique aux herboristes médiévales, les plantes dites « de femmes » ont toujours accompagné les cycles, les transitions hormonales et la fertilité.',
    en: 'The female sphere is one of the historical fields of women\'s medicine. From Hippocratic phytotherapy to medieval herbalists, so-called "women\'s plants" have always accompanied cycles, hormonal transitions and fertility.',
  },
  male: {
    fr: 'Plusieurs plantes sont spécifiquement étudiées pour la sphère masculine, notamment pour le confort prostatique et la vitalité après quarante ans. Les monographies HMPC européennes les inscrivent désormais dans un cadre scientifique rigoureux.',
    en: 'Several plants are specifically studied for the male sphere, particularly for prostate comfort and vitality after forty. European HMPC monographs now place them in a rigorous scientific framework.',
  },
  circulatory: {
    fr: 'La circulation veineuse et artérielle constitue l\'un des terrains historiques de la phytothérapie européenne. Les plantes veinotoniques et fluidifiantes sont mentionnées dans les ouvrages d\'herboristerie depuis la Renaissance.',
    en: 'Venous and arterial circulation is one of the historical fields of European phytotherapy. Venotonic and fluidifying plants are mentioned in herbalist references since the Renaissance.',
  },
  joints: {
    fr: 'Le confort articulaire et musculaire mobilise depuis l\'Antiquité des plantes anti-inflammatoires, reminéralisantes ou résines balsamiques. La pharmacopée européenne et l\'Ayurveda s\'y croisent.',
    en: 'Joint and muscle comfort has called on anti-inflammatory, remineralising plants and balsamic resins since Antiquity. European pharmacopoeia and Ayurveda meet here.',
  },
  immunity: {
    fr: 'Le soutien des défenses naturelles repose sur des plantes adaptogènes, immunomodulantes et reminéralisantes étudiées tant en Europe qu\'en Asie. Leur usage saisonnier est attesté depuis des millénaires.',
    en: 'Natural defence support rests on adaptogenic, immunomodulating and remineralising plants studied in Europe and Asia. Their seasonal use is attested for millennia.',
  },
  skin: {
    fr: 'La peau, organe-frontière, occupe une place particulière en herboristerie. Plantes dépuratives, vulnéraires, reminéralisantes ou riches en oméga, chacune répond à une dimension spécifique de la beauté et de la santé cutanée.',
    en: 'The skin, a boundary organ, holds a special place in herbalism. Depurative, vulnerary, remineralising or omega-rich plants — each addresses a specific dimension of skin beauty and health.',
  },
  metabolism: {
    fr: 'L\'équilibre métabolique mobilise des plantes draineuses, hépatorégulatrices, hypoglycémiantes ou thermogéniques utilisées de longue date dans les médecines européennes et orientales.',
    en: 'Metabolic balance draws on draining, hepato-regulating, hypoglycemic and thermogenic plants long used in European and Oriental medicines.',
  },
  multi: {
    fr: 'Certaines plantes traversent les classifications thérapeutiques par leur polyvalence remarquable. Adaptogènes ou nutritives complètes, elles offrent un soutien global à la vitalité.',
    en: 'Some plants cross therapeutic classifications through their remarkable versatility. Adaptogens or complete nutritive sources, they offer holistic support to vitality.',
  },
}

const PRECAUTIONS_GENERIC: Record<Lang, string[]> = {
  fr: [
    'Comme tout complément alimentaire à base de plantes, ce produit ne se substitue pas à une alimentation variée et équilibrée ni à un mode de vie sain. Respecter la dose conseillée et tenir hors de portée des jeunes enfants.',
    'En cas de grossesse, d\'allaitement, de suivi médical en cours ou pour les enfants, demander l\'avis d\'un professionnel de santé avant toute utilisation.',
    'Conserver dans un endroit sec, à l\'abri de la lumière et de la chaleur. Refermer soigneusement après chaque utilisation.',
  ],
  en: [
    'Like any plant-based food supplement, this product does not replace a varied and balanced diet or a healthy lifestyle. Respect the recommended dose and keep out of reach of young children.',
    'In case of pregnancy, breastfeeding, ongoing medical follow-up or for children, seek advice from a health professional before use.',
    'Store in a dry place, away from light and heat. Close carefully after each use.',
  ],
}

const CONTRAINDICATIONS_GENERIC: Record<Lang, string[]> = {
  fr: [
    'Hypersensibilité connue à l\'un des composants ou à la famille botanique correspondante.',
    'Femmes enceintes ou allaitantes (sauf avis médical favorable).',
    'Enfants de moins de 12 ans (sauf indication contraire et avis médical).',
    'Suivi médical concomitant : demander conseil à un professionnel de santé pour évaluer une éventuelle interaction.',
  ],
  en: [
    'Known hypersensitivity to any component or to the corresponding botanical family.',
    'Pregnant or breastfeeding women (unless medically advised otherwise).',
    'Children under 12 (unless otherwise indicated and medically advised).',
    'Concurrent medical follow-up: seek a health professional\'s advice for any possible interaction.',
  ],
}

function buildDescription(plant: PlantSeed, lang: Lang) {
  const intro = CATEGORY_INTRO[plant.cat][lang]
  const specific =
    lang === 'fr'
      ? `${plant.fr.name} (${plant.latin}) en est un exemple remarquable : ${plant.fr.specific}.`
      : `${plant.en.name} (${plant.latin}) is a remarkable example: ${plant.en.specific}.`
  const close =
    lang === 'fr'
      ? `Dans la tradition des Remèdes de Mamie, cette plante est intégrée à une approche globale du soin : matières premières rigoureusement sourcées, transformées en France et accompagnées de conseils respectueux des rythmes naturels du corps.`
      : `In the Remèdes de Mamie tradition, this plant is part of a holistic approach to care: rigorously sourced raw materials, processed in France, accompanied by advice that respects the body's natural rhythms.`
  return richText([intro, specific, close])
}

function buildLongDescription(plant: PlantSeed, lang: Lang): string {
  return [
    CATEGORY_INTRO[plant.cat][lang],
    lang === 'fr'
      ? `${plant.fr.name} (${plant.latin}) en est un exemple remarquable : ${plant.fr.specific}.`
      : `${plant.en.name} (${plant.latin}) is a remarkable example: ${plant.en.specific}.`,
  ].join('\n\n')
}

/* ─── Per-plant slug → benefit-id resolver ───────────────────────── */

async function resolveBenefitIds(payload: any, slugs: string[]): Promise<(string | number)[]> {
  if (slugs.length === 0) return []
  const { docs } = await payload.find({
    collection: 'benefits',
    where: { slug: { in: slugs } },
    limit: 100,
    overrideAccess: true,
    depth: 0,
  })
  return (docs as any[]).map((d) => d.id)
}

/* ─── Route handler ───────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED_IN_PROD !== 'true') {
    return NextResponse.json({ error: 'Disabled in production.' }, { status: 403 })
  }
  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })
  if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({
      message:
        'Add ?confirm=yes to seed. Params: ?reset=yes (TRUNCATE wiki tables first) · ?from=<n>&to=<n> (slice).',
      total: PLANTS.length,
    })
  }

  const payload = await getPayload({ config: configPromise })
  const shouldReset = req.nextUrl.searchParams.get('reset') === 'yes'
  const shouldDropSchema = req.nextUrl.searchParams.get('dropSchema') === 'yes'

  // ── DropSchema mode : nukes all wiki_entries* tables so Payload's
  // push:true rebuilds them with the current code definition. Requires
  // a dev-server restart afterwards before any seed call.
  if (shouldDropSchema) {
    try {
      const drizzle = (payload.db as any)?.drizzle
      if (!drizzle) throw new Error('drizzle adapter not available')
      const dropped: string[] = []
      const result: any = await drizzle.execute(`
        SELECT tablename FROM pg_tables
        WHERE schemaname='public'
          AND (tablename = 'wiki_entries'
            OR tablename LIKE 'wiki_entries\\_%' ESCAPE '\\'
            OR tablename = '_wiki_entries_v'
            OR tablename LIKE '_wiki_entries_v_%')
      `)
      const rows = result?.rows ?? result
      for (const r of rows as any[]) {
        const name = r.tablename
        await drizzle.execute(`DROP TABLE IF EXISTS public."${name}" CASCADE`)
        dropped.push(name)
      }
      await drizzle.execute(`DROP SEQUENCE IF EXISTS plant_ref_seq`)
      return NextResponse.json({
        message: 'Schema dropped. Restart `npm run dev` so Payload recreates the tables, then re-run with ?confirm=yes&reset=yes.',
        dropped,
      })
    } catch (err: any) {
      return NextResponse.json(
        { error: 'drop failed: ' + (err?.message || String(err)) },
        { status: 500 },
      )
    }
  }
  const from = parseInt(req.nextUrl.searchParams.get('from') || '0', 10) || 0
  const to = parseInt(req.nextUrl.searchParams.get('to') || '999', 10) || 999
  const slugFilter = req.nextUrl.searchParams.get('slug') || ''

  const created: string[] = []
  const skipped: string[] = []
  const failed: Array<{ slug: string; error: string }> = []
  let purged = 0

  if (shouldReset) {
    try {
      const drizzle = (payload.db as any)?.drizzle
      if (!drizzle) throw new Error('drizzle adapter not available')
      await drizzle.execute(
        `DO $$
         DECLARE r RECORD;
         BEGIN
           FOR r IN
             SELECT tablename FROM pg_tables
             WHERE schemaname='public'
               AND (tablename = 'wiki_entries'
                 OR tablename LIKE 'wiki_entries\\_%' ESCAPE '\\'
                 OR tablename = '_wiki_entries_v'
                 OR tablename LIKE '_wiki_entries_v_%')
           LOOP
             EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
           END LOOP;
         END$$;`,
      )
      // Reset the plant_ref_seq so we restart from P-001
      await drizzle.execute(`DROP SEQUENCE IF EXISTS plant_ref_seq`)
      purged = 1
    } catch (err: any) {
      failed.push({ slug: '<bulk-purge>', error: 'truncate: ' + (err?.message || String(err)) })
    }
  }

  const slice = slugFilter
    ? PLANTS.filter((p) => p.slug === slugFilter)
    : PLANTS.slice(from, to)

  for (let i = 0; i < slice.length; i++) {
    const plant = slice[i]
    // For slug-filter mode, use the plant's actual position in the master
    // PLANTS list to keep referenceNumber stable.
    const idx = slugFilter ? PLANTS.findIndex((p) => p.slug === plant.slug) : from + i
    const referenceNumber = `P-${String(idx + 1).padStart(3, '0')}`
    try {
      // Skip the existence check when reset just truncated everything —
      // the tables are guaranteed empty. For incremental runs, do a simple
      // find on the main table only (no `draft: true`) to avoid the heavy
      // join with version tables which can fail on schema-sync edge cases.
      if (!shouldReset) {
        const existing = await payload.find({
          collection: 'wikiEntries',
          where: { slug: { equals: plant.slug } },
          limit: 1,
          overrideAccess: true,
        } as any)
        if (existing.docs.length > 0) {
          skipped.push(plant.slug)
          continue
        }
      }

      const seedContext = {
        skipCompliance: true,
        skipComplianceReason: 'seed-plants initial referential',
        skipModeration: true,
      }

      const benefitIds = await resolveBenefitIds(payload, plant.benefits)

      const doc = await payload.create({
        collection: 'wikiEntries',
        data: {
          slug: plant.slug,
          referenceNumber,
          latinName: plant.latin,
          family: plant.family,
          category: plant.cat,
          partsUsed: plant.parts,
          imageType: plant.imgType,
          externalImageUrl: imageUrlForSlug(plant.slug),
          status: 'published',
          complianceStatus: 'approved',
          name: plant.fr.name,
          shortDescription: plant.fr.short,
          longDescription: buildLongDescription(plant, 'fr'),
          description: buildDescription(plant, 'fr'),
          precautionsText: PRECAUTIONS_GENERIC.fr.join(' '),
          precautions: richText(PRECAUTIONS_GENERIC.fr),
          contraindications: richText(CONTRAINDICATIONS_GENERIC.fr),
          origin: plant.fr.origin,
          harvest: plant.fr.harvest,
          form: plant.fr.form,
          conservation: plant.fr.conservation,
          activeCompounds: plant.fr.compounds,
          benefits: benefitIds,
          _status: 'published',
        } as any,
        locale: 'fr',
        overrideAccess: true,
        req: { context: seedContext } as any,
      } as any)

      if (!doc?.id) {
        throw new Error('payload.create returned no id')
      }

      await payload.update({
        collection: 'wikiEntries',
        id: doc.id,
        data: {
          name: plant.en.name,
          shortDescription: plant.en.short,
          longDescription: buildLongDescription(plant, 'en'),
          description: buildDescription(plant, 'en'),
          precautionsText: PRECAUTIONS_GENERIC.en.join(' '),
          precautions: richText(PRECAUTIONS_GENERIC.en),
          contraindications: richText(CONTRAINDICATIONS_GENERIC.en),
          origin: plant.en.origin,
          harvest: plant.en.harvest,
          form: plant.en.form,
          conservation: plant.en.conservation,
          activeCompounds: plant.en.compounds,
        } as any,
        locale: 'en',
        overrideAccess: true,
        req: { context: seedContext } as any,
      } as any)

      created.push(`${(doc as any).referenceNumber || referenceNumber} ${plant.slug}`)
    } catch (err: any) {
      // Surface the actual Postgres error message — drizzle wraps it
      // in `cause` while the top-level message is the generic SQL.
      const causeMsg =
        (err?.cause as any)?.message ||
        (err?.cause as any)?.detail ||
        (err?.cause as any)?.code ||
        ''
      const errMsg = err?.message || String(err)
      const concise = causeMsg
        ? `${causeMsg}${errMsg.startsWith('Failed query') ? '' : ' :: ' + errMsg.slice(0, 100)}`
        : errMsg.slice(0, 200)
      failed.push({ slug: plant.slug, error: concise })
    }
  }

  return NextResponse.json({
    total: slice.length,
    purged,
    created: created.length,
    skipped: skipped.length,
    failed: failed.length,
    details: { created, skipped, failed },
  })
}
