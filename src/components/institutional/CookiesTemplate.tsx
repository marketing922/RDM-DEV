import React from 'react'
import Link from 'next/link'
import { InstitBreadcrumb, InstitHeader } from '@/components/institutional/primitives'
import {
  LegalTOC,
  LegalMeta,
  LegalSection,
  LegalBox,
  LegalBody,
} from '@/components/institutional/legal/LegalPrimitives'
import Reveal from '@/components/ui/Reveal'

type Props = {
  locale: string
  homeLabel: string
}

const TOC_ITEMS = [
  { id: 'definition', label: "Qu'est-ce qu'un cookie ?" },
  { id: 'types', label: 'Types de cookies' },
  { id: 'finalites', label: 'Finalités' },
  { id: 'preferences', label: 'Gérer vos préférences' },
  { id: 'tiers', label: 'Cookies tiers' },
  { id: 'en-savoir-plus', label: 'En savoir plus' },
]

type CookieCategory = {
  name: string
  alwaysOn: boolean
  description: string
  cookies: string[]
}

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    name: 'Cookies strictement nécessaires',
    alwaysOn: true,
    description:
      "Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés. Ils sont généralement établis en réponse à des actions que vous effectuez (paramétrage de vos préférences de confidentialité, connexion, remplissage de formulaires). Ils ne stockent aucune information personnelle identifiable et reposent sur l'intérêt légitime de SAS CALEBASSE.",
    cookies: ['tarteaucitron', 'PHPSESSID', 'session'],
  },
  {
    name: "Cookies statistiques (mesure d'audience)",
    alwaysOn: false,
    description:
      "Les cookies statistiques nous aident, par la collecte et la communication d'informations de manière anonyme, à comprendre comment les visiteurs interagissent avec le site web. Le dépôt de ces cookies repose sur votre consentement.",
    cookies: [
      '_ga',
      '_ga_*',
      '_gid',
      '_gat',
      'collect',
      '_clck',
      '_clsk',
      '_cltk',
      'CLID',
      'c.gif',
      '_hjAbsoluteSessionInProgress',
      '_hjFirstSeen',
      '_hjIncludedInSessionSample_*',
      '_hjSession_*',
      '_hjSessionUser_*',
    ],
  },
  {
    name: 'Cookies marketing (publicité ciblée)',
    alwaysOn: false,
    description:
      "Les cookies marketing sont utilisés pour effectuer le suivi des visiteurs au travers des sites web. Le but est d'afficher des publicités qui sont pertinentes et intéressantes pour l'utilisateur. Le dépôt de ces cookies repose sur votre consentement.",
    cookies: [
      '_fbp',
      '_fbc',
      'fr',
      '_uetsid',
      '_uetsid_exp',
      '_uetvid',
      '_uetvid_exp',
      'ANONCHK',
      'MR',
      'MUID',
      'SRM_B',
      'SM',
      'eng_mt',
      'pagead/landing',
    ],
  },
]

export default function CookiesTemplate({ locale, homeLabel }: Props) {
  const linkClass =
    'text-rm-burgundy underline decoration-rm-rule underline-offset-[3px] hover:decoration-rm-burgundy transition-colors'

  return (
    <main className="min-h-screen bg-rm-cream text-rm-ink font-sans">
      <InstitBreadcrumb
        crumbs={[
          { label: homeLabel, href: `/${locale}` },
          { label: 'Politique de cookies' },
        ]}
        locale={locale}
      />

      <InstitHeader
        chapter="Vie privée"
        title="Politique"
        sub="des cookies."
        intro="Comment nous utilisons les cookies et traceurs sur www.remedes-mamie.com."
      />

      <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-16 md:py-20 pb-24 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10 lg:gap-12">
        <aside>
          <LegalTOC items={TOC_ITEMS} />
        </aside>

        <div>
          <LegalMeta version="1.0" updated="avril 2026" />

          <LegalBody>
            <Reveal>
              <LegalSection
                id="definition"
                num={1}
                title="Qu'est-ce qu'un cookie ou traceur ?"
              >
                <p className="mb-4">
                  Un cookie ou traceur est une information déposée sur votre
                  terminal (ordinateur, mobile, tablette) par le serveur du site
                  visité.
                </p>
                <p className="mb-4">
                  Ces informations sont stockées sur votre terminal dans un
                  fichier texte auquel un serveur accède pour lire et enregistrer
                  des informations.
                </p>
                <p className="mb-3">Il existe deux grandes familles de cookies :</p>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>
                    <strong>Cookies de session</strong> : ils disparaissent dès
                    que vous quittez le site.
                  </li>
                  <li>
                    <strong>Cookies permanents</strong> : ils demeurent sur votre
                    équipement terminal jusqu&apos;à expiration de leur durée de
                    vie ou jusqu&apos;à ce que vous les supprimiez.
                  </li>
                </ul>
                <p className="mb-4">
                  Vous êtes informé que, lors de vos visites sur le site
                  www.remedes-mamie.com, des cookies peuvent être installés sur
                  votre équipement terminal.
                </p>
                <p className="mb-4">
                  D&apos;autres types de traceurs peuvent aussi être utilisés,
                  tels que les <strong>pixels invisibles</strong> (balises web).
                  Ceux-ci se présentent sous forme d&apos;images graphiques
                  minuscules et peuvent être placés sur le site ou dans un email
                  pour collecter des informations techniques et des informations
                  sur l&apos;activité.
                </p>
                <p className="mb-3">
                  Le terme «&nbsp;cookie&nbsp;» ou «&nbsp;traceur&nbsp;» recouvre
                  notamment :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>les cookies HTTP</li>
                  <li>les cookies Flash</li>
                  <li>les pixels invisibles ou «&nbsp;web bugs&nbsp;»</li>
                  <li>
                    les identifiants générés par un logiciel ou un système
                    d&apos;exploitation
                  </li>
                </ul>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="types" num={2} title="Quels types de cookies sont utilisés ?">
                <p className="mb-5">
                  Les cookies et traceurs utilisés sur le site sont classés par
                  catégorie selon leur finalité. Vous pouvez accepter ou refuser
                  chaque catégorie via notre panneau de gestion des cookies.
                </p>

                {COOKIE_CATEGORIES.map((cat) => (
                  <div
                    key={cat.name}
                    className="border border-rm-rule bg-rm-paper px-5 py-5 mb-3.5"
                  >
                    <div className="flex justify-between items-start gap-5 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="block w-2.5 h-2.5 rounded-full bg-rm-teal" />
                        <div className="font-display text-[22px] text-rm-teal font-normal">
                          {cat.name}
                        </div>
                      </div>
                      <span className="text-[11px] text-rm-inkSoft uppercase tracking-[0.15em] font-semibold whitespace-nowrap">
                        {cat.alwaysOn ? 'Toujours actifs' : 'Avec votre consentement'}
                      </span>
                    </div>
                    <p className="font-serif text-[14px] leading-[1.6] text-rm-inkSoft">
                      {cat.description}
                    </p>
                    <div className="flex gap-1.5 flex-wrap mt-2.5">
                      {cat.cookies.map((c) => (
                        <span
                          key={c}
                          className="font-mono text-[10px] bg-rm-creamSoft border border-rm-rule px-2 py-[3px] rounded text-rm-burgundy"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                <LegalBox>
                  Les cookies tiers (Google Analytics, Microsoft Clarity, Hotjar,
                  Meta, Microsoft Bing, Taboola, Google Ads) ne sont déposés
                  qu&apos;après recueil de votre consentement via notre panneau
                  de gestion.
                </LegalBox>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="finalites" num={3} title="Quelles sont les finalités de ces cookies ?">
                <h3 className="font-display text-[20px] text-rm-teal mt-2 mb-2 font-normal">
                  Cookies techniques (intérêt légitime)
                </h3>
                <p className="mb-3">
                  Ces cookies sont déposés dès votre arrivée sur le site pour
                  vous délivrer un service de qualité et sécurisé :
                </p>
                <ul className="list-disc pl-6 mb-5 space-y-1">
                  <li>permettre votre bonne connexion au site</li>
                  <li>assurer le bon affichage des pages</li>
                  <li>mémoriser vos préférences de cookies</li>
                </ul>

                <h3 className="font-display text-[20px] text-rm-teal mt-2 mb-2 font-normal">
                  Cookies soumis à votre consentement
                </h3>
                <p className="mb-3">
                  Le dépôt de ces cookies repose sur votre consentement et ils
                  sont mis en œuvre pour :
                </p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>
                    <strong>Mesure d&apos;audience</strong> : analyser la
                    fréquentation et l&apos;utilisation du site, de ses rubriques
                    et services proposés, nous permettant d&apos;améliorer
                    l&apos;ergonomie du site.
                  </li>
                  <li>
                    <strong>Mémorisation des préférences</strong> : mémoriser vos
                    préférences d&apos;affichage (langue, paramètres
                    d&apos;affichage, système d&apos;exploitation).
                  </li>
                  <li>
                    <strong>Formulaires</strong> : mémoriser les informations
                    relatives à un formulaire que vous avez rempli ou à un
                    service (inscription, panier).
                  </li>
                  <li>
                    <strong>Espaces personnels</strong> : permettre
                    d&apos;accéder à des espaces réservés, tels que votre compte
                    personnel.
                  </li>
                  <li>
                    <strong>Publicité ciblée</strong> : adapter les contenus
                    publicitaires à vos centres d&apos;intérêts et comportements.
                  </li>
                  <li>
                    <strong>Mesure de performance publicitaire</strong> : mesurer
                    l&apos;impact des campagnes de prospection commerciale.
                  </li>
                </ul>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="preferences" num={4} title="Comment configurer vos préférences cookies ?">
                <h3 className="font-display text-[20px] text-rm-teal mt-2 mb-2 font-normal">
                  Via notre panneau de gestion des cookies
                </h3>
                <p className="mb-3">
                  Vous pouvez à tout moment modifier vos préférences cookies
                  gratuitement via le bouton <strong>«&nbsp;Gérer mes cookies&nbsp;»</strong>{' '}
                  présent en bas de chaque page du site.
                </p>

                <div className="flex gap-3 mt-3.5 flex-wrap">
                  <button
                    type="button"
                    className="bg-rm-burgundy text-white font-sans text-[13px] font-semibold px-5 py-3 hover:bg-rm-burgundy/90 transition-colors"
                  >
                    Rouvrir mes préférences
                  </button>
                  <button
                    type="button"
                    className="bg-transparent text-rm-teal border border-rm-ruleStrong font-sans text-[13px] font-semibold px-5 py-3 hover:border-rm-burgundy hover:text-rm-burgundy transition-colors"
                  >
                    Tout refuser
                  </button>
                </div>

                <h3 className="font-display text-[20px] text-rm-teal mt-6 mb-2 font-normal">
                  Via les paramètres de votre navigateur
                </h3>
                <p className="mb-3">
                  Vous pouvez également configurer votre navigateur pour :
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>enregistrer systématiquement tous les cookies</li>
                  <li>refuser systématiquement tous les cookies</li>
                  <li>
                    être averti lors du dépôt d&apos;un cookie et choisir de
                    l&apos;accepter ou non
                  </li>
                </ul>

                <LegalBox tone="warn">
                  <strong>Attention</strong> : si vous refusez ou supprimez
                  certains cookies, vous pourriez ne plus bénéficier de certains
                  contenus et services sur notre site. SAS CALEBASSE décline
                  toute responsabilité pour les conséquences liées au
                  fonctionnement dégradé de ses services.
                </LegalBox>

                <h3 className="font-display text-[20px] text-rm-teal mt-6 mb-2 font-normal">
                  Liens vers les paramètres des principaux navigateurs
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Google Chrome</strong> :{' '}
                    <a
                      href="https://support.google.com/chrome/answer/95647?hl=fr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      support.google.com/chrome/answer/95647
                    </a>
                  </li>
                  <li>
                    <strong>Safari</strong> :{' '}
                    <a
                      href="https://www.apple.com/legal/privacy/fr-ww/cookies/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      apple.com/legal/privacy/fr-ww/cookies
                    </a>
                  </li>
                  <li>
                    <strong>Mozilla Firefox</strong> :{' '}
                    <a
                      href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      support.mozilla.org/fr/kb/activer-desactiver-cookies
                    </a>
                  </li>
                  <li>
                    <strong>Microsoft Edge</strong> :{' '}
                    <a
                      href="https://support.microsoft.com/fr-fr/help/4468242/microsoft-edge-browsing-data-and-privacy-microsoft-privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      support.microsoft.com/fr-fr/help/4468242
                    </a>
                  </li>
                  <li>
                    <strong>Opera</strong> :{' '}
                    <a
                      href="https://help.opera.com/en/?s=cookies&product=latest"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      help.opera.com
                    </a>
                  </li>
                </ul>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="tiers" num={5} title="Cookies tiers">
                <p className="mb-4">
                  Les cookies tiers sont des cookies susceptibles d&apos;être
                  déposés sur votre terminal par des sociétés tierces lorsque
                  vous interagissez avec des contenus de ces sociétés sur notre
                  site (boutons de partage, vidéos intégrées, etc.).
                </p>
                <p className="mb-4">
                  SAS CALEBASSE ne contrôle pas la collecte par ces sites tiers
                  des informations relatives à votre navigation sur notre site.
                </p>
                <p className="mb-3">
                  Nous vous recommandons de consulter les politiques cookies de
                  ces sites tiers :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Google</strong> :{' '}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      policies.google.com/privacy
                    </a>
                  </li>
                  <li>
                    <strong>Meta (Facebook)</strong> :{' '}
                    <a
                      href="https://www.facebook.com/privacy/policy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      facebook.com/privacy/policy
                    </a>
                  </li>
                  <li>
                    <strong>Microsoft</strong> :{' '}
                    <a
                      href="https://privacy.microsoft.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      privacy.microsoft.com
                    </a>
                  </li>
                  <li>
                    <strong>Hotjar</strong> :{' '}
                    <a
                      href="https://www.hotjar.com/legal/policies/privacy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      hotjar.com/legal/policies/privacy
                    </a>
                  </li>
                  <li>
                    <strong>Taboola</strong> :{' '}
                    <a
                      href="https://www.taboola.com/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      taboola.com/privacy-policy
                    </a>
                  </li>
                </ul>
              </LegalSection>
            </Reveal>

            <Reveal>
              <LegalSection id="en-savoir-plus" num={6} title="En savoir plus">
                <p className="mb-3">
                  Pour plus d&apos;informations sur les cookies et vos droits,
                  vous pouvez consulter :
                </p>
                <ul className="list-disc pl-6 space-y-1 mb-5">
                  <li>
                    Le site de la CNIL :{' '}
                    <a
                      href="https://www.cnil.fr/fr/cookies-et-autres-traceurs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      cnil.fr/fr/cookies-et-autres-traceurs
                    </a>
                  </li>
                  <li>
                    Notre{' '}
                    <Link
                      href={`/${locale}/politique-confidentialite`}
                      className={linkClass}
                    >
                      Politique de Confidentialité
                    </Link>
                  </li>
                  <li>
                    Nos{' '}
                    <Link href={`/${locale}/mentions-legales`} className={linkClass}>
                      Mentions légales
                    </Link>
                  </li>
                </ul>
              </LegalSection>
            </Reveal>
          </LegalBody>
        </div>
      </div>
    </main>
  )
}
