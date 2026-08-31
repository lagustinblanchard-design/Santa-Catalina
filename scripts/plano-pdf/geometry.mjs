/**
 * Geometría del plano imprimible: rotación, escala y derivados.
 *
 * Funciones puras, sin I/O. La geometría cruda sale de lib/lot_geometry.json,
 * el mismo archivo que usa components/InteractiveLotMap.tsx.
 */

export const PX_PER_M = 2.4          // unidades SVG por metro
export const MM_PER_PX = 25.4 / 96   // 1 px CSS en mm

// viewBox del plano completo — espejo de components/InteractiveLotMap.tsx:31
export const VB = { x: 100, y: 190, w: 830, h: 1660 }

// Corredores de calle — espejo de scripts/avance-images/plano.mjs:37-41
export const GRID = {
  colGaps: [[298, 346], [490, 538], [682, 730]],
  rowGaps: [[603, 651], [988, 1037], [1374, 1398], [1590, 1640]],
  left: 154, right: 880, top: 265, bottom: 1785,
}

// Reservas municipales — espejo de components/InteractiveLotMap.tsx:41-44
export const RESERVAS = [
  { x: 154, y: 1398, w: 336, h: 192, label: 'Reserva Municipal 2' },
  { x: 538, y: 1398, w: 342, h: 192, label: 'Reserva Municipal 1' },
]

/**
 * Rota 90° antihorario: (x,y) → (y,−x). Un rect axis-aligned sigue siéndolo,
 * así que no hace falta ningún <g transform>: rotar con transform rotaría también
 * las tramas (la diagonal a 45° pasaría a 135°, intercambiando VENDIDO con
 * FIDEICOMISO) y obligaría a contrarrotar cada <text>.
 *
 * Como y crece hacia el sur, el norte (0,−1) queda mapeado a (−1,0): apunta a la
 * IZQUIERDA de la hoja. El este queda arriba.
 */
export function rotateRect([x0, y0, x1, y1]) {
  return [y0, -x1, y1, -x0]
}

/** Nombre de la calle que linda con un borde, o null si es límite del loteo. */
function streetFor(edge, coord) {
  if (edge === 'north') return coord === GRID.top ? 'Calle Pública (Norte)' : 'Calle interna'
  if (edge === 'east')  return coord === GRID.right ? 'Av. Dalmasio Esquivel (asfalto)' : 'Calle interna'
  if (edge === 'south') {
    if (coord === GRID.bottom) return 'Av. Tito Aranda (ripio)'
    if (coord === 1374) return 'Calle Pública (Sur)'
    return 'Calle interna'
  }
  // west: x=154 es el límite oeste del loteo, no una calle
  return coord === GRID.left ? null : 'Calle interna'
}

/**
 * Layout de una manzana para su hoja.
 *
 * Las 12 manzanas verticales (~144×338) se rotan para que entren apaisadas; las
 * manzanas 4 y 11 ya son horizontales (~342×145) y se dejan como están. Así las 14
 * caen en la misma escala (~3,1) y comparten un único layout.
 */
export function layoutBlock(block, bbox, lotRects, { useW, useH, pad = 30 }) {
  const [gx0, gy0, gx1, gy1] = bbox
  const rotated = (gy1 - gy0) > (gx1 - gx0)

  const tx = rotated ? rotateRect : (r) => r
  const [bx0, by0, bx1, by1] = tx(bbox)

  const rects = new Map()
  for (const [id, r] of lotRects) rects.set(id, tx(r))

  const w = bx1 - bx0, h = by1 - by0
  const scale = Math.min(useW / (w + pad * 2), useH / (h + pad * 2))

  // Qué calle cae en cada borde de la HOJA. Rotado: izquierda=norte, arriba=este.
  const geo = {
    north: streetFor('north', gy0), south: streetFor('south', gy1),
    west:  streetFor('west',  gx0), east:  streetFor('east',  gx1),
  }
  const edges = rotated
    ? { left: geo.north, right: geo.south, top: geo.east,  bottom: geo.west }
    : { top:  geo.north, bottom: geo.south, left: geo.west, right: geo.east }

  return {
    rotated, scale, rects,
    block: [bx0, by0, bx1, by1],
    viewBox: `${bx0 - pad} ${by0 - pad} ${w + pad * 2} ${h + pad * 2}`,
    edges,
  }
}

/**
 * Paso de trama en unidades SVG para que en papel mida ~1,6 mm.
 *
 * patternUnits="userSpaceOnUse" mide en unidades SVG, que se multiplican por la
 * escala de cada página: un paso fijo de 14 unidades a escala 3,1 saldría de 11,4 mm
 * en papel, más grueso que medio lote. Por eso se calcula por página.
 */
export function hatchStep(scale) {
  return 1.6 / (MM_PER_PX * scale)
}

/**
 * Segmentos de línea para dibujar una trama diagonal/vertical DENTRO de un rect,
 * ya recortados a sus bordes.
 *
 * Se calculan a mano (Liang-Barsky) en vez de usar <pattern>: Chrome rasteriza cada
 * celda de un <pattern> como una imagen PNG independiente al exportar a PDF — en un
 * lote grande con paso chico eso son cientos de celdas, y sobre 150 lotes con trama
 * el PDF entero salía de ~93 MB. Líneas <line> vectoriales no tienen ese problema:
 * el mismo documento baja a menos de 1 MB.
 */
function clipLineToRect(x0, y0, x1, y1, rx0, ry0, rx1, ry1) {
  let t0 = 0, t1 = 1
  const dx = x1 - x0, dy = y1 - y0
  const p = [-dx, dx, -dy, dy]
  const q = [x0 - rx0, rx1 - x0, y0 - ry0, ry1 - y0]
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null
    } else {
      const r = q[i] / p[i]
      if (p[i] < 0) { if (r > t1) return null; if (r > t0) t0 = r }
      else { if (r < t0) return null; if (r < t1) t1 = r }
    }
  }
  return [x0 + t0 * dx, y0 + t0 * dy, x0 + t1 * dx, y0 + t1 * dy]
}

export function hatchSegments(x0, y0, x1, y1, angleDeg, step) {
  const theta = (angleDeg * Math.PI) / 180
  const dx = Math.cos(theta), dy = Math.sin(theta)
  const nx = -dy, ny = dx
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  const diag = Math.hypot(x1 - x0, y1 - y0)
  const n = Math.ceil(diag / 2 / step)

  const segments = []
  for (let i = -n; i <= n; i++) {
    const c = i * step
    const px = cx + nx * c, py = cy + ny * c
    const seg = clipLineToRect(px - dx * diag, py - dy * diag, px + dx * diag, py + dy * diag, x0, y0, x1, y1)
    if (seg) segments.push(seg)
  }
  return segments
}

/** Ángulos por tipo de trama; 'cross' combina dos familias de líneas. */
export const HATCH_ANGLES = { diag45: [45], diag135: [135], vert90: [90], cross: [45, 135], none: [] }

/** Barra de escala gráfica: elige una cantidad redonda de metros cercana a `targetMm`. */
export function scaleBarSpec(scale, targetMm = 40) {
  const mmPerM = PX_PER_M * scale * MM_PER_PX
  const raw = targetMm / mmPerM
  const nice = [5, 10, 20, 25, 50, 100, 200].reduce(
    (best, n) => (Math.abs(n - raw) < Math.abs(best - raw) ? n : best)
  )
  return { metres: nice, units: nice * PX_PER_M, mm: nice * mmPerM }
}
