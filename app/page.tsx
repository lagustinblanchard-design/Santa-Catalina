import Navbar from '@/components/Navbar'
import HeroV4 from '@/components/v4/HeroV4'
import TimelineStage from '@/components/v4/TimelineStage'
import PageSections from '@/components/PageSections'
import RendersV4 from '@/components/v4/RendersV4'
import CierreV4 from '@/components/v4/CierreV4'
import SiteFooter from '@/components/SiteFooter'
import WhatsAppButton from '@/components/WhatsAppButton'
import { LOTS, applyStatuses } from '@/lib/lots'
import { fetchLotStatuses } from '@/lib/sheets'
import { listingJsonLd } from '@/lib/structured-data'

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
    </>
  )
}
