import LotMap3D from '@/components/LotMap3D'
import { LOTS, applyStatuses } from '@/lib/lots'
import { fetchLotStatuses } from '@/lib/sheets'

// Showroom 3D del loteo (deck.gl + satélite). Enlazado desde el navbar y la sección de lotes.
export const metadata = {
  title: 'Recorrido 3D · Loteo Santa Catalina',
}

// Disponibilidad de lotes: siempre en vivo, sin caché de página ni de datos.
export const dynamic = 'force-dynamic'

export default async function Mapa3DPreview() {
  let lots = LOTS
  try {
    const statuses = await fetchLotStatuses()
    lots = applyStatuses(statuses)
  } catch {
    // sheet no disponible — usa datos hardcodeados
  }

  return (
    <main className="fixed inset-0 h-dvh w-dvw bg-gray-900">
      <LotMap3D lots={lots} />
    </main>
  )
}
