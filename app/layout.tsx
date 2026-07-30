import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

// Preferí NEXT_PUBLIC_SITE_URL en Vercel (dominio custom estable) una vez confirmado.
// VERCEL_URL lo inyecta Vercel automáticamente en cada deploy (preview o producción) —
// sin eso, las URLs de Open Graph salen relativas y WhatsApp/Telegram no muestran imagen.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Predios Santa Catalina — Segunda Preventa | RE/MAX PAYÉ',
  description:
    'Lotes residenciales y mixtos en Corrientes Capital. 14 manzanas, financiación en pesos y dólares. Comercializado por RE/MAX PAYÉ.',
  openGraph: {
    title: 'Predios Santa Catalina — Segunda Preventa',
    description: 'Lotes residenciales y mixtos en Corrientes Capital. Financiación disponible.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`h-full ${montserrat.variable}`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
