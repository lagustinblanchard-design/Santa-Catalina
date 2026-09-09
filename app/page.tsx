import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import PageSections from '@/components/PageSections'
import SiteFooter from '@/components/SiteFooter'
import WhatsAppButton from '@/components/WhatsAppButton'
import { LOTS, applyStatuses } from '@/lib/lots'
import { fetchLotStatuses } from '@/lib/sheets'

// Disponibilidad de lotes: siempre en vivo, sin caché de página ni de datos.
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
      <Navbar />
      <main>
        <Hero />
        <PageSections lots={lots} />
      </main>
      <SiteFooter />
      <WhatsAppButton />
    </>
  )
}
