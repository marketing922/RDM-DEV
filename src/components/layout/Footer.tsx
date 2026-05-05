import * as React from 'react'
import Link from 'next/link'
import { DEFAULT_FOOTER, type FooterData } from '@/lib/layoutGlobals'
import { CookiePreferencesButton } from '@/components/cookies/CookiePreferencesButton'

type IconComponent = (p: React.SVGProps<SVGSVGElement>) => React.ReactElement

type FooterProps = { dict: any; locale: string; footer?: FooterData }

// Prefix a CMS-provided href with the current locale when it's a relative path.
function localizeHref(href: string, locale: string): string {
  if (!href) return `/${locale}`
  if (/^(https?:)?\/\//i.test(href)) return href
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return href
  const normalized = href.startsWith('/') ? href : `/${href}`
  if (normalized === `/${locale}` || normalized.startsWith(`/${locale}/`)) return normalized
  return `/${locale}${normalized}`
}

// Social-brand glyphs (lucide-react 1.x removed brand icons, so we inline them).
const InstagramIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)
const FacebookIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)
const YouTubeIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
)
const LinkedInIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)
const TikTokIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
  </svg>
)
const PinterestIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 0a12 12 0 0 0-4.37 23.17c-.11-.94-.2-2.38.04-3.41.22-.93 1.4-5.94 1.4-5.94s-.36-.72-.36-1.78c0-1.67.97-2.92 2.18-2.92 1.03 0 1.52.77 1.52 1.7 0 1.03-.66 2.58-1 4.02-.29 1.2.6 2.18 1.78 2.18 2.14 0 3.78-2.26 3.78-5.51 0-2.88-2.07-4.9-5.03-4.9-3.43 0-5.44 2.57-5.44 5.23 0 1.04.4 2.15.9 2.75a.36.36 0 0 1 .08.35c-.09.39-.3 1.2-.34 1.37-.05.22-.17.27-.4.16-1.5-.7-2.43-2.88-2.43-4.64 0-3.78 2.74-7.25 7.91-7.25 4.15 0 7.38 2.96 7.38 6.91 0 4.13-2.6 7.45-6.22 7.45-1.22 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15A12 12 0 1 0 12 0z" />
  </svg>
)

const SOCIAL_ICONS: Record<string, IconComponent> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YouTubeIcon,
  linkedin: LinkedInIcon,
  tiktok: TikTokIcon,
  pinterest: PinterestIcon,
}

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
}

export function Footer({ dict, locale, footer }: FooterProps) {
  const data = footer ?? DEFAULT_FOOTER
  const p = (path: string) => localizeHref(path, locale)

  return (
    <footer className="bg-[#1F2937] text-white">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">

          {/* Brand — wide left column */}
          <div className="lg:col-span-5">
            <h3 className="text-base font-bold text-[#FEF9E9] mb-4">
              {dict.meta.siteName}
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-6 whitespace-pre-line max-w-md">
              {dict.footer.description}
            </p>
            {data.socialLinks.length > 0 && (
              <div className="flex gap-3">
                {data.socialLinks.map((s) => {
                  const Icon = SOCIAL_ICONS[s.platform]
                  const label = SOCIAL_LABELS[s.platform] || s.platform
                  return (
                    <a
                      key={`${s.platform}-${s.url}`}
                      href={s.url}
                      aria-label={label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                      {Icon ? (
                        <Icon width={16} height={16} className="text-gray-300" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-300"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      )}
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right side — link columns + contact */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Dynamic columns from footer global */}
          {data.columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-[#FEF9E9] mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}-${link.href}`}>
                    <Link
                      href={p(link.href)}
                      target={link.openInNewTab ? '_blank' : undefined}
                      rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact (preserved from dict) */}
          <div>
            <h4 className="text-sm font-semibold text-[#FEF9E9] mb-4">{dict.footer.contact.title}</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-gray-400"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <span>58 rue Étienne Dolet<br />92240 Malakoff, France</span>
              </li>
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-gray-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                <span>01 45 85 88 00</span>
              </li>
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-gray-400"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                <span>contact@remedes-mamie.com</span>
              </li>
            </ul>
          </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="border-t border-gray-700 pt-8 pb-6">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { label: 'Agriculture Bio', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' },
              { label: 'Pharmacopée', icon: 'M9 2v6h6V2M9 8H4v14h16V8h-5M12 12v4' },
              { label: 'Vegan', icon: 'M12 22c4-4 8-7.5 8-12A8 8 0 1 0 4 10c0 4.5 4 8 8 12z' },
              { label: 'Sans Métaux Lourds', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
              { label: 'Fabriqué en France', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
              { label: '100% Naturel', icon: 'M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13.5 2.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75' },
            ].map((cert) => (
              <div key={cert.label} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d={cert.icon} /></svg>
                <span className="text-xs font-medium text-gray-200">{cert.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legal + Copyright */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-400">
          <p className="text-center md:text-left">{data.copyright}</p>
          {data.legalLinks.length > 0 && (
            <ul className="flex flex-wrap items-center justify-center md:justify-end gap-x-5 gap-y-2">
              {data.legalLinks.map((link) => (
                <li key={`legal-${link.label}-${link.href}`}>
                  <Link href={p(link.href)} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookiePreferencesButton
                  locale={locale}
                  label={locale === 'en' ? 'Cookie preferences' : 'Preferences cookies'}
                  className="hover:text-white transition-colors cursor-pointer"
                />
              </li>
            </ul>
          )}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 text-center text-xs text-gray-500">
          SAS CALEBASSE &mdash; RCS Paris B 415 228 311
        </div>
      </div>
    </footer>
  )
}
