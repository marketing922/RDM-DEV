import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Site en maintenance — Les Remèdes de Mamie',
  description: 'Notre site est en cours de maintenance. Nous revenons très bientôt.',
}

export default function MaintenancePage() {
  return (
    <html lang="fr">
      <body style={{ margin: 0, backgroundColor: '#FEF9E9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          {/* Logo */}
          <img
            src="https://res.cloudinary.com/laboratoire-calebasse/image/upload/v1761315097/RM_logo_2297718b45.png"
            alt="Les Remèdes de Mamie"
            style={{ width: '180px', height: 'auto', marginBottom: '40px' }}
          />

          {/* Icône maintenance */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#FFF5D5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D0802C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#054A57',
              margin: '0 0 12px 0',
            }}
          >
            Site en maintenance
          </h1>

          <p
            style={{
              fontSize: '1.125rem',
              color: '#712E2F',
              opacity: 0.7,
              margin: '0 0 8px 0',
              maxWidth: '500px',
              lineHeight: 1.6,
            }}
          >
            Nous travaillons actuellement sur notre site pour vous offrir
            une meilleure expérience.
          </p>

          <p
            style={{
              fontSize: '1rem',
              color: '#712E2F',
              opacity: 0.5,
              margin: '0 0 40px 0',
            }}
          >
            Nous revenons très bientôt.
          </p>

          {/* Contact */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DCD8C7',
              borderRadius: '12px',
              padding: '20px 32px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#A2211E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <a
              href="mailto:contact@remedes-mamie.com"
              style={{
                color: '#A2211E',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              contact@remedes-mamie.com
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '24px',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#9ca3af',
          }}
        >
          <p style={{ margin: 0 }}>
            &copy; 2026 Les Rem&egrave;des de Mamie — SAS CALEBASSE
          </p>
        </footer>
      </body>
    </html>
  )
}
