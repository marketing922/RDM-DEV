import Link from 'next/link'

export default function NotFound() {
  return (
    <html lang="fr">
      <body className="bg-page text-neutral-600 font-body antialiased">
        <div className="min-h-screen flex flex-col items-center justify-center px-lg">
          <p className="font-heading text-display text-brand mb-md">404</p>
          <h1 className="font-heading text-h1 text-neutral-600 mb-xs text-center">
            Page non trouvee
          </h1>
          <p className="font-body text-body-lg text-neutral-400 mb-2xl text-center max-w-md">
            La page que vous recherchez n&apos;existe pas ou a ete deplacee.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-md">
            <Link
              href="/"
              className="inline-flex items-center justify-center font-ui font-medium rounded-xl transition-all duration-200 transform will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 bg-brand text-white hover:bg-brand-dark active:scale-[0.97] shadow-sm hover:shadow-md h-[44px] px-lg text-body"
            >
              Retour a l&apos;accueil
            </Link>
            <Link
              href="/fr/plantes"
              className="inline-flex items-center justify-center font-ui font-medium rounded-xl transition-all duration-200 transform will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 bg-transparent text-brand border-2 border-brand hover:bg-brand hover:text-white active:scale-[0.97] h-[44px] px-lg text-body"
            >
              Explorer les plantes
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
