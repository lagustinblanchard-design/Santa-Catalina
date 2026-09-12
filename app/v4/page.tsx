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

// Experimento 3D + scroll-driven (Fase 1 del plan: sticky de línea de tiempo
// sólo con stills, sin deck.gl todavía — ver plan en
// C:\Users\agusj\.claude\plans\tenemos-herramientas-skills-para-mejorar-abstract-honey.md).
// noindex, no reemplaza a `/`.
export const metadata = {
  robots: { index: false, follow: true },
}

// Disponibilidad de lotes: siempre en vivo, sin caché de página ni de datos
// (mismo fix que app/page.tsx, app/v2 y app/v3).
export const dynamic = 'force-dynamic'

export default async function HomeV4() {
  let lots = LOTS
  try {
    const statuses = await fetchLotStatuses()
    lots = applyStatuses(statuses)
  } catch {
    // sheet no disponible — usa datos hardcodeados
  }

  return (
    <>
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
