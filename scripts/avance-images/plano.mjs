/**
 * Plano del loteo Santa Catalina en SVG, para las imágenes de avance de obra.
 *
 * La geometría sale de lib/lot_geometry.json — el MISMO archivo que usa
 * components/InteractiveLotMap.tsx, cuyo comentario aclara que el viewBox
 * "matches PDF coordinate space". Por eso el plano acá es idéntico al del
 * PDF de avance: no se redibuja nada a mano.
 *
 * Las constantes VB, PALETTE, BLOCK_LETTER, RESERVAS y GRID de este archivo
 * están duplicadas a propósito en lib/plano.ts, de donde las toma el mapa de
 * avance interactivo del sitio (components/project/AvanceObraMap.tsx). Este
 * script es Node ESM plano y corre fuera del build de Next, así que no puede
 * importar un .ts. La duplicación es tolerable porque la geometría está
 * congelada por el plano de mensura aprobado (ver lib/geo/calibration.ts). Si
 * algún día se desincroniza, mover los literales a un JSON compartido y
 * leerlo con readFileSync acá, igual que ya se hace con lot_geometry.json.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')

const GEO = JSON.parse(readFileSync(path.join(ROOT, 'lib', 'lot_geometry.json'), 'utf8'))
const BBOXES = GEO.bboxes

// viewBox — espejo de components/InteractiveLotMap.tsx:31
export const VB = { x: 100, y: 190, w: 830, h: 1660 }

// Mz → letra catastral — espejo de components/InteractiveLotMap.tsx:35-38
const BLOCK_LETTER = {
  1: 'L', 2: 'H', 3: 'D', 4: 'M', 5: 'K', 6: 'G', 7: 'C',
  8: 'J', 9: 'F', 10: 'B', 11: 'N', 12: 'I', 13: 'E', 14: 'A',
}

// Reservas municipales — espejo de components/InteractiveLotMap.tsx:41-44
const RESERVAS = [
  { x: 154, y: 1398, w: 336, h: 192, label: 'Reserva Municipal 2', id: 'Reserva Municipal 2' },
  { x: 538, y: 1398, w: 342, h: 192, label: 'Reserva Municipal 1', id: 'Reserva Municipal 1' },
]

// Corredores de calle = los huecos entre bboxes de manzanas. Se derivan del
// grid real (columnas 154-298 / 346-490 / 538-682 / 730-880) en vez de hardcodearse.
const GRID = {
  colGaps: [[298, 346], [490, 538], [682, 730]],
  rowGaps: [[603, 651], [988, 1037], [1374, 1398], [1590, 1640]],
  left: 154, right: 880, top: 265, bottom: 1785,
}

// Las 7 manzanas con cordón cuneta ejecutado (8-14) más RM2 ocupan exactamente
// x 154→490: la mitad OESTE del loteo. Ese es el "sector oeste" del reporte.
// El corte entre oeste y este cae en el corredor 490-538.
const CORTE_OESTE_ESTE = 538

/** Recorta un corredor de calle al sector indicado ('oeste' | 'este' | 'todos'). */
function clipSector(r, sector) {
  if (sector === 'todos') return r
  if (sector === 'este') {
    const x = Math.max(r.x, CORTE_OESTE_ESTE)
    const w = r.x + r.w - x
    return w > 0 ? { ...r, x, w } : null
  }
  // oeste (default)
  const w = Math.min(r.w, CORTE_OESTE_ESTE - r.x)
  return w > 0 ? { ...r, w } : null
}

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
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Rectángulos de todos los corredores de calle del loteo. */
function streetRects() {
  const { colGaps, rowGaps, left, right, top, bottom } = GRID
  const rects = []
  for (const [x0, x1] of colGaps) rects.push({ x: x0, y: top, w: x1 - x0, h: bottom - top })
  for (const [y0, y1] of rowGaps) rects.push({ x: left, y: y0, w: right - left, h: y1 - y0 })
  return rects
}

/**
 * Plano de infraestructura vial: manzanas ejecutadas en verde y trazado de
 * apertura de calles tramado sobre los corredores del sector oeste.
 */
export function planoVial({ manzanas = [], reservas = [], sector = 'oeste' } = {}) {
  const P = PALETTE
  const done = new Set(manzanas)
  const doneRes = new Set(reservas)

  const streets = streetRects()
    .map(r => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${P.street}"/>`)
    .join('')

  // Apertura de calles: los corredores del sector declarado en lib/avance.json.
  const apertura = streetRects()
    .map(r => clipSector(r, sector))
    .filter(Boolean)
    .map(r => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="url(#hatch)" stroke="${P.orange}" stroke-width="1.2"/>`)
    .join('')

  const bloques = Object.keys(BBOXES).map(k => {
    const n = Number(k)
    const [x0, y0, x1, y1] = BBOXES[k]
    const w = x1 - x0, h = y1 - y0
    const on = done.has(n)
    const fill = on ? P.greenFill : P.neutralFill
    const stroke = on ? P.greenStroke : P.neutralStroke
    const text = on ? P.greenText : P.neutralText
    return `<g>
      <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="${on ? 2.6 : 1.4}"/>
      <text x="${x0 + w / 2}" y="${y0 + h / 2 - 2}" text-anchor="middle" font-size="30" font-weight="800" fill="${text}">Mz ${n}</text>
      <text x="${x0 + w / 2}" y="${y0 + h / 2 + 26}" text-anchor="middle" font-size="19" font-weight="600" fill="${text}" opacity="0.75">${BLOCK_LETTER[n]}</text>
    </g>`
  }).join('')

  const reservasSvg = RESERVAS.map(r => {
    const on = doneRes.has(r.id)
    const fill = on ? P.greenFill : P.neutralFill
    const stroke = on ? P.greenStroke : P.neutralStroke
    const text = on ? P.greenText : P.neutralText
    return `<g>
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="${on ? 2.6 : 1.4}" stroke-dasharray="${on ? 'none' : '10 6'}"/>
      <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 7}" text-anchor="middle" font-size="20" font-weight="700" fill="${text}">${esc(r.label)}</text>
    </g>`
  }).join('')

  return `<svg viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <pattern id="hatch" width="14" height="14" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="${P.orange}" opacity="0.16"/>
        <line x1="0" y1="0" x2="0" y2="14" stroke="${P.orange}" stroke-width="7" opacity="0.85"/>
      </pattern>
    </defs>
    <rect x="${VB.x}" y="${VB.y}" width="${VB.w}" height="${VB.h}" fill="${P.paper}"/>
    ${streets}
    ${apertura}
    ${reservasSvg}
    ${bloques}
    ${northArrow()}
    ${streetLabels()}
  </svg>`
}

/**
 * Esquema de red sanitaria: el trazado recorre las calles; el tramo del extremo
 * este queda punteado y representa el porcentaje pendiente.
 */
export function planoRed({ color }) {
  const P = PALETTE
  const { colGaps, rowGaps, left, right, top, bottom } = GRID
  const mid = ([a, b]) => (a + b) / 2

  const bloques = Object.keys(BBOXES).map(k => {
    const [x0, y0, x1, y1] = BBOXES[k]
    return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="4" fill="${P.neutralFill}" stroke="${P.neutralStroke}" stroke-width="1.2"/>`
  }).join('')

  const reservasSvg = RESERVAS.map(r =>
    `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="4" fill="${P.neutralFill}" stroke="${P.neutralStroke}" stroke-width="1.2" stroke-dasharray="10 6"/>`
  ).join('')

  // La red sanitaria cubre TODAS las calles del loteo, incluidas la fila de
  // reservas y la fila Mz 11 / Mz 4 — confirmado por el owner. Fin de la fila
  // de manzanas numeradas (1-3): las columnas exteriores se funden en un solo
  // bloque ancho después de acá, así que esas dos líneas divisorias no siguen
  // de largo — sólo el corredor central (real en toda la altura) sí.
  // Espejo de lib/plano.ts:RED_V.
  const fila3Fondo = rowGaps[2][0]
  const vLines = colGaps.map((g, i) => {
    const y2 = i === 1 ? bottom : fila3Fondo
    return `<line x1="${mid(g)}" y1="${top}" x2="${mid(g)}" y2="${y2}" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`
  }).join('')

  const hLines = rowGaps.map(g =>
    `<line x1="${left}" y1="${mid(g)}" x2="${right}" y2="${mid(g)}" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`
  ).join('')

  const perimeter = `
    <line x1="${left}" y1="${top}" x2="${right}" y2="${top}" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
    <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`

  // Tramo pendiente (10%): sólo entre la manzana 3 y la Reserva Municipal 1,
  // no todo el borde este. Espejo de lib/plano.ts:RED_BORDE_ESTE.
  const pendienteInicio = rowGaps[1][1] // techo de la Mz 3
  const pendienteFin = rowGaps[3][0]    // piso de la Reserva Municipal 1
  const esteSegmentos = [
    { y1: top, y2: pendienteInicio, pendiente: false },
    { y1: pendienteInicio, y2: pendienteFin, pendiente: true },
    { y1: pendienteFin, y2: bottom, pendiente: false },
  ]
  const pending = esteSegmentos.map(seg =>
    `<line x1="${right}" y1="${seg.y1}" x2="${right}" y2="${seg.y2}" stroke="${color}" stroke-width="7" stroke-linecap="round"` +
    (seg.pendiente ? ` stroke-dasharray="16 14" opacity="0.5"` : '') + `/>`
  ).join('')

  // Bocas de registro: sólo en los extremos del tramo pendiente (Mz 3 y
  // Reserva Municipal 1). Espejo de lib/plano.ts:RED_NODOS.
  const nodes = [pendienteInicio, pendienteFin].map((y) => [right, y])
  const nodesSvg = nodes
    .map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="9" fill="#fff" stroke="${color}" stroke-width="4"/>`)
    .join('')

  // Cortes puntuales sin agua ni cloaca — confirmados por el owner sobre una
  // captura anotada a mano. Espejo de lib/plano.ts:RED_CORTES.
  const corteAncho = 22
  const cortes = [
    { x: right, y: mid(rowGaps[0]) },           // borde este, entre Mz 1 y Mz 2
    { x: right, y: mid(rowGaps[1]) },           // borde este, entre Mz 2 y Mz 3
    { x: left, y: mid(rowGaps[3]) },            // borde oeste, junto a Mz 11
    { x: mid(colGaps[1]), y: mid(rowGaps[3]) }, // corredor central, entre Mz 11 y Mz 4
  ]
  const cortesSvg = cortes
    .map(p => `<line x1="${p.x}" y1="${p.y - corteAncho}" x2="${p.x}" y2="${p.y + corteAncho}" stroke="${P.paper}" stroke-width="9" stroke-linecap="round"/>`)
    .join('')

  return `<svg viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <rect x="${VB.x}" y="${VB.y}" width="${VB.w}" height="${VB.h}" fill="${P.paper}"/>
    ${bloques}
    ${reservasSvg}
    ${perimeter}${vLines}${hLines}${pending}${nodesSvg}${cortesSvg}
  </svg>`
}

function northArrow() {
  const x = 895, y = 232
  return `<g>
    <circle cx="${x}" cy="${y}" r="20" fill="#fff" stroke="${PALETTE.payeRed}" stroke-width="2.5"/>
    <path d="M ${x} ${y - 12} L ${x + 7} ${y + 9} L ${x} ${y + 4} L ${x - 7} ${y + 9} Z" fill="${PALETTE.payeRed}"/>
    <text x="${x}" y="${y - 26}" text-anchor="middle" font-size="17" font-weight="800" fill="${PALETTE.payeRed}">N</text>
  </g>`
}

function streetLabels() {
  const c = PALETTE.grayMid
  return `<g font-size="17" font-weight="600" fill="${c}">
    <text x="517" y="252" text-anchor="middle">Calle Pública (Norte)</text>
    <text x="517" y="1622" text-anchor="middle">Calle Pública (Sur)</text>
    <text x="517" y="1822" text-anchor="middle">Av. Tito Aranda (ripio)</text>
    <text x="912" y="1020" text-anchor="middle" transform="rotate(90,912,1020)">Av. Dalmasio Esquivel (asfalto)</text>
  </g>`
}
