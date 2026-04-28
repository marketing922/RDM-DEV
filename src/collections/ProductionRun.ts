import type { Access, CollectionConfig } from 'payload'
import { coerceUploadIds } from '@/hooks/coerceUploadIds'

/**
 * ProductionRun — journal interne de chaque production de contenu IA
 * (wiki ou blog) lancée par l'orchestrateur (`src/lib/content-orchestrator.ts`).
 *
 * Pas de hook de modération / compliance / notification critique : c'est un
 * journal opérationnel, pas un contenu publiable. Le hook `coerceUploadIds`
 * est gardé par cohérence avec les autres collections (sans effet pratique
 * ici car il n'y a pas de relation upload).
 */

const isStaff: Access = ({ req }) => {
  const role = (req.user as { role?: string } | null | undefined)?.role
  return role === 'admin' || role === 'editor'
}

const isAdmin: Access = ({ req }) => {
  return (req.user as { role?: string } | null | undefined)?.role === 'admin'
}

const PRODUCTION_STEP_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'En file d’attente', value: 'queued' },
  { label: 'Recherche web', value: 'researching' },
  { label: 'Extraction', value: 'extracting' },
  { label: 'Génération des champs', value: 'generating-fields' },
  { label: 'Génération GEO', value: 'generating-geo' },
  { label: 'Génération SEO', value: 'generating-seo' },
  { label: 'Récupération des images', value: 'fetching-images' },
  { label: 'Modération', value: 'moderating' },
  { label: 'Création du document', value: 'creating-doc' },
  { label: 'Upload des images', value: 'uploading-images' },
  { label: 'Publication', value: 'publishing' },
  { label: 'Terminé', value: 'done' },
  { label: 'Échec', value: 'failed' },
]

export const ProductionRun: CollectionConfig = {
  slug: 'productionRun',
  labels: {
    singular: 'Production IA',
    plural: 'Productions IA',
  },
  admin: {
    defaultColumns: ['kind', 'seed', 'status', 'totalCostEur', 'createdAt'],
    group: 'Système',
    description:
      'Journal des productions de contenu autonomes (encyclopédie + blog) lancées par l’orchestrateur IA.',
  },
  defaultSort: '-createdAt',
  access: {
    read: isStaff,
    create: isStaff,
    update: isStaff,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [coerceUploadIds],
  },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      index: true,
      label: 'Type',
      options: [
        { label: 'Fiche plante (wiki)', value: 'wiki' },
        { label: 'Article de blog', value: 'blog' },
      ],
    },
    {
      name: 'seed',
      type: 'text',
      required: true,
      maxLength: 200,
      label: 'Sujet / nom',
      admin: {
        description: 'Nom de plante OU sujet d’article (slug-friendly).',
      },
    },
    {
      name: 'mode',
      type: 'select',
      defaultValue: 'autonomous',
      label: 'Mode',
      options: [
        { label: 'Autonome', value: 'autonomous' },
        { label: 'Import JSON', value: 'import-json' },
      ],
    },
    {
      name: 'conflictPolicy',
      type: 'select',
      defaultValue: 'fail',
      label: 'Politique de conflit',
      admin: {
        readOnly: true,
        description: 'Toujours "fail" : si le slug existe déjà, la production est annulée et un lien vers le doc existant est retourné.',
      },
      options: [
        { label: 'Refuser si slug existe', value: 'fail' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'queued',
      index: true,
      label: 'Statut',
      options: PRODUCTION_STEP_OPTIONS,
    },
    {
      name: 'brief',
      type: 'textarea',
      label: 'Brief éditorial',
      admin: {
        description: 'Pour les articles de blog : angle, instructions auteur.',
      },
    },
    {
      name: 'importedJson',
      type: 'json',
      label: 'JSON importé',
      admin: {
        description: 'Données brutes fournies en mode import-json.',
      },
    },
    {
      name: 'steps',
      type: 'array',
      label: 'Étapes exécutées',
      labels: { singular: 'Étape', plural: 'Étapes' },
      fields: [
        { name: 'name', type: 'text', label: 'Nom' },
        {
          name: 'status',
          type: 'select',
          label: 'Statut',
          options: [
            { label: 'En attente', value: 'pending' },
            { label: 'OK', value: 'ok' },
            { label: 'Échec', value: 'failed' },
          ],
        },
        { name: 'durationMs', type: 'number', label: 'Durée (ms)' },
        { name: 'output', type: 'json', label: 'Sortie' },
        { name: 'errorMessage', type: 'text', label: 'Message d’erreur' },
      ],
    },
    {
      name: 'totalCostEur',
      type: 'number',
      defaultValue: 0,
      label: 'Coût total (EUR)',
      admin: {
        step: 0.000001,
      },
    },
    {
      name: 'totalDurationMs',
      type: 'number',
      defaultValue: 0,
      label: 'Durée totale (ms)',
    },
    {
      name: 'docCollection',
      type: 'text',
      label: 'Collection du document',
      admin: {
        description: 'Slug Payload : wikiEntries ou blogPosts.',
      },
    },
    {
      name: 'docId',
      type: 'text',
      label: 'ID du document',
    },
    {
      name: 'docSlug',
      type: 'text',
      label: 'Slug du document',
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Publié le',
    },
    {
      name: 'errorCode',
      type: 'text',
      label: 'Code d’erreur',
    },
    {
      name: 'errorMessage',
      type: 'textarea',
      label: 'Message d’erreur',
    },
    {
      name: 'warnings',
      type: 'array',
      label: 'Avertissements',
      labels: { singular: 'Avertissement', plural: 'Avertissements' },
      fields: [{ name: 'message', type: 'text', required: true }],
    },
    {
      name: 'initiatedBy',
      type: 'select',
      label: 'Déclenché par',
      options: [
        { label: 'Admin UI', value: 'admin-ui' },
        { label: 'Clé API', value: 'api-key' },
        { label: 'CLI', value: 'cli' },
        { label: 'Cron', value: 'cron' },
      ],
    },
    {
      name: 'actorId',
      type: 'text',
      label: 'Identifiant acteur',
      admin: {
        description: 'ID utilisateur Payload, "apikey:xxx", "cron", etc.',
      },
    },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'fr',
      label: 'Locale',
      options: [
        { label: 'Français', value: 'fr' },
        { label: 'English', value: 'en' },
      ],
    },
  ],
  indexes: [
    { fields: ['kind'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
  ],
}
