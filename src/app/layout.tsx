// src/app/layout.tsx
import type { Metadata } from 'next'
import { Barlow, Barlow_Condensed, Bebas_Neue } from 'next/font/google'
import './globals.css'

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const barlow = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Quiniela Mundial 2026',
  description: 'Predecí todos los partidos del Mundial 2026. Competí con familia y amigos.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Quiniela Mundial 2026 🏆',
    description: '¡Armá tus predicciones y competí con tu familia!',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bebas.variable} ${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="bg-pitch-900 text-[#F0EDE8] font-barlow antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
