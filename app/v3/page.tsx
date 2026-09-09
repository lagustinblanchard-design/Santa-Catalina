import Navbar from '@/components/Navbar'
import HeroV3 from '@/components/v3/HeroV3'
import PageSections from '@/components/PageSections'
import SiteFooter from '@/components/SiteFooter'
import WhatsAppButton from '@/components/WhatsAppButton'
import { LOTS, applyStatuses } from '@/lib/lots'
import { fetchLotStatuses } from '@/lib/sheets'

// Experimento de Hero interactivo (4 banners + viñetas) — mismo contenido
// comercial que `/`. noindex mientras no esté decidido si reemplaza a `/`.
export const metadata = {
  robots: { index: false, follow: true },
}

// Disponibilidad de lotes: siempre en vivo, sin caché de página ni de datos
// (mismo fix que app/page.tsx).
export const dynamic = 'force-dynamic'

export default async function HomeV3() {
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
        <HeroV3 lots={lots} />
        <PageSections lots={lots} />
      </main>
      <SiteFooter />
      <WhatsAppButton />
    </>
  )
}
