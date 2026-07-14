import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gerak Dulu',
  description: 'Bantu ojol tahu harus ke mana',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-512.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <meta name="theme-color" content="#ff6b00" />
      </head>
      <body>{children}</body>
    </html>
  )
}