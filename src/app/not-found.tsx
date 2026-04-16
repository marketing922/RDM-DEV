import Link from 'next/link'

export default function NotFound() {
  return (
    <html lang="fr">
      <body className="bg-[#FEF9E9] text-gray-600 antialiased">
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <p className="text-[8rem] sm:text-[10rem] font-extrabold leading-none text-[#A2211E] mb-4">
            404
          </p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Page introuvable
          </h1>
          <p className="text-base text-gray-500 mb-10 text-center max-w-md">
            La page que vous cherchez n&apos;existe pas ou a &eacute;t&eacute; d&eacute;plac&eacute;e.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 bg-[#A2211E] text-white hover:bg-[#712E2F] active:scale-[0.97] shadow-sm hover:shadow-md h-[48px] px-8 text-base w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A2211E]/50 focus-visible:ring-offset-2"
          >
            Retour &agrave; l&apos;accueil
          </Link>
        </div>
        <footer className="absolute bottom-0 w-full py-6 text-center text-sm text-gray-400">
          <p className="font-semibold text-gray-500">Les Rem&egrave;des de Mamie</p>
          <p>&copy; 2026</p>
        </footer>
      </body>
    </html>
  )
}
