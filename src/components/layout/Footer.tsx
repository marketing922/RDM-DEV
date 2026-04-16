import Link from 'next/link'

type FooterProps = { dict: any }

export function Footer({ dict }: FooterProps) {
  const certifications = [
    { key: 'bio', icon: '🌿' },
    { key: 'pharmacopee', icon: '📋' },
    { key: 'vegan', icon: '🌱' },
    { key: 'metaux', icon: '🛡️' },
    { key: 'france', icon: '🇫🇷' },
    { key: 'naturel', icon: '🍃' },
  ] as const

  return (
    <footer className="bg-footer-bg text-footer-text">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-lg py-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2xl">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <h3 className="font-heading text-h5 text-footer-heading mb-md">
              {dict.meta.siteName}
            </h3>
            <p className="text-body-sm mb-lg">
              {dict.footer.description}
            </p>
            {/* Social Icons */}
            <div className="flex gap-sm">
              {['facebook', 'instagram', 'twitter', 'youtube'].map((social) => (
                <a
                  key={social}
                  href={`https://${social}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social}
                  className="w-[40px] h-[40px] flex items-center justify-center rounded-full bg-neutral-500/20 hover:bg-brand transition-colors duration-200"
                >
                  <span className="text-body-sm text-footer-heading uppercase">
                    {social[0]}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="font-heading text-h6 text-footer-heading mb-md uppercase tracking-wider">
              {dict.footer.shop.title}
            </h4>
            <ul className="space-y-xs">
              <li>
                <Link href="/boutique/tisanes" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.shop.tisanes}
                </Link>
              </li>
              <li>
                <Link href="/boutique/poudres" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.shop.poudres}
                </Link>
              </li>
              <li>
                <Link href="/boutique/gelules" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.shop.gelules}
                </Link>
              </li>
              <li>
                <Link href="/boutique/promotions" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.shop.promotions}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="font-heading text-h6 text-footer-heading mb-md uppercase tracking-wider">
              {dict.footer.resources.title}
            </h4>
            <ul className="space-y-xs">
              <li>
                <Link href="/wiki" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.resources.wiki}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.resources.blog}
                </Link>
              </li>
              <li>
                <Link href="/bienfaits" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.resources.bienfaits}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.resources.faq}
                </Link>
              </li>
            </ul>
          </div>

          {/* Info Column */}
          <div>
            <h4 className="font-heading text-h6 text-footer-heading mb-md uppercase tracking-wider">
              {dict.footer.info.title}
            </h4>
            <ul className="space-y-xs">
              <li>
                <Link href="/a-propos" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.info.about}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.info.contact}
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.info.mentions}
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.info.cgv}
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.info.confidentialite}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-body-sm hover:text-footer-heading transition-colors duration-fast">
                  {dict.footer.info.cookies}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-heading text-h6 text-footer-heading mb-md uppercase tracking-wider">
              {dict.footer.contact.title}
            </h4>
            <ul className="space-y-xs text-body-sm">
              <li className="flex items-start gap-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 flex-shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Paris, France</span>
              </li>
              <li className="flex items-start gap-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 flex-shrink-0">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>contact@remedes-mamie.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-3xl pt-2xl border-t border-neutral-500/20">
          <div className="flex flex-wrap items-center justify-center gap-lg">
            {certifications.map((cert) => (
              <div
                key={cert.key}
                className="flex items-center gap-xs bg-neutral-500/10 rounded-xl px-md py-xs"
              >
                <span className="text-body-lg">{cert.icon}</span>
                <span className="font-ui text-caption text-footer-heading">
                  {dict.home.certifications[cert.key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment badges */}
        <div className="mt-xl flex flex-col items-center gap-sm">
          <p className="font-ui text-caption uppercase tracking-wider">
            {dict.footer.payments}
          </p>
          <div className="flex items-center gap-md">
            {['Visa', 'Mastercard', 'CB', 'Stripe'].map((method) => (
              <div
                key={method}
                className="bg-neutral-500/10 rounded-lg px-sm py-2xs"
              >
                <span className="font-ui text-caption text-footer-heading font-medium">
                  {method}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-neutral-500/20">
        <div className="max-w-7xl mx-auto px-lg py-md flex flex-col md:flex-row items-center justify-center gap-xs text-center">
          <p className="text-caption">
            &copy; {new Date().getFullYear()} {dict.meta.siteName}. {dict.footer.copyright}
          </p>
          <p className="text-caption">
            {dict.footer.company}
          </p>
        </div>
      </div>
    </footer>
  )
}
