export default function MonitoringLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>Monitoring — RDM</title>
      </head>
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: '#0b0f14',
          color: '#e5e9f0',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  )
}
