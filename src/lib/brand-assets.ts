/**
 * Brand asset URLs (Cloudinary) — single source of truth.
 * Mirrors design-system/02-brand-assets.md
 */

const CLOUDINARY = 'https://res.cloudinary.com/laboratoire-calebasse/image/upload'

export const BRAND = {
  logo: `${CLOUDINARY}/v1761315097/RM_logo_2297718b45.png`,
  heroIllustration: `${CLOUDINARY}/v1761315098/RM_9133bc1749.png`,
  defaultPlant: `${CLOUDINARY}/v1761295312/Chat_GPT_Image_Oct_24_2025_10_38_36_AM_1_a78649daf4.png`,
  timeline: `${CLOUDINARY}/v1759908829/timeline_9ddc59cec1.jpg`,
  icons: {
    natural: `${CLOUDINARY}/v1761638875/100_naturel_et_pur_a729474982.png`,
    madeInFrance: `${CLOUDINARY}/v1761638875/fabrique_en_France_c8918f0126.png`,
    ancestral: `${CLOUDINARY}/v1761638874/savoir_faire_ancestral_b831db15f3.png`,
  },
  certifications: {
    bio: `${CLOUDINARY}/v1759917732/bio_1_Photoroom_83979e4d37.png`,
    pharmacopee: `${CLOUDINARY}/v1759917732/pharmacopee_1_Photoroom_f8d2c169cf.png`,
    vegan: `${CLOUDINARY}/v1759917732/vegan_1_Photoroom_5c36156877.png`,
    sansMetauxLourds: `${CLOUDINARY}/v1759917732/metaux_lourds_1_Photoroom_6dd6ec51b6.png`,
  },
} as const
