import type { Metadata } from 'next'
import { Montserrat, Cinzel, Josefin_Sans } from 'next/font/google'
import { SITE } from '@/lib/data'
import { SITE_URL } from '@/lib/site-url'
import CookieBanner from '@/components/CookieBanner'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

// Cinzel/Josefin cargan acá (raíz) en vez de sólo en app/v2/layout.tsx para que
// /mapa-3d — ruta hermana de v2, no un hijo de app/v2/ — también pueda usarlas (ver
// Fase 5.2 del plan de motion: el overlay del showroom 3D pasa al vocabulario de v2).
const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const josefin = Josefin_Sans({
  subsets: ['latin'],
  variable: '--font-josefin',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE.name} — ${SITE.stage} | RE/MAX PAYÉ`,
  description:
    `Lotes residenciales y mixtos en Corrientes Capital. ${SITE.totalBlocks} manzanas, financiación en pesos y dólares. Comercializado por RE/MAX PAYÉ.`,
  openGraph: {
    title: `${SITE.name} — ${SITE.stage}`,
    description: 'Lotes residenciales y mixtos en Corrientes Capital. Financiación disponible.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`h-full ${montserrat.variable} ${cinzel.variable} ${josefin.variable}`}>
      <body className="min-h-full">
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
