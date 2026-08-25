/**
 * Geometría y paleta del plano esquemático del loteo, para el mapa de avance
 * de obra interactivo (components/project/AvanceObraMap.tsx).
 *
 * Estas constantes están duplicadas a propósito en
 * scripts/avance-images/plano.mjs, que genera las mismas imágenes de avance
 * pero en un script Node ESM plano que corre fuera del build de Next (no
 * puede importar un .ts). La duplicación es tolerable porque la geometría
 * está congelada por el plano de mensura aprobado por Catastro — ver
 * lib/geo/calibration.ts. Si algún día se desincroniza, mover los literales
 * a un JSON compartido (ej. lib/plano_geometry_extra.json) y leerlo desde
 * ambos lados, igual que ya se hace con lib/lot_geometry.json.
 *
 * Si tocás algo acá, actualizá también el espejo en plano.mjs.
 */

export const VB = { x: 100, y: 190, w: 830, h: 1660 } as const

export const PALETTE = {
  bone: '#F2ECE0',
  paper: '#FBF8F2',
  graphite: '#2E2A26',
  grayMid: '#6B6660',
  grayLight: '#D8D2C7',
  payeRed: '#AA1120',
  brown: '#8A6A47',
  greenFill: '#D9E8D2',
  greenStroke: '#5F8F5F',
  greenText: '#3A6B45',
  neutralFill: '#EDE7DB',
  neutralStroke: '#CFC6B4',
  neutralText: '#A79D8B',
  street: '#E4DED1',
  orange: '#E08A33',
  water: '#2B7FC4',
} as const

// Mz → letra catastral del plano de mensura.
export const BLOCK_LETTER: Record<number, string> = {
  1: 'L', 2: 'H', 3: 'D', 4: 'M', 5: 'K', 6: 'G', 7: 'C',
  8: 'J', 9: 'F', 10: 'B', 11: 'N', 12: 'I', 13: 'E', 14: 'A',
}

export type Reserva = { id: string; label: string; x: number; y: number; w: number; h: number }

// Reservas municipales — franja aparte, entre la grilla principal y el borde sur.
export const RESERVAS: Reserva[] = [
  { id: 'Reserva Municipal 2', label: 'Reserva Municipal 2', x: 154, y: 1398, w: 336, h: 192 },
  { id: 'Reserva Municipal 1', label: 'Reserva Municipal 1', x: 538, y: 1398, w: 342, h: 192 },
]

export type Rect = { x: number; y: number; w: number; h: number }
export type Sector = 'oeste' | 'este' | 'todos'

// Corredores de calle = huecos entre bboxes de manzanas, derivados de la grilla real.
const GRID = {
  colGaps: [[298, 346], [490, 538], [682, 730]] as const,
  rowGaps: [[603, 651], [988, 1037], [1374, 1398], [1590, 1640]] as const,
  left: 154, right: 880, top: 265, bottom: 1785,
}

// Las 7 manzanas con cordón cuneta ejecutado (8-14) más RM2 ocupan exactamente
// x 154→490: la mitad OESTE del loteo. Ahí cae el "sector oeste" del reporte.
const CORTE_OESTE_ESTE = 538

/** Recorta un corredor de calle al sector indicado ('oeste' | 'este' | 'todos'). */
function clipSector(r: Rect, sector: Sector): Rect | null {
  if (sector === 'todos') return r
  if (sector === 'este') {
    const x = Math.max(r.x, CORTE_OESTE_ESTE)
    const w = r.x + r.w - x
    return w > 0 ? { ...r, x, w } : null
  }
  const w = Math.min(r.w, CORTE_OESTE_ESTE - r.x)
  return w > 0 ? { ...r, w } : null
}

/** Rectángulos de todos los corredores de calle del loteo. */
function streetRects(): Rect[] {
  const { colGaps, rowGaps, left, right, top, bottom } = GRID
  const rects: Rect[] = []
  for (const [x0, x1] of colGaps) rects.push({ x: x0, y: top, w: x1 - x0, h: bottom - top })
  for (const [y0, y1] of rowGaps) rects.push({ x: left, y: y0, w: right - left, h: y1 - y0 })
  return rects
}

// Precalculado a nivel de módulo — geometría constante, no depende de props ni
// de estado. Nada de esto se recalcula por render.
export const STREET_RECTS: Rect[] = streetRects()

export const APERTURA_OESTE: Rect[] = STREET_RECTS
  .map((r) => clipSector(r, 'oeste'))
  .filter((r): r is Rect => r !== null)

// Trazado de la red sanitaria: cubre TODAS las calles del loteo, incluidas la
// fila de reservas y la fila Mz 11 / Mz 4 — confirmado por el owner. El único
// tramo pendiente (10%, punteado) es Mz 3 → Reserva Municipal 1; aparte hay 4
// cortes puntuales sin agua ni cloaca, confirmados por el owner sobre una
// captura anotada a mano (no se derivan de avance.json).
const mid = ([a, b]: readonly [number, number]) => (a + b) / 2

// Fin de la fila de manzanas numeradas (1-3): a partir de acá, las columnas
// exteriores se funden en un solo bloque ancho (Reserva Municipal / Mz 11 y
// Mz 4 ocupan dos columnas cada uno), así que sus líneas divisorias no siguen
// de largo — sólo el corredor central (real en toda la altura del loteo) sí.
const FILA3_FONDO = GRID.rowGaps[2][0]

export type RedVLine = { x: number; y1: number; y2: number }
export const RED_V: RedVLine[] = GRID.colGaps.map((gap, i) => ({
  x: mid(gap),
  y1: GRID.top,
  y2: i === 1 ? GRID.bottom : FILA3_FONDO,
}))

export const RED_H: number[] = GRID.rowGaps.map(mid)
export const RED_PERIMETRO = { left: GRID.left, right: GRID.right, top: GRID.top, bottom: GRID.bottom }

// El tramo pendiente (10%) va desde el techo de la manzana 3 hasta el piso de
// la Reserva Municipal 1 — no todo el borde este.
const PENDIENTE_INICIO = GRID.rowGaps[1][1] // techo de la Mz 3
const PENDIENTE_FIN = GRID.rowGaps[3][0]    // piso de la Reserva Municipal 1

// Borde este partido en 3 tramos: ejecutado / pendiente (punteado) / ejecutado.
export const RED_BORDE_ESTE: Array<{ y1: number; y2: number; pendiente: boolean }> = [
  { y1: GRID.top, y2: PENDIENTE_INICIO, pendiente: false },
  { y1: PENDIENTE_INICIO, y2: PENDIENTE_FIN, pendiente: true },
  { y1: PENDIENTE_FIN, y2: GRID.bottom, pendiente: false },
]

// Bocas de registro: sólo en los extremos del tramo pendiente (Mz 3 y
// Reserva Municipal 1) — no en cada cruce de fila de todo el borde.
export const RED_NODOS: Array<readonly [number, number]> = [PENDIENTE_INICIO, PENDIENTE_FIN]
  .map((y) => [GRID.right, y] as const)

export type Point = { x: number; y: number }

// Cortes puntuales sin agua ni cloaca — confirmados por el owner sobre una
// captura anotada a mano, no derivables de avance.json.
export const RED_CORTES: Point[] = [
  { x: GRID.right, y: mid(GRID.rowGaps[0]) },           // borde este, entre Mz 1 y Mz 2
  { x: GRID.right, y: mid(GRID.rowGaps[1]) },           // borde este, entre Mz 2 y Mz 3
  { x: GRID.left, y: mid(GRID.rowGaps[3]) },            // borde oeste, junto a Mz 11
  { x: mid(GRID.colGaps[1]), y: mid(GRID.rowGaps[3]) }, // corredor central, entre Mz 11 y Mz 4
]
export const RED_CORTE_ANCHO = 22 // medio-ancho del corte, en unidades del viewBox
