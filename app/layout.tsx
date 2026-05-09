import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Predios Santa Catalina — Segunda Preventa | RE/MAX PAYÉ',
  description:
    'Lotes residenciales y mixtos en Corrientes Capital. 14 manzanas, financiación en pesos y dólares. Comercializado por RE/MAX PAYÉ.',
  openGraph: {
    title: 'Predios Santa Catalina — Segunda Preventa',
    description: 'Lotes residenciales y mixtos en Corrientes Capital. Financiación disponible.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`h-full ${montserrat.variable}`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
