import Link from 'next/link'
import '@/styles/globals.css'

export default function NotFound() {
  return (
    <html lang="fr">
      <body style={{ backgroundColor: '#FEF9E9', margin: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <p
            style={{
              fontSize: 'clamp(6rem, 15vw, 10rem)',
              fontWeight: 800,
              lineHeight: 1,
              color: '#A2211E',
              margin: '0 0 16px 0',
            }}
          >
            404
          </p>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#1f2937',
              margin: '0 0 8px 0',
              textAlign: 'center',
            }}
          >
            Page introuvable
          </h1>
          <p
            style={{
              fontSize: '1rem',
              color: '#6b7280',
              margin: '0 0 40px 0',
              textAlign: 'center',
              maxWidth: '28rem',
            }}
          >
            La page que vous cherchez n&apos;existe pas ou a &eacute;t&eacute;
            d&eacute;plac&eacute;e.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 500,
              borderRadius: '9999px',
              backgroundColor: '#A2211E',
              color: '#ffffff',
              height: '48px',
              padding: '0 32px',
              fontSize: '1rem',
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'background-color 0.2s',
            }}
          >
            Retour &agrave; l&apos;accueil
          </Link>
        </div>
        <footer
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '24px',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#9ca3af',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <p style={{ fontWeight: 600, color: '#6b7280', margin: '0 0 4px 0' }}>
            Les Rem&egrave;des de Mamie
          </p>
          <p style={{ margin: 0 }}>&copy; 2026</p>
        </footer>
      </body>
    </html>
  )
}
