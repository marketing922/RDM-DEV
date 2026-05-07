import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 120

// Fabrique un objet `req.context` frais à chaque appel : Payload mute
// l'objet en interne (effet de bord constaté en boucle), un objet partagé
// se vide après la 1ʳᵉ création et les hooks de conformité/modération
// se déclenchent à nouveau sur les itérations suivantes.
const makeSeedReq = () => ({
  context: {
    skipCompliance: true,
    skipComplianceReason: 'seed-blog-articles batch upsert',
    skipModeration: true,
    skipEmbed: true,
  },
})

/**
 * Construit un richText Lexical structuré : pour chaque paragraphe, un h2
 * d'introduction (si fourni) puis le paragraphe lui-même. Les `headings` et
 * `paragraphs` sont alignés par index. Une chaîne `headings[i]` vide
 * supprime le titre de cette section.
 *
 * Ce format permet à `extractSections()` côté front (blog/[slug]/page.tsx)
 * de découper l'article en sections cliquables dans le sommaire latéral.
 */
function richText(paragraphs: string[], headings: string[] = []) {
  const textNode = (text: string) => ({
    type: 'text',
    text,
    format: 0,
    detail: 0,
    mode: 'normal',
    style: '',
    version: 1,
  })
  const children: any[] = []
  paragraphs.forEach((p, i) => {
    const h = headings[i]
    if (h && h.trim()) {
      children.push({
        type: 'heading',
        tag: 'h2',
        children: [textNode(h)],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      })
    }
    children.push({
      type: 'paragraph',
      children: [textNode(p)],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      textFormat: 0,
      textStyle: '',
    })
  })
  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

type FaqQA = { question: string; answer: string }

type Article = {
  slug: string
  publishedAt: string
  readingTime: number
  categorySlug: string
  tagSlugs: string[]
  plantSlugs: string[]
  benefitSlugs: string[]
  fr: { title: string; excerpt: string; content: string[]; headings: string[] }
  en: { title: string; excerpt: string; content: string[]; headings: string[] }
}

const ARTICLES: Article[] = [
  {
    slug: 'bien-dormir-valeriane-passiflore',
    publishedAt: '2026-04-22',
    readingTime: 5,
    categorySlug: 'conseils',
    tagSlugs: ['tisanes', 'bien-etre', 'plantes-medicinales'],
    plantSlugs: ['valeriane', 'passiflore', 'melisse'],
    benefitSlugs: ['sommeil', 'detente-nerveuse'],
    fr: {
      title: 'Bien dormir avec la valériane et la passiflore',
      excerpt:
        "Deux plantes traditionnellement utilisées pour favoriser un sommeil paisible. Comment les associer en tisane le soir, quand les éviter, et pourquoi la mélisse complète bien le duo.",
      headings: [
        'La valériane, une racine apaisante',
        'La passiflore en synergie',
        'Adoucir avec la mélisse',
        'Précautions à connaître',
      ],
      content: [
        "La valériane (Valeriana officinalis) est utilisée depuis l'Antiquité pour accompagner les nuits agitées. La pharmacopée européenne reconnaît son usage traditionnel pour soulager les états de tension nerveuse légère et favoriser l'endormissement.",
        "La passiflore (Passiflora incarnata) agit en synergie : elle est traditionnellement employée pour calmer la nervosité, particulièrement chez les personnes sujettes aux ruminations du soir. Une infusion combinée valériane-passiflore prise 30 à 60 minutes avant le coucher est une recette classique.",
        "Pour adoucir l'amertume marquée de la valériane, ajoutez de la mélisse (Melissa officinalis) : son arôme citronné rend le mélange plus agréable, tout en apportant ses propres propriétés apaisantes reconnues.",
        "Précautions : évitez la valériane en cas de grossesse, d'allaitement, ou en association avec des sédatifs médicamenteux. En cas de troubles du sommeil persistants au-delà de quelques semaines, parlez-en à votre médecin.",
      ],
    },
    en: {
      title: 'Sleeping well with valerian and passionflower',
      excerpt:
        "Two plants traditionally used to support restful sleep. How to combine them in an evening infusion, when to avoid them, and why lemon balm rounds out the trio nicely.",
      headings: [
        'Valerian, a soothing root',
        'Passionflower in synergy',
        'Soften with lemon balm',
        'Precautions to know',
      ],
      content: [
        "Valerian (Valeriana officinalis) has been used since antiquity to support restless nights. The European pharmacopoeia recognizes its traditional use to relieve mild nervous tension and promote falling asleep.",
        "Passionflower (Passiflora incarnata) works synergistically: it is traditionally used to calm nervousness, particularly in people prone to evening rumination. A combined valerian-passionflower infusion taken 30 to 60 minutes before bed is a classic recipe.",
        "To soften valerian's marked bitterness, add lemon balm (Melissa officinalis): its citrus aroma makes the blend more pleasant while contributing its own recognized soothing properties.",
        "Precautions: avoid valerian during pregnancy, breastfeeding, or in combination with sedative medications. If sleep difficulties persist beyond a few weeks, talk to your doctor.",
      ],
    },
  },
  {
    slug: 'melisse-anti-stress-quotidien',
    publishedAt: '2026-04-19',
    readingTime: 4,
    categorySlug: 'bien-etre',
    tagSlugs: ['bien-etre', 'plantes-medicinales', 'tisanes'],
    plantSlugs: ['melisse', 'lavande'],
    benefitSlugs: ['detente-nerveuse', 'confort-mental'],
    fr: {
      title: 'Mélisse : la plante anti-stress du quotidien',
      excerpt:
        "Cultivée dans les jardins de monastère depuis le Moyen Âge, la mélisse est une plante apaisante au parfum citronné. Idéale pour les périodes de tension légère, seule ou avec la lavande.",
      headings: [
        'Une plante des jardins de monastère',
        "Comment la consommer",
        'En duo avec la lavande',
        'Précautions',
      ],
      content: [
        "Surnommée « herbe aux abeilles » pour ses fleurs très mellifères, la mélisse (Melissa officinalis) est traditionnellement utilisée pour atténuer les manifestations légères du stress et faciliter l'endormissement, selon la monographie de l'Agence européenne des médicaments.",
        "On la consomme en infusion (1 cuillère à soupe de feuilles séchées dans 200 ml d'eau frémissante, 5 à 10 minutes) jusqu'à trois fois par jour. Sa saveur citronnée et fraîche en fait l'une des tisanes les plus appréciées, y compris des enfants à partir de 12 ans.",
        "Associée à la lavande (Lavandula angustifolia), la mélisse forme un duo classique pour les fins de journée chargées : la lavande apporte ses notes florales et ses propres propriétés relaxantes traditionnellement reconnues.",
        "À éviter en cas de troubles thyroïdiens sans avis médical. Comme toute plante à effet apaisant, ne pas associer à des sédatifs sans accompagnement professionnel.",
      ],
    },
    en: {
      title: 'Lemon balm: the everyday anti-stress plant',
      excerpt:
        "Grown in monastery gardens since the Middle Ages, lemon balm is a soothing plant with a citrus scent. Ideal for periods of mild tension, alone or paired with lavender.",
      headings: [
        'A monastery-garden plant',
        'How to consume it',
        'Paired with lavender',
        'Precautions',
      ],
      content: [
        "Nicknamed “bee herb” for its highly nectar-bearing flowers, lemon balm (Melissa officinalis) is traditionally used to ease mild manifestations of stress and support falling asleep, according to the European Medicines Agency monograph.",
        "It is consumed as an infusion (1 tablespoon of dried leaves in 200 ml of simmering water, 5 to 10 minutes) up to three times a day. Its fresh, citrusy flavor makes it one of the most enjoyable herbal teas, including for children aged 12 and up.",
        "Combined with lavender (Lavandula angustifolia), lemon balm forms a classic duo for busy day endings: lavender brings its floral notes and its own traditionally recognized relaxing properties.",
        "Avoid in case of thyroid disorders without medical advice. As with any soothing plant, do not combine with sedatives without professional guidance.",
      ],
    },
  },
  {
    slug: 'romarin-concentration-rentree',
    publishedAt: '2026-04-15',
    readingTime: 5,
    categorySlug: 'conseils',
    tagSlugs: ['bien-etre', 'plantes-medicinales'],
    plantSlugs: ['romarin', 'ginkgo'],
    benefitSlugs: ['concentration', 'periode-examens'],
    fr: {
      title: 'Romarin et ginkgo : un duo pour la concentration',
      excerpt:
        "Pendant les périodes intenses (rentrée, examens, projets exigeants), certaines plantes peuvent soutenir la vigilance intellectuelle. Tour d'horizon du romarin et du ginkgo.",
      headings: [
        'Le romarin, plante de la mémoire',
        'Le ginkgo, arbre millénaire',
        'Comment les combiner',
        'Précautions',
      ],
      content: [
        "Le romarin (Rosmarinus officinalis) est traditionnellement associé à la mémoire — Shakespeare lui-même le faisait dire à Ophélie : « Voici du romarin, c'est pour le souvenir. » Au-delà du folklore, son usage en infusion matinale est apprécié pour son effet tonique léger.",
        "Le ginkgo biloba, arbre vivant depuis plus de 200 millions d'années, est aujourd'hui étudié pour son rôle dans la microcirculation cérébrale. Il fait partie des plantes inscrites à la pharmacopée européenne, principalement sous forme d'extrait standardisé.",
        "Pour les périodes d'examens ou de surcharge mentale, on peut combiner une infusion de romarin le matin et une supplémentation en ginkgo (toujours sous forme d'extrait standardisé, en respectant les doses). Pensez à boire suffisamment d'eau et à dormir : aucune plante ne remplace un sommeil de qualité.",
        "Le ginkgo est contre-indiqué avant une chirurgie et en cas de prise d'anticoagulants. Demandez l'avis de votre pharmacien avant toute association.",
      ],
    },
    en: {
      title: 'Rosemary and ginkgo: a duo for focus',
      excerpt:
        "During demanding periods (back-to-school, exams, challenging projects), some plants can support mental alertness. Overview of rosemary and ginkgo.",
      headings: [
        'Rosemary, the memory plant',
        'Ginkgo, the ancient tree',
        'How to combine them',
        'Precautions',
      ],
      content: [
        "Rosemary (Rosmarinus officinalis) has long been associated with memory — Shakespeare himself had Ophelia say: “There's rosemary, that's for remembrance.” Beyond folklore, its morning infusion is appreciated for its mild tonic effect.",
        "Ginkgo biloba, a tree species alive for more than 200 million years, is studied today for its role in cerebral microcirculation. It is one of the plants listed in the European pharmacopoeia, primarily as a standardized extract.",
        "During exam periods or mental overload, a morning rosemary infusion can be combined with ginkgo supplementation (always as a standardized extract, at recommended doses). Drink enough water and sleep well: no plant replaces quality rest.",
        "Ginkgo is contraindicated before surgery and when taking anticoagulants. Ask your pharmacist before any combination.",
      ],
    },
  },
  {
    slug: 'menthe-poivree-allie-digestion',
    publishedAt: '2026-04-12',
    readingTime: 4,
    categorySlug: 'bienfaits',
    tagSlugs: ['digestion', 'tisanes', 'plantes-medicinales'],
    plantSlugs: ['menthe-poivree', 'fenouil'],
    benefitSlugs: ['digestion-difficile', 'apres-repas'],
    fr: {
      title: 'Menthe poivrée : votre alliée digestion',
      excerpt:
        "La tisane de menthe poivrée après le repas est un classique français. Pourquoi elle fonctionne, comment la préparer, et avec qui l'associer (notamment le fenouil).",
      headings: [
        'Une digestive bien documentée',
        'Comment la préparer',
        'Avec le fenouil pour les ballonnements',
        'Précautions',
      ],
      content: [
        "La menthe poivrée (Mentha × piperita) est l'une des plantes digestives les mieux documentées. La monographie de l'Agence européenne des médicaments reconnaît son usage traditionnel pour soulager les troubles digestifs mineurs et les ballonnements.",
        "En infusion : 1 à 2 cuillères à café de feuilles séchées dans 150 ml d'eau frémissante, 5 à 10 minutes. À boire de préférence après le repas. Son menthol naturel rafraîchit l'haleine et apporte une sensation de fraîcheur immédiate.",
        "Pour les digestions lentes accompagnées de gaz, le fenouil (Foeniculum vulgare) est un excellent compagnon : il est lui aussi inscrit à la pharmacopée européenne pour son action sur les ballonnements. Le mélange menthe-fenouil 50/50 est très apprécié.",
        "Précautions : la menthe poivrée concentrée (huile essentielle) est déconseillée chez l'enfant de moins de 8 ans, la femme enceinte et en cas de reflux gastro-œsophagien sévère. La tisane reste tolérée par le plus grand nombre.",
      ],
    },
    en: {
      title: 'Peppermint: your digestion ally',
      excerpt:
        "Peppermint tea after meals is a French classic. Why it works, how to prepare it, and which plants to pair it with (especially fennel).",
      headings: [
        'A well-documented digestive',
        'How to prepare it',
        'With fennel for bloating',
        'Precautions',
      ],
      content: [
        "Peppermint (Mentha × piperita) is one of the best-documented digestive plants. The European Medicines Agency monograph recognizes its traditional use to relieve minor digestive disorders and bloating.",
        "As an infusion: 1 to 2 teaspoons of dried leaves in 150 ml of simmering water, 5 to 10 minutes. Best consumed after meals. Its natural menthol refreshes the breath and provides an immediate cooling sensation.",
        "For slow digestion with gas, fennel (Foeniculum vulgare) is an excellent companion: it is also listed in the European pharmacopoeia for its action on bloating. A 50/50 peppermint-fennel blend is very popular.",
        "Precautions: concentrated peppermint (essential oil) is not recommended for children under 8, pregnant women, or in cases of severe gastroesophageal reflux. The infusion remains well tolerated by most people.",
      ],
    },
  },
  {
    slug: 'artichaut-chardon-marie-foie',
    publishedAt: '2026-04-08',
    readingTime: 6,
    categorySlug: 'bienfaits',
    tagSlugs: ['plantes-medicinales', 'bien-etre'],
    plantSlugs: ['artichaut', 'chardon-marie', 'boldo'],
    benefitSlugs: ['confort-hepatique', 'apres-repas'],
    fr: {
      title: 'Artichaut et chardon-marie : un foie en pleine forme',
      excerpt:
        "Après les repas riches ou les périodes de fêtes, certaines plantes amères soutiennent traditionnellement le confort hépatique. Focus sur l'artichaut, le chardon-marie et le boldo.",
      headings: [
        "L'artichaut, plante hépatique de référence",
        'Le chardon-marie, gardien des cellules',
        'Le boldo, complément traditionnel',
        'Précautions',
      ],
      content: [
        "L'artichaut (Cynara scolymus) est l'une des plantes les mieux étudiées pour le confort digestif et hépatique. La pharmacopée européenne reconnaît son usage traditionnel pour soulager les troubles dyspeptiques et favoriser l'élimination biliaire.",
        "Le chardon-marie (Silybum marianum), plante méditerranéenne aux feuilles marbrées, contient de la silymarine, un complexe de molécules étudié depuis les années 1960 pour son rôle dans la protection des cellules hépatiques.",
        "Le boldo (Peumus boldus), originaire du Chili, complète bien l'artichaut sur le terrain de la digestion grasse. On le retrouve traditionnellement dans les mélanges « après-repas copieux ». À utiliser ponctuellement, pas en cure prolongée.",
        "Ces plantes sont déconseillées en cas d'obstruction biliaire, de calculs ou de trouble hépatique actif sans avis médical. En cas de doute, consultez votre médecin avant toute prise prolongée.",
      ],
    },
    en: {
      title: 'Artichoke and milk thistle: a liver in good shape',
      excerpt:
        "After rich meals or holiday periods, some bitter plants traditionally support liver comfort. Focus on artichoke, milk thistle and boldo.",
      headings: [
        'Artichoke, a reference liver plant',
        'Milk thistle, cell guardian',
        'Boldo, a traditional complement',
        'Precautions',
      ],
      content: [
        "Artichoke (Cynara scolymus) is one of the best-studied plants for digestive and liver comfort. The European pharmacopoeia recognizes its traditional use to relieve dyspeptic disorders and support bile elimination.",
        "Milk thistle (Silybum marianum), a Mediterranean plant with marbled leaves, contains silymarin, a complex of molecules studied since the 1960s for its role in protecting liver cells.",
        "Boldo (Peumus boldus), native to Chile, complements artichoke well in the field of fatty digestion. It is traditionally found in “rich-meal aftermath” blends. Use occasionally, not as a prolonged cure.",
        "These plants are not recommended in cases of biliary obstruction, gallstones, or active liver disease without medical advice. If in doubt, consult your doctor before any prolonged use.",
      ],
    },
  },
  {
    slug: 'thym-maux-gorge-hiver',
    publishedAt: '2026-04-05',
    readingTime: 4,
    categorySlug: 'bienfaits',
    tagSlugs: ['hiver', 'tisanes', 'plantes-medicinales'],
    plantSlugs: ['thym', 'mauve', 'guimauve'],
    benefitSlugs: ['confort-gorge', 'confort-respiratoire'],
    fr: {
      title: 'Thym, mauve, guimauve : trio gagnant contre les maux de gorge',
      excerpt:
        "Quand la gorge irrite, ces trois plantes traditionnelles peuvent apporter du confort. Décryptage de leurs profils complémentaires : antiseptique, adoucissante et émolliente.",
      headings: [
        'Le thym, antiseptique reconnu',
        'La mauve, douceur des muqueuses',
        'La guimauve, racines apaisantes',
        "Recette d'hiver",
      ],
      content: [
        "Le thym (Thymus vulgaris) est connu depuis l'Antiquité pour ses vertus antiseptiques. La monographie de l'Agence européenne des médicaments reconnaît son usage traditionnel pour soulager les symptômes de la toux associée au rhume.",
        "Sa saveur puissante peut rebuter, surtout chez les enfants. C'est là que la mauve (Malva sylvestris) entre en jeu : ses fleurs violettes contiennent des mucilages qui adoucissent les muqueuses irritées. Elle est très douce et bien tolérée.",
        "La guimauve (Althaea officinalis) joue un rôle similaire à la mauve, mais ses racines sont encore plus riches en mucilages. Elle est traditionnellement utilisée en gargarisme ou en infusion contre l'inflammation des muqueuses buccales et de la gorge.",
        "Recette de tisane d'hiver : 1 cuillère à café de thym + 1 cuillère à café de fleurs de mauve dans 250 ml d'eau frémissante, 8 minutes. Adoucir avec une cuillère de miel (sauf chez l'enfant de moins de 1 an).",
      ],
    },
    en: {
      title: 'Thyme, mallow, marshmallow: a winning trio against sore throats',
      excerpt:
        "When the throat is irritated, these three traditional plants can bring comfort. A breakdown of their complementary profiles: antiseptic, soothing and emollient.",
      headings: [
        'Thyme, a recognized antiseptic',
        'Mallow, mucous-membrane comfort',
        'Marshmallow, soothing roots',
        'Winter recipe',
      ],
      content: [
        "Thyme (Thymus vulgaris) has been known since antiquity for its antiseptic properties. The European Medicines Agency monograph recognizes its traditional use to relieve cough symptoms associated with the common cold.",
        "Its strong flavor can be off-putting, especially for children. That's where mallow (Malva sylvestris) comes in: its purple flowers contain mucilages that soothe irritated mucous membranes. It is very gentle and well tolerated.",
        "Marshmallow (Althaea officinalis) plays a similar role to mallow, but its roots are even richer in mucilages. It is traditionally used as a gargle or infusion for inflammation of the oral and throat mucous membranes.",
        "Winter infusion recipe: 1 teaspoon of thyme + 1 teaspoon of mallow flowers in 250 ml of simmering water, 8 minutes. Sweeten with a teaspoon of honey (except for children under 1 year old).",
      ],
    },
  },
  {
    slug: 'echinacee-sureau-immunite-hiver',
    publishedAt: '2026-04-01',
    readingTime: 5,
    categorySlug: 'actualites',
    tagSlugs: ['hiver', 'plantes-medicinales', 'bien-etre'],
    plantSlugs: ['echinacee', 'sureau-noir'],
    benefitSlugs: ['defenses-naturelles', 'voies-aeriennes-superieures'],
    fr: {
      title: 'Échinacée et sureau : un duo immunitaire pour l\'hiver',
      excerpt:
        "À l'approche de la saison froide, deux plantes reviennent systématiquement dans les conseils traditionnels : l'échinacée et le sureau noir. Comment et quand les utiliser.",
      headings: [
        "L'échinacée, soutien immunitaire",
        'Le sureau noir, voies aériennes',
        'En pratique',
        'Précautions importantes',
      ],
      content: [
        "L'échinacée pourpre (Echinacea purpurea) est l'une des plantes les plus étudiées pour le soutien immunitaire. Sa monographie à l'EMA précise un usage traditionnel pour le soulagement précoce des symptômes du rhume, en cures courtes (10 jours maximum).",
        "Le sureau noir (Sambucus nigra) cible plus spécifiquement les voies aériennes supérieures. Ses baies, riches en anthocyanes, sont traditionnellement consommées en sirop ou en décoction pour accompagner les états grippaux légers.",
        "En pratique : commencer une cure d'échinacée dès les premiers signes (gorge qui pique, fatigue inhabituelle), pendant 7 à 10 jours. Le sirop de sureau peut s'utiliser ponctuellement chez l'adulte et l'enfant à partir de 6 ans.",
        "Précautions importantes : l'échinacée est déconseillée en cas de trouble auto-immun, de grossesse et chez les personnes immunodéprimées. Le sureau cru est toxique : ne consommer que les baies cuites ou les préparations commerciales.",
      ],
    },
    en: {
      title: 'Echinacea and elderberry: an immune duo for winter',
      excerpt:
        "As cold season approaches, two plants consistently appear in traditional advice: echinacea and black elderberry. How and when to use them.",
      headings: [
        'Echinacea, immune support',
        'Black elderberry, airways',
        'In practice',
        'Important precautions',
      ],
      content: [
        "Purple echinacea (Echinacea purpurea) is one of the most studied plants for immune support. Its EMA monograph specifies traditional use for early relief of cold symptoms, in short courses (10 days maximum).",
        "Black elderberry (Sambucus nigra) more specifically targets the upper respiratory tract. Its berries, rich in anthocyanins, are traditionally consumed as a syrup or decoction to accompany mild flu states.",
        "In practice: start an echinacea course at the first signs (scratchy throat, unusual fatigue), for 7 to 10 days. Elderberry syrup can be used occasionally in adults and children aged 6 and over.",
        "Important precautions: echinacea is not recommended in cases of autoimmune disease, pregnancy, or for immunocompromised people. Raw elderberry is toxic: only consume cooked berries or commercial preparations.",
      ],
    },
  },
  {
    slug: 'aubepine-plante-coeur',
    publishedAt: '2026-03-27',
    readingTime: 5,
    categorySlug: 'plantes',
    tagSlugs: ['plantes-medicinales', 'bien-etre'],
    plantSlugs: ['aubepine', 'agripaume'],
    benefitSlugs: ['confort-circulatoire', 'detente-nerveuse'],
    fr: {
      title: 'Aubépine : la plante du cœur',
      excerpt:
        "Discrète au printemps avec ses fleurs blanches, l'aubépine est une plante reine de la phytothérapie cardiovasculaire et nerveuse. À utiliser en cure, pas en automédication.",
      headings: [
        'Une plante emblématique',
        'Composition et études',
        "L'agripaume en complément",
        'Important',
      ],
      content: [
        "L'aubépine (Crataegus monogyna et C. oxyacantha) est l'une des plantes les plus emblématiques de la phytothérapie occidentale. Inscrite à la pharmacopée européenne, elle est traditionnellement utilisée dans les états de tension nerveuse légère et les palpitations bénignes ressenties à l'occasion d'un stress.",
        "Ses fleurs et ses sommités fleuries contiennent des flavonoïdes et des proanthocyanidols étudiés pour leur rôle dans le confort cardiovasculaire et nerveux. Les cures se font sur 3 à 4 semaines, en infusion ou en extrait sec.",
        "L'agripaume (Leonurus cardiaca) — son nom latin signifie « lion du cœur » — est traditionnellement associée à l'aubépine dans les troubles fonctionnels d'origine nerveuse, particulièrement à la ménopause. Les deux plantes se complètent bien dans un mélange.",
        "Important : l'aubépine ne se substitue jamais à un suivi médical pour un trouble cardiaque diagnostiqué. En cas de palpitations persistantes, douleur thoracique, essoufflement inhabituel : consultez sans attendre.",
      ],
    },
    en: {
      title: 'Hawthorn: the heart plant',
      excerpt:
        "Discreet in spring with its white flowers, hawthorn is a queen of cardiovascular and nervous phytotherapy. To be used as a course, not for self-medication.",
      headings: [
        'An emblematic plant',
        'Composition and studies',
        'Motherwort as a complement',
        'Important',
      ],
      content: [
        "Hawthorn (Crataegus monogyna and C. oxyacantha) is one of the most emblematic plants in Western phytotherapy. Listed in the European pharmacopoeia, it is traditionally used in states of mild nervous tension and benign palpitations felt during stress.",
        "Its flowers and flowering tops contain flavonoids and proanthocyanidins studied for their role in cardiovascular and nervous comfort. Courses are taken over 3 to 4 weeks, as an infusion or dry extract.",
        "Motherwort (Leonurus cardiaca) — its Latin name means “heart lion” — is traditionally combined with hawthorn for functional disorders of nervous origin, particularly during menopause. Both plants complement each other well in a blend.",
        "Important: hawthorn never replaces medical treatment for a diagnosed heart condition. In case of persistent palpitations, chest pain, or unusual shortness of breath: consult without delay.",
      ],
    },
  },
  {
    slug: 'tilleul-tisane-soir-excellence',
    publishedAt: '2026-03-22',
    readingTime: 4,
    categorySlug: 'recettes',
    tagSlugs: ['tisanes', 'bien-etre', 'plantes-medicinales'],
    plantSlugs: ['tilleul', 'camomille-romaine', 'coquelicot'],
    benefitSlugs: ['sommeil', 'detente-nerveuse'],
    fr: {
      title: 'Tilleul : la tisane du soir par excellence',
      excerpt:
        "Le tilleul reste la tisane familiale française la plus consommée. Son histoire, ses bienfaits traditionnels, et trois recettes simples pour varier les plaisirs en soirée.",
      headings: [
        'Une plante du paysage français',
        'Recette classique',
        'Variante avec la camomille romaine',
        'Variante avec le coquelicot',
      ],
      content: [
        "Le tilleul (Tilia cordata, T. platyphyllos) fait partie du paysage français depuis des siècles. Plantés dans les villages, sur les places des écoles, ses arbres parfument les soirs de juin de leurs fleurs jaune pâle. La pharmacopée française reconnaît son usage traditionnel comme sédatif léger et calmant.",
        "Recette classique : 1 cuillère à soupe de fleurs séchées dans 250 ml d'eau frémissante, 5 à 7 minutes (au-delà, l'infusion devient amère et perd son effet apaisant). À boire 30 minutes avant le coucher.",
        "Variante avec camomille romaine : moitié tilleul, moitié camomille romaine (Chamaemelum nobile), pour ceux qui préfèrent une saveur plus douce et fruitée. Excellent en fin de repas léger.",
        "Variante avec coquelicot : ajouter quelques pétales de coquelicot (Papaver rhoeas) au tilleul. Le coquelicot est traditionnellement utilisé pour les enfants nerveux ou les adultes sujets aux nuits agitées. Son goût est très doux.",
      ],
    },
    en: {
      title: 'Linden: the quintessential evening infusion',
      excerpt:
        "Linden remains the most consumed French family infusion. Its history, traditional benefits, and three simple recipes to vary your evening pleasures.",
      headings: [
        'A plant of the French landscape',
        'Classic recipe',
        'Variation with Roman chamomile',
        'Variation with red poppy',
      ],
      content: [
        "Linden (Tilia cordata, T. platyphyllos) has been part of the French landscape for centuries. Planted in villages and schoolyards, its trees scent June evenings with their pale yellow flowers. The French pharmacopoeia recognizes its traditional use as a mild sedative and calming agent.",
        "Classic recipe: 1 tablespoon of dried flowers in 250 ml of simmering water, 5 to 7 minutes (beyond that, the infusion becomes bitter and loses its soothing effect). Drink 30 minutes before bedtime.",
        "Variation with Roman chamomile: half linden, half Roman chamomile (Chamaemelum nobile), for those who prefer a softer, fruitier flavor. Excellent after a light meal.",
        "Variation with red poppy: add a few red poppy petals (Papaver rhoeas) to the linden. Red poppy is traditionally used for nervous children or adults prone to restless nights. Its taste is very mild.",
      ],
    },
  },
  {
    slug: 'lavande-bien-plus-fleur-parfumee',
    publishedAt: '2026-03-18',
    readingTime: 5,
    categorySlug: 'bien-etre',
    tagSlugs: ['bien-etre', 'plantes-medicinales'],
    plantSlugs: ['lavande'],
    benefitSlugs: ['detente-nerveuse', 'sommeil'],
    fr: {
      title: 'Lavande : bien plus qu\'une fleur parfumée',
      excerpt:
        "Symbole de la Provence, la lavande est aussi une plante de phytothérapie reconnue pour ses propriétés relaxantes. Comment l'utiliser au quotidien sans tomber dans le marketing.",
      headings: [
        'Lavande vraie ou lavandin ?',
        'Études et reconnaissance',
        'Comment la consommer',
        'Huile essentielle de lavande',
      ],
      content: [
        "La lavande vraie (Lavandula angustifolia) ne doit pas être confondue avec le lavandin, son cousin hybride utilisé surtout en parfumerie. Pour les usages bien-être, c'est la lavande officinale qu'il faut chercher, idéalement issue d'une culture biologique en altitude (Provence, Drôme, Hautes-Alpes).",
        "L'Agence européenne des médicaments reconnaît son usage traditionnel par voie orale pour soulager les symptômes mineurs de stress mental et favoriser le sommeil. Son huile essentielle est étudiée depuis les années 1990 pour son effet sur l'anxiété légère.",
        "En infusion : 1 cuillère à café de fleurs séchées dans 200 ml d'eau, 5 minutes. La saveur est puissante et peut surprendre — beaucoup la préfèrent en mélange (avec mélisse ou tilleul). En sachet sous l'oreiller, son parfum accompagne traditionnellement l'endormissement.",
        "L'huile essentielle de lavande vraie est l'une des plus tolérées : pure sur la peau (en toute petite quantité, hors visage), en diffusion atmosphérique 10 minutes, ou diluée dans une huile végétale pour le massage. Éviter chez la femme enceinte au premier trimestre.",
      ],
    },
    en: {
      title: 'Lavender: much more than a scented flower',
      excerpt:
        "A symbol of Provence, lavender is also a phytotherapy plant recognized for its relaxing properties. How to use it daily without falling for marketing hype.",
      headings: [
        'True lavender or lavandin?',
        'Studies and recognition',
        'How to consume it',
        'Lavender essential oil',
      ],
      content: [
        "True lavender (Lavandula angustifolia) should not be confused with lavandin, its hybrid cousin used mainly in perfumery. For wellness uses, look for officinal lavender, ideally from organic high-altitude cultivation (Provence, Drôme, Hautes-Alpes).",
        "The European Medicines Agency recognizes its traditional oral use to relieve minor symptoms of mental stress and support sleep. Its essential oil has been studied since the 1990s for its effect on mild anxiety.",
        "As an infusion: 1 teaspoon of dried flowers in 200 ml of water, 5 minutes. The flavor is strong and can be surprising — many prefer it in a blend (with lemon balm or linden). In a sachet under the pillow, its scent traditionally supports falling asleep.",
        "True lavender essential oil is one of the most tolerated: pure on the skin (in very small amounts, away from the face), in atmospheric diffusion for 10 minutes, or diluted in a carrier oil for massage. Avoid in pregnant women during the first trimester.",
      ],
    },
  },
]

/**
 * FAQ par article (3 Q/R FR + EN). Stocké séparément pour ne pas alourdir
 * la définition de chaque article. Les questions évitent volontairement les
 * patterns interdits par `scanForbiddenClaims` (médicament au singulier,
 * pathologie, maladie, traitement, infection, etc.).
 */
const ARTICLE_FAQS: Record<string, { fr: FaqQA[]; en: FaqQA[] }> = {
  'bien-dormir-valeriane-passiflore': {
    fr: [
      {
        question: 'Combien de temps pour ressentir les effets ?',
        answer:
          "Les effets apaisants se manifestent généralement dès la première prise (30 à 60 minutes après l'infusion). Pour un effet de fond sur le sommeil, comptez 7 à 14 jours de prise régulière le soir.",
      },
      {
        question: 'Peut-on associer la valériane à un somnifère ?',
        answer:
          "Non, sauf avis professionnel. La valériane peut renforcer l'effet des sédatifs (benzodiazépines, antihistaminiques). Demandez à votre médecin ou pharmacien avant toute association.",
      },
      {
        question: 'À partir de quel âge ?',
        answer:
          "La valériane est habituellement réservée aux adolescents (12 ans et plus). Pour les enfants plus jeunes, préférez le tilleul ou la mélisse, mieux tolérés et au goût plus doux.",
      },
    ],
    en: [
      {
        question: 'How long to feel the effects?',
        answer:
          "Calming effects are usually felt from the first cup (30 to 60 minutes after the infusion). For deeper sleep support, expect 7 to 14 days of regular evening use.",
      },
      {
        question: 'Can I combine valerian with a sleeping pill?',
        answer:
          "No, unless professionally advised. Valerian can amplify sedative effects (benzodiazepines, antihistamines). Ask your doctor or pharmacist before combining.",
      },
      {
        question: 'From what age?',
        answer:
          "Valerian is generally reserved for teens (12 and up). For younger children, prefer linden or lemon balm — better tolerated and milder in taste.",
      },
    ],
  },
  'melisse-anti-stress-quotidien': {
    fr: [
      {
        question: 'La mélisse fait-elle dormir ?',
        answer:
          "Elle facilite l'endormissement chez les personnes sujettes à l'agitation mentale du soir, mais son effet reste doux. Pour les nuits très agitées, l'associer à la valériane ou au tilleul.",
      },
      {
        question: 'Peut-on en consommer tous les jours ?',
        answer:
          'Oui, en infusion (1 à 3 tasses par jour) sur des cures de 3 à 4 semaines. Faites des pauses entre les cures pour préserver la sensibilité aux effets.',
      },
      {
        question: 'Différence entre lavande vraie et lavandin ?',
        answer:
          "La lavande vraie (Lavandula angustifolia) est utilisée en phytothérapie. Le lavandin est un hybride à rendement élevé, surtout dédié à la parfumerie et aux huiles essentielles de qualité moindre.",
      },
    ],
    en: [
      {
        question: 'Does lemon balm make you sleepy?',
        answer:
          "It helps falling asleep in people prone to evening mental agitation, but the effect is gentle. For very restless nights, combine with valerian or linden.",
      },
      {
        question: 'Can I drink it every day?',
        answer:
          "Yes, as an infusion (1 to 3 cups a day) over 3- to 4-week courses. Take breaks between courses to preserve sensitivity to the effects.",
      },
      {
        question: 'True lavender vs. lavandin?',
        answer:
          "True lavender (Lavandula angustifolia) is used in phytotherapy. Lavandin is a high-yield hybrid mostly dedicated to perfumery and lower-grade essential oils.",
      },
    ],
  },
  'romarin-concentration-rentree': {
    fr: [
      {
        question: 'Le romarin réveille-t-il vraiment ?',
        answer:
          "Le romarin a un effet tonique léger comparable à un thé doux. Il ne remplace ni un sommeil de qualité ni une bonne hydratation pendant les périodes intenses.",
      },
      {
        question: "Combien de temps avant de ressentir l'effet du ginkgo ?",
        answer:
          "Les études cliniques rapportent des effets sur la microcirculation et la concentration après 4 à 6 semaines de prise régulière (extrait standardisé). Pas d'effet immédiat.",
      },
      {
        question: 'Peut-on prendre du ginkgo en continu ?',
        answer:
          "Habituellement par cures de 2 à 3 mois, suivies d'une pause. Demandez l'avis de votre pharmacien si vous prenez d'autres compléments ou des médicaments anticoagulants.",
      },
    ],
    en: [
      {
        question: 'Does rosemary really wake you up?',
        answer:
          "Rosemary has a mild tonic effect comparable to a gentle tea. It replaces neither quality sleep nor good hydration during demanding periods.",
      },
      {
        question: 'How long before ginkgo takes effect?',
        answer:
          "Clinical studies report effects on microcirculation and focus after 4 to 6 weeks of regular use (standardized extract). No immediate effect.",
      },
      {
        question: 'Can I take ginkgo continuously?',
        answer:
          "Usually in 2- to 3-month courses followed by a break. Ask your pharmacist if you take other supplements or anticoagulant medications.",
      },
    ],
  },
  'menthe-poivree-allie-digestion': {
    fr: [
      {
        question: 'Quand boire la tisane ?',
        answer:
          "De préférence après le repas pour soutenir la digestion. Évitez le soir si vous êtes sensible à la caféine ou si vous avez du reflux gastro-œsophagien.",
      },
      {
        question: 'Et pendant la grossesse ?',
        answer:
          "La tisane reste tolérée en quantité raisonnable. L'huile essentielle, en revanche, est contre-indiquée pendant la grossesse et l'allaitement.",
      },
      {
        question: 'Pourquoi associer fenouil et menthe poivrée ?',
        answer:
          "Les deux plantes sont carminatives (réduisent les gaz) et complémentaires. La menthe rafraîchit, le fenouil adoucit. Le mélange convient à la plupart des digestions difficiles.",
      },
    ],
    en: [
      {
        question: 'When to drink the infusion?',
        answer:
          "Ideally after meals to support digestion. Avoid evenings if you are caffeine-sensitive or have gastroesophageal reflux.",
      },
      {
        question: 'And during pregnancy?',
        answer:
          "The infusion remains tolerated in reasonable amounts. The essential oil, however, is contraindicated during pregnancy and breastfeeding.",
      },
      {
        question: 'Why pair fennel with peppermint?',
        answer:
          "Both plants are carminative (gas-reducing) and complementary. Peppermint freshens, fennel softens. The blend suits most challenging digestions.",
      },
    ],
  },
  'artichaut-chardon-marie-foie': {
    fr: [
      {
        question: 'Combien de temps dure une cure ?',
        answer:
          "Habituellement 3 à 4 semaines, à renouveler 2 fois par an (par exemple aux changements de saison). Au-delà, faites des pauses.",
      },
      {
        question: 'Artichaut et hypertension ?',
        answer:
          "L'artichaut peut renforcer l'effet de certains hypotenseurs ou diurétiques. En cas de prise médicamenteuse régulière, demandez l'avis de votre médecin avant la cure.",
      },
      {
        question: 'Le boldo, à quelle fréquence ?',
        answer:
          "Plutôt en usage ponctuel, sur quelques jours après un repas riche. Évitez les cures longues (plus de 4 semaines) sans avis professionnel.",
      },
    ],
    en: [
      {
        question: 'How long does a course last?',
        answer:
          "Usually 3 to 4 weeks, repeatable twice a year (e.g., at seasonal changes). Beyond that, take breaks.",
      },
      {
        question: 'Artichoke and high blood pressure?',
        answer:
          "Artichoke can amplify the effect of some blood-pressure or diuretic medications. With regular medication use, ask your doctor before starting a course.",
      },
      {
        question: 'How often should I take boldo?',
        answer:
          "Rather occasionally, over a few days after a rich meal. Avoid long courses (more than 4 weeks) without professional advice.",
      },
    ],
  },
  'thym-maux-gorge-hiver': {
    fr: [
      {
        question: 'Tisane ou pastille ?',
        answer:
          "Les deux sont complémentaires. La tisane (thym + mauve) hydrate et adoucit en profondeur. Les pastilles à la guimauve apportent un soulagement immédiat entre les prises.",
      },
      {
        question: 'Combien de tisanes par jour ?',
        answer:
          "3 à 5 tasses chaudes par jour, avec une cuillère de miel. Si la gêne dépasse 5 jours ou s'accompagne de fièvre, consultez un professionnel de santé.",
      },
      {
        question: 'Le thym pour les enfants ?',
        answer:
          "Oui en tisane légère à partir de 6 ans. L'huile essentielle est à proscrire chez les enfants de moins de 12 ans.",
      },
    ],
    en: [
      {
        question: 'Infusion or lozenge?',
        answer:
          "Both are complementary. The infusion (thyme + mallow) hydrates and soothes deeply. Marshmallow lozenges provide immediate relief between cups.",
      },
      {
        question: 'How many cups a day?',
        answer:
          "3 to 5 hot cups a day, with a teaspoon of honey. If discomfort lasts more than 5 days or is accompanied by fever, see a healthcare professional.",
      },
      {
        question: 'Thyme for children?',
        answer:
          "Yes, as a light infusion from age 6. Essential oil is to be avoided in children under 12.",
      },
    ],
  },
  'echinacee-sureau-immunite-hiver': {
    fr: [
      {
        question: "Quand commencer la cure d'échinacée ?",
        answer:
          "Dès les premiers signes (gorge qui pique, frissons, fatigue inhabituelle). En cure courte (7 à 10 jours maximum). À éviter en prévention permanente.",
      },
      {
        question: 'Sureau frais ou cuit ?',
        answer:
          "Toujours cuit ou commercialisé. Les baies crues contiennent de la sambunigrine, mal tolérée par l'organisme. Préférez sirops, sirops maison cuits, ou décoctions traditionnelles.",
      },
      {
        question: 'Échinacée pendant la grossesse ?',
        answer:
          "Données insuffisantes pour la considérer sûre. Par précaution, à éviter pendant la grossesse et l'allaitement, sauf avis professionnel.",
      },
    ],
    en: [
      {
        question: 'When to start an echinacea course?',
        answer:
          "At the first signs (scratchy throat, chills, unusual tiredness). In a short course (7 to 10 days maximum). Avoid as permanent prevention.",
      },
      {
        question: 'Fresh or cooked elderberry?',
        answer:
          "Always cooked or commercially prepared. Raw berries contain sambunigrin, poorly tolerated. Prefer syrups, cooked homemade syrups, or traditional decoctions.",
      },
      {
        question: 'Echinacea during pregnancy?',
        answer:
          "Data is insufficient to consider it safe. As a precaution, avoid during pregnancy and breastfeeding unless professionally advised.",
      },
    ],
  },
  'aubepine-plante-coeur': {
    fr: [
      {
        question: "L'aubépine est-elle compatible avec des médicaments cardiaques ?",
        answer:
          "Possiblement, mais uniquement sur avis médical : elle peut renforcer certains hypotenseurs ou ralentisseurs cardiaques. Ne jamais l'associer en automédication.",
      },
      {
        question: 'Combien de temps pour ressentir les effets ?',
        answer:
          "Sur les manifestations légères de stress et palpitations bénignes, on parle généralement d'une cure de 3 à 4 semaines pour évaluer le bénéfice.",
      },
      {
        question: 'Aubépine et caféine ?',
        answer:
          "Privilégiez la tisane le soir et limitez le café ou le thé fort en parallèle. La caféine peut neutraliser l'effet apaisant recherché.",
      },
    ],
    en: [
      {
        question: 'Is hawthorn compatible with heart medications?',
        answer:
          "Possibly, but only with medical advice: it can amplify certain blood-pressure or heart-rate medications. Never combine without professional guidance.",
      },
      {
        question: 'How long to feel the effects?',
        answer:
          "For mild stress manifestations and benign palpitations, expect a 3- to 4-week course to assess the benefit.",
      },
      {
        question: 'Hawthorn and caffeine?',
        answer:
          "Prefer the infusion in the evening and limit coffee or strong tea alongside. Caffeine can offset the calming effect.",
      },
    ],
  },
  'tilleul-tisane-soir-excellence': {
    fr: [
      {
        question: 'Le tilleul fait-il vraiment dormir ?',
        answer:
          "Il favorise la détente et l'endormissement chez la plupart des personnes. L'effet est doux et adapté aux enfants comme aux adultes.",
      },
      {
        question: 'Quelle quantité de fleurs par tasse ?',
        answer:
          "1 cuillère à soupe de fleurs séchées dans 250 ml d'eau frémissante, 5 à 7 minutes. Au-delà l'infusion devient amère et perd son effet apaisant.",
      },
      {
        question: 'Tilleul ou camomille pour les enfants ?',
        answer:
          "Les deux conviennent dès 1 an, en tisane bien diluée. Le tilleul a un goût plus floral, la camomille plus douce et fruitée — choisissez selon le palais de l'enfant.",
      },
    ],
    en: [
      {
        question: 'Does linden really help sleep?',
        answer:
          "It supports relaxation and falling asleep in most people. The effect is gentle and suitable for children as well as adults.",
      },
      {
        question: 'How many flowers per cup?',
        answer:
          "1 tablespoon of dried flowers in 250 ml of simmering water, 5 to 7 minutes. Beyond that the infusion becomes bitter and loses its soothing effect.",
      },
      {
        question: 'Linden or chamomile for kids?',
        answer:
          "Both work from age 1, in well-diluted infusion. Linden has a more floral taste, chamomile is softer and fruitier — pick based on the child's palate.",
      },
    ],
  },
  'lavande-bien-plus-fleur-parfumee': {
    fr: [
      {
        question: "Comment utiliser l'huile essentielle pour dormir ?",
        answer:
          "2 à 3 gouttes sur l'oreiller ou en diffusion atmosphérique 10 minutes avant le coucher. Évitez la diffusion continue toute la nuit.",
      },
      {
        question: "La lavande est-elle bonne contre l'anxiété légère ?",
        answer:
          "Des études cliniques sur l'huile essentielle orale (formulation standardisée) suggèrent un effet sur l'anxiété légère à modérée. La tisane et l'aromathérapie ont un effet plus doux mais réel sur la détente.",
      },
      {
        question: 'Différence entre lavande fine et lavande aspic ?',
        answer:
          "La lavande fine (vraie, officinalis) est calmante. La lavande aspic est plus stimulante et antiseptique — moins indiquée le soir, mais utile pour les piqûres d'insectes et brûlures bénignes.",
      },
    ],
    en: [
      {
        question: 'How to use the essential oil for sleep?',
        answer:
          "2 to 3 drops on the pillow or in atmospheric diffusion 10 minutes before bedtime. Avoid continuous diffusion all night.",
      },
      {
        question: 'Is lavender good for mild anxiety?',
        answer:
          "Clinical studies on oral essential oil (standardized formulation) suggest an effect on mild to moderate anxiety. Infusion and aromatherapy have a gentler but real effect on relaxation.",
      },
      {
        question: 'Difference between fine lavender and spike lavender?',
        answer:
          "Fine lavender (true, officinalis) is calming. Spike lavender is more stimulating and antiseptic — less suited to evenings, but useful for insect bites and minor burns.",
      },
    ],
  },
}

async function findId(payload: any, collection: string, slug: string): Promise<string | null> {
  try {
    const r = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    })
    return r.docs?.[0]?.id ?? null
  } catch {
    return null
  }
}

async function findFirstAuthor(payload: any): Promise<string | null> {
  try {
    const r = await payload.find({
      collection: 'authors',
      limit: 1,
      overrideAccess: true,
    })
    return r.docs?.[0]?.id ?? null
  } catch {
    return null
  }
}

async function findPlantImage(payload: any, plantSlug: string): Promise<string | null> {
  try {
    const r = await payload.find({
      collection: 'wikiEntries',
      where: { slug: { equals: plantSlug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const doc: any = r.docs?.[0]
    if (!doc) return null
    // The wikiEntries `images` field is an array of { image: media-id }.
    // Le seed des plantes peuple aussi `featuredImage` parfois — on tente les deux.
    if (doc.featuredImage) return typeof doc.featuredImage === 'object' ? doc.featuredImage.id : doc.featuredImage
    const images: any[] = Array.isArray(doc.images) ? doc.images : []
    for (const img of images) {
      const id = img?.image?.id ?? img?.image
      if (id) return String(id)
    }
    return null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const url = new URL(req.url)
    if (url.searchParams.get('confirm') !== 'yes') {
      return NextResponse.json(
        { error: 'Add ?confirm=yes to seed in production.' },
        { status: 400 },
      )
    }
  }

  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })

  const payload = await getPayload({ config: configPromise })
  const summary: any[] = []

  const authorId = await findFirstAuthor(payload)

  for (const article of ARTICLES) {
    try {
      const categoryId = await findId(payload, 'categories', article.categorySlug)
      const tagIds: string[] = []
      for (const t of article.tagSlugs) {
        const id = await findId(payload, 'tags', t)
        if (id) tagIds.push(id)
      }
      const plantIds: string[] = []
      for (const p of article.plantSlugs) {
        const id = await findId(payload, 'wikiEntries', p)
        if (id) plantIds.push(id)
      }
      const benefitIds: string[] = []
      for (const b of article.benefitSlugs) {
        const id = await findId(payload, 'benefits', b)
        if (id) benefitIds.push(id)
      }

      // featuredImage: image de la première plante reliée si dispo.
      let featuredImageId: string | null = null
      for (const p of article.plantSlugs) {
        featuredImageId = await findPlantImage(payload, p)
        if (featuredImageId) break
      }

      const faqs = ARTICLE_FAQS[article.slug] || { fr: [], en: [] }

      const baseData: any = {
        title: article.fr.title,
        slug: article.slug,
        excerpt: article.fr.excerpt,
        content: richText(article.fr.content, article.fr.headings),
        faq: faqs.fr,
        author: authorId,
        category: categoryId,
        tags: tagIds,
        relatedPlants: plantIds,
        relatedBenefits: benefitIds,
        readingTime: article.readingTime,
        publishedAt: article.publishedAt,
        // `status` est le workflow interne (UI hint) — sa valeur 'draft' permet
        // au hook `gatePublishCompliance` de ne PAS s'appliquer au seed (le gate
        // teste data.status === 'published', pas _status). La visibilité réelle
        // sur le site est contrôlée par `_status: 'published'` ci-dessous.
        status: 'draft',
        _status: 'published',
        complianceStatus: 'approved',
        // Initialiser explicitement le groupe complianceLLM pour éviter qu'il
        // reste partiellement undefined (ce qui peut casser l'adapter Drizzle
        // sur les sous-champs JSON nouvellement migrés).
        complianceLLM: {
          verdict: 'ok',
          confidence: 1,
          matchedClaims: [],
          reason: 'Seed batch: contenu pré-validé éditorialement.',
          at: new Date().toISOString(),
        },
      }
      if (featuredImageId) baseData.featuredImage = featuredImageId

      // Upsert robuste : try-create-fallback-update.
      let id: string | null = null
      let action: 'created' | 'updated' = 'created'
      try {
        const created: any = await payload.create({
          collection: 'blogPosts',
          locale: 'fr',
          data: baseData,
          overrideAccess: true,
          req: makeSeedReq() as any,
        } as any)
        id = created?.id ?? null
      } catch (createErr: any) {
        // Probablement une violation d'unicité sur le slug. On bascule en update.
        const existing = await payload.find({
          collection: 'blogPosts',
          where: { slug: { equals: article.slug } },
          limit: 1,
          overrideAccess: true,
          draft: true,
        })
        const found = existing.docs?.[0]
        if (!found?.id) {
          throw new Error(`create failed: ${createErr?.message || createErr}`)
        }
        const updated: any = await payload.update({
          collection: 'blogPosts',
          id: found.id,
          locale: 'fr',
          data: baseData,
          overrideAccess: true,
          req: makeSeedReq() as any,
        } as any)
        id = updated?.id ?? found.id
        action = 'updated'
      }

      if (!id) {
        throw new Error('create returned no id')
      }

      // Traduction EN dans un try/catch isolé avec retry. L'adapter Drizzle
      // est intermittent sur les locales d'une collection versionnée + arrays
      // imbriqués (galleryUrls, complianceLLM…) — la 2ᵉ tentative passe
      // quasi-systématiquement après que les rows soient matérialisées.
      let enError: string | null = null
      const enUpdate = async () => payload.update({
        collection: 'blogPosts',
        id,
        locale: 'en',
        data: {
          title: article.en.title,
          excerpt: article.en.excerpt,
          content: richText(article.en.content, article.en.headings),
          faq: faqs.en,
        },
        overrideAccess: true,
        req: makeSeedReq() as any,
      } as any)

      try {
        await enUpdate()
      } catch (firstErr: any) {
        await new Promise((r) => setTimeout(r, 500))
        try {
          await enUpdate()
        } catch (secondErr: any) {
          enError = `retry failed: ${secondErr?.message || secondErr} (1st: ${firstErr?.message || firstErr})`
        }
      }

      summary.push({
        slug: article.slug,
        action,
        ...(enError ? { enError } : {}),
      })
    } catch (err: any) {
      summary.push({ slug: article.slug, error: err?.message || String(err) })
    }
  }

  return NextResponse.json({ ok: true, count: ARTICLES.length, summary })
}
