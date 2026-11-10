import type { Metadata } from 'next'
import { SITE } from '@/lib/data'
import Navbar from '@/components/Navbar'
import HeroV4 from '@/components/v4/HeroV4'
import TimelineStage from '@/components/v4/TimelineStage'
import PageSections from '@/components/PageSections'
import RendersV4 from '@/components/v4/RendersV4'
import CierreV4 from '@/components/v4/CierreV4'
import SiteFooter from '@/components/SiteFooter'
import WhatsAppButton from '@/components/WhatsAppButton'
import PiluChat from '@/components/pilu/PiluChat'
import { LOTS, applyStatuses } from '@/lib/lots'
import { fetchLotStatuses } from '@/lib/sheets'
import { listingJsonLd, faqJsonLd } from '@/lib/structured-data'

// Título/descripción propios de la home con la frase que la gente busca ("lotes en
// Corrientes"); antes heredaba el genérico del layout, que no la tenía. La canónica es
// obligatoria acá: los links de agente (?ref=…) y de campaña (?utm_…, ?fbclid=…) abren
// esta misma página con otra URL, y sin canónica Google las trata como copias.
const TITLE = `Lotes y terrenos en Corrientes Capital, en cuotas | ${SITE.name}`
const DESCRIPTION =
  `Lotes y terrenos en Santa Catalina, Corrientes Capital: ${SITE.totalBlocks} manzanas aprobadas, ` +
  `financiación en cuotas en pesos y dólares, escritura. Comercializa ${SITE.broker}.`
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', url: '/' },
}

// V4 (antes en /v4, ver git log) pasó a ser la versión oficial y única de cara
// al público — /v4 ahora redirige acá (ver next.config.ts). Disponibilidad de
// lotes: siempre en vivo, sin caché de página ni de datos.
export const dynamic = 'force-dynamic'

export default async function Home() {
  let lots = LOTS
  try {
    const statuses = await fetchLotStatuses()
    lots = applyStatuses(statuses)
  } catch {
    // sheet no disponible — usa datos hardcodeados
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd()) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />
      <Navbar />
      <main>
        <HeroV4 lots={lots} />
        <TimelineStage lots={lots} />
        <PageSections lots={lots} />
        <RendersV4 />
        <CierreV4 />
      </main>
      <SiteFooter />
      <WhatsAppButton />
      {/* Pilu: apagado hasta que exista NEXT_PUBLIC_PILU_API_URL (ver lib/pilu.ts). Solo en la home. */}
      <PiluChat />
    </>
  )
}
