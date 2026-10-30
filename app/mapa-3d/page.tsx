import type { Metadata } from 'next'
import LotMap3D from '@/components/LotMap3D'
import { LOTS, applyStatuses } from '@/lib/lots'
import { fetchLotStatuses } from '@/lib/sheets'

// Showroom 3D del loteo (deck.gl + satélite). Enlazado desde el navbar y la sección de lotes.
// Descripción y canónica propias: antes heredaba la de la home (idéntica) y, como
// los links por lote/agente (?lote=…&ref=…) abren esta misma página, sin canónica
// cada uno contaba como una URL distinta.
export const metadata: Metadata = {
  title: 'Recorrido 3D del loteo Santa Catalina | Distrito Payé',
  description:
    'Recorré en 3D las 16 manzanas y los 306 lotes de Distrito Payé, en Corrientes: medidas, precio y disponibilidad de cada lote sobre fotos aéreas reales.',
  alternates: { canonical: '/mapa-3d' },
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
      {/* El mapa se dibuja en el navegador y mientras carga sólo hay un "Cargando…",
          así que el HTML que lee Google no tenía ningún título ni texto. Este bloque
          (sólo para lectores de pantalla y buscadores) dice qué es la página; coincide
          con lo que se ve en la portada del recorrido. */}
      <h1 className="sr-only">Recorrido 3D del loteo Santa Catalina, Corrientes</h1>
      <p className="sr-only">
        Explorá en 3D las 16 manzanas y los {lots.length} lotes de Distrito Payé, en Corrientes
        Capital. Cada lote muestra sus medidas, su precio y si está disponible, sobre fotos
        aéreas reales del loteo.
      </p>
      <LotMap3D lots={lots} />
    </main>
  )
}
