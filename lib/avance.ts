/**
 * Adaptador tipado sobre lib/avance.json, para el mapa de avance de obra
 * interactivo (components/project/AvanceObraMap.tsx y AvanceObraPanel.tsx).
 *
 * No editamos avance.json acá: es la fuente única del reporte mensual que
 * también alimenta scripts/avance-images/build.mjs (las imágenes de avance
 * que se publican en redes). Cualquier corrección de redacción del reporte
 * (por ej. si el mes que viene se decide contar las reservas municipales como
 * manzana en el propio PDF) se edita ahí, no acá.
 */

import AVANCE_RAW from '@/lib/avance.json'
import { SITE, type AvanceLayerId } from '@/lib/data'
import { PALETTE } from '@/lib/plano'

type Sector = 'oeste' | 'este' | 'todos'
const SECTORES: readonly Sector[] = ['oeste', 'este', 'todos']

// El campo crudo es `string` (JSON no tiene uniones literales) — angostamos
// con un fallback seguro en vez de castear a ciegas.
const rawSector: string = AVANCE_RAW.vial.aperturaCalles.sector
export const SECTOR: Sector = (SECTORES as readonly string[]).includes(rawSector)
  ? (rawSector as Sector)
  : 'oeste'

export const MZ_CORDON: number[] = AVANCE_RAW.vial.cordonCuneta.manzanas
export const RES_CORDON: string[] = AVANCE_RAW.vial.cordonCuneta.reservas

// El sitio cuenta las 2 reservas municipales como manzana (SITE.totalBlocks =
// 16, "confirmado por el owner" — ver lib/data.ts). El PDF de avance cuenta
// sólo las numeradas (14) y lista la Reserva Municipal 2 aparte. Derivamos
// SIEMPRE de los arrays + SITE.totalBlocks acá, y nunca leemos
// `totalManzanas` ni `resumen.tarjetas` de avance.json: esos campos son la
// redacción del reporte impreso tal como lo aprobó el cliente.
export const CORDON_EJECUTADAS = MZ_CORDON.length + RES_CORDON.length // 8
export const CORDON_TOTAL = SITE.totalBlocks // 16

export const AVANCE_MES = AVANCE_RAW.titulo // 'Julio 2026'

type Referencia = { kind: 'fill' | 'hatch' | 'line' | 'dashed' | 'dot'; color: string; label: string }

export type AvanceLayer = {
  id: AvanceLayerId
  titulo: string
  resumen: string
  color: string
  referencias: Referencia[]
  descripcionSvg: string
}

const refsVial = AVANCE_RAW.vial.referencias

export const AVANCE_LAYERS: Record<AvanceLayerId, AvanceLayer> = {
  cordon: {
    id: 'cordon',
    titulo: AVANCE_RAW.vial.cordonCuneta.label,
    resumen: `${CORDON_EJECUTADAS} de ${CORDON_TOTAL} manzanas ejecutadas`,
    color: PALETTE.greenStroke,
    referencias: [
      { kind: 'fill', color: PALETTE.greenFill, label: refsVial.manzana },
      { kind: 'fill', color: PALETTE.neutralFill, label: refsVial.obraEnAvance },
    ],
    descripcionSvg: AVANCE_RAW.vial.cordonCuneta.detalle,
  },
  ripio: {
    id: 'ripio',
    titulo: AVANCE_RAW.vial.aperturaCalles.label,
    resumen: AVANCE_RAW.vial.aperturaCalles.estado,
    color: PALETTE.orange,
    referencias: [
      { kind: 'hatch', color: PALETTE.orange, label: refsVial.apertura },
      { kind: 'fill', color: PALETTE.street, label: refsVial.enripiado },
    ],
    descripcionSvg: AVANCE_RAW.vial.aperturaCalles.detalle,
  },
  agua: {
    id: 'agua',
    titulo: AVANCE_RAW.redes.agua.label,
    resumen: `${AVANCE_RAW.redes.agua.pct}% ejecutado`,
    color: PALETTE.water,
    referencias: AVANCE_RAW.redes.agua.leyenda.map((label, i): Referencia => ({
      kind: i === 0 ? 'line' : i === 1 ? 'dashed' : 'dot',
      color: PALETTE.water,
      label,
    })),
    descripcionSvg: AVANCE_RAW.redes.bajada,
  },
  cloaca: {
    id: 'cloaca',
    titulo: AVANCE_RAW.redes.cloaca.label,
    resumen: `${AVANCE_RAW.redes.cloaca.pct}% ejecutado`,
    color: PALETTE.brown,
    referencias: AVANCE_RAW.redes.cloaca.leyenda.map((label, i): Referencia => ({
      kind: i === 0 ? 'line' : i === 1 ? 'dashed' : 'dot',
      color: PALETTE.brown,
      label,
    })),
    descripcionSvg: AVANCE_RAW.redes.bajada,
  },
}
