import React from 'react'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { richTextToPlain } from '@/lib/utils'

type BlogPrintPageProps = {
  locale: string
  title: string
  excerpt?: string
  authorName?: string
  authorRole?: string
  publishedAt?: string
  readingTime?: number | string
  category?: string
  content?: unknown
  featuredImage?: unknown
  canonicalUrl: string
}

const BlogPrintPage: React.FC<BlogPrintPageProps> = (props) => {
  const today = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const heroSrc = resolveMediaUrl(props.featuredImage as any, 'card')
  const plainBody = props.content ? richTextToPlain(props.content as any) : ''
  // Split on blank lines for natural paragraph rendering.
  const paragraphs = plainBody
    .split(/\n{2,}|(?<=[.!?])\s{2,}/g)
    .map((s) => s.trim())
    .filter(Boolean)

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
          line-height: 1.6;
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
        .print-meta {
          font-size: 10pt; color: #6b6357; text-align: right; line-height: 1.4;
        }
        .print-meta strong {
          color: #054A57; font-family: 'Source Sans 3', sans-serif;
          letter-spacing: 0.06em; text-transform: uppercase; font-size: 9pt;
        }
        .print-eyebrow {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 9pt; color: #A2211E; letter-spacing: 0.18em;
          text-transform: uppercase; margin: 0 0 12px;
        }
        .print-title {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 32pt; line-height: 1.1; color: #054A57;
          margin: 0 0 14px;
        }
        .print-byline {
          font-size: 10pt; color: #6b6357; margin: 0 0 4px;
        }
        .print-byline strong { color: #054A57; }
        .print-chapo {
          font-style: italic; font-size: 13.5pt; line-height: 1.55;
          color: #1f1d18; padding-left: 12px; border-left: 3px solid #D0802C;
          margin: 24px 0 24px;
        }
        .print-hero { margin: 18px 0 28px; }
        .print-hero img {
          width: 100%; height: auto; max-height: 300px; object-fit: cover;
          border: 1px solid #E5DDD0; border-radius: 4px;
        }
        .print-prose p { margin: 0 0 12px; text-align: justify; }
        .print-prose p:first-child::first-letter {
          float: left; font-family: 'DM Serif Display', Georgia, serif;
          font-size: 60pt; line-height: 0.85; color: #054A57;
          padding-right: 8px; padding-top: 4px;
        }
        .print-disclaimer {
          margin-top: 28px; padding: 12px 14px;
          background: #FFF5D5; border: 1px solid #D0802C; border-radius: 4px;
          font-size: 10pt; color: #5A4F45;
        }
        .print-disclaimer strong { color: #A2211E; }
        .print-footer {
          margin-top: 28px; padding-top: 14px;
          border-top: 1px solid #E5DDD0;
          font-size: 9pt; color: #6b6357;
          display: flex; justify-content: space-between; gap: 12px;
        }
      `}</style>

      <header className="print-header">
        <img
          src="/assets/brand/rm-logo.png"
          alt="Les Remèdes de Mamie"
          className="print-brand-img"
        />
        <div className="print-meta">
          <strong>Article</strong>
          <br />
          {today}
          <br />
          {props.canonicalUrl}
        </div>
      </header>

      {props.category && <p className="print-eyebrow">{props.category}</p>}
      <h1 className="print-title">{props.title}</h1>

      <p className="print-byline">
        {props.authorName ? (
          <>
            Par <strong>{props.authorName}</strong>
            {props.authorRole && <> — {props.authorRole}</>}
          </>
        ) : (
          <strong>Les Remèdes de Mamie</strong>
        )}
        {props.publishedAt && (
          <>
            {' · '}
            {new Date(props.publishedAt).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </>
        )}
        {props.readingTime && <> · {props.readingTime} min de lecture</>}
      </p>

      {props.excerpt && <div className="print-chapo">{props.excerpt}</div>}

      {heroSrc && (
        <figure className="print-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroSrc} alt={props.title} />
        </figure>
      )}

      <div className="print-prose">
        {paragraphs.length > 0 ? (
          paragraphs.map((para, i) => <p key={i}>{para}</p>)
        ) : (
          <p>{props.excerpt || ''}</p>
        )}
      </div>

      <div className="print-disclaimer">
        <strong>Avertissement.</strong> Cet article est fourni à titre informatif. Il ne
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

export default BlogPrintPage
