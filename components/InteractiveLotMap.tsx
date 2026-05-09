'use client'

import { useState, useCallback } from 'react'
import { LOTS, getBlockLots, countByStatus, type Lot } from '@/lib/lots'
import { STATUS_LABELS, type LotStatus } from '@/lib/data'

// --- Paleta de colores por estado ---
const STATUS_FILL: Record<LotStatus, string> = {
  DISPONIBLE:         '#bbf7d0',
  RESERVADO:          '#fef08a',
  VENDIDO:            '#fecaca',
  FIDEICOMISO:        '#e9d5ff',
  NO_COMERCIALIZABLE: '#e5e7eb',
}
const STATUS_STROKE: Record<LotStatus, string> = {
  DISPONIBLE:         '#16a34a',
  RESERVADO:          '#ca8a04',
  VENDIDO:            '#dc2626',
  FIDEICOMISO:        '#9333ea',
  NO_COMERCIALIZABLE: '#9ca3af',
}
const STATUS_HOVER: Record<LotStatus, string> = {
  DISPONIBLE:         '#4ade80',
  RESERVADO:          '#fde047',
  VENDIDO:            '#f87171',
  FIDEICOMISO:        '#c084fc',
  NO_COMERCIALIZABLE: '#d1d5db',
}

// --- Dimensiones del SVG ---
// Layout norte→sur (igual que plano):
//   MZ 1-4   (I J K L)         ← norte (Calle Pública arriba)
//   MZ 5-8   (E F G H)
//   MZ 9-12  (A B C D)         ← sur del grid principal (Calle Pública debajo)
//   Reserva Muni 2 | Reserva Muni 1
//   MZ 13 (N) | MZ 14 (M)      ← anchas (Av. Tito Aranda debajo)
const COL_W        = 130
const ROW_H        = 175
const GAP          = 18
const BIG_GAP      = 30           // Calle Pública sur (separa grid principal de Reservas)
const PAD          = 30
const RESERVA_H    = 70
const BOTTOM_ROW_H = 140
const BOTTOM_ROW_W = COL_W * 2 + GAP

const ROW1_Y    = PAD                                  // MZ 1-4
const ROW2_Y    = ROW1_Y + ROW_H + GAP                 // MZ 5-8
const ROW3_Y    = ROW2_Y + ROW_H + GAP                 // MZ 9-12
const RESERVA_Y = ROW3_Y + ROW_H + BIG_GAP             // Reservas Municipales
const ROW4_Y    = RESERVA_Y + RESERVA_H + GAP          // MZ 13-14

const SVG_W = PAD * 2 + COL_W * 4 + GAP * 3
const SVG_H = ROW4_Y + BOTTOM_ROW_H + PAD + 14

// Posición de cada manzana en el plano (col 1 = oeste, col 4 = este;
// row 1 = norte, row 3 = sur del grid principal). Las anchas 11 y 4
// están fuera del grid (al sur de las Reservas Municipales).
const POSITION_MAP: Record<number, { col: 1 | 2 | 3 | 4; row: 1 | 2 | 3 }> = {
   1: { col: 4, row: 1 },  2: { col: 4, row: 2 },  3: { col: 4, row: 3 },
   5: { col: 3, row: 1 },  6: { col: 3, row: 2 },  7: { col: 3, row: 3 },
   8: { col: 2, row: 1 },  9: { col: 2, row: 2 }, 10: { col: 2, row: 3 },
  12: { col: 1, row: 1 }, 13: { col: 1, row: 2 }, 14: { col: 1, row: 3 },
}

function blockPos(block: number): { x: number; y: number; w: number; h: number } {
  if (block === 11) return { x: PAD, y: ROW4_Y, w: BOTTOM_ROW_W, h: BOTTOM_ROW_H }
  if (block === 4)  return { x: PAD + BOTTOM_ROW_W + GAP, y: ROW4_Y, w: BOTTOM_ROW_W, h: BOTTOM_ROW_H }
  const pos = POSITION_MAP[block]
  const rowY = [ROW1_Y, ROW2_Y, ROW3_Y][pos.row - 1]
  return { x: PAD + (pos.col - 1) * (COL_W + GAP), y: rowY, w: COL_W, h: ROW_H }
}

// Layout interno de cada manzana: cantidad de lotes en frente norte (top) y sur (bottom).
// Los lotes restantes (si los hay) van en columna sobre el lado este (esquinas NE/SE).
// Por defecto: split 50/50 (mitad arriba, mitad abajo). Override por manzana abajo.
type LotLayout = { topCount: number; sideCount?: number; sideOnEast?: boolean }
const LOT_LAYOUTS: Partial<Record<number, LotLayout>> = {
  // TODO: ajustar por manzana según plano (esquinas con lotes en 3 lados, etc).
  // Ejemplo MZ 1 (esquina NE, 20 lotes): topCount=8 (frente N), sideCount=3 (este), bottomCount=9 (frente S)
}

function lotRects(block: number, lots: Lot[]) {
  const { x, y, w, h } = blockPos(block)
  const n = lots.length
  if (n === 0) return []

  const layout = LOT_LAYOUTS[block]
  const sideCount = layout?.sideCount ?? 0
  const topCount = layout?.topCount ?? Math.ceil((n - sideCount) / 2)
  const bottomCount = n - topCount - sideCount
  const sideOnEast = layout?.sideOnEast ?? true

  const innerY = y + 18
  const innerH = h - 20
  const innerX = x + 2
  const innerW = w - 4
  const sideW = sideCount > 0 ? Math.min(innerW * 0.18, 28) : 0
  const mainW = innerW - sideW
  const mainX = sideOnEast ? innerX : innerX + sideW
  const sideX = sideOnEast ? innerX + mainW : innerX

  const rowH = innerH / 2
  const topW  = topCount    > 0 ? mainW / topCount    : 0
  const botW  = bottomCount > 0 ? mainW / bottomCount : 0
  const sideH = sideCount   > 0 ? innerH / sideCount  : 0

  return lots.map((lot, i) => {
    if (i < topCount) {
      return { lot, rx: mainX + i * topW,                ry: innerY,           rw: topW - 1, rh: rowH - 1 }
    }
    if (i < topCount + bottomCount) {
      const c = i - topCount
      return { lot, rx: mainX + c * botW,                ry: innerY + rowH,    rw: botW - 1, rh: rowH - 1 }
    }
    const r = i - topCount - bottomCount
    return   { lot, rx: sideX,                           ry: innerY + r * sideH, rw: sideW - 1, rh: sideH - 1 }
  })
}

type TooltipData = { lot: Lot; x: number; y: number }
const STATUSES = Object.keys(STATUS_LABELS) as LotStatus[]
function fmt(n: number) { return `USD ${n.toLocaleString('es-AR')}` }

export default function InteractiveLotMap() {
  const [hovered, setHovered]       = useState<string | null>(null)
  const [tooltip, setTooltip]       = useState<TooltipData | null>(null)
  const [activeFilter, setFilter]   = useState<LotStatus | 'ALL'>('ALL')
  const [selectedLot, setSelected]  = useState<Lot | null>(null)

  const handleMouseEnter = useCallback((lot: Lot, svgX: number, svgY: number) => {
    setHovered(lot.id)
    setTooltip({ lot, x: svgX, y: svgY })
  }, [])
  const handleMouseLeave = useCallback(() => { setHovered(null); setTooltip(null) }, [])
  const handleClick = useCallback((lot: Lot) => {
    setSelected(lot)
    setTimeout(() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' }), 200)
  }, [])

  const totalCounts = countByStatus(LOTS)

  return (
    <section id="lotes" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white" style={{ backgroundColor: '#FF1200' }}>
            Disponibilidad
          </span>
          <h2 className="text-4xl font-black text-gray-900">Mapa interactivo del loteo</h2>
          <p className="mt-3 text-gray-500 text-sm">
            Pasá el cursor sobre cada lote para ver su estado · Hacé clic para consultar
          </p>
        </div>

        {/* Leyenda + filtros */}
        <div className="mb-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === 'ALL'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todos
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-700">{LOTS.length}</span>
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s === activeFilter ? 'ALL' : s)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === s
                  ? 'border-gray-700 bg-gray-700 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: STATUS_FILL[s], borderColor: STATUS_STROKE[s] }} />
              {STATUS_LABELS[s]}
              {(totalCounts[s] ?? 0) > 0 && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{totalCounts[s]}</span>
              )}
            </button>
          ))}
        </div>

        {/* SVG Map */}
        <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" className="select-none" style={{ display: 'block' }}>

            {/* Calles (norte → sur, igual que plano) */}
            <text x={SVG_W / 2} y={PAD - 10} textAnchor="middle" fontSize="9" fill="#6b7280" fontFamily="inherit" letterSpacing="1">Calle Pública</text>
            <text x={SVG_W / 2} y={ROW2_Y - GAP / 2 + 3} textAnchor="middle" fontSize="7.5" fill="#9ca3af" fontFamily="inherit">— Calle Proyectada —</text>
            <text x={SVG_W / 2} y={ROW3_Y - GAP / 2 + 3} textAnchor="middle" fontSize="7.5" fill="#9ca3af" fontFamily="inherit">— Calle Proyectada —</text>
            <text x={SVG_W / 2} y={RESERVA_Y - BIG_GAP / 2 + 3} textAnchor="middle" fontSize="9" fill="#6b7280" fontFamily="inherit" letterSpacing="1">Calle Pública</text>
            <text x={SVG_W / 2} y={ROW4_Y - GAP / 2 + 3} textAnchor="middle" fontSize="7.5" fill="#9ca3af" fontFamily="inherit">— Calle Proyectada —</text>
            <text
              x={SVG_W - 8} y={SVG_H / 2}
              textAnchor="middle" fontSize="8" fill="#9ca3af" fontFamily="inherit"
              transform={`rotate(90, ${SVG_W - 8}, ${SVG_H / 2})`}
            >Avenida Dalmasio Esquivel (Asfalto)</text>
            <text
              x={10} y={ROW2_Y + ROW_H / 2}
              textAnchor="middle" fontSize="8" fill="#9ca3af" fontFamily="inherit"
              transform={`rotate(-90, 10, ${ROW2_Y + ROW_H / 2})`}
            >Calle Pública</text>
            <text x={SVG_W / 2} y={SVG_H - 4} textAnchor="middle" fontSize="9" fill="#6b7280" fontFamily="inherit" letterSpacing="1">Avenida Tito Aranda (ripio)</text>

            {/* Reservas Municipales (no se comercializan) */}
            <g>
              <rect
                x={PAD} y={RESERVA_Y} width={BOTTOM_ROW_W} height={RESERVA_H} rx={4}
                fill="#f3f4f6" stroke="#d1d5db" strokeWidth={1} strokeDasharray="4 3"
              />
              <text
                x={PAD + BOTTOM_ROW_W / 2} y={RESERVA_Y + RESERVA_H / 2 + 4}
                textAnchor="middle" fontSize="11" fontWeight="600" fill="#6b7280" fontFamily="inherit"
              >Reserva Municipal 2</text>
              <rect
                x={PAD + BOTTOM_ROW_W + GAP} y={RESERVA_Y} width={BOTTOM_ROW_W} height={RESERVA_H} rx={4}
                fill="#f3f4f6" stroke="#d1d5db" strokeWidth={1} strokeDasharray="4 3"
              />
              <text
                x={PAD + BOTTOM_ROW_W + GAP + BOTTOM_ROW_W / 2} y={RESERVA_Y + RESERVA_H / 2 + 4}
                textAnchor="middle" fontSize="11" fontWeight="600" fill="#6b7280" fontFamily="inherit"
              >Reserva Municipal 1</text>
            </g>

            {/* Manzanas 1–14 */}
            {Array.from({ length: 14 }, (_, i) => i + 1).map((block) => {
              const { x, y, w, h } = blockPos(block)
              const lots = getBlockLots(block)
              const rects = lotRects(block, lots)
              return (
                <g key={block}>
                  <rect x={x} y={y} width={w} height={h} rx={4} fill="#f9fafb" stroke="#d1d5db" strokeWidth={1} />
                  <text x={x + w / 2} y={y + 13} textAnchor="middle" fontSize="10" fontWeight="700" fill="#374151" fontFamily="inherit">
                    Mz {block}
                  </text>
                  {rects.map(({ lot, rx, ry, rw, rh }) => {
                    const isFiltered = activeFilter !== 'ALL' && lot.status !== activeFilter
                    const isHovered  = hovered === lot.id
                    const fill   = isFiltered ? '#f3f4f6' : isHovered ? STATUS_HOVER[lot.status] : STATUS_FILL[lot.status]
                    const stroke = isFiltered ? '#e5e7eb' : STATUS_STROKE[lot.status]
                    return (
                      <g key={lot.id}>
                        <rect
                          x={rx} y={ry} width={rw} height={rh} rx={2}
                          fill={fill} stroke={stroke} strokeWidth={isHovered ? 2 : 1}
                          style={{ cursor: isFiltered ? 'default' : 'pointer', transition: 'fill 0.12s ease' }}
                          onMouseEnter={() => !isFiltered && handleMouseEnter(lot, rx + rw / 2, ry)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => !isFiltered && handleClick(lot)}
                        />
                        {rh >= 14 && rw >= 8 && (
                          <text
                            x={rx + rw / 2} y={ry + rh / 2 + 3}
                            textAnchor="middle" fontSize={rw < 14 ? 6 : 7} fontWeight="600"
                            fill={isFiltered ? '#d1d5db' : STATUS_STROKE[lot.status]}
                            fontFamily="inherit"
                            style={{ pointerEvents: 'none', userSelect: 'none' }}
                          >{lot.lot}</text>
                        )}
                      </g>
                    )
                  })}
                </g>
              )
            })}
          </svg>

          {/* Tooltip (desktop) */}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-20 hidden md:block"
              style={{
                left: `${(tooltip.x / SVG_W) * 100}%`,
                top: `${(tooltip.y / SVG_H) * 100}%`,
                transform: 'translate(-50%, -110%)',
              }}
            >
              <div className="w-52 rounded-xl border border-gray-200 bg-white p-3 shadow-xl text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900">Mz {tooltip.lot.block} · L{tooltip.lot.lot}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: STATUS_FILL[tooltip.lot.status], color: STATUS_STROKE[tooltip.lot.status], border: `1px solid ${STATUS_STROKE[tooltip.lot.status]}` }}
                  >{STATUS_LABELS[tooltip.lot.status]}</span>
                </div>
                <div className="space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span>Medidas</span>
                    <span className="font-medium text-gray-900">{tooltip.lot.dims} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Superficie</span>
                    <span className="font-medium text-gray-900">{tooltip.lot.sqm} m²</span>
                  </div>
                  {tooltip.lot.status === 'DISPONIBLE' && tooltip.lot.price && (
                    <div className="flex justify-between border-t border-gray-100 pt-1 mt-1">
                      <span>Precio desde</span>
                      <span className="font-bold" style={{ color: '#FF1200' }}>{fmt(tooltip.lot.price)}</span>
                    </div>
                  )}
                </div>
                {tooltip.lot.status === 'DISPONIBLE' && (
                  <p className="mt-2 text-center text-gray-400">Clic para consultar →</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile: panel lote seleccionado */}
        {selectedLot && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:hidden">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900">Manzana {selectedLot.block} · Lote {selectedLot.lot}</p>
                <p className="text-sm text-gray-500">{selectedLot.dims} m · {selectedLot.sqm} m²</p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: STATUS_FILL[selectedLot.status], color: STATUS_STROKE[selectedLot.status] }}
              >{STATUS_LABELS[selectedLot.status]}</span>
            </div>
            {selectedLot.status === 'DISPONIBLE' && selectedLot.price && (
              <p className="text-lg font-black" style={{ color: '#FF1200' }}>Desde {fmt(selectedLot.price)}</p>
            )}
            <button
              onClick={() => setSelected(null)}
              className="mt-3 w-full rounded-xl py-2 text-sm font-medium text-gray-500 border border-gray-200"
            >Cerrar</button>
          </div>
        )}

        {/* Acciones */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Disponibilidad orientativa — la real se actualiza desde Google Drive.{' '}
            <a href="#contacto" className="font-medium underline" style={{ color: '#FF1200' }}>Consultá disponibilidad exacta</a>.
          </p>
          <a
            href="/Loteo Sta. Catalina.pdf"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver plano original
          </a>
        </div>
      </div>
    </section>
  )
}
