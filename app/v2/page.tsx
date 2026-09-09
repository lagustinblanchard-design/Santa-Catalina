import NavbarV2 from '@/components/v2/NavbarV2'
import HeroV2 from '@/components/v2/HeroV2'
import ProjectInfoV2 from '@/components/v2/ProjectInfoV2'
import InteractiveLotMap from '@/components/InteractiveLotMap'
import PriceCalculatorV2 from '@/components/v2/PriceCalculatorV2'
import FinancingV2 from '@/components/v2/FinancingV2'
import ZoningV2 from '@/components/v2/ZoningV2'
import GalleryV2 from '@/components/v2/GalleryV2'
import ContactFormV2 from '@/components/v2/ContactFormV2'
import ChatWidgetV2 from '@/components/v2/ChatWidgetV2'
import WhatsAppButton from '@/components/WhatsAppButton'
import Link from 'next/link'
import { LOTS, applyStatuses } from '@/lib/lots'
import { fetchLotStatuses } from '@/lib/sheets'

// Rediseño en curso — mismo contenido comercial que `/`. noindex para no competir
// con la home en buscadores mientras no esté decidido si reemplaza a `/` o se descarta.
export const metadata = {
  robots: { index: false, follow: true },
}

// Disponibilidad de lotes: siempre en vivo, sin caché de página ni de datos
// (mismo fix que app/page.tsx y app/mapa-3d/page.tsx).
export const dynamic = 'force-dynamic'

export default async function HomeV2() {
  let lots = LOTS
  try {
    const statuses = await fetchLotStatuses()
    lots = applyStatuses(statuses)
  } catch {
    // fallback to static data
  }

  return (
    <>
      <NavbarV2 />
      <main>
        <HeroV2 />
        <ProjectInfoV2 />
        <InteractiveLotMap lots={lots} />
        <PriceCalculatorV2 />
        <FinancingV2 />
        <ZoningV2 />
        <GalleryV2 />
        <ContactFormV2 />
      </main>
      <footer style={{
        background: '#000',
        borderTop: '1px solid #1a1a1a',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}>
        <p style={{ color: '#555', fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          RE/MAX PAYÉ · Corrientes Capital
        </p>
        <p style={{ color: '#333', fontSize: '0.65rem' }}>
          Predios Santa Catalina — Segunda Preventa · Ord. N.º 7403
        </p>
        <p style={{ color: '#444', fontSize: '0.65rem', marginTop: '1rem' }}>
          <Link href="/privacidad" style={{ color: '#444', textDecoration: 'underline' }}>Política de privacidad</Link>
          {' · '}
          <Link href="/terminos" style={{ color: '#444', textDecoration: 'underline' }}>Términos y condiciones</Link>
        </p>
        <p style={{ color: '#222', fontSize: '0.6rem', marginTop: '0.75rem' }}>
          Precios en USD. Sujeto a disponibilidad. Honorarios no incluidos.
        </p>
      </footer>
      <WhatsAppButton isRaised />
      <ChatWidgetV2 />
    </>
  )
}
