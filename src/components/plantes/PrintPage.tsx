import React from 'react'
import Image from 'next/image'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { richTextToPlain } from '@/lib/utils'

type Source = { title?: string; publisher?: string; year?: number | string; url?: string }

type PrintPageProps = {
  locale: string
  name: string
  latinName?: string
  shortDescription?: string
  longDescription?: string
  family?: string
  origin?: string
  partsUsed?: string
  activeCompounds?: string
  harvest?: string
  form?: string
  conservation?: string
  precautionsText?: string
  precautions?: unknown
  contraindications?: unknown
  directAnswer?: string
  keyTakeaways?: string[]
  sources?: Source[]
  faq?: Array<{ question: string; answer: string }>
  benefits?: Array<{ name?: string; slug?: string }>
  heroImage?: unknown
  canonicalUrl: string
}

const Section: React.FC<{ num: string; title: string; children: React.ReactNode }> = ({
  num,
  title,
  children,
}) => (
  <section className="print-section">
    <h2 className="print-h2">
      <span className="print-h2-num">§ {num}</span> {title}
    </h2>
    <div className="print-prose">{children}</div>
  </section>
)

const PrintPage: React.FC<PrintPageProps> = (props) => {
  const today = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const heroSrc = resolveMediaUrl(props.heroImage as any, 'card')
  const longText = props.longDescription || ''
  const precautionsRich = (() => {
    if (!props.precautions) return ''
    if (typeof props.precautions === 'string') return props.precautions
    return richTextToPlain(props.precautions as any)
  })()
  const contraRich = (() => {
    if (!props.contraindications) return ''
    if (typeof props.contraindications === 'string') return props.contraindications
    return richTextToPlain(props.contraindications as any)
  })()

  const enBref = [
    { label: 'Nom latin', value: props.latinName },
    { label: 'Famille', value: props.family },
    { label: 'Parties utilisées', value: props.partsUsed },
    { label: 'Forme', value: props.form },
    { label: 'Origine', value: props.origin },
    { label: 'Conservation', value: props.conservation },
  ].filter((r) => r.value)

  return (
    <div className="print-root">
      <style>{`
        @page { size: A4; margin: 18mm 16mm 22mm 16mm; }
        @media print {
          html, body { background: #ffffff !important; }
          .print-root { color: #1f1d18; }
        }
        .print-root {
          font-family: 'Source Serif 4', 'Source Serif Pro', Georgia, serif;
          color: #1f1d18;
          background: #ffffff;
          max-width: 760px;
          margin: 0 auto;
          padding: 24px 24px 48px;
          line-height: 1.55;
          font-size: 12pt;
        }
        .print-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 14px;
          border-bottom: 2px solid #054A57;
          margin-bottom: 24px;
        }
        .print-brand-img { height: 52px; width: auto; object-fit: contain; }
        .print-meta { font-size: 10pt; color: #6b6357; text-align: right; line-height: 1.4; }
        .print-meta strong { color: #054A57; font-family: 'Source Sans 3', sans-serif; letter-spacing: 0.06em; text-transform: uppercase; font-size: 9pt; }
        .print-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 32pt; line-height: 1.1; color: #054A57; margin: 0 0 6px; }
        .print-latin { font-style: italic; color: #6b6357; font-size: 14pt; margin: 0 0 16px; }
        .print-chapo {
          font-style: italic; font-size: 13.5pt; line-height: 1.55;
          color: #1f1d18; padding-left: 12px; border-left: 3px solid #D0802C;
          margin: 0 0 24px;
        }
        .print-hero { margin: 18px 0 24px; }
        .print-hero img { width: 100%; height: auto; max-height: 280px; object-fit: cover; border: 1px solid #E5DDD0; border-radius: 4px; }
        .print-hero-caption { font-size: 9.5pt; color: #6b6357; margin-top: 6px; font-style: italic; }
        .print-section { page-break-inside: avoid; margin: 0 0 22px; }
        .print-h2 {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 17pt; color: #054A57; margin: 0 0 10px;
          border-bottom: 1px solid #E5DDD0; padding-bottom: 6px;
        }
        .print-h2-num { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 11pt; color: #D0802C; margin-right: 8px; }
        .print-prose p { margin: 0 0 8px; }
        .print-prose strong { color: #054A57; }
        .print-bref {
          display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px;
          background: #FAF6EE; border: 1px solid #E5DDD0;
          padding: 14px 18px; border-radius: 6px;
          font-size: 11pt;
        }
        .print-bref-row { display: flex; justify-content: space-between; gap: 12px; padding: 3px 0; border-bottom: 1px dotted #E5DDD0; }
        .print-bref-row:last-child { border-bottom: none; }
        .print-bref dt { color: #6b6357; font-family: 'Source Sans 3', sans-serif; }
        .print-bref dd { font-weight: 600; color: #1f1d18; margin: 0; text-align: right; }
        .print-list { margin: 0; padding-left: 18px; }
        .print-list li { margin-bottom: 5px; }
        .print-faq-q { font-weight: 600; color: #054A57; margin: 10px 0 3px; }
        .print-faq-a { margin: 0 0 12px; }
        .print-sources { font-size: 10pt; color: #5A4F45; }
        .print-sources li { margin-bottom: 4px; }
        .print-footer {
          margin-top: 32px; padding-top: 14px;
          border-top: 1px solid #E5DDD0;
          font-size: 9pt; color: #6b6357;
          display: flex; justify-content: space-between; gap: 12px;
        }
        .print-disclaimer {
          margin-top: 18px; padding: 12px 14px;
          background: #FFF5D5; border: 1px solid #D0802C; border-radius: 4px;
          font-size: 10pt; color: #5A4F45;
        }
        .print-disclaimer strong { color: #A2211E; }
      `}</style>

      <header className="print-header">
        <img
          src="/assets/brand/rm-logo.png"
          alt="Les Remèdes de Mamie"
          className="print-brand-img"
        />
        <div className="print-meta">
          <strong>Fiche plante</strong>
          <br />
          {today}
          <br />
          {props.canonicalUrl}
        </div>
      </header>

      <h1 className="print-title">{props.name}</h1>
      {props.latinName && <p className="print-latin">{props.latinName}</p>}

      {(props.shortDescription || props.directAnswer) && (
        <div className="print-chapo">{props.shortDescription || props.directAnswer}</div>
      )}

      {heroSrc && (
        <figure className="print-hero">
          {/* Use plain <img> rather than next/image to keep print fidelity simple. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroSrc} alt={props.name} />
          <figcaption className="print-hero-caption">
            {props.name}
            {props.latinName && <> — {props.latinName}</>}
          </figcaption>
        </figure>
      )}

      {enBref.length > 0 && (
        <Section num="01" title="En bref">
          <dl className="print-bref">
            {enBref.map((row) => (
              <div key={row.label} className="print-bref-row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {longText && (
        <Section num="02" title="Portrait botanique">
          {longText.split(/\n\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Section>
      )}

      {(props.activeCompounds || props.partsUsed || props.harvest) && (
        <Section num="03" title="Composition & récolte">
          {props.partsUsed && (
            <p>
              <strong>Parties utilisées : </strong>
              {props.partsUsed}
            </p>
          )}
          {props.activeCompounds && (
            <p>
              <strong>Principes actifs : </strong>
              {props.activeCompounds}
            </p>
          )}
          {props.harvest && (
            <p>
              <strong>Récolte : </strong>
              {props.harvest}
            </p>
          )}
        </Section>
      )}

      {props.benefits && props.benefits.length > 0 && (
        <Section num="04" title="Bienfaits associés">
          <ul className="print-list">
            {props.benefits.map((b, i) => (
              <li key={(b.slug || String(i)) + i}>{b.name}</li>
            ))}
          </ul>
        </Section>
      )}

      {props.keyTakeaways && props.keyTakeaways.length > 0 && (
        <Section num="05" title="À retenir">
          <ul className="print-list">
            {props.keyTakeaways.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </Section>
      )}

      {(props.precautionsText || precautionsRich || contraRich) && (
        <Section num="06" title="Précautions d'usage">
          {props.precautionsText && <p>{props.precautionsText}</p>}
          {precautionsRich && <p>{precautionsRich}</p>}
          {contraRich && (
            <p>
              <strong>Contre-indications : </strong>
              {contraRich}
            </p>
          )}
        </Section>
      )}

      {props.faq && props.faq.length > 0 && (
        <Section num="07" title="Questions fréquentes">
          {props.faq.map((q, i) => (
            <React.Fragment key={i}>
              <p className="print-faq-q">{q.question}</p>
              <p className="print-faq-a">{q.answer}</p>
            </React.Fragment>
          ))}
        </Section>
      )}

      {props.sources && props.sources.length > 0 && (
        <Section num="08" title="Sources">
          <ul className="print-list print-sources">
            {props.sources.map((s, i) => (
              <li key={i}>
                {s.title || 'Source'}
                {s.publisher && <> — {s.publisher}</>}
                {s.year && <> ({s.year})</>}
                {s.url && (
                  <>
                    {' '}
                    — <span style={{ wordBreak: 'break-all' }}>{s.url}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="print-disclaimer">
        <strong>Avertissement.</strong> Cette fiche est fournie à titre informatif. Elle ne
        constitue pas un avis médical et ne se substitue pas à une consultation de
        professionnel de santé. Conformément aux règlements (CE) 1924/2006 et (UE) 432/2012,
        aucune allégation de traitement, prévention ou guérison de maladie n'est revendiquée.
      </div>

      <footer className="print-footer">
        <span>© {new Date().getFullYear()} SAS CALEBASSE — Les Remèdes de Mamie</span>
        <span>{props.canonicalUrl}</span>
      </footer>
    </div>
  )
}

export default PrintPage
