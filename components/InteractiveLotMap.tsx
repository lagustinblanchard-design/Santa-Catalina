'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { type Lot } from '@/lib/lots'
import { STATUS_LABELS, type LotStatus } from '@/lib/data'
import GEO from '@/lib/lot_geometry.json'

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

// SVG viewBox — matches PDF coordinate space
const VB_X = 100, VB_Y = 190, VB_W = 830, VB_H = 1660

const STATUSES = Object.keys(STATUS_LABELS) as LotStatus[]

const BLOCK_LETTER: Record<number, string> = {
   1:'L', 2:'H', 3:'D', 4:'M',  5:'K',  6:'G',  7:'C',  8:'J',
   9:'F', 10:'B', 11:'N', 12:'I', 13:'E', 14:'A',
}

// Reservas municipales (between main grid and bottom row)
const RESERVAS = [
  { x:154, y:1398, w:336, h:192, label:'Reserva Municipal 2' },
  { x:538, y:1398, w:342, h:192, label:'Reserva Municipal 1' },
]

// Street label data
const STREETS = [
  { text:'Calle Pública (Norte)', x:530, y:250, anchor:'middle' as const, rotate:0 },
  { text:'Calle Pública (Sur)',   x:530, y:1380, anchor:'middle' as const, rotate:0 },
  { text:'Av. Tito Aranda (ripio)', x:530, y:1820, anchor:'middle' as const, rotate:0 },
  { text:'Av. Dalmasio Esquivel (Asfalto)', x:920, y:900, anchor:'middle' as const, rotate:90 },
]

const lots_GEO = GEO.lots as unknown as Record<string, [number,number,number,number]>
const BBOXES   = GEO.bboxes as unknown as Record<string, [number,number,number,number]>

function fmt(n: number) { return `USD ${n.toLocaleString('es-AR')}` }

type TooltipData = { lot: Lot; svgX: number; svgY: number }

export default function InteractiveLotMap({ lots }: { lots: Lot[] }) {
  const [hovered, setHovered]     = useState<string | null>(null)
  const [tooltip, setTooltip]     = useState<TooltipData | null>(null)
  const [activeFilter, setFilter] = useState<LotStatus | 'ALL'>('ALL')
  const [selected, setSelected]   = useState<Lot | null>(null)

  const onEnter = useCallback((lot: Lot, svgX: number, svgY: number) => {
    setHovered(lot.id)
    setTooltip({ lot, svgX, svgY })
  }, [])
  const onLeave  = useCallback(() => { setHovered(null); setTooltip(null) }, [])
  const onClick  = useCallback((lot: Lot) => {
    // No auto-scroll a #contacto: en mobile sacaba de pantalla la ficha recién abierta
    // (`Mobile: selected lot panel` más abajo) 200ms después de mostrarla.
    setSelected(lot)
  }, [])

  const totalCounts = Object.fromEntries(
    STATUSES.map(s => [s, lots.filter(l => l.status === s).length])
  ) as Record<LotStatus, number>

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

        {/* Filter buttons */}
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
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-700">{lots.length}</span>
          </button>
          {STATUSES.map(s => (
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

        {/* Map container — outer is positioning context for tooltip (no overflow clip) */}
        <div className="relative mx-auto" style={{ maxWidth: 640 }}>
          {/* Inner wrapper clips SVG for rounded corners only */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <svg
              viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`}
              width="100%"
              className="select-none"
              style={{ display: 'block' }}
            >
              {/* Background */}
              <rect x={VB_X} y={VB_Y} width={VB_W} height={VB_H} fill="#f8fafc" />

              {/* Street labels */}
              {STREETS.map(({ text, x, y, anchor, rotate }) => (
                <text
                  key={text}
                  x={x} y={y}
                  textAnchor={anchor}
                  fontSize="11"
                  fill="#6b7280"
                  fontFamily="inherit"
                  letterSpacing="0.5"
                  transform={rotate ? `rotate(${rotate},${x},${y})` : undefined}
                >
                  {text}
                </text>
              ))}

              {/* Calle Pública horizontal lines */}
              <line x1={154} y1={270} x2={880} y2={270} stroke="#9ca3af" strokeWidth="0.5" />
              <line x1={154} y1={1390} x2={880} y2={1390} stroke="#9ca3af" strokeWidth="0.5" />
              <line x1={154} y1={1800} x2={880} y2={1800} stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="4 3" />

              {/* Calles proyectadas (between rows) */}
              <line x1={154} y1={620} x2={880} y2={620} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3 2" />
              <line x1={154} y1={1005} x2={880} y2={1005} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3 2" />
              <line x1={154} y1={1640} x2={880} y2={1640} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3 2" />

              {/* Avenida Dalmasio Esquivel (right side vertical) */}
              <line x1={895} y1={265} x2={895} y2={1374} stroke="#9ca3af" strokeWidth="0.5" />

              {/* Reservas municipales */}
              {RESERVAS.map(({ x, y, w, h, label }) => (
                <g key={label}>
                  <rect x={x} y={y} width={w} height={h} rx={3}
                    fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="5 3" />
                  <text x={x + w/2} y={y + h/2 + 5} textAnchor="middle"
                    fontSize="10" fontWeight="600" fill="#94a3b8" fontFamily="inherit">
                    {label}
                  </text>
                </g>
              ))}

              {/* Blocks: outline + label + lots */}
              {Array.from({ length: 14 }, (_, i) => i + 1).map(block => {
                const bb = BBOXES[String(block)]
                if (!bb) return null
                const [bx0, by0, bx1, by1] = bb
                const bw = bx1 - bx0, bh = by1 - by0

                return (
                  <g key={block}>
                    {/* Block background */}
                    <rect x={bx0} y={by0} width={bw} height={bh} rx={2}
                      fill="#f0f4f8" stroke="#94a3b8" strokeWidth={0.8} />

                    {/* Block label */}
                    <text
                      x={bx0 + bw/2} y={by0 - 4}
                      textAnchor="middle" fontSize="8.5" fontWeight="700"
                      fill="#475569" fontFamily="inherit"
                    >
                      Mz.{block} {BLOCK_LETTER[block]}
                    </text>

                    {/* Individual lots */}
                    {lots.filter(l => l.block === block).map(lot => {
                      const rect = lots_GEO[lot.id]
                      if (!rect) return null
                      const [x0, y0, x1, y1] = rect
                      const rw = x1 - x0, rh = y1 - y0
                      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2

                      const isFiltered = activeFilter !== 'ALL' && lot.status !== activeFilter
                      const isHovered  = hovered === lot.id
                      const fill   = isFiltered ? '#f1f5f9' : isHovered ? STATUS_HOVER[lot.status] : STATUS_FILL[lot.status]
                      const stroke = isFiltered ? '#e2e8f0' : STATUS_STROKE[lot.status]

                      return (
                        <g key={lot.id}>
                          <rect
                            x={x0} y={y0} width={rw} height={rh}
                            fill={fill} stroke={stroke}
                            strokeWidth={isHovered ? 1.5 : 0.7}
                            style={{ cursor: isFiltered ? 'default' : 'pointer', transition: 'fill 0.1s' }}
                            onMouseEnter={() => !isFiltered && onEnter(lot, cx, y0)}
                            onMouseLeave={onLeave}
                            onClick={() => !isFiltered && onClick(lot)}
                          />
                          {/* Lot number — only if rect is big enough */}
                          {rh >= 18 && rw >= 14 && (
                            <text
                              x={cx} y={cy + 3}
                              textAnchor="middle" fontSize="7"
                              fontWeight="600"
                              fill={isFiltered ? '#cbd5e1' : STATUS_STROKE[lot.status]}
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
          </div>{/* end inner overflow-hidden */}

          {/* Tooltip — outside overflow-hidden, clamped so it never clips at edges */}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-20 hidden md:block"
              style={{
                left: `clamp(6.5rem, ${((tooltip.svgX - VB_X) / VB_W) * 100}%, calc(100% - 6.5rem))`,
                top:  `${((tooltip.svgY - VB_Y) / VB_H) * 100}%`,
                transform: 'translate(-50%, -110%)',
              }}
            >
              <div className="w-52 rounded-xl border border-gray-200 bg-white p-3 shadow-xl text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900">
                    Mz.{tooltip.lot.block} · L{tooltip.lot.lot}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: STATUS_FILL[tooltip.lot.status],
                      color: STATUS_STROKE[tooltip.lot.status],
                      border: `1px solid ${STATUS_STROKE[tooltip.lot.status]}`,
                    }}
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

        {/* Mobile: selected lot panel */}
        {selected && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:hidden">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900">Manzana {selected.block} · Lote {selected.lot}</p>
                <p className="text-sm text-gray-500">{selected.dims} m · {selected.sqm} m²</p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: STATUS_FILL[selected.status], color: STATUS_STROKE[selected.status] }}
              >{STATUS_LABELS[selected.status]}</span>
            </div>
            {selected.status === 'DISPONIBLE' && selected.price && (
              <p className="text-lg font-black" style={{ color: '#FF1200' }}>Desde {fmt(selected.price)}</p>
            )}
            <button
              onClick={() => setSelected(null)}
              className="mt-3 w-full rounded-xl py-2 text-sm font-medium text-gray-500 border border-gray-200"
            >Cerrar</button>
          </div>
        )}

        {/* Bottom actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Disponibilidad orientativa — la real se actualiza desde Google Drive.{' '}
            <a href="#contacto" className="font-medium underline" style={{ color: '#FF1200' }}>Consultá disponibilidad exacta</a>.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/mapa-3d"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#AA1120' }}
            >
              Ver en 3D →
            </Link>
            <a
              href="/Loteo Sta. Catalina.pdf"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver plano de Mensura
            </a>
          </div>
        </div>

      </div>
    </section>
  )
}
