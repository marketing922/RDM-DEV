import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublishedOrAdmin, isAdmin } from '@/access'
import { scanForbiddenClaims, gatePublishCompliance, createAuditLog, autoSlug, assignPlantNumber } from '@/hooks'
import { backupAfterChange } from '@/hooks/backupAfterChange'
import { revalidateAfterChange } from '@/hooks/revalidateAfterChange'
import { coerceUploadIds } from '@/hooks/coerceUploadIds'
import { makeEmbedHook } from '@/hooks/embedAfterChange'
import { wikiEntriesExtractor } from '@/hooks/embedExtractors'
import { makeModerateContentAfterChangeHook } from '@/hooks/moderateContentHook'
import { suggestedRelationsField } from '@/components/admin/fields/suggestedRelationsField'
import { complianceCheckField } from '@/components/admin/fields/complianceCheckField'
import { seoGenerateField } from '@/components/admin/fields/seoGenerateField'
import { aiHistoryField } from '@/components/admin/fields/aiHistoryField'
import { geoTab } from '@/fields/geoFields'
import { slugify } from '@/lib/slugify'
import { validateImageUrl } from '@/lib/url-validators'

export const WikiEntries: CollectionConfig = {
  slug: 'wikiEntries',
  labels: {
    singular: 'Fiche Plante',
    plural: 'Encyclop\u00e9die des Plantes',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['referenceNumber', 'name', 'latinName', 'category', '_status', 'complianceStatus', 'updatedAt'],
    group: 'Contenu',
    description: 'G\u00e9rer les fiches plantes de l\u2019encyclop\u00e9die des rem\u00e8des naturels',
    components: {
      beforeList: ['@/components/admin/ListHero.tsx#default'],
      // Almanach-style banner at the top of the edit view (above the fields).
      // Uses the `Description` slot which renders in Payload 3.83's document view.
      Description: '@/components/admin/editor/PlantHeader.tsx#default',
      views: {
        list: {
          Component: '@/components/admin/views/PlantsList.tsx#default',
        },
      },
      edit: {
        beforeDocumentControls: ['@/components/admin/DocHeaderChip.tsx#default'],
      },
    },
  },
  versions: {
    drafts: true,
  },
  access: {
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    read: isPublishedOrAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [coerceUploadIds, scanForbiddenClaims],
    beforeChange: [assignPlantNumber, gatePublishCompliance],
    afterChange: [
      makeModerateContentAfterChangeHook({ collection: 'wikiEntries', fields: ['shortDescription', 'longDescription', 'precautionsText'] }),
      createAuditLog,
      backupAfterChange,
      makeEmbedHook('wikiEntries', wikiEntriesExtractor),
      revalidateAfterChange,
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Informations g\u00e9n\u00e9rales',
          fields: [
            {
              name: 'referenceNumber',
              type: 'text',
              label: 'N\u00b0 de r\u00e9f\u00e9rence',
              admin: {
                readOnly: true,
                description: 'Num\u00e9ro stable assign\u00e9 automatiquement \u00e0 la cr\u00e9ation (P-001, P-002\u2026). Ne pas modifier.',
                position: 'sidebar',
              },
            },
            {
              name: 'name',
              type: 'text',
              required: true,
              localized: true,
              label: 'Nom de la plante',
              admin: {
                placeholder: 'Ex : Camomille',
                description: 'Le nom commun en fran\u00e7ais',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
              },
            },
            {
              name: 'category',
              type: 'select',
              required: true,
              label: 'Cat\u00e9gorie th\u00e9rapeutique',
              admin: {
                description: 'Famille s\u00e9mantique de la plante. D\u00e9termine le regroupement sur la page liste.',
              },
              options: [
                { label: 'Syst\u00e8me nerveux & mental', value: 'nervous' },
                { label: 'Digestion', value: 'digestive' },
                { label: 'Voies respiratoires', value: 'respiratory' },
                { label: 'Sph\u00e8re f\u00e9minine', value: 'female' },
                { label: 'Sph\u00e8re masculine', value: 'male' },
                { label: 'Circulation', value: 'circulatory' },
                { label: 'Articulations & muscles', value: 'joints' },
                { label: 'Immunit\u00e9 & vitalit\u00e9', value: 'immunity' },
                { label: 'Peau & phan\u00e8res', value: 'skin' },
                { label: 'M\u00e9tabolisme & \u00e9quilibre', value: 'metabolism' },
                { label: 'Plante polyvalente', value: 'multi' },
              ],
            },
            {
              name: 'latinName',
              type: 'text',
              label: 'Nom latin',
              admin: {
                placeholder: 'Ex : Matricaria chamomilla',
                description: 'Le nom botanique officiel',
              },
            },
            {
              name: 'slug',
              type: 'text',
              unique: true,
              label: 'Slug (URL)',
              hooks: {
                beforeValidate: [autoSlug('name')],
                beforeChange: [
                  ({ value, data, originalDoc }) => {
                    if (value && typeof value === 'string' && value.trim()) {
                      return slugify(value)
                    }
                    const source = data?.name || data?.title || originalDoc?.name || originalDoc?.title
                    return source ? slugify(String(source)) : value
                  },
                ],
              },
              admin: {
                placeholder: 'camomille',
                description: 'Identifiant unique utilis\u00e9 dans l\u2019URL. G\u00e9n\u00e9r\u00e9 automatiquement depuis le nom si vide.',
              },
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              localized: true,
              label: 'Description courte',
              admin: {
                description: 'R\u00e9sum\u00e9 de 1\u20132 phrases affich\u00e9 dans les listes et aper\u00e7us',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextareaField.tsx#default',
                },
              },
            },
          ],
        },
        {
          label: 'D\u00e9tails botaniques',
          fields: [
            {
              name: 'family',
              type: 'select',
              label: 'Famille botanique',
              admin: {
                description: 'Famille botanique normalis\u00e9e (whitelist).',
              },
              options: [
                { label: 'Ast\u00e9rac\u00e9es (Asteraceae)', value: 'asteraceae' },
                { label: 'Lamiac\u00e9es (Lamiaceae)', value: 'lamiaceae' },
                { label: 'Apiac\u00e9es (Apiaceae)', value: 'apiaceae' },
                { label: 'Rosac\u00e9es (Rosaceae)', value: 'rosaceae' },
                { label: 'Fabac\u00e9es (Fabaceae)', value: 'fabaceae' },
                { label: 'Verb\u00e9nac\u00e9es (Verbenaceae)', value: 'verbenaceae' },
                { label: 'Plantaginac\u00e9es (Plantaginaceae)', value: 'plantaginaceae' },
                { label: 'Hyp\u00e9ricac\u00e9es (Hypericaceae)', value: 'hypericaceae' },
                { label: 'Sapindac\u00e9es (Sapindaceae)', value: 'sapindaceae' },
                { label: 'Adoxac\u00e9es (Adoxaceae)', value: 'adoxaceae' },
                { label: 'Caprifoliac\u00e9es (Caprifoliaceae)', value: 'caprifoliaceae' },
                { label: 'Malvac\u00e9es (Malvaceae)', value: 'malvaceae' },
                { label: 'Boraginac\u00e9es (Boraginaceae)', value: 'boraginaceae' },
                { label: 'Renonculac\u00e9es (Ranunculaceae)', value: 'ranunculaceae' },
                { label: 'Papav\u00e9rac\u00e9es (Papaveraceae)', value: 'papaveraceae' },
                { label: 'Brassicac\u00e9es (Brassicaceae)', value: 'brassicaceae' },
                { label: 'Liliac\u00e9es (Liliaceae)', value: 'liliaceae' },
                { label: 'Pinac\u00e9es (Pinaceae)', value: 'pinaceae' },
                { label: 'Ginkgoac\u00e9es (Ginkgoaceae)', value: 'ginkgoaceae' },
                { label: 'Zingib\u00e9rac\u00e9es (Zingiberaceae)', value: 'zingiberaceae' },
                { label: 'Araliac\u00e9es (Araliaceae)', value: 'araliaceae' },
                { label: 'Crassulac\u00e9es (Crassulaceae)', value: 'crassulaceae' },
                { label: 'Salicac\u00e9es (Salicaceae)', value: 'salicaceae' },
                { label: '\u00c9quis\u00e9tac\u00e9es (Equisetaceae)', value: 'equisetaceae' },
                { label: 'Laurac\u00e9es (Lauraceae)', value: 'lauraceae' },
                { label: 'Linac\u00e9es (Linaceae)', value: 'linaceae' },
                { label: 'Onagrac\u00e9es (Onagraceae)', value: 'onagraceae' },
                { label: '\u00c9ricac\u00e9es (Ericaceae)', value: 'ericaceae' },
                { label: 'Solanac\u00e9es (Solanaceae)', value: 'solanaceae' },
                { label: 'Schisandrac\u00e9es (Schisandraceae)', value: 'schisandraceae' },
                { label: 'Polygonac\u00e9es (Polygonaceae)', value: 'polygonaceae' },
                { label: 'Caryophyllac\u00e9es (Caryophyllaceae)', value: 'caryophyllaceae' },
                { label: 'Gentianac\u00e9es (Gentianaceae)', value: 'gentianaceae' },
                { label: 'Th\u00e9ac\u00e9es (Theaceae)', value: 'theaceae' },
                { label: 'Iridac\u00e9es (Iridaceae)', value: 'iridaceae' },
                { label: 'Hamam\u00e9lidac\u00e9es (Hamamelidaceae)', value: 'hamamelidaceae' },
                { label: 'Vitac\u00e9es (Vitaceae)', value: 'vitaceae' },
                { label: 'Champignons m\u00e9dicinaux', value: 'fungi' },
                { label: 'Autre', value: 'other' },
              ],
            },
            {
              name: 'origin',
              type: 'text',
              localized: true,
              label: 'Origine g\u00e9ographique',
              admin: {
                placeholder: 'Ex : Europe, Asie occidentale',
                description: 'R\u00e9gions d\u2019origine de la plante',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
              },
            },
            {
              name: 'partsUsed',
              type: 'select',
              hasMany: true,
              label: 'Parties utilis\u00e9es',
              admin: {
                description: 'Parties de la plante employ\u00e9es en phytoth\u00e9rapie (whitelist).',
              },
              options: [
                { label: 'Fleurs', value: 'flower' },
                { label: 'Feuilles', value: 'leaf' },
                { label: 'Sommit\u00e9s fleuries', value: 'flowering-tops' },
                { label: 'Racine', value: 'root' },
                { label: 'Rhizome', value: 'rhizome' },
                { label: '\u00c9corce', value: 'bark' },
                { label: 'Fruit', value: 'fruit' },
                { label: 'Graine', value: 'seed' },
                { label: 'Baie', value: 'berry' },
                { label: 'Bourgeon', value: 'bud' },
                { label: 'Tige', value: 'stem' },
                { label: 'Bulbe', value: 'bulb' },
                { label: 'Plante enti\u00e8re', value: 'whole-plant' },
                { label: 'Huile essentielle', value: 'essential-oil' },
                { label: 'R\u00e9sine / Gomme', value: 'resin' },
                { label: 'Champignon entier', value: 'mushroom' },
              ],
            },
            {
              name: 'imageType',
              type: 'select',
              label: 'Type visuel (g\u00e9n\u00e9rateur)',
              admin: {
                description: 'Cat\u00e9gorie de la mati\u00e8re \u00e0 repr\u00e9senter dans le bol (cf. workflow Nano Banana RDM).',
              },
              options: [
                { label: 'Fleurs / p\u00e9tales s\u00e9ch\u00e9s', value: 'flowers-dried' },
                { label: 'Feuilles s\u00e9ch\u00e9es', value: 'leaves-dried' },
                { label: 'Racines / \u00e9corces / morceaux ligneux', value: 'roots-bark' },
                { label: 'Baies / graines / fruits secs', value: 'berries-seeds' },
                { label: 'Champignons s\u00e9ch\u00e9s', value: 'mushrooms' },
                { label: 'Tisane fumante', value: 'tisane' },
                { label: '\u00c9pices', value: 'spices' },
              ],
            },
            {
              name: 'activeCompounds',
              type: 'textarea',
              localized: true,
              label: 'Principes actifs',
              admin: {
                description: 'Les mol\u00e9cules actives et compos\u00e9s chimiques de la plante',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextareaField.tsx#default',
                },
              },
            },
            {
              name: 'harvest',
              type: 'text',
              localized: true,
              label: 'R\u00e9colte',
              admin: {
                placeholder: 'Ex : Juin \u00e0 ao\u00fbt',
                description: 'P\u00e9riode et m\u00e9thode de r\u00e9colte',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
              },
            },
            {
              name: 'form',
              type: 'text',
              localized: true,
              label: 'Forme',
              admin: {
                placeholder: 'Ex : Tisane, huile essentielle',
                description: 'Formes galéniques disponibles',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
              },
            },
            {
              name: 'conservation',
              type: 'text',
              localized: true,
              label: 'Conservation',
              admin: {
                placeholder: 'Ex : Au sec, \u00e0 l\u2019abri de la lumi\u00e8re',
                description: 'Conditions de conservation recommand\u00e9es',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
              },
            },
          ],
        },
        {
          label: 'Contenu',
          fields: [
            {
              name: 'longDescription',
              type: 'textarea',
              localized: true,
              label: 'Description longue (texte brut)',
              admin: {
                description: 'Description d\u00e9taill\u00e9e en texte brut, utilis\u00e9e pour le SEO',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextareaField.tsx#default',
                },
              },
            },
            {
              name: 'description',
              type: 'richText',
              localized: true,
              label: 'Description compl\u00e8te (rich text)',
              admin: {
                description: 'Contenu principal de la fiche avec mise en forme',
              },
            },
            {
              name: 'precautionsText',
              type: 'textarea',
              localized: true,
              label: 'Pr\u00e9cautions (texte brut)',
              admin: {
                description: 'Pr\u00e9cautions d\u2019emploi en texte simple',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextareaField.tsx#default',
                },
              },
            },
            {
              name: 'precautions',
              type: 'richText',
              localized: true,
              label: 'Pr\u00e9cautions (rich text)',
              admin: {
                description: 'Pr\u00e9cautions d\u2019emploi d\u00e9taill\u00e9es avec mise en forme',
              },
            },
            {
              name: 'contraindications',
              type: 'richText',
              localized: true,
              label: 'Contre-indications',
              admin: {
                description: 'Situations o\u00f9 la plante ne doit pas \u00eatre utilis\u00e9e',
              },
            },
          ],
        },
        {
          label: 'Relations',
          fields: [
            {
              name: 'benefits',
              type: 'relationship',
              relationTo: 'benefits',
              hasMany: true,
              label: 'Bienfaits associ\u00e9s',
              admin: {
                description: 'Les bienfaits li\u00e9s \u00e0 cette plante',
              },
            },
            {
              name: 'relatedProducts',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              label: 'Produits associ\u00e9s',
              admin: {
                description: 'Produits issus de ou contenant cette plante.',
              },
            },
            {
              name: 'relatedPosts',
              type: 'relationship',
              relationTo: 'blogPosts',
              hasMany: true,
              label: 'Articles associ\u00e9s',
              admin: {
                description: 'Articles du blog mentionnant cette plante.',
              },
            },
            {
              name: 'externalImageUrl',
              type: 'text',
              label: 'Image principale (URL Cloudinary)',
              validate: validateImageUrl as any,
              admin: {
                placeholder: 'https://res.cloudinary.com/laboratoire-calebasse/image/upload/rdm/plants/<slug>.png',
                description: 'URL Cloudinary de l\u2019image principale de la plante. Auto-construite par le seed \u00e0 partir du slug.',
              },
            },
            {
              name: 'detectedVariants',
              type: 'array',
              label: 'Variantes Cloudinary auto-détectées',
              labels: { singular: 'URL', plural: 'URLs' },
              admin: {
                readOnly: true,
                description:
                  "Variantes auto-détectées par /api/refresh-plant-variants (slug-2, slug-tisane…). " +
                  "Ne pas éditer manuellement — utiliser la galerie ci-dessous pour ajouter des images.",
              },
              fields: [
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  label: 'URL',
                },
              ],
            },
            {
              name: 'galleryUrls',
              type: 'array',
              label: 'Galerie (URLs Cloudinary)',
              labels: { singular: 'URL', plural: 'URLs' },
              admin: {
                description:
                  "URLs Cloudinary additionnelles inject\u00e9es dans le contenu de la fiche. " +
                  "Hosts autoris\u00e9s : res.cloudinary.com, images.unsplash.com (URL directe), cdn.sanity.io. " +
                  "Plusieurs images peuvent cibler la m\u00eame section. Laisser \u00ab Section n\u00b0 \u00bb vide pour les afficher en fin de fiche.",
              },
              fields: [
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  label: 'URL',
                  validate: validateImageUrl as any,
                  admin: { placeholder: 'https://res.cloudinary.com/...' },
                },
                {
                  name: 'caption',
                  type: 'text',
                  label: 'L\u00e9gende',
                  admin: { placeholder: 'Ex : Camomille en infusion' },
                },
                {
                  name: 'sectionIndex',
                  type: 'number',
                  min: 1,
                  label: 'Section n\u00b0',
                  admin: {
                    description:
                      "Num\u00e9ro de la section (1, 2, 3\u2026) apr\u00e8s laquelle ins\u00e9rer l'image. " +
                      "Vide = en fin de fiche.",
                  },
                },
              ],
            },
            {
              name: 'images',
              type: 'array',
              label: 'Galerie (uploads manuels)',
              labels: { singular: 'Image', plural: 'Images' },
              admin: {
                description: 'Uploads Payload manuels (alternative \u00e0 Cloudinary). Utilisez de pr\u00e9f\u00e9rence externalImageUrl + galleryUrls.',
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Image',
                },
              ],
            },
            {
              name: 'author',
              type: 'relationship',
              relationTo: 'authors',
              label: 'Auteur',
              admin: {
                description: 'L\u2019auteur ou r\u00e9dacteur de cette fiche',
              },
            },
          ],
        },
        {
          label: 'Publication',
          fields: [
            {
              name: 'status',
              type: 'select',
              defaultValue: 'draft',
              label: 'Workflow interne',
              admin: {
                description:
                  '\u26a0\ufe0f Ne contr\u00f4le PAS la visibilit\u00e9 sur le site. Pour publier/d\u00e9publier, utilisez les boutons Save Draft / Publish changes en haut de la page.',
              },
              options: [
                { label: 'Brouillon', value: 'draft' },
                { label: 'Publi\u00e9', value: 'published' },
                { label: 'Archiv\u00e9', value: 'archived' },
              ],
            },
            {
              name: 'complianceStatus',
              type: 'select',
              defaultValue: 'pending',
              index: true,
              label: 'Statut de conformit\u00e9',
              admin: {
                description: '\u00c9tat de la v\u00e9rification r\u00e9glementaire du contenu',
              },
              options: [
                { label: 'En attente', value: 'pending' },
                { label: 'Soumis', value: 'submitted' },
                { label: 'Relu', value: 'reviewed' },
                { label: 'Approuv\u00e9', value: 'approved' },
              ],
            },
            {
              name: 'reviewedBy',
              type: 'relationship',
              relationTo: 'users',
              label: 'Relu par',
              admin: {
                readOnly: true,
                description: 'L\u2019utilisateur qui a effectu\u00e9 la v\u00e9rification de conformit\u00e9',
              },
            },
            {
              name: 'complianceLLM',
              type: 'group',
              label: 'Vérification LLM (auto)',
              admin: {
                readOnly: true,
                description:
                  'Résultat de la modération automatique par IA (référence). Le statut humain prime.',
              },
              fields: [
                {
                  name: 'verdict',
                  type: 'select',
                  options: [
                    { label: 'OK', value: 'ok' },
                    { label: 'Risque', value: 'risk' },
                    { label: 'Bloqué', value: 'block' },
                  ],
                },
                { name: 'confidence', type: 'number', min: 0, max: 1 },
                {
                  name: 'matchedClaims',
                  type: 'json',
                  admin: { description: 'Allégations détectées par le LLM (tableau JSON, audit trail IA).' },
                },
                { name: 'reason', type: 'textarea' },
                { name: 'at', type: 'date' },
              ],
            },
          ],
        },
        geoTab,
      ],
    },
    suggestedRelationsField({ name: 'suggestedBenefits', target: 'benefits', label: 'Bienfaits suggérés', targetField: 'benefits' }),
    complianceCheckField({ collection: 'wikiEntries', fields: ['shortDescription', 'longDescription', 'precautionsText'] }),
    seoGenerateField({ collection: 'wikiEntries' }),
    aiHistoryField(),
  ],
  indexes: [
    { fields: ['complianceStatus'] },
    { fields: ['category'] },
  ],
}
