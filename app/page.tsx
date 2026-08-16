import Navbar from '@/components/Navbar'
import { SITE } from '@/lib/data'
import Hero from '@/components/Hero'
import ProjectInfo from '@/components/ProjectInfo'
import GoogleMapsLotMap from '@/components/GoogleMapsLotMap'
import PriceCalculator from '@/components/PriceCalculator'
import Financing from '@/components/Financing'
import Zoning from '@/components/Zoning'
import Gallery from '@/components/Gallery'
import ContactForm from '@/components/ContactForm'
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
        <ProjectInfo />
        <GoogleMapsLotMap lots={lots} />
        <PriceCalculator />
        <Financing />
        <Zoning />
        <Gallery />
        <ContactForm />
      </main>
      <footer className="py-10 text-center text-sm" style={{ background: '#2E2A26', color: '#6B6660' }}>
        <p className="font-bold text-white">RE/MAX PAYÉ · Corrientes Capital</p>
        <p className="mt-1" style={{ color: '#D8D2C7' }}>{SITE.name} — {SITE.stage} · Ord. N.º 7403</p>
        <p className="mt-3 text-xs" style={{ color: '#6B6660' }}>Precios en USD. Sujeto a disponibilidad. Honorarios no incluidos.</p>
      </footer>
      <WhatsAppButton />
    </>
  )
}
