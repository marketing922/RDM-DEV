import Link from 'next/link'

type FooterProps = { dict: any; locale: string }

export function Footer({ dict, locale }: FooterProps) {
  const p = (path: string) => `/${locale}${path}`

  return (
    <footer className="bg-[#1F2937] text-white">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-bold font-heading text-[#FEF9E9] mb-4">
              {dict.meta.siteName}
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-6">
              {dict.footer.description}
            </p>
            <div className="flex gap-3">
              {[
                { label: 'Facebook', icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
                { label: 'Instagram', icon: 'M16 2H8a6 6 0 0 0-6 6v8a6 6 0 0 0 6 6h8a6 6 0 0 0 6-6V8a6 6 0 0 0-6-6z' },
                { label: 'Twitter', icon: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
              ].map((s) => (
                <a key={s.label} href="#" aria-label={s.label} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                    <path d={s.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Ressources */}
          <div>
            <h4 className="text-sm font-semibold font-heading text-[#FEF9E9] mb-4">{dict.footer.resources.title}</h4>
            <ul className="space-y-2.5">
              <li><Link href={p('/plantes')} className="text-sm text-gray-300 hover:text-white transition-colors">{dict.footer.resources.wiki}</Link></li>
              <li><Link href={p('/blog')} className="text-sm text-gray-300 hover:text-white transition-colors">{dict.footer.resources.blog}</Link></li>
              <li><Link href={p('/bienfaits')} className="text-sm text-gray-300 hover:text-white transition-colors">{dict.footer.resources.bienfaits}</Link></li>
              <li><Link href={p('/faq')} className="text-sm text-gray-300 hover:text-white transition-colors">{dict.footer.resources.faq}</Link></li>
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h4 className="text-sm font-semibold font-heading text-[#FEF9E9] mb-4">{dict.footer.info.title}</h4>
            <ul className="space-y-2.5">
              <li><Link href={p('/a-propos')} className="text-sm text-gray-300 hover:text-white transition-colors">{dict.footer.info.about}</Link></li>
              <li><Link href={p('/contact')} className="text-sm text-gray-300 hover:text-white transition-colors">{dict.footer.info.contact}</Link></li>
              <li><Link href={p('/mentions-legales')} className="text-sm text-gray-300 hover:text-white transition-colors">{dict.footer.info.mentions}</Link></li>
              <li><Link href={p('/politique-confidentialite')} className="text-sm text-gray-300 hover:text-white transition-colors">{dict.footer.info.confidentialite}</Link></li>
              <li><Link href={p('/politique-cookies')} className="text-sm text-gray-300 hover:text-white transition-colors">{dict.footer.info.cookies}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold font-heading text-[#FEF9E9] mb-4">{dict.footer.contact.title}</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-gray-400"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <span>15 rue de la Vistule<br />75013 Paris, France</span>
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

      {/* Copyright */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} {dict.meta.siteName}. {dict.footer.copyright}</p>
          <p className="mt-1">{dict.footer.company}</p>
        </div>
      </div>
    </footer>
  )
}
