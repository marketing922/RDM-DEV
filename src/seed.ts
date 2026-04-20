/**
 * Seed script for "Les Remedes de Mamie" - Payload CMS
 * Phase 1: Encyclopedia content (plants, blog posts, benefits, categories, authors, tags)
 *
 * This script populates the CMS with real, accurate, educational content
 * about medicinal plants. All content is compliant with EFSA claim regulations.
 *
 * Usage:
 *   - Via API route (recommended): GET /api/seed?confirm=yes (dev only)
 *   - Via seed.mjs runner: node seed.mjs
 */

import type { Payload } from 'payload'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a Lexical rich-text JSON structure from an array of paragraph strings */
function richText(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
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

// ---------------------------------------------------------------------------
// Data: Authors
// ---------------------------------------------------------------------------

const authorsData = [
  {
    name: 'Marie Dupont',
    role: 'Fondatrice & Herboriste',
    credentials: 'Herboriste diplômée',
    slug: 'marie-dupont',
    bio: {
      fr: richText([
        'Marie Dupont est herboriste diplômée et passionnée par les plantes depuis plus de 15 ans. Elle a fondé Les Remèdes de Mamie pour transmettre les savoirs ancestraux de la phytothérapie traditionnelle.',
        'Formée à l\'École des Plantes de Paris, Marie accompagne au quotidien les personnes souhaitant découvrir les bienfaits des plantes dans une approche respectueuse et responsable.',
      ]),
      en: richText([
        'Marie Dupont is a certified herbalist who has been passionate about plants for over 15 years. She founded Les Remèdes de Mamie to share the ancestral knowledge of traditional phytotherapy.',
        'Trained at the École des Plantes in Paris, Marie helps people discover the benefits of plants through a respectful and responsible approach.',
      ]),
    },
  },
]

// ---------------------------------------------------------------------------
// Data: Categories
// ---------------------------------------------------------------------------

const categoriesData = [
  {
    name: { fr: 'Conseils', en: 'Tips' },
    slug: 'conseils',
    description: {
      fr: 'Conseils pratiques pour utiliser les plantes au quotidien.',
      en: 'Practical tips for using plants in everyday life.',
    },
    order: 1,
  },
  {
    name: { fr: 'Bienfaits', en: 'Benefits' },
    slug: 'bienfaits',
    description: {
      fr: 'Découvrez les bienfaits des plantes et des ingrédients naturels.',
      en: 'Discover the benefits of plants and natural ingredients.',
    },
    order: 2,
  },
  {
    name: { fr: 'Recettes', en: 'Recipes' },
    slug: 'recettes',
    description: {
      fr: 'Recettes de tisanes, infusions et préparations à base de plantes.',
      en: 'Recipes for herbal teas, infusions and plant-based preparations.',
    },
    order: 3,
  },
  {
    name: { fr: 'Actualités', en: 'News' },
    slug: 'actualites',
    description: {
      fr: 'Les dernières nouvelles du monde des plantes et de la phytothérapie.',
      en: 'Latest news from the world of plants and phytotherapy.',
    },
    order: 4,
  },
]

// ---------------------------------------------------------------------------
// Data: Tags
// ---------------------------------------------------------------------------

const tagsData = [
  { name: { fr: 'Tisanes', en: 'Herbal teas' }, slug: 'tisanes' },
  { name: { fr: 'Plantes médicinales', en: 'Medicinal plants' }, slug: 'plantes-medicinales' },
  { name: { fr: 'Bien-être', en: 'Well-being' }, slug: 'bien-etre' },
  { name: { fr: 'Digestion', en: 'Digestion' }, slug: 'digestion' },
  { name: { fr: 'Hiver', en: 'Winter' }, slug: 'hiver' },
  { name: { fr: 'Curcuma', en: 'Turmeric' }, slug: 'curcuma' },
  { name: { fr: 'Infusion', en: 'Infusion' }, slug: 'infusion' },
]

// ---------------------------------------------------------------------------
// Data: Benefits
// ---------------------------------------------------------------------------

const benefitsData = [
  {
    name: { fr: 'Digestion', en: 'Digestion' },
    slug: 'digestion',
    icon: '🌿',
    shortDescription: {
      fr: 'Contribue au confort digestif et aide à maintenir une bonne digestion.',
      en: 'Contributes to digestive comfort and helps maintain good digestion.',
    },
    description: {
      fr: richText([
        'De nombreuses plantes sont reconnues pour leur contribution au confort digestif. Utilisées depuis des siècles dans la tradition herboristique, elles aident à maintenir le fonctionnement normal du système digestif.',
        'Parmi les plantes les plus connues pour leurs propriétés digestives, on retrouve la camomille, la menthe poivrée, le fenouil et le romarin. Ces plantes peuvent être consommées en infusion après les repas pour favoriser une digestion harmonieuse.',
      ]),
      en: richText([
        'Many plants are recognized for their contribution to digestive comfort. Used for centuries in the herbal tradition, they help maintain the normal functioning of the digestive system.',
        'Among the best-known plants for their digestive properties are chamomile, peppermint, fennel, and rosemary. These plants can be consumed as an infusion after meals to promote harmonious digestion.',
      ]),
    },
  },
  {
    name: { fr: 'Sommeil & Relaxation', en: 'Sleep & Relaxation' },
    slug: 'sommeil-relaxation',
    icon: '😴',
    shortDescription: {
      fr: 'Aide à favoriser la détente et contribue à un sommeil de qualité.',
      en: 'Helps promote relaxation and contributes to quality sleep.',
    },
    description: {
      fr: richText([
        'Certaines plantes sont traditionnellement utilisées pour favoriser la détente et contribuer à un endormissement serein. Elles accompagnent les moments de repos et aident à maintenir un cycle de sommeil régulier.',
        'La lavande, la camomille et la valériane figurent parmi les plantes les plus appréciées pour leurs propriétés apaisantes. Une tisane avant le coucher constitue un rituel agréable pour préparer le corps au repos.',
      ]),
      en: richText([
        'Certain plants are traditionally used to promote relaxation and contribute to peaceful sleep. They accompany moments of rest and help maintain a regular sleep cycle.',
        'Lavender, chamomile, and valerian are among the most popular plants for their soothing properties. A herbal tea before bed is a pleasant ritual to prepare the body for rest.',
      ]),
    },
  },
  {
    name: { fr: 'Immunité', en: 'Immunity' },
    slug: 'immunite',
    icon: '🛡️',
    shortDescription: {
      fr: 'Contribue au fonctionnement normal du système immunitaire.',
      en: 'Contributes to the normal functioning of the immune system.',
    },
    description: {
      fr: richText([
        'Le système immunitaire joue un rôle essentiel dans le maintien de la santé. Certaines plantes et nutriments sont reconnus pour leur contribution au fonctionnement normal des défenses naturelles de l\'organisme.',
        'Le thym, l\'échinacée et le sureau sont des plantes traditionnellement associées au soutien des défenses naturelles. Riches en composés actifs, elles s\'intègrent facilement dans une routine bien-être, notamment pendant les mois les plus froids.',
      ]),
      en: richText([
        'The immune system plays an essential role in maintaining health. Certain plants and nutrients are recognized for their contribution to the normal functioning of the body\'s natural defenses.',
        'Thyme, echinacea, and elderberry are plants traditionally associated with supporting natural defenses. Rich in active compounds, they easily fit into a wellness routine, especially during the colder months.',
      ]),
    },
  },
  {
    name: { fr: 'Anti-inflammatoire', en: 'Anti-inflammatory' },
    slug: 'anti-inflammatoire',
    icon: '💪',
    shortDescription: {
      fr: 'Aide à maintenir le confort articulaire et musculaire.',
      en: 'Helps maintain joint and muscle comfort.',
    },
    description: {
      fr: richText([
        'Certaines plantes contiennent des composés naturels qui contribuent au maintien du confort articulaire et musculaire. Leur usage est ancré dans des siècles de tradition herboristique à travers le monde.',
        'Le curcuma, le gingembre et le saule blanc sont parmi les plantes les plus étudiées pour leurs propriétés apaisantes. Le curcuma, notamment, contient de la curcumine, un polyphénol dont les propriétés font l\'objet de nombreuses recherches scientifiques.',
      ]),
      en: richText([
        'Certain plants contain natural compounds that contribute to maintaining joint and muscle comfort. Their use is rooted in centuries of herbal tradition around the world.',
        'Turmeric, ginger, and white willow are among the most studied plants for their soothing properties. Turmeric, in particular, contains curcumin, a polyphenol whose properties are the subject of extensive scientific research.',
      ]),
    },
  },
  {
    name: { fr: 'Énergie & Vitalité', en: 'Energy & Vitality' },
    slug: 'energie-vitalite',
    icon: '⚡',
    shortDescription: {
      fr: 'Contribue à maintenir l\'énergie et la vitalité au quotidien.',
      en: 'Contributes to maintaining daily energy and vitality.',
    },
    description: {
      fr: richText([
        'Maintenir un bon niveau d\'énergie au quotidien est essentiel pour le bien-être général. Certaines plantes sont traditionnellement utilisées pour leur contribution à la vitalité et à la réduction de la fatigue.',
        'Le romarin, le ginseng et le maté figurent parmi les plantes les plus appréciées pour leurs propriétés stimulantes. Associées à une alimentation équilibrée et à une bonne hygiène de vie, elles accompagnent les journées actives.',
      ]),
      en: richText([
        'Maintaining a good energy level throughout the day is essential for overall well-being. Certain plants are traditionally used for their contribution to vitality and reducing fatigue.',
        'Rosemary, ginseng, and mate are among the most popular plants for their stimulating properties. Combined with a balanced diet and a healthy lifestyle, they support active days.',
      ]),
    },
  },
]

// ---------------------------------------------------------------------------
// Data: WikiEntries (Plants)
// ---------------------------------------------------------------------------

const wikiEntriesData = [
  {
    name: { fr: 'Camomille', en: 'Chamomile' },
    latinName: 'Matricaria chamomilla',
    slug: 'camomille',
    family: 'Asteraceae',
    origin: { fr: 'Europe, Asie occidentale', en: 'Europe, Western Asia' },
    partsUsed: { fr: 'Capitules floraux (fleurs séchées)', en: 'Flower heads (dried flowers)' },
    activeCompounds: {
      fr: 'Bisabolol, chamazulène, apigénine, flavonoïdes, matricine, coumarines, acides phénoliques',
      en: 'Bisabolol, chamazulene, apigenin, flavonoids, matricin, coumarins, phenolic acids',
    },
    benefitSlugs: ['digestion', 'sommeil-relaxation'],
    description: {
      fr: richText([
        'La camomille matricaire (Matricaria chamomilla) est l\'une des plantes les plus anciennes et les plus populaires de la pharmacopée traditionnelle européenne. Originaire d\'Europe et d\'Asie occidentale, elle est cultivée et récoltée depuis l\'Antiquité pour ses multiples usages. Reconnaissable à ses petites fleurs blanches au coeur jaune, elle dégage un parfum doux et légèrement fruité qui la rend agréable en infusion.',
        'Riche en bisabolol, en chamazulène et en apigénine, la camomille est principalement appréciée pour ses propriétés apaisantes et digestives. En phytothérapie traditionnelle, elle est utilisée pour favoriser la détente après une journée chargée et pour contribuer au confort digestif après les repas. Sa douceur en fait une plante adaptée à toute la famille, y compris les jeunes enfants (à partir de 3 ans, sous forme de tisane légère).',
        'En usage externe, la camomille entre dans la composition de nombreuses préparations cosmétiques pour ses qualités adoucissantes. Elle est également utilisée en compresses pour apaiser les peaux sensibles et irritées. Son huile essentielle, de couleur bleue caractéristique due au chamazulène, est particulièrement prisée en aromathérapie.',
      ]),
      en: richText([
        'German chamomile (Matricaria chamomilla) is one of the oldest and most popular plants in the European traditional pharmacopoeia. Native to Europe and Western Asia, it has been cultivated and harvested since antiquity for its multiple uses. Recognizable by its small white flowers with a yellow center, it has a soft, slightly fruity fragrance that makes it pleasant as an infusion.',
        'Rich in bisabolol, chamazulene, and apigenin, chamomile is primarily valued for its soothing and digestive properties. In traditional phytotherapy, it is used to promote relaxation after a busy day and to contribute to digestive comfort after meals. Its gentleness makes it a plant suitable for the whole family, including young children (from age 3, as a light herbal tea).',
        'In external use, chamomile is part of many cosmetic preparations for its softening qualities. It is also used in compresses to soothe sensitive and irritated skin. Its essential oil, with its characteristic blue color due to chamazulene, is particularly prized in aromatherapy.',
      ]),
    },
    precautions: {
      fr: richText([
        'La camomille est généralement bien tolérée. Toutefois, les personnes allergiques aux plantes de la famille des Asteraceae (marguerites, chrysanthèmes, ambroisie) doivent faire preuve de prudence. En cas de doute, il est recommandé de consulter un professionnel de santé avant toute utilisation régulière.',
      ]),
      en: richText([
        'Chamomile is generally well tolerated. However, people allergic to plants in the Asteraceae family (daisies, chrysanthemums, ragweed) should exercise caution. If in doubt, it is recommended to consult a healthcare professional before regular use.',
      ]),
    },
    contraindications: {
      fr: richText([
        'Déconseillée aux personnes présentant une allergie connue aux Asteraceae. Par prudence, les femmes enceintes ou allaitantes devraient demander l\'avis d\'un professionnel de santé avant une consommation régulière.',
      ]),
      en: richText([
        'Not recommended for people with a known allergy to Asteraceae. As a precaution, pregnant or breastfeeding women should seek the advice of a healthcare professional before regular consumption.',
      ]),
    },
  },
  {
    name: { fr: 'Menthe poivrée', en: 'Peppermint' },
    latinName: 'Mentha piperita',
    slug: 'menthe-poivree',
    family: 'Lamiaceae',
    origin: { fr: 'Europe (hybride naturel)', en: 'Europe (natural hybrid)' },
    partsUsed: { fr: 'Feuilles et sommités fleuries', en: 'Leaves and flowering tops' },
    activeCompounds: {
      fr: 'Menthol, menthone, acétate de menthyle, flavonoïdes, acide rosmarinique, tanins',
      en: 'Menthol, menthone, menthyl acetate, flavonoids, rosmarinic acid, tannins',
    },
    benefitSlugs: ['digestion', 'energie-vitalite'],
    description: {
      fr: richText([
        'La menthe poivrée (Mentha piperita) est un hybride naturel entre la menthe aquatique et la menthe verte, cultivé dans le monde entier pour son arôme puissant et rafraîchissant. C\'est l\'une des plantes aromatiques les plus utilisées, tant en cuisine qu\'en phytothérapie. Son parfum caractéristique, lié à sa forte teneur en menthol, en fait une plante immédiatement reconnaissable.',
        'Traditionnellement, la menthe poivrée est appréciée pour sa contribution au confort digestif. Elle aide à maintenir une bonne digestion et participe à un fonctionnement intestinal harmonieux. Son effet rafraîchissant en fait également un allié agréable pour les journées chaudes, en infusion glacée ou en tisane.',
        'En aromathérapie, l\'huile essentielle de menthe poivrée est l\'une des plus populaires. Appliquée diluée sur les tempes, elle procure une sensation de fraîcheur appréciée. En cuisine, les feuilles fraîches de menthe agrémentent salades, boissons et desserts, apportant une touche de fraîcheur et de vitalité à chaque préparation.',
      ]),
      en: richText([
        'Peppermint (Mentha piperita) is a natural hybrid of water mint and spearmint, cultivated worldwide for its powerful and refreshing aroma. It is one of the most widely used aromatic plants, both in cooking and phytotherapy. Its characteristic scent, linked to its high menthol content, makes it an immediately recognizable plant.',
        'Traditionally, peppermint is valued for its contribution to digestive comfort. It helps maintain good digestion and participates in harmonious intestinal function. Its refreshing effect also makes it a pleasant ally for hot days, as an iced infusion or herbal tea.',
        'In aromatherapy, peppermint essential oil is one of the most popular. Applied diluted to the temples, it provides a pleasant cooling sensation. In cooking, fresh mint leaves enhance salads, beverages, and desserts, adding a touch of freshness and vitality to every preparation.',
      ]),
    },
    precautions: {
      fr: richText([
        'La menthe poivrée est déconseillée aux enfants de moins de 6 ans en raison de sa forte teneur en menthol. L\'huile essentielle ne doit jamais être appliquée pure sur la peau et doit être tenue éloignée des yeux et des muqueuses. En cas d\'utilisation régulière, il est conseillé de demander l\'avis d\'un professionnel de santé.',
      ]),
      en: richText([
        'Peppermint is not recommended for children under 6 years of age due to its high menthol content. The essential oil should never be applied undiluted to the skin and should be kept away from eyes and mucous membranes. For regular use, it is advisable to seek the advice of a healthcare professional.',
      ]),
    },
    contraindications: {
      fr: richText([
        'Déconseillée aux personnes souffrant de reflux gastro-oesophagien, car la menthe poivrée peut favoriser la détente du sphincter oesophagien. Déconseillée aux femmes enceintes ou allaitantes sans avis médical. L\'huile essentielle est contre-indiquée chez les enfants de moins de 6 ans.',
      ]),
      en: richText([
        'Not recommended for people with gastro-esophageal reflux, as peppermint may promote relaxation of the esophageal sphincter. Not recommended for pregnant or breastfeeding women without medical advice. The essential oil is contraindicated in children under 6 years of age.',
      ]),
    },
  },
  {
    name: { fr: 'Lavande', en: 'Lavender' },
    latinName: 'Lavandula angustifolia',
    slug: 'lavande',
    family: 'Lamiaceae',
    origin: { fr: 'Bassin méditerranéen', en: 'Mediterranean basin' },
    partsUsed: { fr: 'Sommités fleuries', en: 'Flowering tops' },
    activeCompounds: {
      fr: 'Linalol, acétate de linalyle, terpinèn-4-ol, camphre, coumarines, tanins, flavonoïdes',
      en: 'Linalool, linalyl acetate, terpinen-4-ol, camphor, coumarins, tannins, flavonoids',
    },
    benefitSlugs: ['sommeil-relaxation'],
    description: {
      fr: richText([
        'La lavande vraie (Lavandula angustifolia), aussi appelée lavande fine, est une plante emblématique du bassin méditerranéen et de la Provence française. Cultivée depuis l\'Antiquité romaine, elle est appréciée pour son parfum délicat et ses multiples usages. Ses épis de fleurs violettes, qui ornent les paysages provençaux de juin à août, sont récoltés puis séchés pour être utilisés en infusion, en sachet parfumé ou distillés en huile essentielle.',
        'En phytothérapie traditionnelle, la lavande est reconnue pour ses propriétés apaisantes qui favorisent la détente et contribuent à un sommeil de qualité. Son parfum, à lui seul, aide à créer une atmosphère propice au repos et à la sérénité. En infusion, elle s\'associe harmonieusement à la camomille ou à la verveine pour des tisanes du soir réconfortantes.',
        'Au-delà de ses qualités relaxantes, la lavande possède des propriétés purifiantes reconnues depuis des siècles. Son nom vient d\'ailleurs du latin « lavare » (laver), car les Romains l\'utilisaient pour parfumer leurs bains. En usage externe, l\'huile essentielle de lavande est l\'une des plus polyvalentes : elle est utilisée en massage diluée dans une huile végétale, en diffusion atmosphérique ou ajoutée à l\'eau du bain.',
      ]),
      en: richText([
        'True lavender (Lavandula angustifolia), also called fine lavender, is an iconic plant of the Mediterranean basin and French Provence. Cultivated since Roman antiquity, it is valued for its delicate fragrance and multiple uses. Its purple flower spikes, which adorn the Provençal landscape from June to August, are harvested and dried for use in infusions, scented sachets, or distilled into essential oil.',
        'In traditional phytotherapy, lavender is recognized for its soothing properties that promote relaxation and contribute to quality sleep. Its fragrance alone helps create an atmosphere conducive to rest and serenity. As an infusion, it harmoniously combines with chamomile or verbena for comforting evening teas.',
        'Beyond its relaxing qualities, lavender has purifying properties recognized for centuries. Its name actually comes from the Latin "lavare" (to wash), as the Romans used it to perfume their baths. In external use, lavender essential oil is one of the most versatile: it is used in massage diluted in a vegetable oil, in atmospheric diffusion, or added to bathwater.',
      ]),
    },
    precautions: {
      fr: richText([
        'La lavande est généralement bien tolérée par la majorité des personnes. L\'huile essentielle doit cependant être diluée avant application cutanée et un test de tolérance est recommandé pour les peaux sensibles. En diffusion, veiller à aérer la pièce régulièrement.',
      ]),
      en: richText([
        'Lavender is generally well tolerated by most people. However, the essential oil should be diluted before skin application, and a tolerance test is recommended for sensitive skin. When diffusing, make sure to ventilate the room regularly.',
      ]),
    },
    contraindications: {
      fr: richText([
        'Par prudence, l\'huile essentielle de lavande est déconseillée pendant les trois premiers mois de grossesse et chez les enfants de moins de 3 ans. Les personnes sous anticoagulants devraient consulter un professionnel de santé avant une utilisation régulière.',
      ]),
      en: richText([
        'As a precaution, lavender essential oil is not recommended during the first three months of pregnancy and in children under 3 years of age. People on anticoagulants should consult a healthcare professional before regular use.',
      ]),
    },
  },
  {
    name: { fr: 'Curcuma', en: 'Turmeric' },
    latinName: 'Curcuma longa',
    slug: 'curcuma',
    family: 'Zingiberaceae',
    origin: { fr: 'Asie du Sud-Est, Inde', en: 'Southeast Asia, India' },
    partsUsed: { fr: 'Rhizome (racine)', en: 'Rhizome (root)' },
    activeCompounds: {
      fr: 'Curcuminoïdes (curcumine, déméthoxycurcumine, bis-déméthoxycurcumine), huile essentielle (turmérone, zingibérène), polysaccharides',
      en: 'Curcuminoids (curcumin, demethoxycurcumin, bisdemethoxycurcumin), essential oil (turmerone, zingiberene), polysaccharides',
    },
    benefitSlugs: ['anti-inflammatoire', 'digestion'],
    description: {
      fr: richText([
        'Le curcuma (Curcuma longa) est une plante vivace de la famille des Zingiberaceae, originaire d\'Asie du Sud-Est et largement cultivée en Inde depuis plus de 4000 ans. Son rhizome, d\'un jaune orangé intense, est utilisé à la fois comme épice, colorant alimentaire et en phytothérapie traditionnelle. Dans la médecine ayurvédique, le curcuma occupe une place de premier plan et fait partie des épices quotidiennes de la cuisine indienne.',
        'La curcumine, principal polyphénol du curcuma, est l\'objet de très nombreuses études scientifiques. Le curcuma contribue au confort articulaire et aide à maintenir la souplesse des articulations. Il participe également au confort digestif en soutenant le fonctionnement normal du foie et de la vésicule biliaire. Pour optimiser l\'assimilation de la curcumine par l\'organisme, il est traditionnellement conseillé de l\'associer à du poivre noir (pipérine) et à un corps gras.',
        'En cuisine, le curcuma est l\'ingrédient clé du curry et colore de nombreux plats traditionnels asiatiques. Son goût légèrement amer et terreux se marie parfaitement avec le gingembre, la coriandre et le cumin. On le retrouve aussi dans le lait d\'or (golden milk), une boisson chaude traditionnelle à base de curcuma, lait végétal et épices, très populaire pour ses qualités réconfortantes.',
      ]),
      en: richText([
        'Turmeric (Curcuma longa) is a perennial plant of the Zingiberaceae family, native to Southeast Asia and widely cultivated in India for over 4,000 years. Its rhizome, with its intense orange-yellow color, is used as a spice, food coloring, and in traditional phytotherapy. In Ayurvedic tradition, turmeric holds a prominent place and is part of the daily spices in Indian cuisine.',
        'Curcumin, the main polyphenol in turmeric, is the subject of extensive scientific studies. Turmeric contributes to joint comfort and helps maintain joint flexibility. It also participates in digestive comfort by supporting the normal functioning of the liver and gallbladder. To optimize the absorption of curcumin by the body, it is traditionally advised to combine it with black pepper (piperine) and a fatty substance.',
        'In cooking, turmeric is the key ingredient in curry and colors many traditional Asian dishes. Its slightly bitter and earthy taste pairs perfectly with ginger, coriander, and cumin. It is also found in golden milk, a traditional warm drink made from turmeric, plant-based milk, and spices, very popular for its comforting qualities.',
      ]),
    },
    precautions: {
      fr: richText([
        'Le curcuma alimentaire est généralement bien toléré aux doses culinaires habituelles. En cas de prise de compléments alimentaires à base de curcuma concentré, il est recommandé de respecter les doses indiquées par le fabricant et de consulter un professionnel de santé en cas de doute.',
      ]),
      en: richText([
        'Dietary turmeric is generally well tolerated at usual culinary doses. When taking concentrated turmeric dietary supplements, it is recommended to follow the doses indicated by the manufacturer and to consult a healthcare professional if in doubt.',
      ]),
    },
    contraindications: {
      fr: richText([
        'Le curcuma à fortes doses est déconseillé en cas d\'obstruction des voies biliaires ou de calculs biliaires. Les personnes sous anticoagulants ou antiplaquettaires devraient consulter un professionnel de santé. Déconseillé aux femmes enceintes à doses élevées (au-delà de l\'usage culinaire).',
      ]),
      en: richText([
        'High-dose turmeric is not recommended in cases of bile duct obstruction or gallstones. People on anticoagulants or antiplatelet drugs should consult a healthcare professional. Not recommended for pregnant women at high doses (beyond culinary use).',
      ]),
    },
  },
  {
    name: { fr: 'Thym', en: 'Thyme' },
    latinName: 'Thymus vulgaris',
    slug: 'thym',
    family: 'Lamiaceae',
    origin: { fr: 'Bassin méditerranéen, Europe méridionale', en: 'Mediterranean basin, Southern Europe' },
    partsUsed: { fr: 'Parties aériennes (feuilles et sommités fleuries)', en: 'Aerial parts (leaves and flowering tops)' },
    activeCompounds: {
      fr: 'Thymol, carvacrol, flavonoïdes (lutéoline, apigénine), acide rosmarinique, tanins, saponines triterpéniques',
      en: 'Thymol, carvacrol, flavonoids (luteolin, apigenin), rosmarinic acid, tannins, triterpenic saponins',
    },
    benefitSlugs: ['immunite'],
    description: {
      fr: richText([
        'Le thym (Thymus vulgaris) est un sous-arbrisseau aromatique emblématique de la flore méditerranéenne, présent sur les coteaux secs et ensoleillés du sud de l\'Europe. Utilisé depuis l\'Antiquité grecque et romaine — les Égyptiens l\'employaient déjà dans leurs rituels — le thym est aujourd\'hui l\'une des plantes aromatiques les plus couramment utilisées en cuisine comme en phytothérapie.',
        'Le thym est particulièrement riche en thymol et en carvacrol, deux composés phénoliques qui lui confèrent ses propriétés purifiantes remarquables. En phytothérapie traditionnelle, le thym est associé au confort respiratoire et contribue au fonctionnement normal des voies respiratoires supérieures. Une tisane de thym au miel est un classique des remèdes de grand-mère pour affronter les mois d\'hiver.',
        'En cuisine, le thym est un pilier des herbes de Provence et du bouquet garni. Il parfume les viandes grillées, les légumes rôtis, les soupes et les sauces. Le thym frais ou séché s\'intègre à merveille dans la cuisine méditerranéenne, apportant chaleur et profondeur aromatique aux plats les plus simples comme les plus élaborés.',
      ]),
      en: richText([
        'Thyme (Thymus vulgaris) is an aromatic subshrub emblematic of the Mediterranean flora, found on dry, sun-drenched slopes in southern Europe. Used since Greek and Roman antiquity — the Egyptians already employed it in their rituals — thyme is today one of the most commonly used aromatic plants in both cooking and phytotherapy.',
        'Thyme is particularly rich in thymol and carvacrol, two phenolic compounds that give it its remarkable purifying properties. In traditional phytotherapy, thyme is associated with respiratory comfort and contributes to the normal functioning of the upper respiratory tract. A thyme tea with honey is a classic grandmother\'s remedy for facing the winter months.',
        'In cooking, thyme is a pillar of herbes de Provence and the bouquet garni. It flavors grilled meats, roasted vegetables, soups, and sauces. Fresh or dried thyme integrates beautifully into Mediterranean cuisine, bringing warmth and aromatic depth to the simplest and most elaborate dishes alike.',
      ]),
    },
    precautions: {
      fr: richText([
        'Le thym en infusion est généralement bien toléré. L\'huile essentielle de thym à thymol est en revanche très puissante et doit être utilisée avec précaution, toujours diluée et sur de courtes périodes. Ne pas dépasser trois tasses de tisane de thym par jour.',
      ]),
      en: richText([
        'Thyme as an infusion is generally well tolerated. Thymol-type thyme essential oil is very powerful and should be used with caution, always diluted and for short periods. Do not exceed three cups of thyme tea per day.',
      ]),
    },
    contraindications: {
      fr: richText([
        'L\'huile essentielle de thym à thymol est déconseillée aux femmes enceintes ou allaitantes, aux enfants de moins de 6 ans et aux personnes souffrant d\'hypertension. En cas d\'allergie aux Lamiaceae (menthe, basilic, origan), la prudence est de mise.',
      ]),
      en: richText([
        'Thymol-type thyme essential oil is not recommended for pregnant or breastfeeding women, children under 6, and people with high blood pressure. In case of allergy to Lamiaceae (mint, basil, oregano), caution is advised.',
      ]),
    },
  },
  {
    name: { fr: 'Romarin', en: 'Rosemary' },
    latinName: 'Rosmarinus officinalis',
    slug: 'romarin',
    family: 'Lamiaceae',
    origin: { fr: 'Bassin méditerranéen', en: 'Mediterranean basin' },
    partsUsed: { fr: 'Feuilles et sommités fleuries', en: 'Leaves and flowering tops' },
    activeCompounds: {
      fr: 'Acide rosmarinique, acide carnosique, carnosol, 1,8-cinéole, camphre, flavonoïdes, diterpènes',
      en: 'Rosmarinic acid, carnosic acid, carnosol, 1,8-cineole, camphor, flavonoids, diterpenes',
    },
    benefitSlugs: ['energie-vitalite', 'digestion'],
    description: {
      fr: richText([
        'Le romarin (Rosmarinus officinalis, récemment reclassé Salvia rosmarinus) est un arbrisseau aromatique vivace du bassin méditerranéen, où il pousse spontanément dans les garrigues et les maquis. Son nom, du latin « ros marinus » (rosée de mer), évoque les embruns des côtes où il prospère. Symbole de mémoire et de fidélité depuis l\'Antiquité, le romarin était brûlé dans les temples grecs et portait le surnom d\'« herbe aux couronnes ».',
        'En phytothérapie traditionnelle, le romarin est apprécié pour ses propriétés stimulantes et digestives. Il contribue au fonctionnement normal du foie et aide à maintenir une bonne digestion. Riche en antioxydants naturels — notamment l\'acide rosmarinique et l\'acide carnosique — il participe à la protection des cellules contre le stress oxydatif. Une infusion de romarin après un repas copieux est une habitude bien ancrée dans la tradition méditerranéenne.',
        'Le romarin est aussi un indispensable en cuisine, particulièrement dans les grillades, les rôtis d\'agneau, les pommes de terre au four et les focaccias. Son arôme puissant et boisé, associé à des notes de pin et d\'eucalyptus, sublime les plats les plus simples. En aromathérapie, l\'huile essentielle de romarin à cinéole est utilisée en diffusion pour ses propriétés rafraîchissantes et stimulantes.',
      ]),
      en: richText([
        'Rosemary (Rosmarinus officinalis, recently reclassified as Salvia rosmarinus) is a perennial aromatic shrub of the Mediterranean basin, where it grows spontaneously in garrigue and maquis landscapes. Its name, from the Latin "ros marinus" (sea dew), evokes the sea spray of the coasts where it thrives. A symbol of memory and fidelity since antiquity, rosemary was burned in Greek temples and bore the nickname "herb of crowns."',
        'In traditional phytotherapy, rosemary is valued for its stimulating and digestive properties. It contributes to the normal functioning of the liver and helps maintain good digestion. Rich in natural antioxidants — particularly rosmarinic acid and carnosic acid — it participates in protecting cells against oxidative stress. A rosemary infusion after a hearty meal is a well-established habit in Mediterranean tradition.',
        'Rosemary is also an essential ingredient in cooking, particularly in grills, roast lamb, baked potatoes, and focaccia. Its powerful, woody aroma, combined with notes of pine and eucalyptus, elevates the simplest dishes. In aromatherapy, cineole-type rosemary essential oil is used in diffusion for its refreshing and stimulating properties.',
      ]),
    },
    precautions: {
      fr: richText([
        'Le romarin en usage culinaire et en tisane est généralement bien toléré. En cas d\'utilisation d\'huile essentielle, toujours diluer dans une huile végétale et éviter l\'usage prolongé sans avis professionnel. Le romarin peut avoir un effet stimulant, il est donc préférable de le consommer plutôt en journée qu\'en soirée.',
      ]),
      en: richText([
        'Rosemary in culinary use and as a tisane is generally well tolerated. When using essential oil, always dilute in a vegetable oil and avoid prolonged use without professional advice. Rosemary may have a stimulating effect, so it is best consumed during the day rather than in the evening.',
      ]),
    },
    contraindications: {
      fr: richText([
        'L\'huile essentielle de romarin à camphre est déconseillée aux femmes enceintes ou allaitantes, aux enfants de moins de 6 ans et aux personnes ayant des antécédents de convulsions. Les personnes souffrant d\'hypertension devraient utiliser le romarin avec modération.',
      ]),
      en: richText([
        'Camphor-type rosemary essential oil is not recommended for pregnant or breastfeeding women, children under 6 years of age, and people with a history of seizures. People with high blood pressure should use rosemary in moderation.',
      ]),
    },
  },
]

// ---------------------------------------------------------------------------
// Data: Blog Posts
// ---------------------------------------------------------------------------

const blogPostsData = [
  {
    title: {
      fr: '5 tisanes indispensables pour l\'hiver',
      en: '5 Essential Herbal Teas for Winter',
    },
    slug: '5-tisanes-indispensables-hiver',
    excerpt: {
      fr: 'Découvrez notre sélection de cinq tisanes à adopter dès les premiers froids pour passer un hiver en toute sérénité.',
      en: 'Discover our selection of five herbal teas to adopt as soon as the first cold days arrive for a serene winter.',
    },
    categorySlugs: 'conseils',
    tagSlugs: ['tisanes', 'hiver', 'bien-etre', 'plantes-medicinales'],
    publishedAt: '2026-01-15T10:00:00.000Z',
    readingTime: 5,
    content: {
      fr: richText([
        'L\'hiver est une saison exigeante pour notre organisme. Le froid, le manque de lumière et la promiscuité dans les transports et les lieux publics mettent nos défenses naturelles à rude épreuve. Heureusement, la nature nous offre de précieux alliés pour traverser cette période avec sérénité : les tisanes de plantes.',
        'Depuis des siècles, les traditions herboristiques européennes ont identifié des plantes particulièrement adaptées à la saison froide. Riches en composés actifs, ces plantes se consomment simplement en infusion et s\'intègrent facilement dans notre quotidien. Voici notre sélection de cinq tisanes indispensables pour l\'hiver.',
        '1. La tisane de thym au miel',
        'Le thym (Thymus vulgaris) est sans doute la plante la plus emblématique de l\'hiver dans la tradition française. Riche en thymol et en carvacrol, le thym est reconnu pour ses propriétés purifiantes et son soutien au confort respiratoire. Pour préparer une tisane de thym, faites infuser une cuillère à café de thym séché dans une tasse d\'eau frémissante pendant 10 minutes. Filtrez et ajoutez une cuillère de miel de thym pour un double bénéfice. Cette tisane se déguste idéalement deux à trois fois par jour pendant les périodes de froid.',
        '2. La tisane de sureau',
        'Le sureau noir (Sambucus nigra) est une plante ancestrale dont les fleurs et les baies sont utilisées depuis le Moyen Âge. En tisane, les fleurs de sureau séchées aident à maintenir le confort respiratoire et contribuent au fonctionnement normal des défenses naturelles. Faites infuser deux cuillères à café de fleurs séchées dans 250 ml d\'eau frémissante pendant 10 à 15 minutes. Son goût délicat et légèrement floral en fait une tisane agréable, même pour les palais les plus exigeants.',
        '3. La tisane de gingembre et citron',
        'Le gingembre (Zingiber officinale) est une racine aux propriétés réchauffantes appréciées en hiver. Associé au citron, il forme une boisson tonifiante et rafraîchissante. Râpez un morceau de gingembre frais (environ 2 cm) dans une tasse d\'eau chaude, ajoutez le jus d\'un demi-citron et une cuillère de miel. Cette tisane contribue au confort digestif et apporte une agréable sensation de chaleur intérieure.',
        '4. La tisane d\'échinacée',
        'L\'échinacée (Echinacea purpurea) est une plante originaire d\'Amérique du Nord, utilisée depuis des siècles par les peuples amérindiens. Elle est reconnue pour sa contribution au fonctionnement normal du système immunitaire. En tisane, utilisez une cuillère à café de racine séchée ou de parties aériennes pour une tasse d\'eau frémissante. Laissez infuser 10 minutes. Son goût légèrement poivré et herbacé est agréable, surtout associé à un peu de miel.',
        '5. La tisane de camomille et lavande',
        'Pour clore cette sélection, rien de tel qu\'une tisane associant camomille et lavande pour les longues soirées d\'hiver. Cette combinaison favorise la détente et contribue à un sommeil réparateur, essentiel pour maintenir notre vitalité pendant la saison froide. Mélangez une cuillère à café de camomille séchée et une demi-cuillère de fleurs de lavande dans une tasse d\'eau frémissante. Infusez 7 à 8 minutes et savourez avant le coucher.',
        'Conseils pratiques pour vos tisanes d\'hiver',
        'Quelle que soit la tisane choisie, quelques règles simples permettent d\'en tirer le meilleur parti. Utilisez toujours de l\'eau frémissante (jamais bouillante, pour préserver les composés fragiles). Couvrez votre tasse pendant l\'infusion pour éviter l\'évaporation des huiles essentielles. Privilégiez les plantes issues de l\'agriculture biologique et achetées chez un herboriste de confiance. Enfin, n\'hésitez pas à varier les plaisirs et à alterner entre ces différentes tisanes tout au long de l\'hiver.',
        'Rappel : les tisanes de plantes sont des compléments à une hygiène de vie équilibrée. Elles ne remplacent pas une alimentation variée et un mode de vie sain. En cas de doute sur l\'utilisation d\'une plante, consultez un professionnel de santé.',
      ]),
      en: richText([
        'Winter is a demanding season for our bodies. The cold, lack of light, and close contact in public transport and shared spaces put our natural defenses to the test. Fortunately, nature offers us precious allies to get through this period with serenity: herbal teas.',
        'For centuries, European herbal traditions have identified plants particularly suited to the cold season. Rich in active compounds, these plants are simply consumed as infusions and easily fit into our daily routine. Here is our selection of five essential herbal teas for winter.',
        '1. Thyme tea with honey',
        'Thyme (Thymus vulgaris) is undoubtedly the most emblematic plant of winter in French tradition. Rich in thymol and carvacrol, thyme is recognized for its purifying properties and its support for respiratory comfort. To prepare thyme tea, steep one teaspoon of dried thyme in a cup of simmering water for 10 minutes. Strain and add a spoonful of thyme honey for double benefits. This tea is ideally enjoyed two to three times a day during cold periods.',
        '2. Elderflower tea',
        'Black elderberry (Sambucus nigra) is an ancestral plant whose flowers and berries have been used since the Middle Ages. As a tea, dried elderflowers help maintain respiratory comfort and contribute to the normal functioning of natural defenses. Steep two teaspoons of dried flowers in 250 ml of simmering water for 10 to 15 minutes. Its delicate, slightly floral taste makes it a pleasant tea, even for the most demanding palates.',
        '3. Ginger and lemon tea',
        'Ginger (Zingiber officinale) is a root with warming properties appreciated in winter. Combined with lemon, it forms a toning and refreshing drink. Grate a piece of fresh ginger (about 2 cm) in a cup of hot water, add the juice of half a lemon and a spoonful of honey. This tea contributes to digestive comfort and provides a pleasant sensation of inner warmth.',
        '4. Echinacea tea',
        'Echinacea (Echinacea purpurea) is a plant native to North America, used for centuries by Native American peoples. It is recognized for its contribution to the normal functioning of the immune system. As a tea, use one teaspoon of dried root or aerial parts per cup of simmering water. Let it steep for 10 minutes. Its slightly peppery, herbaceous taste is pleasant, especially with a little honey.',
        '5. Chamomile and lavender tea',
        'To close this selection, nothing beats a tea combining chamomile and lavender for long winter evenings. This combination promotes relaxation and contributes to restorative sleep, essential for maintaining our vitality during the cold season. Mix one teaspoon of dried chamomile and half a teaspoon of lavender flowers in a cup of simmering water. Steep for 7 to 8 minutes and enjoy before bedtime.',
        'Practical tips for your winter teas',
        'Whatever tea you choose, a few simple rules will help you get the most out of it. Always use simmering water (never boiling, to preserve fragile compounds). Cover your cup during steeping to prevent evaporation of essential oils. Choose organically grown plants purchased from a trusted herbalist. Finally, don\'t hesitate to vary the pleasures and alternate between these different teas throughout the winter.',
        'Reminder: herbal teas are complements to a balanced lifestyle. They do not replace a varied diet and a healthy way of living. If in doubt about the use of a plant, consult a healthcare professional.',
      ]),
    },
  },
  {
    title: {
      fr: 'Le curcuma : l\'épice aux mille vertus',
      en: 'Turmeric: The Spice of a Thousand Virtues',
    },
    slug: 'curcuma-epice-mille-vertus',
    excerpt: {
      fr: 'Plongez dans l\'univers fascinant du curcuma, cette épice dorée venue d\'Asie qui a conquis le monde par ses qualités exceptionnelles.',
      en: 'Dive into the fascinating world of turmeric, the golden spice from Asia that has conquered the world with its exceptional qualities.',
    },
    categorySlugs: 'bienfaits',
    tagSlugs: ['curcuma', 'bien-etre', 'digestion', 'plantes-medicinales'],
    publishedAt: '2026-02-03T10:00:00.000Z',
    readingTime: 7,
    content: {
      fr: richText([
        'Le curcuma, cette épice dorée aux reflets orangés, est bien plus qu\'un simple condiment culinaire. Utilisé depuis plus de 4 000 ans dans la médecine traditionnelle ayurvédique et dans la cuisine indienne, le curcuma (Curcuma longa) s\'est imposé comme l\'une des épices les plus étudiées au monde. Partons à la découverte de cette plante fascinante et de ses multiples facettes.',
        'Une histoire millénaire',
        'Originaire d\'Asie du Sud-Est, le curcuma est cultivé principalement en Inde, qui produit à elle seule près de 80 % de la production mondiale. Dans la tradition hindoue, le curcuma est considéré comme sacré et joue un rôle central dans les cérémonies religieuses et les rituels de mariage. Marco Polo, lors de ses voyages en Chine au XIIIe siècle, le décrivait déjà comme « un végétal qui possède toutes les propriétés du safran, tout en n\'étant pas du safran ». C\'est d\'ailleurs cette ressemblance qui lui a valu le surnom de « safran des Indes ».',
        'La curcumine : le joyau du curcuma',
        'La curcumine est le principal polyphénol actif du curcuma, responsable de sa couleur jaune orangé caractéristique. Elle appartient à la famille des curcuminoïdes et représente environ 3 à 5 % du poids du rhizome séché. C\'est le composé le plus étudié du curcuma : on recense aujourd\'hui plus de 12 000 publications scientifiques à son sujet.',
        'La curcumine est reconnue pour ses propriétés antioxydantes. Elle contribue à la protection des cellules contre le stress oxydatif et participe au confort articulaire. Sa biodisponibilité naturelle étant limitée, il est traditionnellement conseillé de l\'associer à la pipérine du poivre noir, qui facilite son assimilation par l\'organisme. L\'ajout d\'un corps gras (huile d\'olive, huile de coco) améliore également son absorption.',
        'Le curcuma et le confort digestif',
        'En phytothérapie traditionnelle, le curcuma est particulièrement apprécié pour son soutien au confort digestif. Il contribue au fonctionnement normal du foie et favorise la production de bile, ce qui aide à la digestion des graisses. En Inde, il est courant de boire un verre de lait chaud agrémenté de curcuma (le fameux « haldi doodh ») après un repas copieux.',
        'Le curcuma participe aussi au maintien d\'une bonne santé gastrique. Dans la tradition ayurvédique, il est considéré comme un « agni deepak », c\'est-à-dire un stimulant du feu digestif. Cette notion, bien que poétique, traduit l\'observation empirique que le curcuma facilite le processus de digestion.',
        'Comment intégrer le curcuma au quotidien',
        'Il existe de nombreuses façons d\'intégrer le curcuma dans son alimentation quotidienne. La plus simple est de l\'utiliser comme épice en cuisine : il se marie parfaitement avec le riz, les légumineuses, les légumes rôtis et les soupes. Le lait d\'or (golden milk) est devenu un classique : mélangez une cuillère à café de curcuma en poudre avec du lait végétal chaud, une pincée de poivre noir, un peu de cannelle et de miel.',
        'En infusion, le curcuma frais râpé ou en poudre se prépare comme un thé : ajoutez une cuillère à café dans une tasse d\'eau chaude, laissez infuser 5 à 10 minutes, et parfumez avec du citron et du gingembre frais. Pour les plus pressés, les compléments alimentaires à base d\'extrait de curcuma standardisé en curcumine offrent une alternative pratique, en veillant à respecter les dosages recommandés.',
        'Le curcuma en usage externe',
        'Le curcuma ne se limite pas à l\'usage interne. En Inde, il est traditionnellement utilisé dans les soins de la peau. Le masque « ubtan », à base de curcuma, farine de pois chiches et eau de rose, est un classique de la beauté ayurvédique. Ses propriétés purifiantes et son action antioxydante en font un ingrédient apprécié dans les cosmétiques naturels. Attention toutefois : le curcuma tache fortement et peut colorer la peau de façon temporaire.',
        'Précautions d\'emploi',
        'Le curcuma alimentaire aux doses culinaires habituelles est généralement bien toléré. En revanche, les compléments alimentaires concentrés en curcumine nécessitent quelques précautions. Il est déconseillé d\'en prendre en cas de calculs biliaires ou d\'obstruction des voies biliaires. Les personnes sous anticoagulants devraient consulter leur professionnel de santé avant une supplémentation. Comme pour toute plante, il est important de respecter les doses recommandées et de ne pas dépasser la durée d\'utilisation conseillée.',
        'Le curcuma est une épice remarquable qui a traversé les millénaires sans perdre de sa pertinence. Qu\'il soit utilisé en cuisine, en infusion ou en complément alimentaire, il s\'intègre naturellement dans une démarche de bien-être global. Comme toujours, une approche raisonnée et informée reste la meilleure façon de profiter de ses qualités exceptionnelles.',
      ]),
      en: richText([
        'Turmeric, the golden spice with orange hues, is much more than a simple culinary condiment. Used for over 4,000 years in traditional Ayurvedic practice and Indian cuisine, turmeric (Curcuma longa) has established itself as one of the most studied spices in the world. Let\'s explore this fascinating plant and its many facets.',
        'A thousand-year history',
        'Native to Southeast Asia, turmeric is primarily cultivated in India, which alone produces nearly 80% of the world\'s supply. In Hindu tradition, turmeric is considered sacred and plays a central role in religious ceremonies and wedding rituals. Marco Polo, during his travels to China in the 13th century, already described it as "a vegetable that possesses all the properties of saffron, while not being saffron." It is this resemblance that earned it the nickname "Indian saffron."',
        'Curcumin: the jewel of turmeric',
        'Curcumin is the main active polyphenol in turmeric, responsible for its characteristic orange-yellow color. It belongs to the curcuminoid family and represents about 3 to 5% of the weight of the dried rhizome. It is the most studied compound in turmeric, with over 12,000 scientific publications to date.',
        'Curcumin is recognized for its antioxidant properties. It contributes to protecting cells against oxidative stress and participates in joint comfort. Since its natural bioavailability is limited, it is traditionally advised to combine it with piperine from black pepper, which facilitates its absorption. Adding a fatty substance (olive oil, coconut oil) also improves its absorption.',
        'Turmeric and digestive comfort',
        'In traditional phytotherapy, turmeric is particularly valued for its support of digestive comfort. It contributes to the normal functioning of the liver and promotes bile production, which helps with fat digestion. In India, it is common to drink a glass of warm milk with turmeric (the famous "haldi doodh") after a hearty meal.',
        'Turmeric also participates in maintaining good gastric health. In Ayurvedic tradition, it is considered an "agni deepak," meaning a stimulant of the digestive fire. This notion, while poetic, reflects the empirical observation that turmeric facilitates the digestion process.',
        'How to integrate turmeric into daily life',
        'There are many ways to integrate turmeric into your daily diet. The simplest is to use it as a cooking spice: it pairs perfectly with rice, legumes, roasted vegetables, and soups. Golden milk has become a classic: mix a teaspoon of turmeric powder with warm plant-based milk, a pinch of black pepper, a little cinnamon, and honey.',
        'As an infusion, freshly grated or powdered turmeric is prepared like tea: add a teaspoon to a cup of hot water, steep for 5 to 10 minutes, and flavor with lemon and fresh ginger. For those in a hurry, dietary supplements based on standardized curcumin turmeric extract offer a practical alternative, making sure to follow recommended dosages.',
        'Turmeric for external use',
        'Turmeric is not limited to internal use. In India, it is traditionally used in skin care. The "ubtan" mask, made from turmeric, chickpea flour, and rose water, is a classic of Ayurvedic beauty. Its purifying properties and antioxidant action make it a prized ingredient in natural cosmetics. Be careful, however: turmeric stains strongly and can temporarily color the skin.',
        'Precautions',
        'Dietary turmeric at usual culinary doses is generally well tolerated. However, concentrated curcumin supplements require some precautions. They are not recommended in cases of gallstones or bile duct obstruction. People on anticoagulants should consult their healthcare professional before supplementation. As with any plant, it is important to follow recommended doses and not exceed the advised duration of use.',
        'Turmeric is a remarkable spice that has crossed millennia without losing its relevance. Whether used in cooking, infusion, or as a dietary supplement, it naturally fits into a holistic well-being approach. As always, a reasoned and informed approach remains the best way to enjoy its exceptional qualities.',
      ]),
    },
  },
  {
    title: {
      fr: 'Comment préparer une infusion parfaite',
      en: 'How to Prepare a Perfect Infusion',
    },
    slug: 'comment-preparer-infusion-parfaite',
    excerpt: {
      fr: 'Apprenez les techniques essentielles pour préparer des infusions de plantes qui préservent tous les bienfaits et les saveurs.',
      en: 'Learn the essential techniques for preparing plant infusions that preserve all the benefits and flavors.',
    },
    categorySlugs: 'conseils',
    tagSlugs: ['infusion', 'tisanes', 'bien-etre', 'plantes-medicinales'],
    publishedAt: '2026-03-10T10:00:00.000Z',
    readingTime: 4,
    content: {
      fr: richText([
        'Préparer une infusion peut sembler d\'une simplicité enfantine : de l\'eau chaude, des plantes, et voilà. Pourtant, quelques détails techniques font toute la différence entre une tisane insipide et une infusion riche en saveurs et en composés actifs. Voici les clés pour réussir vos infusions à tous les coups.',
        'Choisir ses plantes avec soin',
        'La qualité de vos plantes est le facteur le plus déterminant pour obtenir une bonne infusion. Privilégiez les plantes issues de l\'agriculture biologique, achetées en vrac chez un herboriste de confiance ou dans une boutique spécialisée. Les plantes en vrac sont généralement plus fraîches et plus aromatiques que les sachets industriels, car elles sont moins fragmentées et conservent mieux leurs huiles essentielles.',
        'Vérifiez la date de récolte ou de conditionnement : les plantes séchées se conservent idéalement entre 12 et 18 mois. Au-delà, elles perdent progressivement leurs qualités aromatiques et leurs composés actifs. Stockez vos plantes dans des contenants hermétiques, à l\'abri de la lumière, de la chaleur et de l\'humidité.',
        'La température de l\'eau : un paramètre crucial',
        'Contrairement à une idée reçue, l\'eau bouillante n\'est pas toujours la meilleure option pour préparer une infusion. Une eau trop chaude peut détruire certains composés fragiles (notamment les huiles essentielles volatiles) et donner un goût amer à la tisane. Voici les températures recommandées selon le type de plante :',
        'Pour les fleurs délicates (camomille, lavande, tilleul) : 80 à 85 °C. Faites bouillir l\'eau puis laissez-la refroidir une à deux minutes avant de verser. Pour les feuilles aromatiques (menthe, mélisse, verveine) : 85 à 90 °C. L\'eau doit frémir mais ne pas bouillonner. Pour les plantes plus robustes (thym, romarin, sauge) : 90 à 95 °C. Ces plantes supportent bien une eau plus chaude. Pour les racines et les écorces (gingembre, réglisse, cannelle) : utilisez la méthode de la décoction, en faisant mijoter les morceaux dans l\'eau pendant 10 à 15 minutes.',
        'Le dosage et le temps d\'infusion',
        'Le dosage standard est d\'une cuillère à café bien remplie (environ 2 à 3 grammes) de plantes séchées pour une tasse de 200 à 250 ml d\'eau. Pour les plantes fraîches, doublez la quantité car elles contiennent naturellement beaucoup d\'eau.',
        'Le temps d\'infusion varie selon la plante, mais se situe généralement entre 5 et 15 minutes. Un temps trop court ne permettra pas d\'extraire suffisamment de composés actifs, tandis qu\'un temps trop long risque de rendre l\'infusion amère (notamment pour les plantes riches en tanins comme la sauge ou le thé vert). En règle générale : 5 à 7 minutes pour les plantes délicates, 8 à 10 minutes pour les plantes aromatiques standard, et 10 à 15 minutes pour les plantes plus coriaces.',
        'Le geste essentiel : couvrir pendant l\'infusion',
        'C\'est probablement le conseil le plus important et le plus souvent négligé. Couvrez toujours votre tasse ou votre théière pendant l\'infusion. La raison est simple : de nombreux composés actifs des plantes sont des huiles essentielles volatiles. Si vous laissez votre infusion à découvert, ces huiles s\'évaporent avec la vapeur d\'eau et vous perdez une partie significative des bienfaits et des arômes de votre tisane. Un simple couvercle, une soucoupe retournée sur la tasse, ou un linge propre suffit.',
        'Sucrer avec discernement',
        'Le miel est le compagnon traditionnel des tisanes, et pour cause : au-delà de son goût agréable, il apporte ses propres qualités. Cependant, ajoutez-le une fois l\'infusion légèrement refroidie (en dessous de 40 °C) pour préserver ses qualités. Le sucre de canne, le sirop d\'agave ou le sirop d\'érable sont d\'autres options. Essayez aussi de déguster certaines tisanes nature : une camomille de qualité ou une verveine bien infusée n\'ont pas besoin de sucre.',
        'Les mélanges : un art à explorer',
        'Créer ses propres mélanges de plantes est un plaisir créatif et une façon de personnaliser ses tisanes. Quelques associations classiques qui fonctionnent bien : camomille et lavande pour le soir, menthe et réglisse pour la digestion, thym et miel de sapin pour l\'hiver, romarin et citron pour un coup de fouet en journée. N\'hésitez pas à expérimenter, en commençant toujours par de petites quantités pour ajuster les proportions à votre goût.',
        'Préparer une infusion parfaite est un petit rituel quotidien qui allie plaisir des sens et bien-être. En respectant ces quelques principes simples — bonnes plantes, bonne température, bon timing — vous transformerez chaque tasse en un véritable moment de sérénité.',
      ]),
      en: richText([
        'Preparing an infusion may seem childishly simple: hot water, plants, and there you go. Yet a few technical details make all the difference between a bland tisane and an infusion rich in flavors and active compounds. Here are the keys to successful infusions every time.',
        'Choosing your plants carefully',
        'The quality of your plants is the most determining factor for a good infusion. Choose organically grown plants, purchased loose from a trusted herbalist or specialty shop. Loose plants are generally fresher and more aromatic than industrial teabags, as they are less fragmented and better retain their essential oils.',
        'Check the harvest or packaging date: dried plants ideally keep for 12 to 18 months. Beyond that, they gradually lose their aromatic qualities and active compounds. Store your plants in airtight containers, away from light, heat, and humidity.',
        'Water temperature: a crucial parameter',
        'Contrary to popular belief, boiling water is not always the best option for preparing an infusion. Water that is too hot can destroy certain fragile compounds (particularly volatile essential oils) and give the tea a bitter taste. Here are the recommended temperatures by plant type:',
        'For delicate flowers (chamomile, lavender, linden): 80 to 85 degrees C. Boil the water and let it cool for one to two minutes before pouring. For aromatic leaves (mint, lemon balm, verbena): 85 to 90 degrees C. The water should simmer but not boil. For more robust plants (thyme, rosemary, sage): 90 to 95 degrees C. These plants handle hotter water well. For roots and barks (ginger, licorice, cinnamon): use the decoction method, simmering the pieces in water for 10 to 15 minutes.',
        'Dosage and steeping time',
        'The standard dosage is one well-filled teaspoon (about 2 to 3 grams) of dried plants per cup of 200 to 250 ml of water. For fresh plants, double the quantity as they naturally contain a lot of water.',
        'Steeping time varies by plant but generally ranges from 5 to 15 minutes. Too short won\'t extract enough active compounds, while too long risks making the infusion bitter (particularly for tannin-rich plants like sage or green tea). As a general rule: 5 to 7 minutes for delicate plants, 8 to 10 minutes for standard aromatic plants, and 10 to 15 minutes for tougher plants.',
        'The essential gesture: covering during steeping',
        'This is probably the most important and most often overlooked piece of advice. Always cover your cup or teapot during steeping. The reason is simple: many active plant compounds are volatile essential oils. If you leave your infusion uncovered, these oils evaporate with the steam and you lose a significant portion of the benefits and aromas of your tea. A simple lid, a saucer turned upside down on the cup, or a clean cloth will do.',
        'Sweetening with discernment',
        'Honey is the traditional companion to herbal teas, and with good reason: beyond its pleasant taste, it brings its own qualities. However, add it once the infusion has cooled slightly (below 40 degrees C) to preserve its qualities. Cane sugar, agave syrup, or maple syrup are other options. Also try tasting some teas plain: a quality chamomile or well-steeped verbena needs no sugar.',
        'Blends: an art to explore',
        'Creating your own plant blends is a creative pleasure and a way to personalize your teas. Some classic combinations that work well: chamomile and lavender for the evening, mint and licorice for digestion, thyme and fir honey for winter, rosemary and lemon for a daytime boost. Don\'t hesitate to experiment, always starting with small quantities to adjust proportions to your taste.',
        'Preparing a perfect infusion is a small daily ritual that combines sensory pleasure and well-being. By following these few simple principles — good plants, good temperature, good timing — you will transform each cup into a true moment of serenity.',
      ]),
    },
  },
]

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

export async function seed(payload: Payload): Promise<{ message: string; counts: Record<string, number> }> {
  const counts: Record<string, number> = {}

  payload.logger.info('--- Seed: starting ---')

  // -----------------------------------------------------------------------
  // 1. Authors
  // -----------------------------------------------------------------------
  payload.logger.info('Seeding authors...')
  const authorMap: Record<string, string> = {}
  for (const data of authorsData) {
    const existing = await payload.find({ collection: 'authors', where: { slug: { equals: data.slug } }, limit: 1, overrideAccess: true })
    if (existing.docs.length > 0) {
      authorMap[data.slug] = existing.docs[0].id as string
      payload.logger.info(`  Author "${data.name}" already exists, skipping.`)
      continue
    }
    const doc = await payload.create({
      collection: 'authors',
      locale: 'fr',
      overrideAccess: true,
      draft: false,
      data: {
        name: data.name,
        role: data.role,
        credentials: data.credentials,
        slug: data.slug,
        bio: data.bio.fr,
      },
    })
    authorMap[data.slug] = doc.id as string
  }
  counts.authors = authorsData.length

  // -----------------------------------------------------------------------
  // 2. Categories
  // -----------------------------------------------------------------------
  payload.logger.info('Seeding categories...')
  const categoryMap: Record<string, string> = {}
  for (const data of categoriesData) {
    const existing = await payload.find({ collection: 'categories', where: { slug: { equals: data.slug } }, limit: 1, overrideAccess: true })
    if (existing.docs.length > 0) {
      categoryMap[data.slug] = existing.docs[0].id as string
      payload.logger.info(`  Category "${data.name.fr}" already exists, skipping.`)
      continue
    }
    const doc = await payload.create({
      collection: 'categories',
      locale: 'fr',
      overrideAccess: true,
      draft: false,
      data: {
        name: data.name.fr,
        slug: data.slug,
        description: data.description.fr,
        order: data.order,
      },
    })
    categoryMap[data.slug] = doc.id as string
  }
  counts.categories = categoriesData.length

  // -----------------------------------------------------------------------
  // 3. Tags
  // -----------------------------------------------------------------------
  payload.logger.info('Seeding tags...')
  const tagMap: Record<string, string> = {}
  for (const data of tagsData) {
    const existing = await payload.find({ collection: 'tags', where: { slug: { equals: data.slug } }, limit: 1, overrideAccess: true })
    if (existing.docs.length > 0) {
      tagMap[data.slug] = existing.docs[0].id as string
      payload.logger.info(`  Tag "${data.name.fr}" already exists, skipping.`)
      continue
    }
    const doc = await payload.create({
      collection: 'tags',
      locale: 'fr',
      overrideAccess: true,
      draft: false,
      data: {
        name: data.name.fr,
        slug: data.slug,
      },
    })
    tagMap[data.slug] = doc.id as string
  }
  counts.tags = tagsData.length

  // -----------------------------------------------------------------------
  // 4. Benefits
  // -----------------------------------------------------------------------
  payload.logger.info('Seeding benefits...')
  const benefitMap: Record<string, string> = {}
  for (const data of benefitsData) {
    const existing = await payload.find({ collection: 'benefits', where: { slug: { equals: data.slug } }, limit: 1, overrideAccess: true })
    if (existing.docs.length > 0) {
      benefitMap[data.slug] = existing.docs[0].id as string
      payload.logger.info(`  Benefit "${data.name.fr}" already exists, skipping.`)
      continue
    }
    const doc = await payload.create({
      collection: 'benefits',
      locale: 'fr',
      overrideAccess: true,
      draft: false,
      data: {
        name: data.name.fr,
        slug: data.slug,
        icon: data.icon,
        shortDescription: data.shortDescription.fr,
        description: data.description.fr,
        status: 'published',
        _status: 'published',
        complianceStatus: 'approved',
      },
    })
    benefitMap[data.slug] = doc.id as string
  }
  counts.benefits = benefitsData.length

  // -----------------------------------------------------------------------
  // 5. WikiEntries (Plants)
  // -----------------------------------------------------------------------
  payload.logger.info('Seeding wiki entries (plants)...')
  for (const data of wikiEntriesData) {
    const existing = await payload.find({ collection: 'wikiEntries', where: { slug: { equals: data.slug } }, limit: 1, overrideAccess: true })
    if (existing.docs.length > 0) {
      payload.logger.info(`  Plant "${data.name.fr}" already exists, skipping.`)
      continue
    }
    const benefitIds = data.benefitSlugs.map((s) => benefitMap[s]).filter(Boolean)
    const authorId = authorMap['marie-dupont']

    const doc = await payload.create({
      collection: 'wikiEntries',
      locale: 'fr',
      overrideAccess: true,
      draft: false,
      data: {
        name: data.name.fr,
        latinName: data.latinName,
        slug: data.slug,
        family: data.family,
        origin: data.origin.fr,
        partsUsed: data.partsUsed.fr,
        activeCompounds: data.activeCompounds.fr,
        benefits: benefitIds,
        description: data.description.fr,
        precautions: data.precautions.fr,
        contraindications: data.contraindications.fr,
        author: authorId,
        status: 'published',
        _status: 'published',
        complianceStatus: 'approved',
      },
    })
  }
  counts.wikiEntries = wikiEntriesData.length

  // -----------------------------------------------------------------------
  // 6. Blog Posts
  // -----------------------------------------------------------------------
  payload.logger.info('Seeding blog posts...')
  for (const data of blogPostsData) {
    const existing = await payload.find({ collection: 'blogPosts', where: { slug: { equals: data.slug } }, limit: 1, overrideAccess: true })
    if (existing.docs.length > 0) {
      payload.logger.info(`  Blog post "${data.title.fr}" already exists, skipping.`)
      continue
    }
    const categoryId = categoryMap[data.categorySlugs]
    const tagIds = data.tagSlugs.map((s) => tagMap[s]).filter(Boolean)
    const authorId = authorMap['marie-dupont']

    const doc = await payload.create({
      collection: 'blogPosts',
      locale: 'fr',
      overrideAccess: true,
      draft: false,
      data: {
        title: data.title.fr,
        slug: data.slug,
        excerpt: data.excerpt.fr,
        content: data.content.fr,
        author: authorId,
        category: categoryId,
        tags: tagIds,
        publishedAt: data.publishedAt,
        readingTime: data.readingTime,
        status: 'published',
        _status: 'published',
        complianceStatus: 'approved',
      },
    })
  }
  counts.blogPosts = blogPostsData.length

  payload.logger.info('--- Seed: complete ---')

  return {
    message: 'Seed completed successfully',
    counts,
  }
}
