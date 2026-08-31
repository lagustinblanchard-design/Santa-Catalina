import GoogleMapsLotMapGeo from '@/components/GoogleMapsLotMapGeo'
import WhatsAppButton from '@/components/WhatsAppButton'
import { LOTS, applyStatuses } from '@/lib/lots'
import { fetchLotStatuses } from '@/lib/sheets'

// VISTA PREVIA aislada — no enlazada desde la home. Replica el sistema del video
// (geolocalización en tiempo real) sin tocar la página de producción.
export const metadata = {
  title: 'Vista previa · Mapa con ubicación en tiempo real',
  robots: { index: false, follow: false },
}

export default async function MapaPreview() {
  let lots = LOTS
  try {
    const statuses = await fetchLotStatuses()
    lots = applyStatuses(statuses)
  } catch {
    // sheet no disponible — usa datos hardcodeados
  }

  return (
    <>
      <main>
        <GoogleMapsLotMapGeo lots={lots} />
      </main>
      <WhatsAppButton />
    </>
  )
}
