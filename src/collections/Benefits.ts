import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, isPublishedOrAdmin, isAdmin } from '@/access'
import { scanForbiddenClaims, gatePublishCompliance, createAuditLog, autoSlug, assignBenefitNumber } from '@/hooks'
import { backupAfterChange } from '@/hooks/backupAfterChange'
import { revalidateAfterChange } from '@/hooks/revalidateAfterChange'
import { coerceUploadIds } from '@/hooks/coerceUploadIds'
import { makeEmbedHook } from '@/hooks/embedAfterChange'
import { benefitsExtractor } from '@/hooks/embedExtractors'
import { makeModerateContentAfterChangeHook } from '@/hooks/moderateContentHook'
import { suggestedRelationsField } from '@/components/admin/fields/suggestedRelationsField'
import { complianceCheckField } from '@/components/admin/fields/complianceCheckField'
import { seoGenerateField } from '@/components/admin/fields/seoGenerateField'
import { aiHistoryField } from '@/components/admin/fields/aiHistoryField'
import { geoTab } from '@/fields/geoFields'
import { slugify } from '@/lib/slugify'

export const Benefits: CollectionConfig = {
  slug: 'benefits',
  labels: {
    singular: 'Bienfait',
    plural: 'Bienfaits',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['referenceNumber', 'name', 'category', '_status', 'complianceStatus', 'updatedAt'],
    group: 'Contenu',
    description: 'G\u00e9rer les bienfaits sant\u00e9 associ\u00e9s aux plantes',
    components: {
      beforeList: ['@/components/admin/ListHero.tsx#default'],
      views: {
        list: {
          Component: '@/components/admin/views/BenefitsList.tsx#default',
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
    beforeChange: [assignBenefitNumber, gatePublishCompliance],
    afterChange: [
      makeModerateContentAfterChangeHook({ collection: 'benefits', fields: ['shortDescription'] }),
      createAuditLog,
      backupAfterChange,
      makeEmbedHook('benefits', benefitsExtractor),
      revalidateAfterChange,
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Informations principales',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              localized: true,
              label: 'Nom du bienfait',
              admin: {
                placeholder: 'Ex : Digestion',
                description: 'Le nom du bienfait sant\u00e9',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextField.tsx#default',
                },
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
                placeholder: 'digestion',
                description: 'Identifiant unique pour l\u2019URL. G\u00e9n\u00e9r\u00e9 automatiquement depuis le nom si vide.',
              },
            },
            {
              name: 'referenceNumber',
              type: 'text',
              label: 'N° de référence',
              admin: {
                description: 'Numéro stable de l’entrée (format B-XXX). Assigné par le seed, ou à saisir manuellement.',
                position: 'sidebar',
              },
            },
            {
              name: 'category',
              type: 'select',
              required: true,
              label: 'Catégorie',
              admin: {
                description: 'Famille sémantique du bienfait. Détermine le regroupement sur la page liste.',
              },
              options: [
                { label: 'Système nerveux & mental', value: 'nervous' },
                { label: 'Digestion', value: 'digestive' },
                { label: 'Voies respiratoires', value: 'respiratory' },
                { label: 'Sphère féminine', value: 'female' },
                { label: 'Sphère masculine', value: 'male' },
                { label: 'Circulation', value: 'circulatory' },
                { label: 'Articulations & muscles', value: 'joints' },
                { label: 'Immunité & vitalité', value: 'immunity' },
                { label: 'Peau & phanères', value: 'skin' },
                { label: 'Métabolisme & équilibre', value: 'metabolism' },
              ],
            },
            {
              name: 'bodyRegion',
              type: 'select',
              label: 'Région du corps',
              admin: {
                description:
                  'Région anatomique associée, utilisée par l explorateur corporel sur la page d accueil.',
              },
              options: [
                { label: 'Tête (migraines, sommeil...)', value: 'tete' },
                { label: 'Gorge (toux, voix...)', value: 'gorge' },
                { label: 'Respiration (bronches, sinus...)', value: 'respiration' },
                { label: 'Digestion (estomac, foie...)', value: 'digestion' },
                { label: 'Féminin (cycle, ménopause...)', value: 'feminin' },
                { label: 'Circulation (jambes, veines...)', value: 'circulation' },
              ],
            },
            {
              name: 'icon',
              type: 'select',
              required: true,
              defaultValue: 'leaf',
              label: 'Ic\u00f4ne (Lucide)',
              admin: {
                description: 'Pictogramme Lucide affich\u00e9 sur la fiche. Liste ferm\u00e9e pour coh\u00e9rence visuelle.',
              },
              options: [
                { label: 'Cerveau (mental)', value: 'brain' },
                { label: 'Feuille (d\u00e9tente)', value: 'leaf' },
                { label: 'Lune (sommeil)', value: 'moon' },
                { label: 'Soleil (vitalit\u00e9)', value: 'sun' },
                { label: 'Batterie (fatigue)', value: 'battery' },
                { label: 'Cible (concentration)', value: 'target' },
                { label: 'Livre ouvert (\u00e9tude)', value: 'book-open' },
                { label: 'Microphone (gorge/voix)', value: 'mic' },
                { label: 'M\u00e9gaphone (vocal)', value: 'megaphone' },
                { label: 'Vent (respiration)', value: 'wind' },
                { label: 'Brume (voies a\u00e9riennes)', value: 'cloud-fog' },
                { label: 'Pomme (digestion)', value: 'apple' },
                { label: 'Couverts (repas)', value: 'utensils' },
                { label: 'Pousse (foie)', value: 'sprout' },
                { label: 'Caf\u00e9 (apr\u00e8s-repas)', value: 'coffee' },
                { label: 'Fleur (f\u00e9minin)', value: 'flower' },
                { label: 'Fleur 2 (f\u00e9minin alt.)', value: 'flower-2' },
                { label: 'C\u0153ur (bien-\u00eatre)', value: 'heart' },
                { label: 'Bouclier (prostate/protection)', value: 'shield' },
                { label: 'Bouclier valid\u00e9 (immunit\u00e9)', value: 'shield-check' },
                { label: '\u00c9clair (\u00e9nergie)', value: 'zap' },
                { label: 'C\u0153ur battant (circulation)', value: 'heart-pulse' },
                { label: 'Empreintes (jambes)', value: 'footprints' },
                { label: 'Vagues (veineux)', value: 'waves' },
                { label: '\u00c9tincelles (microcirculation/\u00e9clat)', value: 'sparkles' },
                { label: 'Os (articulations)', value: 'bone' },
                { label: 'Activit\u00e9 (souplesse)', value: 'activity' },
                { label: 'Halt\u00e8re (musculaire)', value: 'dumbbell' },
                { label: 'Recyclage (r\u00e9cup\u00e9ration)', value: 'refresh-cw' },
                { label: 'Flocon (hivernal)', value: 'snowflake' },
                { label: 'Main (peau)', value: 'hand' },
                { label: 'Ciseaux (cheveux/ongles)', value: 'scissors' },
                { label: 'Balance (poids)', value: 'scale' },
                { label: 'Gouttes (drainage)', value: 'droplets' },
                { label: 'Goutte (urinaire)', value: 'droplet' },
              ],
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              localized: true,
              label: 'Description courte',
              admin: {
                description: 'R\u00e9sum\u00e9 affich\u00e9 dans les listes et aper\u00e7us',
                components: {
                  Field: '@/components/admin/fields/AIGenerateTextareaField.tsx#default',
                },
              },
            },
            {
              name: 'description',
              type: 'richText',
              localized: true,
              label: 'Description compl\u00e8te',
              admin: {
                description: 'Explication d\u00e9taill\u00e9e du bienfait avec mise en forme',
              },
            },
            {
              name: 'precautions',
              type: 'richText',
              localized: true,
              label: 'Pr\u00e9cautions d\u2019usage',
              admin: {
                description: 'Pr\u00e9cautions, contre-indications et populations \u00e0 risque.',
              },
            },
            {
              name: 'redFlags',
              type: 'textarea',
              localized: true,
              label: 'Drapeaux rouges (consulter un m\u00e9decin)',
              admin: {
                description: 'Sympt\u00f4mes ou situations qui imposent un avis m\u00e9dical (un par ligne).',
                placeholder: 'Ex : douleur intense\nfi\u00e8vre persistante\nsympt\u00f4mes > 7 jours',
              },
            },
            {
              name: 'regulatoryClaim',
              type: 'text',
              localized: true,
              label: 'All\u00e9gation autoris\u00e9e',
              admin: {
                description: 'Formulation conforme (EFSA / pharmacop\u00e9e) \u00e0 utiliser pour ce bienfait.',
                placeholder: 'Ex : \u00ab Contribue \u00e0 une digestion normale \u00bb',
              },
            },
            {
              name: 'severity',
              type: 'select',
              defaultValue: 'routine',
              label: 'Niveau de vigilance',
              admin: {
                description: 'Pilote l\u2019affichage des avertissements.',
              },
              options: [
                { label: 'Confort courant', value: 'routine' },
                { label: 'Inconfort passager', value: 'transient' },
                { label: 'Surveillance recommand\u00e9e', value: 'requires-monitoring' },
              ],
            },
          ],
        },
        {
          label: 'Relations',
          fields: [
            {
              name: 'relatedPlants',
              type: 'relationship',
              relationTo: 'wikiEntries',
              hasMany: true,
              label: 'Plantes associ\u00e9es',
              admin: {
                description: 'Les fiches plantes li\u00e9es \u00e0 ce bienfait',
              },
            },
            {
              name: 'relatedProducts',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              label: 'Produits associ\u00e9s',
              admin: {
                description: 'Les produits li\u00e9s \u00e0 ce bienfait',
              },
            },
            {
              name: 'relatedArticles',
              type: 'relationship',
              relationTo: 'blogPosts',
              hasMany: true,
              label: 'Articles associ\u00e9s',
              admin: {
                description: 'Articles de blog li\u00e9s \u00e0 ce bienfait',
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
    suggestedRelationsField({ name: 'suggestedProducts', target: 'products', label: 'Produits suggérés', targetField: 'relatedProducts' }),
    complianceCheckField({ collection: 'benefits', fields: ['shortDescription'] }),
    seoGenerateField({ collection: 'benefits' }),
    aiHistoryField(),
  ],
  indexes: [
    { fields: ['complianceStatus'] },
  ],
}
