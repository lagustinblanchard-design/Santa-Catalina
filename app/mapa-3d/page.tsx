import LotMap3D from '@/components/LotMap3D'
import { LOTS, applyStatuses } from '@/lib/lots'
import { fetchLotStatuses } from '@/lib/sheets'

// VISTA PREVIA aislada — no enlazada desde la home. Showpiece 3D del loteo (deck.gl + satélite).
export const metadata = {
  title: 'Vista previa · Loteo Santa Catalina en 3D',
  robots: { index: false, follow: false },
}

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
