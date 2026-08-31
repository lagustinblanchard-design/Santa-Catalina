/**
 * Builders de HTML/SVG para el PDF del plano. Strings puros, sin I/O.
 *
 * Las medidas de página van SIEMPRE en mm, nunca en px: 1123px es 0,48px más ancho
 * que A4 apaisado y alcanza para que Chrome parta cada hoja en dos.
 */

import { STATUS_LABELS, STATUS_PRINT } from '../../lib/data.ts'
import { BLOCK_LETTER } from '../../lib/lots.ts'
import { VB, RESERVAS, MM_PER_PX, hatchStep, hatchSegments, HATCH_ANGLES, scaleBarSpec } from './geometry.mjs'

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
))

const ORDER = ['DISPONIBLE', 'RESERVADO', 'VENDIDO', 'FIDEICOMISO', 'NO_COMERCIALIZABLE']

/** Tamaño de fuente en unidades SVG para que en papel mida `pt` puntos. */
const font = (pt, scale) => (pt / 0.75) / scale

/** Ancho aproximado de un texto en `em`, suficiente para decidir si entra. */
const emWidth = (s) => s.length * 0.55

/**
 * Trama como líneas <line> ya recortadas al rect, no como <pattern>.
 *
 * Chrome rasteriza cada celda de un <pattern> como una imagen PNG al exportar a
 * PDF: sobre un lote grande con paso chico son cientos de celdas, y con ~150 lotes
 * con trama el documento entero salía de ~93 MB. Líneas vectoriales no tienen ese
 * problema — el mismo documento baja a menos de 1 MB.
 */
function hatchLines(x0, y0, x1, y1, hatch, stroke, step) {
  const angles = HATCH_ANGLES[hatch]
  if (!angles.length) return ''
  const w = (step * 0.28).toFixed(2)
  let out = ''
  for (const a of angles) {
    for (const [ax, ay, bx, by] of hatchSegments(x0, y0, x1, y1, a, step)) {
      out += `<line x1="${ax.toFixed(2)}" y1="${ay.toFixed(2)}" x2="${bx.toFixed(2)}" y2="${by.toFixed(2)}"`
        + ` stroke="${stroke}" stroke-width="${w}"/>`
    }
  }
  return out
}

/** Un lote: relleno + trama + número, m² y estado. */
function lotCell(lot, rect, scale) {
  const [x0, y0, x1, y1] = rect
  const w = x1 - x0, h = y1 - y0
  const cx = x0 + w / 2, cy = y0 + h / 2
  const p = STATUS_PRINT[lot.status]
  const step = hatchStep(scale)

  // hatchLines ya devuelve segmentos recortados exactamente al rect (Liang-Barsky):
  // no hace falta ningún <clipPath>.
  const box = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${p.fill}"/>`
    + hatchLines(x0, y0, x1, y1, p.hatch, p.stroke, step)
    + `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="none" stroke="${p.stroke}" stroke-width="${0.9 / scale * 1.5}"/>`

  // El texto se dimensiona contra el ancho real del lote: los hay de 20mm y de 50mm.
  const usable = w * 0.88
  const fit = (text, maxPt) => Math.min(maxPt, usable / emWidth(text) * 0.75 * scale)

  const numPt = fit(`L${lot.lot}`, 13)
  const sqmPt = fit(`${lot.sqm} m²`, 12)
  const label = STATUS_LABELS[lot.status]
  const usePt = fit(label, 9.5)
  const statusText = usePt >= 6.5 ? label : p.abbr
  const statusPt = usePt >= 6.5 ? usePt : fit(p.abbr, 9.5)

  // Tres líneas necesitan alto; si no entra, se cae a número + m².
  const lineH = (pt) => font(pt, scale) * 1.25
  const three = lineH(numPt) + lineH(sqmPt) + lineH(statusPt) <= h * 0.92
  const top = cy - (three ? lineH(numPt) * 0.72 : lineH(numPt) * 0.15)

  const t = (y, pt, weight, fill, text) =>
    `<text x="${cx}" y="${y.toFixed(2)}" text-anchor="middle" font-size="${font(pt, scale).toFixed(2)}"`
    + ` font-weight="${weight}" fill="${fill}">${esc(text)}</text>`

  // El texto del estado NO usa p.stroke: es el mismo color de la trama que tiene
  // detrás, así que se camuflaba contra ella. Gris oscuro neutro, igual que el m².
  return box
    + t(top, numPt, 700, '#1f2937', `L${lot.lot}`)
    + t(top + lineH(sqmPt), sqmPt, 600, '#374151', `${lot.sqm} m²`)
    + (three ? t(top + lineH(sqmPt) + lineH(statusPt), statusPt, 500, '#1f2937', statusText) : '')
}

/** Flecha de norte. En las hojas rotadas el norte apunta a la izquierda. */
function northArrow(cx, cy, r, left) {
  const dir = left ? -1 : 0
  const tip = left ? `${cx - r * 0.75},${cy}` : `${cx},${cy - r * 0.75}`
  const wings = left
    ? `${cx + r * 0.5},${cy - r * 0.42} ${cx + r * 0.5},${cy + r * 0.42}`
    : `${cx - r * 0.42},${cy + r * 0.5} ${cx + r * 0.42},${cy + r * 0.5}`
  return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#9ca3af" stroke-width="${r * 0.05}"/>`
    + `<polygon points="${tip} ${wings}" fill="#AA1120"/>`
    + `<text x="${cx + (dir ? r * 0.72 : 0)}" y="${cy + (dir ? r * 0.12 : r * 0.95)}" text-anchor="middle"`
    + ` font-size="${r * 0.62}" font-weight="700" fill="#374151">N</text></g>`
}

/** Mini-mapa de ubicación, con norte arriba y la manzana actual resaltada. */
function locator(bboxes, current, widthMm) {
  const s = 1 // el viewBox hace el escalado
  const blocks = Object.entries(bboxes).map(([n, [x0, y0, x1, y1]]) => {
    const on = Number(n) === current
    return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"`
      + ` fill="${on ? '#AA1120' : '#e5e7eb'}" stroke="${on ? '#AA1120' : '#cbd5e1'}" stroke-width="6"/>`
  }).join('')
  const res = RESERVAS.map((r) =>
    `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="6" stroke-dasharray="18 12"/>`
  ).join('')

  return `<div class="loc"><svg viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" style="width:${widthMm}mm">`
    + res + blocks + northArrow(VB.x + 60, VB.y + 60, 46, false) + `</svg>`
    + `<div class="loc-cap">Ubicación en el loteo</div></div>`
}

/** Barra de escala gráfica. Un "1:500" impreso deja de ser cierto si el cliente ajusta a página. */
function scaleBar(scale) {
  const { metres, mm } = scaleBarSpec(scale)
  const half = (mm / 2).toFixed(2)
  return `<div class="bar"><svg width="${mm.toFixed(2)}mm" height="4mm" viewBox="0 0 ${mm.toFixed(2)} 4">`
    + `<rect x="0" y="0" width="${half}" height="1.6" fill="#374151"/>`
    + `<rect x="${half}" y="0" width="${half}" height="1.6" fill="#fff" stroke="#374151" stroke-width="0.2"/>`
    + `</svg><span>0</span><span class="bar-end">${metres} m</span></div>`
}

function legend() {
  return `<div class="leg">` + ORDER.map((st) => {
    const p = STATUS_PRINT[st]
    // Swatch como SVG inline, no background CSS: el fill de SVG siempre se imprime.
    return `<span class="leg-i"><svg width="14" height="10" viewBox="0 0 14 10">`
      + `<rect width="14" height="10" fill="${p.fill}"/>`
      + hatchLines(0, 0, 14, 10, p.hatch, p.stroke, 2.4)
      + `<rect width="14" height="10" fill="none" stroke="${p.stroke}" stroke-width="1"/></svg>`
      + esc(STATUS_LABELS[st]) + `</span>`
  }).join('') + `</div>`
}

function head(title, sub, right) {
  return `<div class="head"><div><h1>${esc(title)}</h1><div class="sub">${esc(sub)}</div></div>`
    + `<div class="head-r">${right}</div></div>`
}

function foot(stamp) {
  return `<div class="foot"><span>Gráfico ilustrativo. Superficies y medidas según plano de mensura`
    + ` aprobado; sujetas a mensura definitiva. Sin valor contractual.</span>`
    + `<span class="stamp">${esc(stamp)}</span></div>`
}

/** Hoja de una manzana. */
export function blockPage(block, lots, layout, bboxes, stamp, pageNo) {
  const counts = ORDER.map((st) => [st, lots.filter((l) => l.status === st).length])
    .filter(([, n]) => n > 0)
    .map(([st, n]) => `${n} ${STATUS_LABELS[st].toLowerCase()}`)
    .join(' · ')

  const cells = lots.map((l) => {
    const r = layout.rects.get(l.id)
    return r ? lotCell(l, r, layout.scale) : ''
  }).join('')

  // Rótulos de calle en los cuatro bordes de la hoja.
  const [bx0, by0, bx1, by1] = layout.block
  const fs = font(8.5, layout.scale)
  const off = fs * 1.5
  const edge = (text, x, y, anchor, rot) => text
    ? `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" font-size="${fs.toFixed(2)}"`
      + ` fill="#6b7280" letter-spacing="0.4"${rot ? ` transform="rotate(${rot},${x.toFixed(1)},${y.toFixed(1)})"` : ''}>`
      + esc(text.toUpperCase()) + `</text>`
    : ''

  const streets = edge(layout.edges.top, (bx0 + bx1) / 2, by0 - off * 0.7, 'middle', 0)
    + edge(layout.edges.bottom, (bx0 + bx1) / 2, by1 + off * 1.3, 'middle', 0)
    + edge(layout.edges.left, bx0 - off * 0.6, (by0 + by1) / 2, 'middle', -90)
    + edge(layout.edges.right, bx1 + off * 1.1, (by0 + by1) / 2, 'middle', 90)

  return `<section class="page">`
    + head(`Manzana ${block} — Letra ${BLOCK_LETTER[block]}`,
           `${lots.length} lotes · ${counts}`,
           `<div class="brand">DISTRITO PAYÉ</div><div class="pg">Hoja ${pageNo} de 15</div>`)
    + `<div class="body">`
    + `<div class="plan"><svg viewBox="${layout.viewBox}" preserveAspectRatio="xMidYMid meet">`
    + `${streets}${cells}</svg></div>`
    + `<div class="side">${northArrow(0, 0, 1, layout.rotated).replace('<g>', '<svg viewBox="-1.4 -1.4 2.8 2.8" style="width:13mm">').replace('</g>', '</svg>')}`
    + locator(bboxes, block, 22) + `</div>`
    + `</div>`
    + `<div class="strip">${legend()}${scaleBar(layout.scale)}</div>`
    + foot(stamp) + `</section>`
}

/** Hoja índice: plano completo con norte arriba + resumen por manzana. */
export function indexPage(lots, bboxes, site, stamp) {
  const step = hatchStep(0.36)
  const byBlock = (n) => lots.filter((l) => l.block === n)

  const plan = Object.entries(bboxes).map(([n, bb]) => {
    const cell = byBlock(Number(n)).map((l) => {
      const r = l.rect
      if (!r) return ''
      const p = STATUS_PRINT[l.status]
      const [x0, y0, x1, y1] = r
      return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${p.fill}"/>`
        + hatchLines(x0, y0, x1, y1, p.hatch, p.stroke, step)
        + `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="none" stroke="${p.stroke}" stroke-width="1.2"/>`
    }).join('')
    return cell + `<rect x="${bb[0]}" y="${bb[1]}" width="${bb[2] - bb[0]}" height="${bb[3] - bb[1]}"`
      + ` fill="none" stroke="#475569" stroke-width="2.5"/>`
      + `<text x="${(bb[0] + bb[2]) / 2}" y="${bb[1] - 8}" text-anchor="middle" font-size="24"`
      + ` font-weight="700" fill="#475569">Mz ${n} ${BLOCK_LETTER[n]}</text>`
  }).join('')

  const res = RESERVAS.map((r) =>
    `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#f8fafc" stroke="#94a3b8"`
    + ` stroke-width="2" stroke-dasharray="10 6"/>`
    + `<text x="${r.x + r.w / 2}" y="${r.y + r.h / 2}" text-anchor="middle" font-size="20" fill="#64748b">${esc(r.label)}</text>`
  ).join('')

  const rows = Object.keys(bboxes).map(Number).sort((a, b) => a - b).map((n) => {
    const bl = byBlock(n)
    const c = (st) => bl.filter((l) => l.status === st).length
    const otros = c('FIDEICOMISO') + c('NO_COMERCIALIZABLE') + c('RESERVADO')
    return `<tr><td>${n}</td><td>${BLOCK_LETTER[n]}</td><td>${bl.length}</td>`
      + `<td class="ok">${c('DISPONIBLE')}</td><td>${c('VENDIDO')}</td><td>${otros || '—'}</td>`
      + `<td>${n + 1}</td></tr>`
  }).join('')

  const total = lots.length
  const disp = lots.filter((l) => l.status === 'DISPONIBLE').length

  return `<section class="page">`
    + head(site.name, `${site.tagline} · ${site.stage} · ${site.ordinance}`,
           `<div class="brand">PLANO DE LOTES</div><div class="pg">Hoja 1 de 15</div>`)
    + `<div class="body">`
    + `<div class="plan idx"><svg viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" preserveAspectRatio="xMidYMid meet">`
    + `${res}${plan}`
    // Margen izquierdo (x 100-154) sin uso: ahí no tapa ni el rótulo "Mz N" de la
    // fila superior de manzanas ni ningún lote.
    + northArrow(VB.x + 28, VB.y + 150, 24, false) + `</svg></div>`
    + `<div class="col">`
    + `<div class="tot"><strong>${total}</strong> lotes en 14 manzanas · <strong>${disp}</strong> disponibles</div>`
    + `<table><thead><tr><th>Mz</th><th>Letra</th><th>Lotes</th><th>Disp.</th><th>Vend.</th><th>Otros</th><th>Hoja</th></tr></thead>`
    + `<tbody>${rows}</tbody></table>`
    + legend()
    + `<p class="note">Cada manzana tiene su hoja de detalle con la superficie y el estado de cada lote.</p>`
    + `</div></div>`
    + foot(stamp) + `</section>`
}

export function document_(pages) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Plano de lotes — Distrito Payé</title>
<style>
/* A4 apaisado en mm explícitos: el keyword "A4 landscape" no es confiable en Chrome. */
@page { size: 297mm 210mm; margin: 0 }
* { margin: 0; padding: 0; box-sizing: border-box }
/* Sin esto Chrome descarta los fondos al imprimir: --print-to-pdf no tiene flag de background. */
html { -webkit-print-color-adjust: exact; print-color-adjust: exact }
body { background: #fff; color: #1f2937;
       font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 9pt }
.page { width: 297mm; height: 209.8mm; overflow: hidden;
        display: flex; flex-direction: column; padding: 9mm 10mm 6mm }
.page:not(:last-child) { break-after: page; page-break-after: always }

.head { display: flex; justify-content: space-between; align-items: flex-start;
        border-bottom: 0.5mm solid #AA1120; padding-bottom: 2mm; margin-bottom: 3mm }
h1 { font-size: 17pt; font-weight: 700; letter-spacing: -0.3px }
.sub { font-size: 8.5pt; color: #6b7280; margin-top: 0.6mm }
.head-r { text-align: right }
.brand { font-size: 9pt; font-weight: 700; color: #AA1120; letter-spacing: 1.4px }
.pg { font-size: 8pt; color: #9ca3af; margin-top: 0.6mm }

.body { flex: 1; min-height: 0; display: flex; gap: 4mm }
.plan { flex: 1; min-width: 0 }
.plan > svg { width: 100%; height: 100%; display: block }
.plan.idx { flex: 0 0 88mm }
.side { flex: 0 0 24mm; display: flex; flex-direction: column; align-items: center;
        justify-content: flex-start; gap: 4mm; padding-top: 2mm }
.loc-cap { font-size: 6pt; color: #9ca3af; text-align: center; margin-top: 1mm; line-height: 1.2 }

.col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3mm }
.tot { font-size: 10pt; color: #374151 }
.tot strong { color: #AA1120; font-size: 12pt }
table { width: 100%; border-collapse: collapse; font-size: 8.5pt }
th { text-align: right; font-weight: 600; color: #6b7280; border-bottom: 0.3mm solid #d1d5db;
     padding: 1.1mm 1.6mm; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.4px }
td { text-align: right; padding: 1.1mm 1.6mm; border-bottom: 0.15mm solid #f1f5f9 }
th:first-child, td:first-child, th:nth-child(2), td:nth-child(2) { text-align: left }
td.ok { font-weight: 700; color: #16a34a }
.note { font-size: 7.5pt; color: #9ca3af; line-height: 1.4 }

.strip { display: flex; align-items: center; justify-content: space-between;
         gap: 4mm; padding: 2mm 0 1mm; border-top: 0.15mm solid #e5e7eb; margin-top: 2mm }
.leg { display: flex; flex-wrap: wrap; gap: 1mm 4mm; font-size: 8pt; color: #374151 }
.leg-i { display: inline-flex; align-items: center; gap: 1.4mm }
.bar { display: flex; align-items: center; gap: 1.2mm; font-size: 7.5pt; color: #6b7280 }
.bar-end { font-weight: 600 }

.foot { display: flex; justify-content: space-between; gap: 4mm; font-size: 6.5pt;
        color: #9ca3af; border-top: 0.15mm solid #e5e7eb; padding-top: 1.2mm }
.stamp { white-space: nowrap; font-weight: 600 }
</style></head><body>${pages.join('')}</body></html>`
}
