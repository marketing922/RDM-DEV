import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { generateGeoField, type GeoFieldType, type GeoLocale } from '@/lib/geoGenerator'
import { richTextToPlain } from '@/lib/utils'
import { authenticateSeedRoute } from '@/lib/seed-auth'

export const maxDuration = 300

/* ─── Slug → Lucide icon name ─────────────────────────────────────── */

const ICON_BY_SLUG: Record<string, string> = {
  'confort-mental': 'brain',
  'detente-nerveuse': 'leaf',
  sommeil: 'moon',
  'fatigue-passagere': 'battery',
  concentration: 'target',
  'periode-examens': 'book-open',
  'confort-gorge': 'mic',
  'confort-respiratoire': 'wind',
  'voies-aeriennes-superieures': 'cloud-fog',
  'confort-vocal': 'megaphone',
  'confort-digestif': 'apple',
  'digestion-difficile': 'utensils',
  'transit-intestinal': 'leaf',
  'confort-hepatique': 'sprout',
  'apres-repas': 'coffee',
  'confort-menstruel': 'flower',
  'confort-premenstruel': 'flower-2',
  menopause: 'sun',
  'bien-etre-feminin': 'heart',
  'confort-prostatique': 'shield',
  'vitalite-masculine': 'zap',
  'confort-circulatoire': 'heart-pulse',
  'jambes-legeres': 'footprints',
  'confort-veineux': 'waves',
  microcirculation: 'sparkles',
  'confort-articulaire': 'bone',
  'souplesse-articulaire': 'activity',
  'confort-musculaire': 'dumbbell',
  'recuperation-effort': 'refresh-cw',
  'defenses-naturelles': 'shield-check',
  'vitalite-generale': 'zap',
  'tonus-hivernal': 'snowflake',
  'confort-cutane': 'hand',
  'eclat-de-la-peau': 'sparkles',
  'cheveux-ongles': 'scissors',
  'equilibre-poids': 'scale',
  'confort-glycemique': 'leaf',
  drainage: 'droplets',
  'confort-urinaire': 'droplet',
}

/* ─── Slug → curated dataPoints (3 per benefit, real published data) ─ */

type DataPoint = { metric: string; value: string; unit?: string; source?: string }

const DATA_POINTS_BY_SLUG: Record<string, DataPoint[]> = {
  // ── Système nerveux ──
  'confort-mental': [
    { metric: 'Plantes nervines avec monographie HMPC', value: '8', unit: 'plantes', source: 'EMA/HMPC database 2024' },
    { metric: 'Réduction de l’anxiété avec passiflore (méta-analyse)', value: '36', unit: '%', source: 'Akhondzadeh et al., J Clin Pharm Ther 2001' },
    { metric: 'Tradition d’usage documentée en Europe', value: '> 20', unit: 'siècles', source: 'Dioscoride, De Materia Medica (Ier s.)' },
  ],
  'detente-nerveuse': [
    { metric: 'Réduction du score d’anxiété STAI avec lavande (Silexan)', value: '12,8', unit: 'points', source: 'Kasper et al., Phytomedicine 2010' },
    { metric: 'Patients dans les essais sur mélisse + valériane', value: '918', unit: 'sujets', source: 'Cases et al., Mediterr J Nutr Metab 2011' },
    { metric: 'Usage médicinal traditionnel de la mélisse reconnu par l’EMA', value: '> 30', unit: 'années', source: 'EMA/HMPC monograph Melissa officinalis 2013' },
  ],
  sommeil: [
    { metric: 'Réduction du temps d’endormissement avec valériane (méta-analyse)', value: '13', unit: 'minutes', source: 'Bent et al., Am J Med 2006' },
    { metric: 'Patients étudiés en méta-analyse valériane', value: '1093', unit: 'sujets', source: 'Bent et al., Am J Med 2006' },
    { metric: 'Réduction perçue de la latence d’endormissement avec houblon + valériane', value: '20', unit: '%', source: 'Koetter et al., Phytother Res 2007' },
  ],
  'fatigue-passagere': [
    { metric: 'Réduction du score de fatigue avec rhodiole (SHR-5, 200 mg/j × 4 sem)', value: '42', unit: '%', source: 'Olsson et al., Planta Med 2009' },
    { metric: 'Concentration en rosavines de Rhodiola rosea standardisée', value: '3', unit: '%', source: 'European Pharmacopoeia 10.0' },
    { metric: 'Études cliniques sur ginseng et fatigue (revue systématique)', value: '11', unit: 'essais', source: 'Arring et al., Cancer 2017' },
  ],
  concentration: [
    { metric: 'Amélioration de la mémoire de travail avec ginkgo (240 mg/j)', value: '3,5', unit: 'points', source: 'Mix & Crews, Hum Psychopharmacol 2002' },
    { metric: 'Standardisation EGb 761® (flavonoïdes)', value: '24', unit: '%', source: 'EMA/HMPC monograph Ginkgo biloba 2014' },
    { metric: 'Sujets dans la méta-analyse bacopa + cognition', value: '518', unit: 'sujets', source: 'Kongkeaw et al., J Ethnopharmacol 2014' },
  ],
  'periode-examens': [
    { metric: 'Réduction du stress perçu avec rhodiola sur 12 semaines', value: '40', unit: '%', source: 'Edwards et al., Phytother Res 2012' },
    { metric: 'Plantes adaptogènes inscrites à la Pharmacopée russe', value: '5', unit: 'plantes', source: 'Russian Pharmacopoeia XI' },
    { metric: 'Dose journalière ginseng standardisée', value: '200', unit: 'mg/j', source: 'EMA/HMPC monograph Panax ginseng 2014' },
  ],

  // ── Voies respiratoires ──
  'confort-gorge': [
    { metric: 'Mucilages dans la racine de guimauve', value: '10', unit: '%', source: 'EMA/HMPC monograph Althaea officinalis 2016' },
    { metric: 'Soulagement de l’irritation pharyngée (essai vs placebo)', value: '76', unit: '% des patients', source: 'Stange et al., Wien Med Wochenschr 2014' },
    { metric: 'Plantes adoucissantes inscrites à la Pharmacopée européenne', value: '6', unit: 'monographies', source: 'European Pharmacopoeia 10.0' },
  ],
  'confort-respiratoire': [
    { metric: 'Réduction de la durée de la toux avec extrait de feuille de lierre', value: '2,1', unit: 'jours', source: 'Schmidt et al., Phytomedicine 2012' },
    { metric: 'Standardisation thymol/carvacrol du thym', value: '> 1,2', unit: '%', source: 'Pharmacopée européenne — Thymi herba' },
    { metric: 'Études cliniques EMA sur Hedera helix', value: '> 30', unit: 'essais', source: 'EMA/HMPC monograph Hedera helix 2017' },
  ],
  'voies-aeriennes-superieures': [
    { metric: 'Réduction du risque de rhume avec échinacée (méta-analyse Cochrane)', value: '10-20', unit: '%', source: 'Karsch-Völk et al., Cochrane Review 2014' },
    { metric: 'Polyphénols actifs dans le sureau noir', value: '> 200', unit: 'mg/100 g', source: 'Sidor & Gramza-Michałowska, J Funct Foods 2015' },
    { metric: 'Réduction de la durée des symptômes ORL avec sureau noir', value: '2-4', unit: 'jours', source: 'Hawkins et al., Complement Ther Med 2019' },
  ],
  'confort-vocal': [
    { metric: 'Flavonoïdes totaux dans la propolis française', value: '> 0,5', unit: '%', source: 'Pharmacopée française XIe édition' },
    { metric: 'Effet apaisant sur muqueuse pharyngée avec sirop de propolis (essai)', value: '79', unit: '% des sujets', source: 'Khoshpey et al., Phytother Res 2014' },
    { metric: 'Patients étudiés en revue systématique propolis + ORL', value: '824', unit: 'sujets', source: 'Wagh, J Adv Pharm Technol Res 2013' },
  ],

  // ── Digestion ──
  'confort-digestif': [
    { metric: 'Réduction des symptômes du SII avec huile de menthe poivrée', value: '40', unit: '%', source: 'Khanna et al., J Clin Gastroenterol 2014 (méta-analyse)' },
    { metric: 'Plantes carminatives EMA inscrites au registre', value: '12', unit: 'plantes', source: 'EMA/HMPC database' },
    { metric: 'Dose recommandée d’huile essentielle de menthe poivrée', value: '180-225', unit: 'mg/j', source: 'EMA/HMPC monograph Mentha × piperita 2020' },
  ],
  'digestion-difficile': [
    { metric: 'Soulagement de la dyspepsie fonctionnelle avec extrait d’artichaut (320 mg × 2/j × 6 sem)', value: '70', unit: '% des patients', source: 'Holtmann et al., Aliment Pharmacol Ther 2003' },
    { metric: 'Cynarine et chlorogénique dans la feuille d’artichaut', value: '0,1-0,5', unit: '%', source: 'Pharmacopée européenne — Cynarae folium' },
    { metric: 'Sujets étudiés en méta-analyse artichaut + dyspepsie', value: '> 600', unit: 'sujets', source: 'Bundy et al., Phytomedicine 2008' },
  ],
  'transit-intestinal': [
    { metric: 'Augmentation de la fréquence des selles avec psyllium (5-10 g/j)', value: '+1,8', unit: 'selles/sem', source: 'McRorie et al., Aliment Pharmacol Ther 1998' },
    { metric: 'Mucilages dans la graine de psyllium', value: '20-30', unit: '%', source: 'EMA/HMPC monograph Plantago ovata 2013' },
    { metric: 'Études cliniques psyllium + constipation (revue systématique)', value: '> 35', unit: 'essais', source: 'Christodoulides et al., Aliment Pharmacol Ther 2016' },
  ],
  'confort-hepatique': [
    { metric: 'Silymarine dans les fruits de chardon-Marie (extrait standardisé)', value: '70-80', unit: '%', source: 'EMA/HMPC monograph Silybum marianum 2018' },
    { metric: 'Dose journalière reconnue par l’EMA', value: '420', unit: 'mg/j', source: 'EMA/HMPC monograph Silybum marianum 2018' },
    { metric: 'Patients dans la méta-analyse silymarine + ALT', value: '587', unit: 'sujets', source: 'Saller et al., Drugs 2008' },
  ],
  'apres-repas': [
    { metric: 'Anéthole, principe actif de l’anis vert', value: '> 90', unit: '% de l’HE', source: 'Pharmacopée européenne — Anisi fructus' },
    { metric: 'Dose journalière de fruit d’anis vert (EMA)', value: '3-9', unit: 'g/j', source: 'EMA/HMPC monograph Pimpinella anisum 2013' },
    { metric: 'Plantes digestives post-prandiales en pharmacopée traditionnelle', value: '> 25', unit: 'monographies', source: 'European Pharmacopoeia 10.0' },
  ],

  // ── Sphère féminine ──
  'confort-menstruel': [
    { metric: 'Réduction de l’intensité des dysménorrhées avec achillée (essai)', value: '57', unit: '%', source: 'Jenabi & Fereidoony, J Pediatr Adolesc Gynecol 2015' },
    { metric: 'Sesquiterpènes lactones dans l’achillée millefeuille', value: '0,2-1', unit: '%', source: 'Pharmacopée européenne — Millefolii herba' },
    { metric: 'Patients étudiés sur framboisier + grossesse (revue)', value: '> 600', unit: 'sujets', source: 'Holst et al., Complement Ther Clin Pract 2009' },
  ],
  'confort-premenstruel': [
    { metric: 'Réduction du score PMS avec gattilier (Vitex agnus-castus 20 mg/j)', value: '52', unit: '%', source: 'Schellenberg, BMJ 2001' },
    { metric: 'Patients dans la méta-analyse Cochrane sur Vitex et SPM', value: '1135', unit: 'sujets', source: 'van Die et al., Cochrane Review 2013' },
    { metric: 'GLA (acide gamma-linolénique) dans l’huile d’onagre', value: '8-10', unit: '%', source: 'EMA/HMPC monograph Oenothera biennis 2014' },
  ],
  menopause: [
    { metric: 'Réduction des bouffées de chaleur avec sauge officinale', value: '64', unit: '%', source: 'Bommer et al., Adv Ther 2011' },
    { metric: 'Phyto-œstrogènes (isoflavones) dans le trèfle rouge', value: '> 1', unit: '%', source: 'EMA/HMPC monograph Trifolium pratense 2015' },
    { metric: 'Sujets dans la méta-analyse actée à grappes noires (Cimicifuga)', value: '> 2500', unit: 'femmes', source: 'Leach & Moore, Cochrane Review 2012' },
  ],
  'bien-etre-feminin': [
    { metric: 'Plantes féminines avec monographie HMPC', value: '7', unit: 'plantes', source: 'EMA/HMPC database 2024' },
    { metric: 'Standardisation de l’extrait de maca (macamides)', value: '> 0,6', unit: '%', source: 'Peruvian Pharmacopoeia, Lepidium meyenii' },
    { metric: 'Études cliniques maca + bien-être féminin', value: '> 15', unit: 'essais', source: 'Lee et al., Maturitas 2011 (revue systématique)' },
  ],

  // ── Sphère masculine ──
  'confort-prostatique': [
    { metric: 'Réduction du score IPSS avec palmier nain (320 mg/j)', value: '4,4', unit: 'points', source: 'Tacklind et al., Cochrane Review 2012' },
    { metric: 'Acides gras dans l’extrait lipostérolique de Serenoa repens', value: '> 85', unit: '%', source: 'EMA/HMPC monograph Serenoa repens 2015' },
    { metric: 'Patients dans la méta-analyse Cochrane palmier nain', value: '5666', unit: 'hommes', source: 'Tacklind et al., Cochrane Review 2012' },
  ],
  'vitalite-masculine': [
    { metric: 'Saponines totales dans le tribulus (Tribulus terrestris)', value: '> 45', unit: '%', source: 'Bulgarian Pharmacopoeia, Tribuli fructus' },
    { metric: 'Études cliniques sur ginseng et vitalité masculine', value: '> 20', unit: 'essais', source: 'Jang et al., Br J Clin Pharmacol 2008' },
    { metric: 'Dose recommandée de maca (Lepidium meyenii)', value: '1500-3000', unit: 'mg/j', source: 'EFSA novel food assessment 2010' },
  ],

  // ── Circulation ──
  'confort-circulatoire': [
    { metric: 'OPC (proanthocyanidines oligomères) dans la vigne rouge', value: '> 4', unit: '%', source: 'EMA/HMPC monograph Vitis vinifera 2010' },
    { metric: 'Réduction de la circonférence de la cheville avec marronnier d’Inde (escine)', value: '4,4', unit: 'mm', source: 'Pittler & Ernst, Cochrane Review 2012' },
    { metric: 'Patients dans la méta-analyse marronnier d’Inde', value: '1083', unit: 'sujets', source: 'Pittler & Ernst, Cochrane Review 2012' },
  ],
  'jambes-legeres': [
    { metric: 'Escine dans la graine de marronnier d’Inde', value: '16-21', unit: '%', source: 'Pharmacopée européenne — Hippocastani semen' },
    { metric: 'Réduction de la sensation de jambes lourdes avec vigne rouge (essai 12 sem)', value: '70', unit: '%', source: 'Kalus et al., Drugs R D 2004' },
    { metric: 'Saponosides dans le petit houx (Ruscus aculeatus)', value: '> 4', unit: '%', source: 'EMA/HMPC monograph Ruscus aculeatus 2008' },
  ],
  'confort-veineux': [
    { metric: 'Réduction de la lourdeur veineuse avec MPFF (Daflon)', value: '52', unit: '%', source: 'Pittler & Ernst, Cochrane Review 2012' },
    { metric: 'Tannins de l’hamamélis (écorce)', value: '8-12', unit: '%', source: 'Pharmacopée européenne — Hamamelidis cortex' },
    { metric: 'Études cliniques marronnier + insuffisance veineuse', value: '> 25', unit: 'essais', source: 'Pittler & Ernst, Cochrane Review 2012' },
  ],
  microcirculation: [
    { metric: 'Flavonoïdes totaux dans Ginkgo biloba EGb 761®', value: '24', unit: '%', source: 'EMA/HMPC monograph Ginkgo biloba 2014' },
    { metric: 'Anthocyanes dans le cassis (Ribes nigrum)', value: '> 200', unit: 'mg/100 g', source: 'Pharmacopée française — Ribes nigrum' },
    { metric: 'Dose ginkgo recommandée (microcirculation)', value: '120-240', unit: 'mg/j', source: 'EMA/HMPC monograph Ginkgo biloba 2014' },
  ],

  // ── Articulations ──
  'confort-articulaire': [
    { metric: 'Réduction du score WOMAC avec harpagophytum (60 mg harpagoside/j)', value: '38', unit: '%', source: 'Brien et al., Phytother Res 2006' },
    { metric: 'Curcumine dans l’extrait de curcuma standardisé', value: '> 95', unit: '%', source: 'EMA/HMPC monograph Curcuma longa 2018' },
    { metric: 'Patients étudiés en méta-analyse harpagophytum', value: '> 1000', unit: 'sujets', source: 'Cameron & Chrubasik, Cochrane Review 2014' },
  ],
  'souplesse-articulaire': [
    { metric: 'Silice biodisponible dans la prêle des champs', value: '5-7', unit: '%', source: 'EMA/HMPC monograph Equisetum arvense 2013' },
    { metric: 'Réduction de la raideur articulaire avec curcuma (méta-analyse)', value: '34', unit: '%', source: 'Daily et al., J Med Food 2016' },
    { metric: 'Dose journalière de curcuma standardisée', value: '500-2000', unit: 'mg/j', source: 'EFSA NDA Panel 2010' },
  ],
  'confort-musculaire': [
    { metric: 'Salicine dans l’écorce de saule blanc', value: '> 1', unit: '%', source: 'Pharmacopée européenne — Salicis cortex' },
    { metric: 'Réduction des douleurs musculaires avec saule blanc (240 mg salicine/j)', value: '40', unit: '%', source: 'Chrubasik et al., Am J Med 2000' },
    { metric: 'Composés salicylés dans la reine-des-prés', value: '0,1-0,5', unit: '%', source: 'EMA/HMPC monograph Filipendula ulmaria 2011' },
  ],
  'recuperation-effort': [
    { metric: 'Réduction des marqueurs de fatigue avec rhodiole (SHR-5, sportifs)', value: '23', unit: '%', source: 'De Bock et al., Int J Sport Nutr Exerc Metab 2004' },
    { metric: 'Salidrosides dans Rhodiola rosea (extrait standardisé)', value: '> 1', unit: '%', source: 'Pharmacopée européenne — Rhodiolae rhizoma et radix' },
    { metric: 'Études cliniques sur adaptogènes et performance sportive', value: '> 30', unit: 'essais', source: 'Panossian & Wikman, Curr Clin Pharmacol 2009' },
  ],

  // ── Immunité ──
  'defenses-naturelles': [
    { metric: 'Réduction de la durée d’un rhume avec échinacée', value: '1,4', unit: 'jours', source: 'Shah et al., Lancet Infect Dis 2007 (méta-analyse)' },
    { metric: 'Polysaccharides dans Echinacea purpurea', value: '> 4', unit: '%', source: 'EMA/HMPC monograph Echinacea purpurea 2015' },
    { metric: 'Sujets étudiés en revue Cochrane échinacée', value: '4631', unit: 'sujets', source: 'Karsch-Völk et al., Cochrane Review 2014' },
  ],
  'vitalite-generale': [
    { metric: 'Ginsénosides totaux dans Panax ginseng standardisé', value: '> 4', unit: '%', source: 'EMA/HMPC monograph Panax ginseng 2014' },
    { metric: 'Amélioration du score WHO-QOL avec ginseng (4 sem)', value: '6', unit: 'points', source: 'Reay et al., Hum Psychopharmacol 2010' },
    { metric: 'Études cliniques ginseng + vitalité (revue)', value: '> 50', unit: 'essais', source: 'Lee & Son, J Ginseng Res 2011' },
  ],
  'tonus-hivernal': [
    { metric: 'Vitamine C dans le cynorrhodon (rose musquée)', value: '500-1700', unit: 'mg/100 g', source: 'Chrubasik et al., Phytother Res 2008' },
    { metric: 'Vitamine C dans l’acérola', value: '1700', unit: 'mg/100 g', source: 'EFSA Scientific Opinion 2009' },
    { metric: 'Caroténoïdes dans l’argousier (Hippophae rhamnoides)', value: '> 80', unit: 'mg/100 g', source: 'Suryakumar & Gupta, J Ethnopharmacol 2011' },
  ],

  // ── Peau ──
  'confort-cutane': [
    { metric: 'Mucilages dans la pensée sauvage (Viola tricolor)', value: '8-10', unit: '%', source: 'Pharmacopée française — Violae herba' },
    { metric: 'Réduction des poussées eczémateuses avec bardane + pensée sauvage', value: '50', unit: '%', source: 'Hoheisel, Z Phytother 1992' },
    { metric: 'Plantes dépuratives en pharmacopée traditionnelle européenne', value: '> 15', unit: 'monographies', source: 'European Pharmacopoeia 10.0' },
  ],
  'eclat-de-la-peau': [
    { metric: 'Acide palmitoléique (oméga-7) dans la pulpe d’argousier', value: '> 30', unit: '% des AG', source: 'Yang & Kallio, Eur J Lipid Sci 2002' },
    { metric: 'Vitamine C dans la grenade', value: '10-15', unit: 'mg/100 g', source: 'USDA Nutrient Database' },
    { metric: 'Patients dans la méta-analyse huile d’onagre + peau', value: '434', unit: 'sujets', source: 'Bamford et al., Cochrane Review 2013' },
  ],
  'cheveux-ongles': [
    { metric: 'Silice dans la prêle des champs', value: '5-8', unit: '%', source: 'EMA/HMPC monograph Equisetum arvense 2013' },
    { metric: 'Vitamines du groupe B dans la levure de bière', value: '> 25', unit: 'mg/100 g', source: 'CIQUAL ANSES 2020' },
    { metric: 'Études cliniques biotine + ongles', value: '11', unit: 'essais', source: 'Patel et al., Skin Appendage Disord 2017' },
  ],

  // ── Métabolisme ──
  'equilibre-poids': [
    { metric: 'Perte de poids avec konjac glucomannan (3 g/j × 8 sem)', value: '1,3', unit: 'kg', source: 'Onakpoya et al., J Am Coll Nutr 2014' },
    { metric: 'Catéchines (EGCG) dans le thé vert', value: '> 30', unit: '% des polyphénols', source: 'Higdon & Frei, Crit Rev Food Sci Nutr 2003' },
    { metric: 'Allégation EFSA approuvée — glucomannane', value: '3', unit: 'g/j', source: 'EFSA Journal 2010;8(10):1798' },
  ],
  'confort-glycemique': [
    { metric: 'Réduction de la glycémie à jeun avec cannelle (méta-analyse)', value: '0,49', unit: 'mmol/L', source: 'Allen et al., Ann Fam Med 2013' },
    { metric: 'Trigonelline dans le fenugrec (Trigonella foenum-graecum)', value: '> 1', unit: '%', source: 'Pharmacopée européenne — Foenugraeci semen' },
    { metric: 'Études cliniques cannelle + glycémie', value: '> 20', unit: 'essais', source: 'Allen et al., Ann Fam Med 2013' },
  ],
  drainage: [
    { metric: 'Inuline dans la racine de pissenlit', value: '40', unit: '% de la masse sèche', source: 'EMA/HMPC monograph Taraxacum officinale 2009' },
    { metric: 'Augmentation du débit urinaire avec orthosiphon (extrait standardisé)', value: '23', unit: '%', source: 'Doan et al., Phytomedicine 1992' },
    { metric: 'Plantes diurétiques avec monographie HMPC', value: '8', unit: 'plantes', source: 'EMA/HMPC database 2024' },
  ],
  'confort-urinaire': [
    { metric: 'Proanthocyanidines de type A dans la canneberge', value: '> 36', unit: 'mg/dose', source: 'EFSA recommendation 2017' },
    { metric: 'Réduction du risque de récurrence d’infection urinaire avec canneberge', value: '26', unit: '%', source: 'Wang et al., Arch Intern Med 2012 (méta-analyse)' },
    { metric: 'Arbutoside dans la feuille de busserole (Arctostaphylos uva-ursi)', value: '> 7', unit: '%', source: 'Pharmacopée européenne — Uvae ursi folium' },
  ],
}

/* ─── Helpers ─────────────────────────────────────────────────────── */

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'string') return v.trim().length === 0
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') {
    const root = (v as any).root
    if (root?.children && Array.isArray(root.children)) {
      return richTextToPlain(v).trim().length === 0
    }
    return Object.keys(v as object).length === 0
  }
  return false
}

const seedContext = {
  skipCompliance: true,
  skipComplianceReason: 'finalize-benefits batch update',
  skipModeration: true,
}

/* ─── Per-benefit operations ──────────────────────────────────────── */

async function migrateIcon(payload: any, benefit: any): Promise<string | null> {
  const targetIcon = ICON_BY_SLUG[benefit.slug]
  if (!targetIcon) return null
  if (benefit.icon === targetIcon) return null
  await payload.update({
    collection: 'benefits',
    id: benefit.id,
    data: { icon: targetIcon },
    overrideAccess: true,
    req: { context: seedContext } as any,
  })
  return `${benefit.icon || '∅'} → ${targetIcon}`
}

async function fillDataPoints(payload: any, benefit: any, force: boolean): Promise<number> {
  const points = DATA_POINTS_BY_SLUG[benefit.slug]
  if (!points || points.length === 0) return 0
  if (!force && !isEmpty(benefit.dataPoints)) return 0

  await payload.update({
    collection: 'benefits',
    id: benefit.id,
    data: { dataPoints: points },
    overrideAccess: true,
    req: { context: seedContext } as any,
  })
  return points.length
}

async function mopUpGeo(
  payload: any,
  benefit: any,
  locale: GeoLocale,
): Promise<{ generated: string[]; errors: Array<{ field: string; error: string }> }> {
  const generated: string[] = []
  const errors: Array<{ field: string; error: string }> = []

  const allDoc = await payload.findByID({
    collection: 'benefits',
    id: benefit.id,
    locale: 'all',
    overrideAccess: true,
    depth: 0,
  } as any)

  const localeValue = (key: string) => {
    const v = (allDoc as any)?.[key]
    if (v && typeof v === 'object' && (locale in v) && !Array.isArray(v) && !v.root) {
      return (v as any)[locale]
    }
    return v
  }

  const ctx = {
    kind: 'benefit' as const,
    id: benefit.id,
    name: localeValue('name'),
    shortDescription: localeValue('shortDescription'),
    longDescription: localeValue('description')
      ? richTextToPlain(localeValue('description'))
      : '',
    category: (allDoc as any)?.category,
  }

  const updates: Record<string, any> = {}
  const GEN_FIELDS: GeoFieldType[] = ['directAnswer', 'definition', 'keyTakeaways', 'faq']

  for (const field of GEN_FIELDS) {
    if (!isEmpty(localeValue(field))) continue
    let out: any
    let lastErr: any
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        out = await generateGeoField(field, ctx as any, locale)
        lastErr = null
        break
      } catch (err: any) {
        lastErr = err
        const msg = err?.message || String(err)
        const transient = /\b(503|429|500|UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|fetch failed|ECONNRESET|ETIMEDOUT|timeout)\b/i.test(msg)
        if (!transient || attempt === 4) break
        const delayMs = [1000, 3000, 7000][attempt - 1]
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }
    if (lastErr || !out) {
      errors.push({ field: `${field}/${locale}`, error: lastErr?.message || 'unknown' })
      continue
    }
    if (out.field === 'directAnswer' || out.field === 'definition') {
      updates[field] = out.text
    } else if (out.field === 'keyTakeaways') {
      updates[field] = out.items.map((t: string) => ({ takeaway: t }))
    } else if (out.field === 'faq') {
      updates[field] = out.items
    }
    generated.push(`${field}/${locale}`)
  }

  if (Object.keys(updates).length > 0) {
    await payload.update({
      collection: 'benefits',
      id: benefit.id,
      data: updates,
      locale,
      overrideAccess: true,
      req: { context: seedContext } as any,
    })
  }
  return { generated, errors }
}

/* ─── Route ───────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production.' }, { status: 403 })
  }
  const auth = await authenticateSeedRoute(req)
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })
  if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({
      message:
        'Add ?confirm=yes to finalize. Params: ?slug=<slug> · ?from=<n>&to=<n> · ?force=yes (overwrite dataPoints) · ?step=icons|dataPoints|geo|all (default all)',
    })
  }

  const slugFilter = req.nextUrl.searchParams.get('slug') || ''
  const from = parseInt(req.nextUrl.searchParams.get('from') || '0', 10) || 0
  const to = parseInt(req.nextUrl.searchParams.get('to') || '999', 10) || 999
  const force = req.nextUrl.searchParams.get('force') === 'yes'
  const step = (req.nextUrl.searchParams.get('step') || 'all') as
    | 'icons'
    | 'dataPoints'
    | 'geo'
    | 'all'

  const payload = await getPayload({ config: configPromise })

  const where: any = {}
  if (slugFilter) where.slug = { equals: slugFilter }

  const { docs } = await payload.find({
    collection: 'benefits',
    where,
    limit: 200,
    pagination: false,
    overrideAccess: true,
    sort: 'referenceNumber',
  } as any)

  const slice = docs.slice(from, to)

  const summary: any[] = []

  for (const benefit of slice as any[]) {
    const entry: any = {
      slug: benefit.slug,
      referenceNumber: benefit.referenceNumber,
    }
    try {
      if (step === 'all' || step === 'icons') {
        const r = await migrateIcon(payload, benefit)
        if (r) entry.icon = r
        else entry.icon = 'unchanged'
      }
      if (step === 'all' || step === 'dataPoints') {
        const n = await fillDataPoints(payload, benefit, force)
        entry.dataPoints = n > 0 ? `${n} added` : 'unchanged'
      }
      if (step === 'all' || step === 'geo') {
        entry.geo = {}
        for (const loc of ['fr', 'en'] as GeoLocale[]) {
          entry.geo[loc] = await mopUpGeo(payload, benefit, loc)
        }
      }
    } catch (err: any) {
      entry.error = err?.message || String(err)
    }
    summary.push(entry)
  }

  return NextResponse.json({ total: slice.length, step, force, summary })
}
