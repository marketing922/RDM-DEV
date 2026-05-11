import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 300

/* ─── richText helper (Lexical JSON) ──────────────────────────────── */
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

/* ─── Templates per category ──────────────────────────────────────── */
type Lang = 'fr' | 'en'
type Cat =
  | 'nervous' | 'digestive' | 'respiratory' | 'female' | 'male'
  | 'circulatory' | 'joints' | 'immunity' | 'skin' | 'metabolism'

const CATEGORY_INTRO: Record<Cat, Record<Lang, string>> = {
  nervous: {
    fr: 'Les médecines traditionnelles ont depuis des siècles identifié des plantes capables de soutenir l\'équilibre nerveux et mental. Issues de la pharmacopée européenne comme des traditions asiatiques, elles offrent une approche douce, respectueuse des rythmes naturels du corps.',
    en: 'Traditional medicines have for centuries identified plants capable of supporting nervous and mental balance. From the European pharmacopoeia and Asian traditions alike, they offer a gentle approach that respects the body\'s natural rhythms.',
  },
  digestive: {
    fr: 'La digestion occupe une place centrale dans la médecine traditionnelle européenne. Les herboristes ont consigné depuis le Moyen Âge l\'usage de plantes amères, aromatiques ou carminatives, dont l\'efficacité est aujourd\'hui largement étudiée par la science moderne.',
    en: 'Digestion holds a central place in traditional European medicine. Herbalists have recorded since the Middle Ages the use of bitter, aromatic and carminative plants whose efficacy is now widely studied by modern science.',
  },
  respiratory: {
    fr: 'Les voies respiratoires sont, dans la pharmacopée traditionnelle, l\'une des sphères les plus richement documentées. Les plantes balsamiques, mucilagineuses ou expectorantes ont accompagné les saisons froides depuis des générations.',
    en: 'The respiratory tract is one of the most richly documented spheres in the traditional pharmacopoeia. Balsamic, mucilaginous and expectorant plants have accompanied cold seasons for generations.',
  },
  female: {
    fr: 'La sphère féminine bénéficie d\'un héritage botanique exceptionnel. De la phytothérapie hippocratique aux herboristes médiévales, les plantes dites « de femme » ont accompagné les cycles, les transitions hormonales et le bien-être au féminin.',
    en: 'The female sphere benefits from an exceptional botanical heritage. From Hippocratic phytotherapy to medieval herbalists, so-called "women\'s plants" have accompanied cycles, hormonal transitions and female well-being.',
  },
  male: {
    fr: 'Les médecines traditionnelles consignent plusieurs plantes spécifiquement étudiées pour la sphère masculine, notamment pour le confort prostatique et la vitalité après quarante ans.',
    en: 'Traditional medicines record several plants specifically studied for the male sphere, particularly for prostate comfort and vitality after forty.',
  },
  circulatory: {
    fr: 'La circulation veineuse et artérielle est l\'un des terrains historiques de la phytothérapie européenne. Les plantes veinotoniques et fluidifiantes sont mentionnées dans les ouvrages d\'herboristerie depuis la Renaissance.',
    en: 'Venous and arterial circulation is one of the historical fields of European phytotherapy. Venotonic and fluidifying plants are mentioned in herbalist references since the Renaissance.',
  },
  joints: {
    fr: 'Le confort articulaire et musculaire occupe les médecines traditionnelles depuis l\'Antiquité. Plantes anti-inflammatoires, reminéralisantes ou résines balsamiques sont consignées dans la pharmacopée européenne et ayurvédique.',
    en: 'Joint and muscle comfort has occupied traditional medicines since Antiquity. Anti-inflammatory, remineralising plants and balsamic resins are recorded in European and Ayurvedic pharmacopoeias.',
  },
  immunity: {
    fr: 'Le soutien des défenses naturelles repose, dans la tradition, sur des plantes adaptogènes et immunomodulantes étudiées tant en Europe qu\'en Asie. Leur usage saisonnier est attesté depuis des millénaires.',
    en: 'Support of natural defences rests, in tradition, on adaptogenic and immunomodulating plants studied both in Europe and Asia. Their seasonal use is attested for millennia.',
  },
  skin: {
    fr: 'La peau, organe-frontière, a toujours occupé une place particulière en herboristerie. Plantes dépuratives et reminéralisantes accompagnent depuis longtemps la beauté et la santé cutanée.',
    en: 'The skin, a boundary organ, has always held a special place in herbalism. Depurative and remineralising plants have long accompanied skin beauty and health.',
  },
  metabolism: {
    fr: 'L\'équilibre métabolique mobilise des plantes draineuses, hépatorégulatrices et thermogéniques utilisées de longue date dans les médecines européennes et orientales.',
    en: 'Metabolic balance draws on draining, hepato-regulating and thermogenic plants long used in European and Oriental medicines.',
  },
}

const RED_FLAGS: Record<Cat, Record<Lang, string[]>> = {
  nervous: {
    fr: ['Symptômes persistants au-delà de 14 jours', 'Idées noires ou détresse psychique', 'Insomnie chronique', 'Prise concomitante d\'antidépresseurs ou anxiolytiques'],
    en: ['Symptoms persisting beyond 14 days', 'Dark thoughts or psychological distress', 'Chronic insomnia', 'Concurrent use of antidepressants or anxiolytics'],
  },
  digestive: {
    fr: ['Douleur abdominale intense', 'Sang dans les selles', 'Perte de poids inexpliquée', 'Symptômes au-delà de 7 jours', 'Vomissements répétés'],
    en: ['Severe abdominal pain', 'Blood in stool', 'Unexplained weight loss', 'Symptoms beyond 7 days', 'Repeated vomiting'],
  },
  respiratory: {
    fr: ['Fièvre supérieure à 38,5°C plus de 3 jours', 'Difficulté respiratoire', 'Toux avec expectorations colorées', 'Symptômes au-delà de 7 jours'],
    en: ['Fever above 38.5°C for more than 3 days', 'Breathing difficulty', 'Cough with coloured sputum', 'Symptoms beyond 7 days'],
  },
  female: {
    fr: ['Saignements anormaux ou abondants', 'Douleurs pelviennes intenses', 'Cycle absent plus de 3 mois (hors grossesse)', 'Grossesse ou allaitement'],
    en: ['Abnormal or heavy bleeding', 'Severe pelvic pain', 'Absent cycle for over 3 months (excluding pregnancy)', 'Pregnancy or breastfeeding'],
  },
  male: {
    fr: ['Difficulté ou douleur à la miction', 'Sang dans les urines', 'Fièvre associée', 'Antécédent de cancer de la prostate'],
    en: ['Difficulty or pain on urination', 'Blood in urine', 'Associated fever', 'History of prostate cancer'],
  },
  circulatory: {
    fr: ['Œdème asymétrique d\'une jambe', 'Douleur thoracique', 'Essoufflement inhabituel', 'Antécédent de phlébite ou embolie'],
    en: ['Asymmetric leg swelling', 'Chest pain', 'Unusual shortness of breath', 'History of phlebitis or embolism'],
  },
  joints: {
    fr: ['Douleur articulaire avec rougeur et chaleur', 'Articulation déformée ou bloquée', 'Fièvre associée', 'Symptômes au-delà de 14 jours'],
    en: ['Joint pain with redness and heat', 'Deformed or locked joint', 'Associated fever', 'Symptoms beyond 14 days'],
  },
  immunity: {
    fr: ['Fièvre supérieure à 39°C', 'Infections répétées', 'Fatigue extrême et inhabituelle', 'Traitement immunosuppresseur en cours'],
    en: ['Fever above 39°C', 'Repeated infections', 'Extreme and unusual fatigue', 'Ongoing immunosuppressive treatment'],
  },
  skin: {
    fr: ['Lésion qui ne cicatrise pas', 'Grain de beauté qui change de forme ou de couleur', 'Démangeaisons généralisées', 'Éruption avec fièvre'],
    en: ['Wound that does not heal', 'Mole changing shape or colour', 'Generalised itching', 'Rash with fever'],
  },
  metabolism: {
    fr: ['Perte ou prise de poids rapide inexpliquée', 'Soif excessive et urines abondantes', 'Œdèmes persistants', 'Antécédent rénal ou hépatique'],
    en: ['Rapid unexplained weight loss or gain', 'Excessive thirst and abundant urination', 'Persistent oedema', 'Renal or hepatic history'],
  },
}

const PRECAUTIONS_BY_SEVERITY: Record<string, Record<Lang, string[]>> = {
  routine: {
    fr: [
      'Comme tout complément alimentaire, ce produit ne se substitue pas à une alimentation variée et équilibrée ni à un mode de vie sain. Respecter la dose conseillée et tenir hors de portée des jeunes enfants.',
      'En cas de grossesse, d\'allaitement, de traitement médical en cours ou pour les enfants, demander l\'avis d\'un professionnel de santé avant utilisation.',
    ],
    en: [
      'Like any food supplement, this product does not replace a varied, balanced diet or a healthy lifestyle. Respect the recommended dose and keep out of reach of young children.',
      'In case of pregnancy, breastfeeding, ongoing medical treatment or for children, seek advice from a health professional before use.',
    ],
  },
  transient: {
    fr: [
      'Cet usage traditionnel concerne un inconfort passager. Si les symptômes persistent au-delà de quelques jours, consultez un professionnel de santé.',
      'Comme tout complément alimentaire, ce produit ne se substitue pas à une alimentation variée et équilibrée ni à un mode de vie sain. Respecter la dose conseillée et tenir hors de portée des jeunes enfants.',
    ],
    en: [
      'This traditional use concerns transient discomfort. If symptoms persist beyond a few days, consult a health professional.',
      'Like any food supplement, this product does not replace a varied, balanced diet or a healthy lifestyle. Respect the recommended dose and keep out of reach of young children.',
    ],
  },
  'requires-monitoring': {
    fr: [
      'Cet usage requiert une vigilance particulière. Toujours consulter un professionnel de santé avant la prise prolongée, et respecter strictement la posologie.',
      'En cas de grossesse, d\'allaitement, de traitement médical en cours, d\'antécédent personnel ou familial pertinent, demander l\'avis d\'un médecin.',
    ],
    en: [
      'This use requires particular vigilance. Always consult a health professional before prolonged use, and strictly observe the dosage.',
      'In case of pregnancy, breastfeeding, ongoing medical treatment, relevant personal or family history, seek medical advice.',
    ],
  },
}

/* ─── Benefit data ────────────────────────────────────────────────── */

type Item = {
  slug: string
  icon: string
  category: Cat
  bodyRegion: 'tete' | 'gorge' | 'respiration' | 'digestion' | 'feminin' | 'circulation'
  severity: 'routine' | 'transient' | 'requires-monitoring'
  fr: { name: string; shortDescription: string; regulatoryClaim: string; specific: string }
  en: { name: string; shortDescription: string; regulatoryClaim: string; specific: string }
}

const ITEMS: Item[] = [
  // ── Système nerveux & mental ──
  { slug: 'confort-mental', icon: 'brain', category: 'nervous', bodyRegion: 'tete', severity: 'routine',
    fr: { name: 'Confort mental & relaxation', shortDescription: 'Apaiser l\'esprit et favoriser la détente.', regulatoryClaim: 'Contribue à la relaxation et au bien-être mental.', specific: 'La camomille, la mélisse et la passiflore sont parmi les plantes les plus traditionnellement utilisées pour favoriser un état de calme intérieur.' },
    en: { name: 'Mental comfort & relaxation', shortDescription: 'Soothe the mind and promote relaxation.', regulatoryClaim: 'Contributes to relaxation and mental well-being.', specific: 'Chamomile, lemon balm and passionflower are among the plants most traditionally used to promote a state of inner calm.' } },
  { slug: 'detente-nerveuse', icon: 'leaf', category: 'nervous', bodyRegion: 'tete', severity: 'routine',
    fr: { name: 'Détente nerveuse', shortDescription: 'Soulager les tensions nerveuses du quotidien.', regulatoryClaim: 'Aide à maintenir la détente et la relaxation optimales.', specific: 'L\'aubépine et la valériane sont consignées depuis le Moyen Âge pour leur action sur le système nerveux sympathique.' },
    en: { name: 'Nervous tension relief', shortDescription: 'Ease daily nervous tension.', regulatoryClaim: 'Helps maintain optimal relaxation.', specific: 'Hawthorn and valerian have been recorded since the Middle Ages for their action on the sympathetic nervous system.' } },
  { slug: 'sommeil', icon: 'moon', category: 'nervous', bodyRegion: 'tete', severity: 'routine',
    fr: { name: 'Sommeil & endormissement', shortDescription: 'Favoriser un sommeil naturel et réparateur.', regulatoryClaim: 'Contribue à un sommeil sain et naturel.', specific: 'La valériane, le houblon et la passiflore figurent parmi les plantes du sommeil les mieux étudiées par la pharmacopée européenne.' },
    en: { name: 'Sleep & falling asleep', shortDescription: 'Promote natural, restorative sleep.', regulatoryClaim: 'Contributes to healthy, natural sleep.', specific: 'Valerian, hop and passionflower are among the sleep plants best studied by the European pharmacopoeia.' } },
  { slug: 'fatigue-passagere', icon: 'battery', category: 'nervous', bodyRegion: 'tete', severity: 'transient',
    fr: { name: 'Confort en cas de fatigue passagère', shortDescription: 'Soutenir l\'organisme face à la fatigue passagère.', regulatoryClaim: 'Aide en cas de fatigue passagère.', specific: 'Le ginseng, l\'éleuthérocoque et la rhodiole sont les plantes adaptogènes de référence en cas de baisse d\'énergie.' },
    en: { name: 'Comfort in temporary fatigue', shortDescription: 'Support the body during temporary fatigue.', regulatoryClaim: 'Helps in case of temporary fatigue.', specific: 'Ginseng, eleutherococcus and rhodiola are reference adaptogenic plants for energy slumps.' } },
  { slug: 'concentration', icon: 'target', category: 'nervous', bodyRegion: 'tete', severity: 'routine',
    fr: { name: 'Vigilance & concentration', shortDescription: 'Soutenir l\'attention et les fonctions cognitives.', regulatoryClaim: 'Contribue à des performances cognitives normales.', specific: 'Le ginkgo biloba et le bacopa sont étudiés pour leur soutien aux fonctions cognitives normales.' },
    en: { name: 'Alertness & concentration', shortDescription: 'Support attention and cognitive function.', regulatoryClaim: 'Contributes to normal cognitive performance.', specific: 'Ginkgo biloba and bacopa are studied for their support of normal cognitive function.' } },
  { slug: 'periode-examens', icon: 'book-open', category: 'nervous', bodyRegion: 'tete', severity: 'transient',
    fr: { name: 'Confort en période d\'examens', shortDescription: 'Accompagner les périodes intellectuellement exigeantes.', regulatoryClaim: 'Contribue au maintien des performances cognitives.', specific: 'Une combinaison de plantes adaptogènes et nervines accompagne traditionnellement les périodes de forte sollicitation intellectuelle.' },
    en: { name: 'Comfort during exam periods', shortDescription: 'Support intellectually demanding periods.', regulatoryClaim: 'Contributes to maintaining cognitive performance.', specific: 'A combination of adaptogenic and nervine plants traditionally accompanies periods of high intellectual demand.' } },

  // ── Voies respiratoires ──
  { slug: 'confort-gorge', icon: 'mic', category: 'respiratory', bodyRegion: 'gorge', severity: 'transient',
    fr: { name: 'Confort de la gorge', shortDescription: 'Adoucir et soulager la gorge irritée.', regulatoryClaim: 'Contribue au confort de la gorge.', specific: 'La guimauve, la mauve et le bouillon-blanc sont des plantes mucilagineuses traditionnellement employées pour adoucir les muqueuses.' },
    en: { name: 'Throat comfort', shortDescription: 'Soothe and relieve an irritated throat.', regulatoryClaim: 'Contributes to throat comfort.', specific: 'Marshmallow, mallow and mullein are mucilaginous plants traditionally used to soothe mucous membranes.' } },
  { slug: 'confort-respiratoire', icon: 'wind', category: 'respiratory', bodyRegion: 'respiration', severity: 'transient',
    fr: { name: 'Confort respiratoire', shortDescription: 'Soutenir le bien-être des voies respiratoires.', regulatoryClaim: 'Contribue au confort des voies respiratoires.', specific: 'L\'eucalyptus, le thym et le pin sylvestre figurent parmi les plantes balsamiques les plus consignées.' },
    en: { name: 'Respiratory comfort', shortDescription: 'Support respiratory well-being.', regulatoryClaim: 'Contributes to respiratory tract comfort.', specific: 'Eucalyptus, thyme and Scots pine are among the most recorded balsamic plants.' } },
  { slug: 'voies-aeriennes-superieures', icon: 'cloud-fog', category: 'respiratory', bodyRegion: 'respiration', severity: 'transient',
    fr: { name: 'Confort des voies aériennes supérieures', shortDescription: 'Accompagner la saison froide.', regulatoryClaim: 'Contribue au confort des voies aériennes supérieures.', specific: 'Le sureau noir, l\'échinacée et le sapin baumier sont les alliés saisonniers les plus traditionnels.' },
    en: { name: 'Upper airways comfort', shortDescription: 'Support during the cold season.', regulatoryClaim: 'Contributes to upper airway comfort.', specific: 'Elderberry, echinacea and balsam fir are the most traditional seasonal allies.' } },
  { slug: 'confort-vocal', icon: 'megaphone', category: 'respiratory', bodyRegion: 'gorge', severity: 'transient',
    fr: { name: 'Confort vocal', shortDescription: 'Préserver la souplesse des cordes vocales.', regulatoryClaim: 'Contribue au confort de la gorge et des cordes vocales.', specific: 'La propolis et la guimauve sont les soutiens privilégiés des professionnels de la voix.' },
    en: { name: 'Vocal comfort', shortDescription: 'Preserve vocal cord suppleness.', regulatoryClaim: 'Contributes to throat and vocal cord comfort.', specific: 'Propolis and marshmallow are favoured supports for voice professionals.' } },

  // ── Digestion ──
  { slug: 'confort-digestif', icon: 'apple', category: 'digestive', bodyRegion: 'digestion', severity: 'routine',
    fr: { name: 'Confort digestif', shortDescription: 'Soutenir une digestion harmonieuse.', regulatoryClaim: 'Contribue à une digestion normale.', specific: 'La menthe poivrée, le fenouil et le carvi sont des carminatifs majeurs de la pharmacopée européenne.' },
    en: { name: 'Digestive comfort', shortDescription: 'Support harmonious digestion.', regulatoryClaim: 'Contributes to normal digestion.', specific: 'Peppermint, fennel and caraway are major carminatives of the European pharmacopoeia.' } },
  { slug: 'digestion-difficile', icon: 'utensils', category: 'digestive', bodyRegion: 'digestion', severity: 'transient',
    fr: { name: 'Digestion difficile', shortDescription: 'Soulager les lourdeurs et ballonnements.', regulatoryClaim: 'Aide à réduire la sensation de lourdeur après les repas.', specific: 'L\'artichaut, le radis noir et la gentiane sont des amers digestifs traditionnellement utilisés en cas de digestion lente.' },
    en: { name: 'Difficult digestion', shortDescription: 'Relieve heaviness and bloating.', regulatoryClaim: 'Helps reduce post-meal heaviness.', specific: 'Artichoke, black radish and gentian are digestive bitters traditionally used in case of sluggish digestion.' } },
  { slug: 'transit-intestinal', icon: 'leaf', category: 'digestive', bodyRegion: 'digestion', severity: 'transient',
    fr: { name: 'Confort intestinal & transit', shortDescription: 'Maintenir un transit régulier.', regulatoryClaim: 'Contribue à un transit intestinal normal.', specific: 'Les graines de psyllium, de lin et la mauve sont des fibres mucilagineuses qui régulent le transit en douceur.' },
    en: { name: 'Intestinal comfort & transit', shortDescription: 'Maintain regular transit.', regulatoryClaim: 'Contributes to normal intestinal transit.', specific: 'Psyllium, flax seeds and mallow are mucilaginous fibres that gently regulate transit.' } },
  { slug: 'confort-hepatique', icon: 'sprout', category: 'digestive', bodyRegion: 'digestion', severity: 'routine',
    fr: { name: 'Confort hépatique', shortDescription: 'Soutenir le foie dans ses fonctions naturelles.', regulatoryClaim: 'Contribue au fonctionnement normal du foie.', specific: 'Le chardon-Marie, l\'artichaut et le desmodium figurent parmi les plantes hépatoprotectrices les mieux documentées.' },
    en: { name: 'Liver comfort', shortDescription: 'Support the liver\'s natural functions.', regulatoryClaim: 'Contributes to normal liver function.', specific: 'Milk thistle, artichoke and desmodium are among the best-documented hepatoprotective plants.' } },
  { slug: 'apres-repas', icon: 'coffee', category: 'digestive', bodyRegion: 'digestion', severity: 'routine',
    fr: { name: 'Confort après les repas', shortDescription: 'Accompagner la digestion post-prandiale.', regulatoryClaim: 'Contribue au confort digestif après les repas.', specific: 'L\'anis, la badiane et la verveine sont les digestifs traditionnels servis en infusion en fin de repas.' },
    en: { name: 'Post-meal comfort', shortDescription: 'Support post-meal digestion.', regulatoryClaim: 'Contributes to digestive comfort after meals.', specific: 'Anise, star anise and lemon verbena are the traditional digestives served as an infusion at the end of meals.' } },

  // ── Sphère féminine ──
  { slug: 'confort-menstruel', icon: 'flower', category: 'female', bodyRegion: 'feminin', severity: 'transient',
    fr: { name: 'Confort menstruel', shortDescription: 'Accompagner les cycles avec douceur.', regulatoryClaim: 'Contribue au confort pendant le cycle menstruel.', specific: 'L\'achillée millefeuille, l\'alchémille et le framboisier sont les plantes féminines de référence dans les traditions européennes.' },
    en: { name: 'Menstrual comfort', shortDescription: 'Support cycles gently.', regulatoryClaim: 'Contributes to comfort during the menstrual cycle.', specific: 'Yarrow, lady\'s mantle and raspberry leaf are reference female plants in European traditions.' } },
  { slug: 'confort-premenstruel', icon: 'flower-2', category: 'female', bodyRegion: 'feminin', severity: 'transient',
    fr: { name: 'Confort prémenstruel', shortDescription: 'Soulager les inconforts avant les règles.', regulatoryClaim: 'Aide à atténuer les inconforts liés au cycle.', specific: 'Le gattilier et l\'onagre sont traditionnellement consignés pour la phase lutéale du cycle.' },
    en: { name: 'Premenstrual comfort', shortDescription: 'Relieve premenstrual discomfort.', regulatoryClaim: 'Helps alleviate cycle-related discomfort.', specific: 'Chaste tree and evening primrose are traditionally recorded for the luteal phase of the cycle.' } },
  { slug: 'menopause', icon: 'sun', category: 'female', bodyRegion: 'feminin', severity: 'requires-monitoring',
    fr: { name: 'Confort de la ménopause', shortDescription: 'Traverser la ménopause sereinement.', regulatoryClaim: 'Aide à maintenir le confort durant la ménopause.', specific: 'La sauge officinale, le houblon et le trèfle rouge sont des phytoœstrogéniques traditionnellement utilisés à cette période.' },
    en: { name: 'Menopause comfort', shortDescription: 'Navigate menopause serenely.', regulatoryClaim: 'Helps maintain comfort during menopause.', specific: 'Common sage, hop and red clover are phytoestrogenic plants traditionally used during this period.' } },
  { slug: 'bien-etre-feminin', icon: 'heart', category: 'female', bodyRegion: 'feminin', severity: 'routine',
    fr: { name: 'Bien-être féminin', shortDescription: 'Équilibre et vitalité au féminin.', regulatoryClaim: 'Contribue à l\'équilibre et au bien-être féminin.', specific: 'L\'alchémille, la mélisse et le maca sont des soutiens globaux de la vitalité féminine.' },
    en: { name: 'Female well-being', shortDescription: 'Female balance and vitality.', regulatoryClaim: 'Contributes to female balance and well-being.', specific: 'Lady\'s mantle, lemon balm and maca are global supports of female vitality.' } },

  // ── Sphère masculine ──
  { slug: 'confort-prostatique', icon: 'shield', category: 'male', bodyRegion: 'circulation', severity: 'requires-monitoring',
    fr: { name: 'Confort prostatique', shortDescription: 'Soutenir le confort urinaire masculin après 45 ans.', regulatoryClaim: 'Contribue au confort prostatique.', specific: 'Le palmier nain (Serenoa repens), la prêle et l\'épilobe sont les plantes de référence pour le confort prostatique.' },
    en: { name: 'Prostate comfort', shortDescription: 'Support male urinary comfort after 45.', regulatoryClaim: 'Contributes to prostate comfort.', specific: 'Saw palmetto (Serenoa repens), horsetail and willowherb are reference plants for prostate comfort.' } },
  { slug: 'vitalite-masculine', icon: 'zap', category: 'male', bodyRegion: 'tete', severity: 'routine',
    fr: { name: 'Vitalité masculine', shortDescription: 'Tonus et vitalité au masculin.', regulatoryClaim: 'Contribue au maintien de la vitalité.', specific: 'Le tribulus, le maca et le ginseng sont les plantes adaptogènes traditionnelles de la vitalité masculine.' },
    en: { name: 'Male vitality', shortDescription: 'Male tone and vitality.', regulatoryClaim: 'Contributes to maintaining vitality.', specific: 'Tribulus, maca and ginseng are traditional adaptogenic plants of male vitality.' } },

  // ── Circulation ──
  { slug: 'confort-circulatoire', icon: 'heart-pulse', category: 'circulatory', bodyRegion: 'circulation', severity: 'requires-monitoring',
    fr: { name: 'Confort circulatoire', shortDescription: 'Soutenir une circulation harmonieuse.', regulatoryClaim: 'Contribue à une circulation sanguine normale.', specific: 'La vigne rouge, le marronnier d\'Inde et le mélilot sont les plantes circulatoires phares de la pharmacopée européenne.' },
    en: { name: 'Circulatory comfort', shortDescription: 'Support harmonious circulation.', regulatoryClaim: 'Contributes to normal blood circulation.', specific: 'Red vine, horse chestnut and sweet clover are the leading circulatory plants of the European pharmacopoeia.' } },
  { slug: 'jambes-legeres', icon: 'footprints', category: 'circulatory', bodyRegion: 'circulation', severity: 'transient',
    fr: { name: 'Jambes légères', shortDescription: 'Retrouver une sensation de légèreté.', regulatoryClaim: 'Contribue au confort des jambes lourdes.', specific: 'La vigne rouge, le petit houx (fragon) et le cyprès sont consignés depuis l\'Antiquité pour la sensation de jambes lourdes.' },
    en: { name: 'Light legs', shortDescription: 'Regain a feeling of lightness.', regulatoryClaim: 'Contributes to comfort in case of heavy legs.', specific: 'Red vine, butcher\'s broom and cypress have been recorded since Antiquity for the heavy-legs sensation.' } },
  { slug: 'confort-veineux', icon: 'waves', category: 'circulatory', bodyRegion: 'circulation', severity: 'requires-monitoring',
    fr: { name: 'Confort veineux', shortDescription: 'Tonifier et préserver le réseau veineux.', regulatoryClaim: 'Contribue au tonus veineux.', specific: 'Le marronnier d\'Inde et l\'hamamélis sont des veinotoniques majeurs étudiés depuis le XIXe siècle.' },
    en: { name: 'Venous comfort', shortDescription: 'Tone and preserve venous network.', regulatoryClaim: 'Contributes to venous tone.', specific: 'Horse chestnut and witch hazel are major venotonics studied since the 19th century.' } },
  { slug: 'microcirculation', icon: 'sparkles', category: 'circulatory', bodyRegion: 'circulation', severity: 'routine',
    fr: { name: 'Microcirculation', shortDescription: 'Soutenir la microcirculation périphérique.', regulatoryClaim: 'Contribue à une microcirculation normale.', specific: 'Le ginkgo biloba et le cassis sont les soutiens traditionnels de la microcirculation périphérique.' },
    en: { name: 'Microcirculation', shortDescription: 'Support peripheral microcirculation.', regulatoryClaim: 'Contributes to normal microcirculation.', specific: 'Ginkgo biloba and blackcurrant are traditional supports of peripheral microcirculation.' } },

  // ── Articulations & muscles ──
  { slug: 'confort-articulaire', icon: 'bone', category: 'joints', bodyRegion: 'circulation', severity: 'requires-monitoring',
    fr: { name: 'Confort articulaire', shortDescription: 'Préserver le confort des articulations.', regulatoryClaim: 'Contribue au confort articulaire.', specific: 'L\'harpagophytum, le curcuma et le cassis sont les anti-inflammatoires végétaux les mieux étudiés.' },
    en: { name: 'Joint comfort', shortDescription: 'Preserve joint comfort.', regulatoryClaim: 'Contributes to joint comfort.', specific: 'Devil\'s claw, turmeric and blackcurrant are the best-studied plant anti-inflammatories.' } },
  { slug: 'souplesse-articulaire', icon: 'activity', category: 'joints', bodyRegion: 'circulation', severity: 'routine',
    fr: { name: 'Souplesse articulaire', shortDescription: 'Maintenir la souplesse au quotidien.', regulatoryClaim: 'Contribue à la souplesse des articulations.', specific: 'La prêle et l\'ortie reminéralisent traditionnellement le tissu conjonctif.' },
    en: { name: 'Joint flexibility', shortDescription: 'Maintain daily flexibility.', regulatoryClaim: 'Contributes to joint flexibility.', specific: 'Horsetail and nettle traditionally remineralise connective tissue.' } },
  { slug: 'confort-musculaire', icon: 'dumbbell', category: 'joints', bodyRegion: 'circulation', severity: 'transient',
    fr: { name: 'Confort musculaire', shortDescription: 'Soulager les muscles sollicités.', regulatoryClaim: 'Contribue au confort musculaire.', specific: 'L\'arnica (en usage externe), la reine-des-prés et le saule blanc sont consignés depuis longtemps pour les inconforts musculaires.' },
    en: { name: 'Muscle comfort', shortDescription: 'Soothe overworked muscles.', regulatoryClaim: 'Contributes to muscle comfort.', specific: 'Arnica (external use), meadowsweet and white willow have long been recorded for muscle discomfort.' } },
  { slug: 'recuperation-effort', icon: 'refresh-cw', category: 'joints', bodyRegion: 'circulation', severity: 'routine',
    fr: { name: 'Récupération après l\'effort', shortDescription: 'Soutenir la récupération musculaire.', regulatoryClaim: 'Contribue à la récupération après l\'effort.', specific: 'Le maca, l\'éleuthérocoque et la spiruline sont les compagnons traditionnels de la récupération sportive.' },
    en: { name: 'Post-exercise recovery', shortDescription: 'Support muscle recovery.', regulatoryClaim: 'Contributes to recovery after exercise.', specific: 'Maca, eleutherococcus and spirulina are traditional companions of sports recovery.' } },

  // ── Immunité & vitalité ──
  { slug: 'defenses-naturelles', icon: 'shield-check', category: 'immunity', bodyRegion: 'respiration', severity: 'routine',
    fr: { name: 'Soutien des défenses naturelles', shortDescription: 'Renforcer les défenses immunitaires.', regulatoryClaim: 'Contribue au fonctionnement normal du système immunitaire.', specific: 'L\'échinacée, le sureau noir et la propolis sont les plantes immunitaires les plus traditionnellement employées.' },
    en: { name: 'Natural defences support', shortDescription: 'Strengthen immune defences.', regulatoryClaim: 'Contributes to the normal function of the immune system.', specific: 'Echinacea, elderberry and propolis are the most traditionally used immune plants.' } },
  { slug: 'vitalite-generale', icon: 'zap', category: 'immunity', bodyRegion: 'tete', severity: 'routine',
    fr: { name: 'Vitalité générale', shortDescription: 'Tonus et énergie au quotidien.', regulatoryClaim: 'Contribue au maintien de la vitalité.', specific: 'Le ginseng, l\'éleuthérocoque et la rhodiole sont les adaptogènes de référence pour la vitalité générale.' },
    en: { name: 'General vitality', shortDescription: 'Daily tone and energy.', regulatoryClaim: 'Contributes to maintaining vitality.', specific: 'Ginseng, eleutherococcus and rhodiola are reference adaptogens for general vitality.' } },
  { slug: 'tonus-hivernal', icon: 'snowflake', category: 'immunity', bodyRegion: 'respiration', severity: 'routine',
    fr: { name: 'Tonus en période hivernale', shortDescription: 'Accompagner les changements de saison.', regulatoryClaim: 'Contribue au maintien de la vitalité durant l\'hiver.', specific: 'Le cynorrhodon, l\'acérola et l\'argousier sont des sources naturelles de vitamine C traditionnellement consommées en hiver.' },
    en: { name: 'Winter tone', shortDescription: 'Support seasonal changes.', regulatoryClaim: 'Contributes to maintaining vitality during winter.', specific: 'Rosehip, acerola and sea buckthorn are natural sources of vitamin C traditionally consumed in winter.' } },

  // ── Peau & phanères ──
  { slug: 'confort-cutane', icon: 'hand', category: 'skin', bodyRegion: 'feminin', severity: 'routine',
    fr: { name: 'Confort cutané', shortDescription: 'Apaiser et soutenir la peau au quotidien.', regulatoryClaim: 'Contribue à la santé normale de la peau.', specific: 'La bardane, la pensée sauvage et la pâquerette sont des plantes dépuratives cutanées traditionnelles.' },
    en: { name: 'Skin comfort', shortDescription: 'Soothe and support skin daily.', regulatoryClaim: 'Contributes to normal skin health.', specific: 'Burdock, wild pansy and daisy are traditional skin-depurative plants.' } },
  { slug: 'eclat-de-la-peau', icon: 'sparkles', category: 'skin', bodyRegion: 'feminin', severity: 'routine',
    fr: { name: 'Éclat de la peau', shortDescription: 'Préserver la beauté naturelle de la peau.', regulatoryClaim: 'Contribue au maintien d\'une peau normale.', specific: 'L\'argousier, la grenade et l\'huile d\'onagre figurent parmi les soutiens traditionnels de l\'éclat cutané.' },
    en: { name: 'Skin radiance', shortDescription: 'Preserve natural skin beauty.', regulatoryClaim: 'Contributes to the maintenance of normal skin.', specific: 'Sea buckthorn, pomegranate and evening primrose oil are among the traditional supports of skin radiance.' } },
  { slug: 'cheveux-ongles', icon: 'scissors', category: 'skin', bodyRegion: 'feminin', severity: 'routine',
    fr: { name: 'Vitalité des cheveux & ongles', shortDescription: 'Soutenir la beauté des cheveux et ongles.', regulatoryClaim: 'Contribue au maintien de cheveux et d\'ongles normaux.', specific: 'La prêle, l\'ortie et la levure de bière sont les soutiens traditionnels des phanères.' },
    en: { name: 'Hair & nail vitality', shortDescription: 'Support hair and nail beauty.', regulatoryClaim: 'Contributes to the maintenance of normal hair and nails.', specific: 'Horsetail, nettle and brewer\'s yeast are traditional supports of hair and nails.' } },

  // ── Métabolisme & équilibre ──
  { slug: 'equilibre-poids', icon: 'scale', category: 'metabolism', bodyRegion: 'digestion', severity: 'requires-monitoring',
    fr: { name: 'Équilibre du poids', shortDescription: 'Accompagner un programme minceur équilibré.', regulatoryClaim: 'Contribue au maintien d\'un poids normal dans le cadre d\'un régime hypocalorique.', specific: 'Le konjac, le thé vert et le guarana figurent parmi les plantes traditionnellement associées à un programme minceur.' },
    en: { name: 'Weight balance', shortDescription: 'Support a balanced slimming programme.', regulatoryClaim: 'Contributes to weight maintenance within a calorie-restricted diet.', specific: 'Konjac, green tea and guarana are among the plants traditionally associated with a slimming programme.' } },
  { slug: 'confort-glycemique', icon: 'leaf', category: 'metabolism', bodyRegion: 'digestion', severity: 'requires-monitoring',
    fr: { name: 'Confort glycémique', shortDescription: 'Soutenir l\'équilibre des sucres sanguins.', regulatoryClaim: 'Contribue au maintien d\'une glycémie normale.', specific: 'La cannelle, le fenugrec et le gymnema sont étudiés pour leur action sur le métabolisme glucidique.' },
    en: { name: 'Glycemic comfort', shortDescription: 'Support blood sugar balance.', regulatoryClaim: 'Contributes to maintaining normal blood glucose.', specific: 'Cinnamon, fenugreek and gymnema are studied for their action on carbohydrate metabolism.' } },
  { slug: 'drainage', icon: 'droplets', category: 'metabolism', bodyRegion: 'digestion', severity: 'routine',
    fr: { name: 'Drainage & élimination', shortDescription: 'Soutenir les fonctions d\'élimination.', regulatoryClaim: 'Contribue aux fonctions d\'élimination de l\'organisme.', specific: 'Le pissenlit, l\'orthosiphon et le bouleau sont les diurétiques végétaux traditionnels de la pharmacopée européenne.' },
    en: { name: 'Drainage & elimination', shortDescription: 'Support elimination functions.', regulatoryClaim: 'Contributes to the body\'s elimination functions.', specific: 'Dandelion, orthosiphon and birch are traditional plant diuretics of the European pharmacopoeia.' } },
  { slug: 'confort-urinaire', icon: 'droplet', category: 'metabolism', bodyRegion: 'digestion', severity: 'transient',
    fr: { name: 'Confort urinaire', shortDescription: 'Préserver le confort des voies urinaires.', regulatoryClaim: 'Contribue au confort des voies urinaires.', specific: 'La canneberge, la busserole et le bouleau sont les plantes urinaires les plus traditionnellement consignées.' },
    en: { name: 'Urinary comfort', shortDescription: 'Preserve urinary tract comfort.', regulatoryClaim: 'Contributes to urinary tract comfort.', specific: 'Cranberry, bearberry and birch are the most traditionally recorded urinary plants.' } },
]

/* ─── Builder ─────────────────────────────────────────────────────── */

function buildDescription(item: Item, lang: Lang) {
  const intro = CATEGORY_INTRO[item.category][lang]
  const specific = item[lang].specific
  const close = lang === 'fr'
    ? `Dans la tradition des Remèdes de Mamie, cet usage s'inscrit dans une approche globale de la santé : plantes rigoureusement sourcées, transformées en France et accompagnées de conseils respectueux des rythmes naturels du corps.`
    : `In the Remèdes de Mamie tradition, this use is part of a holistic approach to health: rigorously sourced plants, processed in France and accompanied by advice that respects the body's natural rhythms.`
  return richText([intro, specific, close])
}

function buildPrecautions(item: Item, lang: Lang) {
  return richText(PRECAUTIONS_BY_SEVERITY[item.severity][lang])
}

function buildRedFlags(item: Item, lang: Lang) {
  return RED_FLAGS[item.category][lang].join('\n')
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
      message: 'Add ?confirm=yes to seed. Add &reset=yes to wipe existing benefits first.',
      total: ITEMS.length,
    })
  }

  const payload = await getPayload({ config: configPromise })
  const shouldReset = req.nextUrl.searchParams.get('reset') === 'yes'
  const created: string[] = []
  const skipped: string[] = []
  const failed: Array<{ slug: string; error: string }> = []
  let purged = 0

  if (shouldReset) {
    try {
      const drizzle = (payload.db as any)?.drizzle
      if (!drizzle) throw new Error('drizzle adapter not available')
      // Truncate every benefits-related table (main, locales, rels, arrays, versions).
      // CASCADE handles foreign keys from products/blogPosts back to benefits.
      const result = await drizzle.execute(
        `DO $$
         DECLARE r RECORD;
         BEGIN
           FOR r IN
             SELECT tablename FROM pg_tables
             WHERE schemaname='public'
               AND (tablename = 'benefits'
                 OR tablename LIKE 'benefits\\_%' ESCAPE '\\'
                 OR tablename = '_benefits_v'
                 OR tablename LIKE '_benefits_v_%')
           LOOP
             EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
           END LOOP;
         END$$;`,
      )
      purged = (result as any)?.rowCount ?? 1
    } catch (err: any) {
      failed.push({ slug: '<bulk-purge>', error: 'truncate: ' + (err?.message || String(err)) })
    }
  }

  for (let idx = 0; idx < ITEMS.length; idx++) {
    const item = ITEMS[idx]
    const referenceNumber = `B-${String(idx + 1).padStart(3, '0')}`
    try {
      const existing = await payload.find({
        collection: 'benefits',
        where: { slug: { equals: item.slug } },
        limit: 1,
        overrideAccess: true,
        draft: true,
      } as any)
      if (existing.docs.length > 0) {
        skipped.push(item.slug)
        continue
      }

      const seedReq = {
        context: {
          skipCompliance: true,
          skipComplianceReason: 'seed-benefits initial referential',
          skipModeration: true,
        },
      } as any

      const doc = await payload.create({
        collection: 'benefits',
        data: {
          slug: item.slug,
          referenceNumber,
          icon: item.icon,
          category: item.category,
          bodyRegion: item.bodyRegion,
          severity: item.severity,
          status: 'published',
          complianceStatus: 'approved',
          name: item.fr.name,
          shortDescription: item.fr.shortDescription,
          regulatoryClaim: item.fr.regulatoryClaim,
          description: buildDescription(item, 'fr'),
          precautions: buildPrecautions(item, 'fr'),
          redFlags: buildRedFlags(item, 'fr'),
          _status: 'published',
        } as any,
        locale: 'fr',
        overrideAccess: true,
        req: seedReq,
      } as any)

      if (!doc?.id) {
        throw new Error('payload.create returned no id')
      }

      await payload.update({
        collection: 'benefits',
        id: doc.id,
        data: {
          name: item.en.name,
          shortDescription: item.en.shortDescription,
          regulatoryClaim: item.en.regulatoryClaim,
          description: buildDescription(item, 'en'),
          precautions: buildPrecautions(item, 'en'),
          redFlags: buildRedFlags(item, 'en'),
        } as any,
        locale: 'en',
        overrideAccess: true,
        req: seedReq,
      } as any)

      created.push(`${(doc as any).referenceNumber || '?'} ${item.slug}`)
    } catch (err: any) {
      failed.push({ slug: item.slug, error: err?.message || String(err) })
    }
  }

  return NextResponse.json({
    total: ITEMS.length,
    purged,
    created: created.length,
    skipped: skipped.length,
    failed: failed.length,
    details: { created, skipped, failed },
  })
}
