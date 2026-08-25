'use client'

import { useId } from 'react'
import GEO from '@/lib/lot_geometry.json'
import type { AvanceLayerId } from '@/lib/data'
import { AVANCE_LAYERS, MZ_CORDON, RES_CORDON } from '@/lib/avance'
import {
  VB, PALETTE as P, BLOCK_LETTER, RESERVAS,
  STREET_RECTS, APERTURA_OESTE, RED_V, RED_H, RED_PERIMETRO, RED_BORDE_ESTE, RED_NODOS,
  RED_CORTES, RED_CORTE_ANCHO,
} from '@/lib/plano'

// Sólo necesitamos los bboxes de manzana acá — no importamos GEO.lots (306
// lotes) para no inflar el bundle de la home con geometría que no se usa.
const BBOXES = GEO.bboxes as unknown as Record<string, [number, number, number, number]>
const MANZANAS = Object.keys(BBOXES).map(Number).sort((a, b) => a - b)

const DONE_MZ = new Set(MZ_CORDON)
const DONE_RES = new Set(RES_CORDON)

// Transición suave de color/opacidad al cambiar de capa. prefers-reduced-motion
// ya la anula globalmente (app/globals.css fuerza transition-duration: 0.001ms
// en *, *::before, *::after), así que no hace falta un guard acá.
const TRANSITION = { transition: 'opacity 220ms ease, fill 220ms ease, stroke 220ms ease' } as const

export default function AvanceObraMap({ layer }: { layer: AvanceLayerId }) {
  const uid = useId()
  const hatchId = `avance-hatch-${uid}`
  const loteHatchId = `avance-lote-hatch-${uid}`
  const titleId = `avance-title-${uid}`
  const descId = `avance-desc-${uid}`

  const meta = AVANCE_LAYERS[layer]
  const esVerde = layer === 'cordon'
  const esRipio = layer === 'ripio'
  const esRed = layer === 'agua' || layer === 'cloaca'
  const redColor = layer === 'agua' ? P.water : P.brown

  return (
    <svg
      viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className="block h-auto w-full"
    >
      <title id={titleId}>{`Plano de avance de obra — ${meta.titulo}`}</title>
      <desc id={descId}>{meta.descripcionSvg}</desc>

      <defs>
        <pattern id={hatchId} width={14} height={14} patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width={14} height={14} fill={P.orange} opacity={0.16} />
          <line x1={0} y1={0} x2={0} y2={14} stroke={P.orange} strokeWidth={7} opacity={0.85} />
        </pattern>
        {/* Textura de lotes — sólo decorativa (sugiere subdivisión en lotes
            dentro de cada manzana), no representa límites catastrales reales. */}
        <pattern id={loteHatchId} width={12} height={12} patternUnits="userSpaceOnUse">
          <rect width={12} height={12} fill={P.neutralFill} />
          <line x1={0} y1={0} x2={0} y2={12} stroke={P.neutralStroke} strokeWidth={1.4} opacity={0.7} />
        </pattern>
      </defs>

      <rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill={P.paper} />

      {/* Corredores de calle — base neutra, siempre visible */}
      {STREET_RECTS.map((r, i) => (
        <rect key={`street-${i}`} x={r.x} y={r.y} width={r.w} height={r.h} fill={P.street} />
      ))}

      {/* Apertura de calles / enripiado — tramado naranja, sólo capa Ripio */}
      <g style={TRANSITION} opacity={esRipio ? 1 : 0}>
        {APERTURA_OESTE.map((r, i) => (
          <rect
            key={`apertura-${i}`}
            x={r.x} y={r.y} width={r.w} height={r.h}
            fill={`url(#${hatchId})`} stroke={P.orange} strokeWidth={1.2}
          />
        ))}
      </g>

      {/* Reservas municipales */}
      {RESERVAS.map((r) => {
        const on = esVerde && DONE_RES.has(r.id)
        const fill = esRed ? `url(#${loteHatchId})` : on ? P.greenFill : P.neutralFill
        const stroke = on ? P.greenStroke : P.neutralStroke
        const text = on ? P.greenText : P.neutralText
        return (
          <g key={r.id} style={TRANSITION}>
            <rect
              x={r.x} y={r.y} width={r.w} height={r.h} rx={4}
              fill={fill} stroke={stroke} strokeWidth={on ? 2.6 : 1.4}
              strokeDasharray={on ? 'none' : '10 6'}
            />
            <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 7} textAnchor="middle" fontSize={20} fontWeight={700} fill={text} style={TRANSITION}>
              {r.label}
            </text>
          </g>
        )
      })}

      {/* Manzanas numeradas 1–14 */}
      {MANZANAS.map((n) => {
        const [x0, y0, x1, y1] = BBOXES[String(n)]
        const w = x1 - x0
        const h = y1 - y0
        const on = esVerde && DONE_MZ.has(n)
        const fill = esRed ? `url(#${loteHatchId})` : on ? P.greenFill : P.neutralFill
        const stroke = on ? P.greenStroke : P.neutralStroke
        const text = on ? P.greenText : P.neutralText
        return (
          <g key={n} style={TRANSITION}>
            <rect x={x0} y={y0} width={w} height={h} rx={4} fill={fill} stroke={stroke} strokeWidth={on ? 2.6 : 1.4} />
            <text x={x0 + w / 2} y={y0 + h / 2 - 2} textAnchor="middle" fontSize={30} fontWeight={800} fill={text} style={TRANSITION}>
              {`Mz ${n}`}
            </text>
            <text x={x0 + w / 2} y={y0 + h / 2 + 26} textAnchor="middle" fontSize={19} fontWeight={600} fill={text} opacity={0.75} style={TRANSITION}>
              {BLOCK_LETTER[n]}
            </text>
          </g>
        )
      })}

      {/* Red sanitaria (agua / cloaca) — mismo trazado, color según capa */}
      <g style={TRANSITION} opacity={esRed ? 1 : 0}>
        <line x1={RED_PERIMETRO.left} y1={RED_PERIMETRO.top} x2={RED_PERIMETRO.right} y2={RED_PERIMETRO.top} stroke={redColor} strokeWidth={7} strokeLinecap="round" style={TRANSITION} />
        <line x1={RED_PERIMETRO.left} y1={RED_PERIMETRO.top} x2={RED_PERIMETRO.left} y2={RED_PERIMETRO.bottom} stroke={redColor} strokeWidth={7} strokeLinecap="round" style={TRANSITION} />
        <line x1={RED_PERIMETRO.left} y1={RED_PERIMETRO.bottom} x2={RED_PERIMETRO.right} y2={RED_PERIMETRO.bottom} stroke={redColor} strokeWidth={7} strokeLinecap="round" style={TRANSITION} />
        {/* Borde este: ejecutado / pendiente (Mz 3 a Reserva Municipal 1, punteado) / ejecutado */}
        {RED_BORDE_ESTE.map((seg, i) => (
          <line
            key={`este-${i}`}
            x1={RED_PERIMETRO.right} y1={seg.y1} x2={RED_PERIMETRO.right} y2={seg.y2}
            stroke={redColor} strokeWidth={7} strokeLinecap="round"
            strokeDasharray={seg.pendiente ? '16 14' : 'none'}
            opacity={seg.pendiente ? 0.5 : 1}
            style={TRANSITION}
          />
        ))}
        {RED_V.map((v, i) => (
          <line key={`v-${i}`} x1={v.x} y1={v.y1} x2={v.x} y2={v.y2} stroke={redColor} strokeWidth={7} strokeLinecap="round" style={TRANSITION} />
        ))}
        {RED_H.map((y, i) => (
          <line key={`h-${i}`} x1={RED_PERIMETRO.left} y1={y} x2={RED_PERIMETRO.right} y2={y} stroke={redColor} strokeWidth={7} strokeLinecap="round" style={TRANSITION} />
        ))}
        {RED_NODOS.map(([cx, cy], i) => (
          <circle key={`node-${i}`} cx={cx} cy={cy} r={9} fill="#fff" stroke={redColor} strokeWidth={4} style={TRANSITION} />
        ))}
        {/* Cortes puntuales sin agua ni cloaca — confirmados por el owner */}
        {RED_CORTES.map((p, i) => (
          <line
            key={`corte-${i}`}
            x1={p.x} y1={p.y - RED_CORTE_ANCHO} x2={p.x} y2={p.y + RED_CORTE_ANCHO}
            stroke={P.paper} strokeWidth={9} strokeLinecap="round" style={TRANSITION}
          />
        ))}
      </g>

      {/* Norte */}
      <g>
        <circle cx={895} cy={232} r={20} fill="#fff" stroke={P.payeRed} strokeWidth={2.5} />
        <path d="M 895 220 L 902 241 L 895 236 L 888 241 Z" fill={P.payeRed} />
        <text x={895} y={206} textAnchor="middle" fontSize={17} fontWeight={800} fill={P.payeRed}>N</text>
      </g>

      {/* Rótulos de calle */}
      <g fontSize={17} fontWeight={600} fill={P.grayMid}>
        <text x={517} y={252} textAnchor="middle">Calle Pública (Norte)</text>
        <text x={517} y={1622} textAnchor="middle">Calle Pública (Sur)</text>
        <text x={517} y={1822} textAnchor="middle">Av. Tito Aranda (ripio)</text>
        <text x={912} y={1020} textAnchor="middle" transform="rotate(90,912,1020)">Av. Dalmasio Esquivel (asfalto)</text>
      </g>
    </svg>
  )
}
