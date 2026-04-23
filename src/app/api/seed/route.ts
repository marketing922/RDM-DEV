import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

// Helper: create if slug doesn't exist, return id
async function upsert(payload: any, collection: string, slug: string, data: any, hasDrafts = false) {
  const slugField = collection === 'blogPosts' ? 'slug' : 'slug'
  const existing = await payload.find({ collection, where: { [slugField]: { equals: slug } }, limit: 1, overrideAccess: true })
  if (existing.docs.length > 0) return existing.docs[0].id as string

  const opts: any = { collection, overrideAccess: true, data }
  if (hasDrafts) opts.draft = false

  const doc = await payload.create(opts)
  return doc.id as string
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production.' }, { status: 403 })
  }
  if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({ message: 'Add ?confirm=yes to run seed.' })
  }

  const payload = await getPayload({ config: configPromise })
  const results: Record<string, string> = {}
  const errors: Record<string, string> = {}

  // ── 1. Author ─────────────────────────────────────────────────────
  let authorId: string | undefined
  try {
    authorId = await upsert(payload, 'authors', 'marie-dupont', {
      name: 'Marie Dupont',
      role: 'Fondatrice & Herboriste',
      credentials: 'Herboriste diplômée',
      slug: 'marie-dupont',
    })
    results.author = 'ok'
  } catch (e: any) { errors.author = e.message }

  // ── 2. Categories ─────────────────────────────────────────────────
  const categoryMap: Record<string, string> = {}
  const categories = [
    { name: 'Conseils', slug: 'conseils', description: 'Conseils pratiques pour utiliser les plantes au quotidien.', order: 1 },
    { name: 'Bien-être', slug: 'bien-etre', description: 'Tout pour votre bien-être au naturel.', order: 2 },
    { name: 'Bienfaits', slug: 'bienfaits', description: 'Découvrez les bienfaits des plantes et des ingrédients naturels.', order: 3 },
    { name: 'Nutrition', slug: 'nutrition', description: 'Nutrition et alimentation saine avec les plantes.', order: 4 },
    { name: 'Plantes', slug: 'plantes', description: 'Fiches détaillées sur les plantes médicinales.', order: 5 },
    { name: 'Recettes', slug: 'recettes', description: 'Recettes de tisanes, infusions et préparations à base de plantes.', order: 6 },
    { name: 'Actualités', slug: 'actualites', description: 'Les dernières nouvelles du monde des plantes et de la phytothérapie.', order: 7 },
  ]
  try {
    for (const cat of categories) {
      categoryMap[cat.slug] = await upsert(payload, 'categories', cat.slug, cat)
    }
    results.categories = `${categories.length} ok`
  } catch (e: any) { errors.categories = e.message }

  // ── 3. Tags ───────────────────────────────────────────────────────
  const tagMap: Record<string, string> = {}
  const tags = [
    { name: 'Tisanes', slug: 'tisanes' },
    { name: 'Plantes médicinales', slug: 'plantes-medicinales' },
    { name: 'Bien-être', slug: 'bien-etre' },
    { name: 'Digestion', slug: 'digestion' },
    { name: 'Hiver', slug: 'hiver' },
    { name: 'Curcuma', slug: 'curcuma' },
    { name: 'Infusion', slug: 'infusion' },
  ]
  try {
    for (const tag of tags) {
      tagMap[tag.slug] = await upsert(payload, 'tags', tag.slug, tag)
    }
    results.tags = `${tags.length} ok`
  } catch (e: any) { errors.tags = e.message }

  // ── 4. Benefits ───────────────────────────────────────────────────
  const benefitMap: Record<string, string> = {}
  const benefits = [
    { name: 'Digestion', slug: 'digestion', icon: '🫁', shortDescription: 'Soulager les troubles digestifs naturellement.' },
    { name: 'Sommeil & Relaxation', slug: 'sommeil-relaxation', icon: '😴', shortDescription: 'Retrouver un sommeil réparateur.' },
    { name: 'Immunité', slug: 'immunite', icon: '🛡️', shortDescription: 'Renforcer vos défenses naturelles.' },
    { name: 'Anti-inflammatoire', slug: 'anti-inflammatoire', icon: '💪', shortDescription: 'Aide à maintenir le confort articulaire et musculaire.' },
    { name: 'Énergie & Vitalité', slug: 'energie-vitalite', icon: '⚡', shortDescription: 'Booster votre énergie naturellement.' },
    { name: 'Stress', slug: 'stress', icon: '🧘', shortDescription: 'Gérer le stress avec les plantes.' },
    { name: 'Peau', slug: 'peau', icon: '🌸', shortDescription: 'Prendre soin de votre peau naturellement.' },
    { name: 'Circulation', slug: 'circulation', icon: '🫀', shortDescription: 'Améliorer la circulation sanguine.' },
  ]
  try {
    for (const b of benefits) {
      benefitMap[b.slug] = await upsert(payload, 'benefits', b.slug, {
        ...b,
        status: 'published',
        _status: 'published',
        complianceStatus: 'approved',
      }, true)
    }
    results.benefits = `${benefits.length} ok`
  } catch (e: any) { errors.benefits = e.message }

  // ── 5. Wiki Entries (Plants) ──────────────────────────────────────
  const plants = [
    {
      name: 'Camomille', latinName: 'Matricaria chamomilla', slug: 'camomille',
      shortDescription: 'Plante apaisante et digestive, utilisée depuis l\'Antiquité pour ses propriétés calmantes et anti-inflammatoires.',
      longDescription: 'La camomille matricaire appartient à la famille des Astéracées. Ses fleurs contiennent des composés actifs comme l\'apigénine et le chamazulène, responsables de ses propriétés apaisantes et anti-inflammatoires. Elle est particulièrement appréciée pour faciliter la digestion et favoriser un sommeil réparateur.\n\nUtilisée depuis l\'Antiquité par les Égyptiens, les Grecs et les Romains, la camomille est l\'une des plantes médicinales les plus étudiées au monde. De nombreuses études cliniques ont confirmé ses bienfaits sur le système digestif, le sommeil et la réduction du stress.\n\nEn usage traditionnel, on prépare une infusion avec 1 à 2 cuillères à café de fleurs séchées pour une tasse d\'eau frémissante (90°C). Laisser infuser 5 à 10 minutes, puis filtrer. On peut consommer 2 à 3 tasses par jour, de préférence après les repas ou avant le coucher.\n\nLa camomille peut également être utilisée en application externe sous forme de compresses pour apaiser les irritations cutanées, les coups de soleil légers ou les yeux fatigués. Son huile essentielle, très concentrée, est utilisée en aromathérapie pour ses vertus relaxantes.',
      family: 'Astéracées', origin: 'Europe, Asie', partsUsed: 'Fleurs',
      activeCompounds: 'Apigénine, bisabolol, chamazulène, flavonoïdes',
      harvest: 'Mai à septembre', form: 'Fleurs séchées, infusion', conservation: '12 mois au sec',
      precautionsText: 'Déconseillée aux personnes allergiques aux Astéracées (marguerite, arnica, achillée). Non recommandée pendant la grossesse sans avis médical. Peut interagir avec les anticoagulants.',
      benefitSlugs: ['digestion', 'sommeil-relaxation', 'anti-inflammatoire', 'peau'],
    },
    {
      name: 'Menthe poivrée', latinName: 'Mentha x piperita', slug: 'menthe-poivree',
      shortDescription: 'Plante aromatique rafraîchissante, reconnue pour faciliter la digestion et redonner de l\'énergie.',
      longDescription: 'La menthe poivrée est un hybride naturel entre la menthe aquatique et la menthe verte. Elle est principalement reconnue pour sa richesse en menthol, un composé qui lui confère ses propriétés rafraîchissantes, antispasmodiques et digestives caractéristiques.\n\nOriginaire d\'Europe, la menthe poivrée est cultivée dans le monde entier depuis le XVIIIe siècle. Elle était déjà utilisée dans l\'Égypte ancienne et figure dans la pharmacopée européenne comme plante médicinale de référence pour les troubles digestifs fonctionnels.\n\nLe menthol agit principalement sur les muscles lisses de l\'intestin, contribuant à réduire les crampes et les ballonnements. En infusion, la menthe poivrée aide à soulager les nausées, les flatulences et les sensations de lourdeur après les repas. Elle possède également des propriétés toniques qui aident à lutter contre la fatigue passagère.\n\nPour préparer une infusion de menthe poivrée, utiliser 1 à 2 cuillères à café de feuilles séchées par tasse d\'eau chaude (80-85°C). Infuser 5 à 8 minutes. Consommer après les repas pour favoriser la digestion, ou le matin pour un effet stimulant.',
      family: 'Lamiacées', origin: 'Europe', partsUsed: 'Feuilles',
      activeCompounds: 'Menthol, menthone, flavonoïdes, acide rosmarinique',
      harvest: 'Juin à septembre', form: 'Feuilles séchées, huile essentielle', conservation: '18 mois au sec',
      precautionsText: 'Déconseillée en cas de reflux gastro-œsophagien, de calculs biliaires ou d\'insuffisance hépatique. L\'huile essentielle est contre-indiquée chez les enfants de moins de 6 ans et les femmes enceintes ou allaitantes.',
      benefitSlugs: ['digestion', 'energie-vitalite'],
    },
    {
      name: 'Lavande', latinName: 'Lavandula angustifolia', slug: 'lavande',
      shortDescription: 'Apaisante au parfum envoûtant, la lavande aide à réduire le stress et améliore la qualité du sommeil.',
      longDescription: 'La lavande vraie, ou lavande officinale, est une plante emblématique de la Provence et du bassin méditerranéen. Connue pour son parfum caractéristique et ses propriétés relaxantes, elle est l\'une des plantes les plus utilisées en phytothérapie et en aromathérapie dans le monde.\n\nLes sommités fleuries de la lavande renferment une huile essentielle riche en linalol et en acétate de linalyle, deux composés aux propriétés sédatives, anxiolytiques et antispasmodiques bien documentées. Des études cliniques ont montré que l\'inhalation d\'huile essentielle de lavande contribue à réduire l\'anxiété et à améliorer la qualité du sommeil.\n\nEn usage interne, la lavande se consomme en infusion : 1 à 2 cuillères à café de fleurs séchées dans une tasse d\'eau bouillante, infuser 10 minutes. Elle aide à calmer les tensions nerveuses, à favoriser l\'endormissement et à soulager les maux de tête liés au stress. On recommande 2 à 3 tasses par jour, dont une le soir avant le coucher.\n\nEn usage externe, quelques gouttes d\'huile essentielle de lavande sur l\'oreiller ou en diffusion dans la chambre créent une atmosphère propice au repos. En application cutanée diluée dans une huile végétale, elle apaise les petites brûlures, les piqûres d\'insectes et les irritations de la peau.',
      family: 'Lamiacées', origin: 'Bassin méditerranéen', partsUsed: 'Sommités fleuries',
      activeCompounds: 'Linalol, acétate de linalyle, tanins, coumarines',
      harvest: 'Juillet à août', form: 'Fleurs séchées, huile essentielle', conservation: '24 mois au sec',
      precautionsText: 'L\'huile essentielle de lavande est généralement bien tolérée mais peut provoquer des réactions allergiques cutanées chez les personnes sensibles. Déconseillée par voie orale chez les femmes enceintes et les enfants de moins de 3 ans.',
      benefitSlugs: ['sommeil-relaxation', 'stress', 'peau'],
    },
    {
      name: 'Curcuma', latinName: 'Curcuma longa', slug: 'curcuma',
      shortDescription: 'Épice dorée aux puissantes propriétés anti-inflammatoires, utilisée depuis des millénaires en médecine ayurvédique.',
      longDescription: 'Le curcuma est une plante tropicale de la famille des Zingibéracées, originaire d\'Asie du Sud-Est. Son rhizome, d\'un jaune orangé intense, est utilisé depuis plus de 4 000 ans en médecine traditionnelle indienne (Ayurveda) et chinoise pour ses remarquables propriétés anti-inflammatoires et antioxydantes.\n\nLa curcumine, principal composé actif du curcuma, a fait l\'objet de milliers d\'études scientifiques. Elle contribue à maintenir le confort articulaire, à soutenir le système digestif et à protéger les cellules contre le stress oxydatif. Cependant, la curcumine est naturellement peu biodisponible : son absorption est considérablement améliorée (jusqu\'à 2 000 %) lorsqu\'elle est associée à la pipérine du poivre noir.\n\nEn cuisine, le curcuma s\'intègre facilement dans les plats quotidiens : soupes, currys, riz, smoothies et laits dorés (golden milk). Pour un usage plus ciblé en phytothérapie, on le trouve sous forme de gélules standardisées en curcuminoïdes, de poudre pure ou de teinture mère.\n\nLe « lait doré » est une préparation traditionnelle ayurvédique : mélanger 1 cuillère à café de curcuma en poudre avec du lait végétal chaud, une pincée de poivre noir, une touche de miel et éventuellement de la cannelle. Cette boisson réconfortante peut être consommée quotidiennement pour bénéficier des propriétés du curcuma.',
      family: 'Zingibéracées', origin: 'Asie du Sud-Est', partsUsed: 'Rhizome',
      activeCompounds: 'Curcumine, turmérone, polysaccharides, huile essentielle',
      harvest: 'Octobre à décembre', form: 'Poudre, gélules, rhizome frais', conservation: '24 mois au sec et à l\'abri de la lumière',
      precautionsText: 'Déconseillé en cas d\'obstruction des voies biliaires, de calculs biliaires ou de traitement anticoagulant. À éviter en cas de grossesse à doses thérapeutiques. Les doses culinaires habituelles ne présentent pas de risque.',
      benefitSlugs: ['anti-inflammatoire', 'digestion'],
    },
    {
      name: 'Thym', latinName: 'Thymus vulgaris', slug: 'thym',
      shortDescription: 'Antiseptique puissant, le thym renforce les défenses naturelles et aide à combattre les infections hivernales.',
      longDescription: 'Le thym commun est un petit arbuste aromatique de la famille des Lamiacées, omniprésent dans les garrigues du bassin méditerranéen. Plante médicinale majeure de la pharmacopée européenne, il est reconnu depuis l\'Antiquité pour ses puissantes propriétés antiseptiques, expectorantes et immunostimulantes.\n\nLe thymol et le carvacrol, ses deux principaux composés actifs, possèdent une activité antimicrobienne remarquable contre de nombreuses bactéries et champignons. Ces propriétés font du thym un allié précieux pendant la saison froide pour aider l\'organisme à se défendre contre les infections des voies respiratoires.\n\nEn infusion, le thym aide à dégager les voies respiratoires, à calmer la toux et à soulager les maux de gorge. On prépare une tisane avec 1 à 2 cuillères à café de thym séché (ou un petit bouquet de thym frais) dans une tasse d\'eau bouillante, infuser 10 minutes à couvert. L\'ajout d\'une cuillère de miel et de quelques gouttes de citron renforce l\'action apaisante sur la gorge.\n\nLe thym contribue également à faciliter la digestion grâce à ses propriétés carminatives (réduction des gaz) et antispasmodiques. Une tasse après le repas aide à soulager les ballonnements et les lourdeurs digestives. En gargarisme, l\'infusion de thym refroidie aide à assainir la bouche et à soulager les irritations de la gorge.',
      family: 'Lamiacées', origin: 'Bassin méditerranéen', partsUsed: 'Feuilles, sommités fleuries',
      activeCompounds: 'Thymol, carvacrol, flavonoïdes, acide rosmarinique',
      harvest: 'Mai à juillet', form: 'Feuilles séchées, huile essentielle', conservation: '12 mois au sec',
      precautionsText: 'L\'huile essentielle de thym est très puissante et ne doit jamais être ingérée pure. Déconseillée aux femmes enceintes et allaitantes, ainsi qu\'aux enfants de moins de 6 ans. En cas d\'hypertension, préférer le thym à linalol plutôt que le thym à thymol.',
      benefitSlugs: ['immunite', 'digestion'],
    },
    {
      name: 'Romarin', latinName: 'Rosmarinus officinalis', slug: 'romarin',
      shortDescription: 'Tonique et stimulant, le romarin favorise la digestion et améliore la circulation sanguine.',
      longDescription: 'Le romarin est un arbrisseau aromatique vivace de la famille des Lamiacées, poussant naturellement sur les sols calcaires et ensoleillés du pourtour méditerranéen. Surnommé « herbe de la mémoire » au Moyen Âge, il est utilisé depuis des siècles aussi bien en cuisine qu\'en médecine traditionnelle pour ses vertus toniques, hépatoprotectrices et digestives.\n\nL\'acide rosmarinique, le carnosol et l\'eucalyptol sont les principaux composés actifs du romarin. Ils lui confèrent des propriétés antioxydantes puissantes, une action stimulante sur la sécrétion biliaire (cholagogue et cholérétique) et des effets bénéfiques sur la circulation sanguine périphérique.\n\nLe romarin est traditionnellement utilisé pour favoriser la digestion des repas riches en graisses, soutenir le fonctionnement hépatique et lutter contre la fatigue intellectuelle et physique. En infusion, utiliser 1 à 2 cuillères à café de feuilles séchées par tasse d\'eau bouillante, infuser 10 minutes. On peut consommer 2 à 3 tasses par jour, de préférence le matin et après les repas.\n\nEn usage externe, l\'infusion de romarin peut être utilisée en eau de rinçage capillaire pour stimuler la pousse des cheveux et leur donner de la brillance. En bain de pieds, elle aide à relancer la circulation sanguine et à soulager les jambes lourdes. L\'huile essentielle de romarin, en massage diluée dans une huile végétale, aide à décontracter les muscles et à soulager les douleurs articulaires.',
      family: 'Lamiacées', origin: 'Bassin méditerranéen', partsUsed: 'Feuilles',
      activeCompounds: 'Acide rosmarinique, carnosol, eucalyptol, camphre',
      harvest: 'Avril à juin', form: 'Feuilles séchées, huile essentielle', conservation: '18 mois au sec',
      precautionsText: 'Déconseillé aux personnes souffrant d\'hypertension artérielle, d\'épilepsie ou de troubles hépatiques graves. L\'huile essentielle de romarin à camphre est contre-indiquée chez les femmes enceintes, allaitantes et les enfants de moins de 6 ans.',
      benefitSlugs: ['digestion', 'energie-vitalite', 'circulation'],
    },
  ]
  // Delete existing plants to update with full data
  for (const p of plants) {
    try {
      const old = await payload.find({ collection: 'wikiEntries', where: { slug: { equals: p.slug } }, limit: 1, overrideAccess: true })
      if (old.docs.length > 0) {
        await payload.delete({ collection: 'wikiEntries', id: old.docs[0].id, overrideAccess: true })
      }
    } catch (_) {}
  }
  try {
    for (const p of plants) {
      const benefitIds = p.benefitSlugs.map(s => benefitMap[s]).filter(Boolean)
      await upsert(payload, 'wikiEntries', p.slug, {
        name: p.name,
        latinName: p.latinName,
        slug: p.slug,
        shortDescription: p.shortDescription,
        longDescription: p.longDescription,
        family: p.family,
        origin: p.origin,
        partsUsed: p.partsUsed,
        activeCompounds: p.activeCompounds,
        harvest: p.harvest,
        form: p.form,
        conservation: p.conservation,
        precautionsText: p.precautionsText,
        benefits: benefitIds,
        author: authorId,
        status: 'published',
        _status: 'published',
        complianceStatus: 'approved',
      }, true)
    }
    results.wikiEntries = `${plants.length} ok`
  } catch (e: any) { errors.wikiEntries = e.message }

  // ── 6. Blog Posts ─────────────────────────────────────────────────
  // Delete old test post if exists
  try {
    const old = await payload.find({ collection: 'blogPosts', where: { slug: { equals: 'tisanes-hiver' } }, limit: 1, overrideAccess: true })
    if (old.docs.length > 0) {
      await payload.delete({ collection: 'blogPosts', id: old.docs[0].id, overrideAccess: true })
    }
  } catch (_) {}

  const posts = [
    {
      title: 'Les bienfaits méconnus des tisanes de grand-mère',
      slug: 'bienfaits-meconnus-tisanes-grand-mere',
      excerpt: 'Découvrez comment les recettes ancestrales peuvent transformer votre quotidien et améliorer votre bien-être naturellement. La camomille matricaire est l\'une des plantes les plus étudiées au monde.',
      readingTime: 5,
      publishedAt: '2026-04-12',
      categorySlugs: 'bienfaits',
      tagSlugs: ['tisanes', 'bien-etre', 'plantes-medicinales'],
    },
    {
      title: 'Comment préparer une tisane parfaite',
      slug: 'preparer-tisane-parfaite',
      excerpt: 'Température de l\'eau, durée d\'infusion, choix des plantes : tous les secrets pour réussir vos tisanes à la maison et en tirer le maximum de bienfaits.',
      readingTime: 4,
      publishedAt: '2026-04-10',
      categorySlugs: 'conseils',
      tagSlugs: ['infusion', 'tisanes'],
    },
    {
      title: 'Les plantes pour mieux dormir',
      slug: 'plantes-pour-mieux-dormir',
      excerpt: 'Camomille, tilleul, valériane, passiflore et mélisse : découvrez les plantes les plus efficaces pour retrouver un sommeil réparateur naturellement.',
      readingTime: 3,
      publishedAt: '2026-04-08',
      categorySlugs: 'conseils',
      tagSlugs: ['tisanes', 'plantes-medicinales', 'bien-etre'],
    },
    {
      title: '5 recettes de smoothies aux plantes',
      slug: 'recettes-smoothies-plantes',
      excerpt: 'Des recettes simples et délicieuses pour intégrer les plantes médicinales dans votre alimentation quotidienne. Du petit-déjeuner au goûter.',
      readingTime: 5,
      publishedAt: '2026-04-06',
      categorySlugs: 'recettes',
      tagSlugs: ['bien-etre', 'plantes-medicinales'],
    },
    {
      title: 'Phytothérapie : guide complet',
      slug: 'phytotherapie-guide-complet',
      excerpt: 'Tout ce que vous devez savoir sur la phytothérapie : principes, histoire, réglementation et comment choisir les bonnes plantes pour vos besoins.',
      readingTime: 8,
      publishedAt: '2026-04-04',
      categorySlugs: 'bienfaits',
      tagSlugs: ['plantes-medicinales', 'bien-etre'],
    },
    {
      title: 'Le curcuma : l\'épice aux mille vertus',
      slug: 'curcuma-epice-mille-vertus',
      excerpt: 'Utilisé depuis des millénaires en médecine ayurvédique, le curcuma est reconnu pour ses propriétés anti-inflammatoires naturelles. Apprenez à l\'associer au poivre noir.',
      readingTime: 7,
      publishedAt: '2026-04-02',
      categorySlugs: 'bienfaits',
      tagSlugs: ['curcuma', 'plantes-medicinales', 'bien-etre'],
    },
    {
      title: 'Les super-aliments oubliés',
      slug: 'super-aliments-oublies',
      excerpt: 'Redécouvrez les plantes et aliments ancestraux que nos grands-mères utilisaient au quotidien et qui reviennent aujourd\'hui sur le devant de la scène.',
      readingTime: 6,
      publishedAt: '2026-03-30',
      categorySlugs: 'actualites',
      tagSlugs: ['plantes-medicinales', 'bien-etre'],
    },
    {
      title: 'Infusions d\'été rafraîchissantes',
      slug: 'infusions-ete-rafraichissantes',
      excerpt: 'Menthe, hibiscus, citronnelle : nos meilleures recettes d\'infusions glacées pour rester hydraté et profiter des bienfaits des plantes même en été.',
      readingTime: 4,
      publishedAt: '2026-03-28',
      categorySlugs: 'recettes',
      tagSlugs: ['infusion', 'tisanes', 'bien-etre'],
    },
    {
      title: '5 tisanes indispensables pour l\'hiver',
      slug: '5-tisanes-indispensables-hiver',
      excerpt: 'Thym, eucalyptus, échinacée, sureau et gingembre : préparez votre corps pour l\'hiver avec ces tisanes aux propriétés reconnues.',
      readingTime: 5,
      publishedAt: '2026-03-25',
      categorySlugs: 'conseils',
      tagSlugs: ['tisanes', 'hiver', 'plantes-medicinales'],
    },
  ]
  // Try each post individually to identify exactly which fails
  for (const post of posts) {
    try {
      const tagIds = post.tagSlugs.map(s => tagMap[s]).filter(Boolean)
      await upsert(payload, 'blogPosts', post.slug, {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        readingTime: post.readingTime,
        publishedAt: post.publishedAt,
        author: authorId,
        category: categoryMap[post.categorySlugs],
        tags: tagIds,
        status: 'published',
        _status: 'published',
        complianceStatus: 'approved',
      }, true)
      results[`blog:${post.slug}`] = 'ok'
    } catch (e: any) { errors[`blog:${post.slug}`] = e.message }
  }

  // ── 7. Link Benefits → Plants (reverse relationship) ───────────
  try {
    // Build a map: benefitSlug → [plantId, ...]
    const benefitToPlants: Record<string, string[]> = {}
    for (const p of plants) {
      // Get the plant ID from DB
      const found = await payload.find({ collection: 'wikiEntries', where: { slug: { equals: p.slug } }, limit: 1, overrideAccess: true })
      if (found.docs.length === 0) continue
      const plantId = found.docs[0].id as string
      for (const bSlug of p.benefitSlugs) {
        if (!benefitToPlants[bSlug]) benefitToPlants[bSlug] = []
        benefitToPlants[bSlug].push(plantId)
      }
    }
    // Update each benefit with its relatedPlants
    for (const [bSlug, plantIds] of Object.entries(benefitToPlants)) {
      const bId = benefitMap[bSlug]
      if (!bId) continue
      await payload.update({
        collection: 'benefits',
        id: bId,
        overrideAccess: true,
        draft: false,
        data: { relatedPlants: plantIds },
      })
    }
    results.benefitLinks = `${Object.keys(benefitToPlants).length} benefits linked`
  } catch (e: any) { errors.benefitLinks = e.message }

  const hasErrors = Object.keys(errors).length > 0
  return NextResponse.json({ message: hasErrors ? 'Seed partial' : 'Seed complete', results, errors }, { status: hasErrors ? 207 : 200 })
}
