import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return {
    title: dict.contact.title,
    description: dict.contact.subtitle,
  }
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <>
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-lg">
          <Breadcrumb
            items={[
              { label: dict.nav.home, href: `/${locale}` },
              { label: dict.contact.title },
            ]}
          />
        </div>
      </section>

      <section className="py-4xl">
        <div className="max-w-7xl mx-auto px-lg">
          <div className="text-center mb-2xl">
            <h1 className="font-heading text-display text-neutral-600 mb-xs">
              {dict.contact.title}
            </h1>
            <p className="font-body text-body-lg text-neutral-400 max-w-2xl mx-auto">
              {dict.contact.subtitle}
            </p>
          </div>

          {/* Mobile: info cards first, then form. Desktop: form left, info right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2xl">
            {/* Info cards - shown first on mobile (order-1 mobile, order-2 desktop) */}
            <div className="order-1 lg:order-2 lg:col-span-1 space-y-md">
              {/* Address */}
              <Card className="p-lg hover:translate-y-0">
                <div className="flex items-start gap-md">
                  <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-ui font-medium text-neutral-600 mb-xs">
                      {dict.contact.info.address}
                    </h3>
                    <p className="font-body text-body-sm text-neutral-400">
                      12 rue des Plantes<br />75014 Paris, France
                    </p>
                  </div>
                </div>
              </Card>

              {/* Phone */}
              <Card className="p-lg hover:translate-y-0">
                <div className="flex items-start gap-md">
                  <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-ui font-medium text-neutral-600 mb-xs">
                      {dict.contact.info.phone}
                    </h3>
                    <p className="font-body text-body-sm text-neutral-400">
                      +33 1 23 45 67 89
                    </p>
                  </div>
                </div>
              </Card>

              {/* Email */}
              <Card className="p-lg hover:translate-y-0">
                <div className="flex items-start gap-md">
                  <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-ui font-medium text-neutral-600 mb-xs">
                      {dict.contact.info.email}
                    </h3>
                    <p className="font-body text-body-sm text-neutral-400">
                      contact@remedes-mamie.com
                    </p>
                  </div>
                </div>
              </Card>

              {/* Hours */}
              <Card className="p-lg hover:translate-y-0">
                <div className="flex items-start gap-md">
                  <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-ui font-medium text-neutral-600 mb-xs">
                      {dict.contact.info.hours}
                    </h3>
                    <p className="font-body text-body-sm text-neutral-400">
                      Lun - Ven : 9h - 18h<br />Sam : 10h - 16h
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="order-2 lg:order-1 lg:col-span-2">
              <Card className="p-xl hover:translate-y-0">
                <form className="space-y-lg">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block font-ui text-body-sm font-medium text-neutral-600 mb-xs"
                    >
                      {dict.contact.form.name}
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      className="w-full h-11 px-3.5 bg-white border border-neutral-200 rounded-lg font-body text-body text-neutral-600 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block font-ui text-body-sm font-medium text-neutral-600 mb-xs"
                    >
                      {dict.contact.form.email}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      className="w-full h-11 px-3.5 bg-white border border-neutral-200 rounded-lg font-body text-body text-neutral-600 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block font-ui text-body-sm font-medium text-neutral-600 mb-xs"
                    >
                      {dict.contact.form.subject}
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      className="w-full h-11 px-3.5 bg-white border border-neutral-200 rounded-lg font-body text-body text-neutral-600 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block font-ui text-body-sm font-medium text-neutral-600 mb-xs"
                    >
                      {dict.contact.form.message}
                    </label>
                    <textarea
                      id="contact-message"
                      rows={6}
                      className="w-full px-3.5 py-3 bg-white border border-neutral-200 rounded-lg font-body text-body text-neutral-600 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200 resize-vertical"
                    />
                  </div>

                  <Button variant="primary" size="lg" type="submit" className="w-full sm:w-auto">
                    {dict.contact.form.send}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="h-14 lg:hidden" />
    </>
  )
}
