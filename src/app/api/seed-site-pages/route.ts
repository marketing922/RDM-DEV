import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'

// ─── Lexical richText helpers ─────────────────────────────────────────
const p = (text: string) => ({
  type: 'paragraph',
  version: 1,
  children: [{ type: 'text', version: 1, text }],
})
const h2 = (text: string) => ({
  type: 'heading',
  tag: 'h2',
  version: 1,
  children: [{ type: 'text', version: 1, text }],
})
const ul = (items: string[]) => ({
  type: 'list',
  tag: 'ul',
  listType: 'bullet',
  version: 1,
  children: items.map((text) => ({
    type: 'listitem',
    version: 1,
    children: [{ type: 'text', version: 1, text }],
  })),
})
const rt = (...children: any[]) => ({
  root: { type: 'root', version: 1, children, direction: null, format: '', indent: 0 },
})

// ─── 9 site pages with real content extracted from hardcoded routes ───

const SEED: Array<any> = [
  {
    slug: 'a-propos',
    title: 'À propos',
    intro: "Les savoirs de la pharmacopée française et de la médecine traditionnelle chinoise, rassemblés dans une encyclopédie botanique rigoureuse et accessible.",
    _status: 'published',
    layout: [
      { blockType: 'hero', heading: 'Les Remèdes de Mamie', subheading: "L'almanach des plantes qui soignent depuis toujours" },
      {
        blockType: 'content',
        richText: rt(
          h2('Notre mission'),
          p("Rassembler, sourcer et transmettre les savoirs des pharmacopées française et chinoise. Écrire sobrement et factuellement, sans promesse thérapeutique, en s'appuyant sur la recherche clinique et les monographies ESCOP/EMA."),
          h2('Nos valeurs'),
          ul([
            '100% naturel — plantes rigoureusement sélectionnées',
            'Origine France — fabriqué en France',
            'Savoirs ancestraux — fidèles à la tradition',
            'Qualité premium — certifiée Agriculture Biologique',
          ]),
          h2('Notre histoire'),
          p("Une encyclopédie botanique née de la volonté de croiser la pharmacopée française et la médecine traditionnelle chinoise. Chaque fiche plante est rédigée à partir de sources scientifiques reconnues et relue par notre équipe éditoriale."),
        ),
      },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact',
    intro: "Une question, une remarque, un partenariat ? Notre équipe vous répond sous 48 heures ouvrées.",
    _status: 'published',
    layout: [
      { blockType: 'hero', heading: 'Nous contacter', subheading: "Notre équipe est à votre écoute" },
      {
        blockType: 'contactInfo',
        heading: 'Coordonnées',
        address: 'Les Remèdes de Mamie\n58 rue Étienne Dolet\n92240 Malakoff, France',
        email: 'contact@remedes-mamie.com',
        phone: '+33 1 45 85 88 00',
        openingHours: [
          { day: 'Lun — Ven', hours: '9h – 18h' },
          { day: 'Samedi', hours: '10h – 16h' },
          { day: 'Dim. & jours fériés', hours: 'Fermé' },
        ],
      },
      {
        blockType: 'content',
        richText: rt(
          h2('Écrivez-nous'),
          p("Pour toute question sur nos produits, nos plantes, votre commande ou un éventuel partenariat, envoyez-nous un email à contact@remedes-mamie.com. Nous vous répondons sous 48 heures ouvrées."),
          p("Pour les journalistes et professionnels de la presse : merci d'indiquer votre média et votre deadline dans l'objet de votre message."),
        ),
      },
    ],
  },
  {
    slug: 'faq',
    title: 'Questions fréquentes',
    intro: "Tout ce que vous vouliez savoir sur nos tisanes, nos plantes et notre démarche.",
    _status: 'published',
    layout: [
      { blockType: 'hero', heading: 'Questions fréquentes' },
      {
        blockType: 'faq',
        heading: 'Vos questions',
        items: [
          { question: 'Comment sont sélectionnées vos plantes ?', answer: rt(p("Toutes nos plantes sont rigoureusement sélectionnées selon les normes de la pharmacopée française et européenne. Nous privilégions les filières biologiques et les circuits courts avec des producteurs français ou européens certifiés.")) },
          { question: 'Vos informations sont-elles vérifiées ?', answer: rt(p("Chaque fiche plante et chaque article s'appuie sur des sources scientifiques reconnues (EFSA, pharmacopée européenne, ESCOP, monographies EMA) et est relu par notre équipe éditoriale avant publication.")) },
          { question: 'Les plantes médicinales remplacent-elles un traitement médical ?', answer: rt(p("Non. Les informations présentes sur notre site sont à visée informative et éducative uniquement. Elles ne remplacent pas un avis médical. Consultez toujours un professionnel de santé avant tout usage, notamment en cas de traitement en cours, grossesse, allaitement ou maladie chronique.")) },
          { question: 'Vos tisanes sont-elles bio ?', answer: rt(p("Oui, 100% de nos produits sont certifiés Agriculture Biologique. Nous travaillons uniquement avec des producteurs français ou européens sous certification bio.")) },
          { question: 'Quels sont les délais de livraison ?', answer: rt(p("Nous expédions en France métropolitaine sous 24-48h. La livraison prend ensuite 3 à 5 jours ouvrables en Colissimo, 4 à 6 jours en Mondial Relay. La livraison est offerte à partir de 30 € d'achat.")) },
          { question: 'Puis-je retourner un produit ?', answer: rt(p("Oui, vous disposez de 14 jours francs à compter de la réception pour exercer votre droit de rétractation sur les produits non ouverts et non utilisés. Les frais de retour sont à votre charge. Voir nos CGV pour les détails.")) },
          { question: 'Comment conserver mes tisanes ?', answer: rt(p("Conservez nos produits dans un endroit frais et sec, à l'abri de la lumière directe. Une fois ouverts, consommez-les de préférence dans les 6 mois. La date de péremption figure sur chaque emballage.")) },
          { question: 'Puis-je prendre vos produits si je suis enceinte ?', answer: rt(p("Certaines plantes sont déconseillées pendant la grossesse ou l'allaitement. Consultez impérativement votre médecin ou sage-femme avant tout usage. Les précautions spécifiques sont indiquées sur chaque fiche produit.")) },
        ],
      },
    ],
  },
  {
    slug: 'cgv',
    title: 'Conditions générales de vente',
    intro: "Les conditions régissant l'achat de produits sur le site Les Remèdes de Mamie.",
    _status: 'published',
    layout: [
      { blockType: 'hero', heading: 'Conditions générales de vente', subheading: 'En vigueur à compter du 1er mai 2026' },
      {
        blockType: 'content',
        richText: rt(
          h2('Préambule'),
          p("Les présentes Conditions Générales de Vente (ci-après « CGV ») sont conclues entre SAS CALEBASSE, Société par Actions Simplifiée au capital de 10 000 €, dont le siège social est situé au 15 rue de la Vistule, 75013 Paris, immatriculée au RCS de Paris sous le numéro B 415 228 311, TVA intracommunautaire FR81415228311, téléphone 01 45 85 88 00, email contact@remedes-mamie.com."),
          p("La société SAS CALEBASSE exploite le site www.remedes-mamie.com sous la marque « Les Remèdes de Mamie » (ci-après « le Vendeur »), et toute personne physique non commerçante souhaitant procéder à un achat sur le site (ci-après « le Client »)."),
          h2("Champ d'application"),
          p("Les présentes CGV s'appliquent à toutes les ventes de produits effectuées sur www.remedes-mamie.com, à destination des consommateurs résidant en France métropolitaine. La validation de la commande vaut acceptation sans réserve des CGV en vigueur."),
          h2('Produits'),
          p("Les produits proposés sont des compléments alimentaires et des tisanes/infusions, dans la limite des stocks disponibles. Ils ne constituent ni des substituts à une alimentation variée et équilibrée, ni à un mode de vie sain."),
          h2('Prix et paiement'),
          p("Les prix sont indiqués en euros TTC, hors frais de livraison. Paiement sécurisé par Stripe (certifié PCI-DSS) : carte bancaire (Visa, Mastercard, CB), Apple Pay, Google Pay. Le compte du Client est débité à la validation de la commande."),
          h2('Livraison'),
          p("Livraisons en France métropolitaine uniquement. Colissimo (3-5 jours ouvrables) ou Mondial Relay (4-6 jours ouvrables). La livraison est offerte à partir de 30 € d'achat."),
          h2('Droit de rétractation'),
          p("Conformément aux articles L.221-18 et suivants du Code de la consommation, le Client dispose d'un délai de 14 jours francs à compter de la réception pour exercer son droit de rétractation sur les produits non ouverts et non utilisés. Les frais de retour sont à la charge du Client. Remboursement dans un délai maximum de 14 jours."),
          h2('Garanties légales'),
          p("Tous les produits bénéficient de la garantie légale de conformité (24 mois, articles L.217-4 et suivants du Code de la consommation) et de la garantie légale des vices cachés (2 ans, articles 1641 à 1649 du Code civil)."),
          h2('Service client'),
          p("Email : contact@remedes-mamie.com — Téléphone : 01 45 85 88 00 — Courrier : Les Remèdes de Mamie, 58 rue Étienne Dolet, 92240 Malakoff."),
          h2('Médiation'),
          p("En cas de litige non résolu amiablement, le Client peut recourir gratuitement au CMAP (Centre de Médiation et d'Arbitrage de Paris), 39 avenue Franklin D. Roosevelt, 75008 Paris (www.cmap.fr), ou à la plateforme européenne ODR (ec.europa.eu/consumers/odr)."),
          h2('Droit applicable'),
          p("Les présentes CGV sont soumises au droit français. Compétence est attribuée aux tribunaux français compétents."),
        ),
      },
    ],
  },
  {
    slug: 'mentions-legales',
    title: 'Mentions légales',
    intro: "Informations légales relatives à l'édition et à l'hébergement du site.",
    _status: 'published',
    layout: [
      { blockType: 'hero', heading: 'Mentions légales', subheading: 'Dernière mise à jour : avril 2026' },
      {
        blockType: 'content',
        richText: rt(
          h2('Éditeur du site'),
          p("Le site internet www.remedes-mamie.com est édité par SAS CALEBASSE, Société par Actions Simplifiée au capital de 10 000 €. Siège social : 15 rue de la Vistule, 75013 Paris, France. RCS Paris B 415 228 311. N° TVA intracommunautaire : FR81415228311."),
          p("Le site est exploité sous la marque commerciale Les Remèdes de Mamie."),
          h2('Coordonnées'),
          p("Téléphone : 01 45 85 88 00 — Email : contact@remedes-mamie.com — Adresse postale : Les Remèdes de Mamie, 58 rue Étienne Dolet, 92240 Malakoff, France."),
          h2('Directeur de la publication'),
          p("Monsieur Ruosi WU, en qualité de Président de la société SAS CALEBASSE."),
          h2('Hébergeur'),
          p("Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis. Site web : vercel.com."),
          h2('Propriété intellectuelle'),
          p("L'ensemble du contenu du site (textes, articles, photographies, illustrations, marque et logo, structure du site, bases de données) est la propriété exclusive de SAS CALEBASSE. Toute reproduction, représentation, modification ou exploitation sans autorisation écrite préalable est interdite (articles L.335-2 et suivants du Code de la Propriété Intellectuelle)."),
          h2('Données personnelles'),
          p("Consultez notre Politique de Confidentialité pour le détail de la collecte et du traitement de vos données personnelles. Conformément au RGPD, vous disposez de droits (accès, rectification, suppression, opposition, portabilité). Exercice à contact@remedes-mamie.com."),
          h2('Limitation de responsabilité'),
          p("Les informations sont fournies à titre indicatif et sont susceptibles d'évoluer. SAS CALEBASSE ne saurait être tenue responsable des dommages directs ou indirects résultant de l'accès au site ou de l'utilisation des informations qu'il contient."),
          h2('Droit applicable'),
          p("Les présentes mentions légales sont soumises au droit français. En cas de litige, compétence est attribuée aux tribunaux compétents de Paris."),
        ),
      },
    ],
  },
  {
    slug: 'politique-confidentialite',
    title: 'Politique de confidentialité',
    intro: "Comment nous collectons, utilisons et protégeons vos données personnelles — conforme RGPD.",
    _status: 'published',
    layout: [
      { blockType: 'hero', heading: 'Politique de confidentialité', subheading: 'Dernière mise à jour : avril 2026' },
      {
        blockType: 'content',
        richText: rt(
          h2('Préambule'),
          p("La présente politique décrit comment SAS CALEBASSE collecte, utilise et protège les données personnelles des utilisateurs du site www.remedes-mamie.com, conformément au RGPD et à la loi Informatique et Libertés."),
          h2('Responsable du traitement'),
          p("SAS CALEBASSE — 15 rue de la Vistule, 75013 Paris — contact@remedes-mamie.com."),
          h2('Données collectées'),
          ul([
            "Identification : nom, prénom, email, mot de passe",
            "Contact : adresse postale, téléphone",
            "Commande : produits achetés, montants, historique",
            "Navigation : cookies, adresse IP, pages consultées",
            "Paiement : traité directement par Stripe, jamais stocké par nos soins",
          ]),
          h2('Finalités et bases légales'),
          ul([
            "Exécution du contrat de vente (commandes, livraisons, SAV)",
            "Obligations légales (comptabilité, fiscalité)",
            "Intérêt légitime (prévention fraude, sécurité du site)",
            "Consentement (newsletter, cookies non-essentiels)",
          ]),
          h2('Durées de conservation'),
          p("Compte : durée de vie + 3 ans d'inactivité. Commandes : 10 ans (obligation comptable). Prospection : 3 ans après le dernier contact. Cookies : 13 mois maximum."),
          h2('Destinataires'),
          p("Services internes de SAS CALEBASSE et sous-traitants (hébergeur Vercel, processeur Stripe, transporteurs Colissimo/Mondial Relay, outil d'emailing Brevo). Aucune donnée n'est vendue."),
          h2('Transferts hors UE'),
          p("Certains sous-traitants (Vercel, Stripe) sont situés aux États-Unis. Les transferts sont encadrés par les clauses contractuelles types de la Commission Européenne."),
          h2('Vos droits'),
          p("Accès, rectification, effacement, limitation, portabilité, opposition, retrait du consentement. Exercice à contact@remedes-mamie.com. Vous pouvez également saisir la CNIL (www.cnil.fr)."),
          h2('Sécurité'),
          p("Chiffrement SSL/TLS, authentification forte, accès restreint, sauvegardes régulières."),
          h2('Cookies'),
          p("Consultez notre Politique de Cookies pour le détail et la gestion de vos préférences."),
          h2('Modification'),
          p("La présente politique peut être modifiée à tout moment. Les modifications prennent effet dès publication sur le site."),
        ),
      },
    ],
  },
  {
    slug: 'politique-cookies',
    title: 'Politique de cookies',
    intro: "Quels cookies nous utilisons, pourquoi, et comment gérer vos préférences.",
    _status: 'published',
    layout: [
      { blockType: 'hero', heading: 'Politique de cookies', subheading: 'Dernière mise à jour : avril 2026' },
      {
        blockType: 'content',
        richText: rt(
          h2("Qu'est-ce qu'un cookie ?"),
          p("Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite d'un site web. Il permet de mémoriser des informations pour faciliter votre navigation ou mesurer l'audience."),
          h2('Cookies essentiels'),
          p("Strictement nécessaires au fonctionnement du site. Ne peuvent pas être désactivés."),
          ul([
            "Session utilisateur (connexion, panier)",
            "Préférences de langue et de région",
            "Sécurité (protection contre le CSRF)",
          ]),
          h2("Cookies de mesure d'audience"),
          p("Soumis à votre consentement. Mesure de la fréquentation du site pour améliorer votre expérience. Données anonymisées et agrégées."),
          h2('Cookies de personnalisation'),
          p("Soumis à votre consentement. Contenu pertinent (plantes vues récemment, recommandations) sur la base de votre navigation."),
          h2('Cookies tiers'),
          ul([
            "Stripe : paiement sécurisé (techniques)",
            "Vercel Analytics : mesure de performance",
            "YouTube / Vimeo : lecture de vidéos intégrées",
          ]),
          h2('Durée de conservation'),
          p("Durée de vie maximale de 13 mois conformément à la recommandation de la CNIL. Vous pouvez à tout moment révoquer votre consentement via le bandeau cookies ou les paramètres de votre navigateur."),
          h2('Gérer vos préférences'),
          p("Acceptez, refusez ou paramétrez les cookies non-essentiels via le bandeau affiché à votre première visite. Vous pouvez également bloquer les cookies dans les paramètres de votre navigateur (Chrome, Firefox, Safari, Edge)."),
          h2('Contact'),
          p("Pour toute question : contact@remedes-mamie.com."),
        ),
      },
    ],
  },
  {
    slug: 'avertissement-sante',
    title: 'Avertissement santé',
    intro: "Informations importantes sur l'usage des plantes médicinales et des compléments alimentaires.",
    _status: 'published',
    layout: [
      { blockType: 'hero', heading: 'Avertissement santé', subheading: 'Dernière mise à jour : avril 2026' },
      {
        blockType: 'content',
        richText: rt(
          h2('Objet du site'),
          p("Le site www.remedes-mamie.com est édité par SAS CALEBASSE sous la marque Les Remèdes de Mamie. Les informations fournies le sont à titre informatif et éducatif. Elles visent à partager des connaissances générales sur les plantes médicinales, les compléments alimentaires et les approches naturelles du bien-être."),
          p("Les contenus publiés NE constituent PAS :"),
          ul([
            "Un diagnostic médical",
            "Une prescription médicale",
            "Une recommandation de traitement",
            "Un avis médical personnalisé",
          ]),
          h2("Consultation d'un professionnel de santé"),
          p("Nous vous recommandons vivement de consulter un médecin, un pharmacien ou une sage-femme avant toute utilisation de compléments alimentaires ou de tisanes, notamment dans les situations suivantes :"),
          ul([
            "Grossesse ou allaitement",
            "Traitement médical en cours",
            "Maladie chronique",
            "Prise de médicaments sur ordonnance",
            "Allergies connues",
            "Administration à un enfant de moins de 18 ans",
          ]),
          h2('Compléments alimentaires'),
          p("Nos compléments alimentaires sont conformes au Décret n°2006-352 du 20 mars 2006. Ils ne sont pas des médicaments et ne se substituent pas à une alimentation variée et équilibrée ni à un mode de vie sain."),
          p("Il est important de :"),
          ul([
            "Ne pas dépasser la dose journalière recommandée indiquée sur chaque produit",
            "Tenir les produits hors de portée des jeunes enfants",
            "Conserver les produits dans un endroit frais et sec, à l'abri de la lumière",
          ]),
          h2('Allégations de santé'),
          p("Les allégations présentées sont formulées dans le strict respect du Règlement (CE) n°1924/2006. Seules les allégations autorisées par l'EFSA sont utilisées. Aucun produit n'a la prétention de prévenir, traiter ou guérir une maladie."),
          h2("En cas d'urgence"),
          p("SAMU : 15 — Pompiers : 18 — Urgence européenne : 112 — Centre antipoison : consultez le numéro de votre région."),
          h2('Contact'),
          p("Pour toute question : contact@remedes-mamie.com — 01 45 85 88 00."),
        ),
      },
    ],
  },
  {
    slug: 'accessibilite',
    title: "Déclaration d'accessibilité",
    intro: "Notre engagement pour rendre le site accessible à tous, conformément au RGAA 4.1 niveau AA.",
    _status: 'published',
    layout: [
      { blockType: 'hero', heading: "Déclaration d'accessibilité", subheading: 'Date de déclaration : avril 2026' },
      {
        blockType: 'content',
        richText: rt(
          h2('Engagement'),
          p("SAS CALEBASSE s'engage à rendre le site remedes-mamie.com accessible conformément à l'article 47 de la loi n°2005-102 du 11 février 2005."),
          p("Nous visons la conformité au Référentiel Général d'Amélioration de l'Accessibilité (RGAA) version 4.1, niveau AA, en cohérence avec les WCAG 2.1."),
          h2('État de conformité'),
          p("Le site est en conformité partielle avec le RGAA 4.1. Un audit complet est prévu afin d'améliorer continuellement l'expérience de tous les utilisateurs."),
          h2('Mesures prises'),
          ul([
            "Utilisation de balises sémantiques HTML5",
            "Navigation au clavier fonctionnelle",
            "Contrastes de couleurs conformes au niveau AA",
            "Textes alternatifs sur toutes les images informatives",
            "Formulaires accessibles avec labels et messages d'erreur explicites",
            "Design responsive adapté à toutes les tailles d'écran",
          ]),
          h2('Technologies utilisées'),
          p("HTML5, CSS3, JavaScript (React / Next.js). Ces technologies sont utilisées en conformité avec les standards web pour garantir la compatibilité avec les technologies d'assistance."),
          h2('Signaler un problème'),
          p("Si vous rencontrez un problème d'accessibilité, écrivez à contact@remedes-mamie.com en précisant la page concernée et la nature du problème. Réponse sous 48 heures ouvrées."),
          h2('Voies de recours'),
          p("Si vous n'obtenez pas de réponse satisfaisante, vous pouvez saisir le Défenseur des Droits (www.defenseurdesdroits.fr)."),
        ),
      },
    ],
  },
]

// ─── Endpoint ─────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const h = await getHeaders()
    const { user } = await payload.auth({ headers: h })
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const confirm = url.searchParams.get('confirm')
    const force = url.searchParams.get('force') === 'yes'

    if (confirm !== 'yes') {
      return NextResponse.json({
        info: 'Dry run — ajoutez ?confirm=yes pour semer les 9 pages du site (published).',
        forceHint: '?confirm=yes&force=yes pour écraser les entrées existantes avec le contenu riche',
        willSeed: SEED.map((s) => ({ slug: s.slug, title: s.title, blocks: s.layout.length })),
      })
    }

    const created: any[] = []
    const updated: any[] = []
    const skipped: any[] = []

    for (const seed of SEED) {
      try {
        const existing = await payload
          .find({
            collection: 'sitePages' as any,
            where: { slug: { equals: seed.slug } },
            limit: 1,
            overrideAccess: true,
          })
          .catch(() => ({ docs: [] as any[] }))

        const first = existing.docs[0] as any
        if (first) {
          if (!force) {
            skipped.push({ slug: seed.slug, reason: 'already exists (use &force=yes to overwrite)' })
            continue
          }
          const up = await payload.update({
            collection: 'sitePages' as any,
            id: first.id,
            data: seed as any,
            overrideAccess: true,
            context: { skipCompliance: true } as any,
          })
          updated.push({ slug: seed.slug, id: (up as any).id })
        } else {
          const doc = await payload.create({
            collection: 'sitePages' as any,
            data: seed as any,
            overrideAccess: true,
            context: { skipCompliance: true } as any,
          })
          created.push({ slug: seed.slug, id: (doc as any).id })
        }
      } catch (e: any) {
        skipped.push({ slug: seed.slug, error: e?.message || 'create failed' })
      }
    }

    return NextResponse.json({ created, updated, skipped })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'seed failed' }, { status: 500 })
  }
}
