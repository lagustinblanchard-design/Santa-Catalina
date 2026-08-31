#!/usr/bin/env node
/**
 * Genera el PDF del plano de lotes para enviar a clientes: 1 hoja índice + 14
 * hojas, una por manzana, con m² y estado de venta legibles en cada lote.
 *
 * El estado de venta sale en vivo de la planilla de Google Sheets (lib/sheets.ts,
 * la misma que usa el sitio). El render usa Chrome headless del sistema con
 * --print-to-pdf, igual que scripts/avance-images/build.mjs — no incorpora
 * puppeteer ni playwright sólo para esto.
 *
 * Requiere Node ≥ 22 (type stripping: este script importa lib/*.ts directo, sin
 * transpilar). El .nvmrc del repo pide 20 para Vercel; no lo cambia esto, sólo
 * hace falta una versión más nueva en la máquina donde se genera el PDF.
 *
 * Uso:
 *   node scripts/plano-pdf/build.mjs             # en vivo desde la planilla
 *   node scripts/plano-pdf/build.mjs --html       # sólo el HTML, para iterar
 *   node scripts/plano-pdf/build.mjs --offline    # sin red, estado del repo
 *   node scripts/plano-pdf/build.mjs --allow-partial
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { LOTS, applyStatuses, getBlockLots, BLOCK_LETTER } from '../../lib/lots.ts'
import { fetchLotStatuses } from '../../lib/sheets.ts'
import { SITE } from '../../lib/data.ts'
import { layoutBlock } from './geometry.mjs'
import { blockPage, indexPage, document_ } from './pages.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]

function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p))
  if (!found) throw new Error('No encontré Chrome ni Edge. Instalá alguno o ajustá CHROME_CANDIDATES.')
  return found
}

function parseArgs(argv) {
  const opts = {}
  for (const a of argv) {
    if (a.startsWith('--')) opts[a.slice(2)] = true
  }
  const outIdx = argv.indexOf('--out')
  if (outIdx >= 0) opts.out = argv[outIdx + 1]
  return opts
}

function assertNode() {
  const major = Number(process.versions.node.split('.')[0])
  if (major < 22) {
    throw new Error(
      `Requiere Node ≥ 22 (type stripping para importar lib/*.ts). Versión actual: ${process.versions.node}.\n` +
      `Ejecutá: nvm use 24  (esto NO cambia .nvmrc, que sigue en 20 para Vercel)`
    )
  }
}

async function loadStatuses(opts) {
  if (opts.offline) {
    console.log('--offline: usando el estado hardcodeado de lib/lots.ts (sin red).')
    return { overrides: {}, coverage: 0, source: 'hardcodeado' }
  }

  const overrides = await fetchLotStatuses().catch((err) => {
    console.warn(`No se pudo consultar la planilla: ${err.message}`)
    return {}
  })
  const coverage = Object.keys(overrides).length

  if (coverage < LOTS.length && !opts['allow-partial']) {
    const missing = new Set(LOTS.map((l) => l.block).filter((b) =>
      getBlockLots(b).some((l) => !(l.id in overrides))
    ))
    throw new Error(
      `La planilla devolvió ${coverage}/${LOTS.length} lotes. Manzanas incompletas: ` +
      `${[...missing].sort((a, b) => a - b).join(', ')}.\n` +
      `Eso mezclaría estado en vivo con estado desactualizado del repo en el mismo PDF. ` +
      `Reintentá, o forzá con --allow-partial si es intencional.`
    )
  }

  return {
    overrides, coverage,
    source: coverage >= LOTS.length ? 'planilla' : 'planilla (parcial, --allow-partial)',
  }
}

function buildHtml(lots, source) {
  const geo = JSON.parse(readFileSync(path.join(ROOT, 'lib', 'lot_geometry.json'), 'utf8'))
  const stamp = `Datos al ${new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })} · fuente: ${source}`

  // Área útil de dibujo en px CSS (96dpi) dentro de cada hoja de manzana, ya
  // descontados márgenes/header/legend/pie (.plan en el CSS de pages.mjs).
  const AREA_W = 1047, AREA_H = 597

  const pages = []
  const idxLots = lots.map((l) => ({ ...l, rect: geo.lots[l.id] }))
  pages.push(indexPage(idxLots, geo.bboxes, SITE, stamp))

  for (let block = 1; block <= 14; block++) {
    const blockLots = getBlockLots(block).map((l) => {
      const withStatus = lots.find((x) => x.id === l.id)
      return { ...l, status: withStatus.status } // sin price: no se muestra
    })
    const bbox = geo.bboxes[String(block)]
    const lotRects = blockLots.map((l) => [l.id, geo.lots[l.id]]).filter(([, r]) => r)
    const layout = layoutBlock(block, bbox, lotRects, { useW: AREA_W, useH: AREA_H })
    pages.push(blockPage(block, blockLots, layout, geo.bboxes, stamp, block + 1))
  }

  return document_(pages)
}

function checkGeometry() {
  const geo = JSON.parse(readFileSync(path.join(ROOT, 'lib', 'lot_geometry.json'), 'utf8'))
  console.log('\nDiscrepancias geometría vs. dims declarada (> 1 m²):')
  for (const lot of LOTS) {
    const r = geo.lots[lot.id]
    if (!r) continue
    const geomSqm = ((r[2] - r[0]) * (r[3] - r[1])) / (2.4 * 2.4)
    const diff = Math.abs(geomSqm - lot.sqm)
    if (diff > 1) {
      console.log(`  ${lot.id}  dims=${lot.dims}  declarado=${lot.sqm}m²  geometría=${geomSqm.toFixed(1)}m²  Δ=${diff.toFixed(1)}`)
    }
  }
}

function render(chrome, htmlPath, outPath) {
  const tmpProfile = path.join(tmpdir(), `plano-pdf-profile-${process.pid}`)
  const args = [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-sandbox',
    '--force-device-scale-factor=1',
    `--user-data-dir=${tmpProfile}`, // sin esto puede colgarse contra el perfil de Chrome ya abierto
    '--virtual-time-budget=6000',
    '--no-pdf-header-footer',
    `--print-to-pdf=${outPath}`,
    pathToFileURL(htmlPath).href, // no `file://${path}`: en Windows da file://C:\... mal formado
  ]
  execFileSync(chrome, args, { stdio: 'pipe', timeout: 60000 })
  rmSync(tmpProfile, { recursive: true, force: true })
}

/** Cuenta páginas y valida el tamaño contra A4 apaisado (841.89×595.28pt), para
 *  atrapar en silencio el caso en que Chrome ignoró @page. */
function verifyPdf(outPath) {
  const bytes = readFileSync(outPath, 'latin1')
  const pageCount = (bytes.match(/\/Type\s*\/Page[^s]/g) || []).length
  const media = bytes.match(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/)

  if (pageCount !== 15) {
    throw new Error(`El PDF tiene ${pageCount} páginas, se esperaban 15. Revisá @page / page-break en pages.mjs.`)
  }
  if (media) {
    const w = parseFloat(media[3]), h = parseFloat(media[4])
    if (Math.abs(w - 841.89) > 2 || Math.abs(h - 595.28) > 2) {
      throw new Error(`MediaBox ${w}x${h}pt no es A4 apaisado (841.89x595.28pt esperado).`)
    }
  }
  console.log(`Verificado: ${pageCount} páginas, A4 apaisado.`)
}

async function main() {
  assertNode()
  const opts = parseArgs(process.argv.slice(2))

  const { overrides, source } = await loadStatuses(opts)
  const lots = applyStatuses(overrides).map(({ price, ...rest }) => rest) // sin precio en el PDF

  if (opts['check-geometry']) checkGeometry()

  const html = buildHtml(lots, source)

  const outDir = path.join(ROOT, 'out', 'plano')
  mkdirSync(outDir, { recursive: true })
  const htmlPath = path.join(outDir, 'plano.html')
  writeFileSync(htmlPath, html, 'utf8')
  console.log(`HTML: ${htmlPath}`)

  if (opts.html) {
    console.log('--html: listo para revisar en el navegador (vista previa de impresión).')
    return
  }

  const chrome = findChrome()
  const outPath = opts.out ? path.resolve(opts.out) : path.join(outDir, 'plano-distrito-paye.pdf')
  console.log(`Navegador: ${path.basename(chrome)}`)
  render(chrome, htmlPath, outPath)
  verifyPdf(outPath)
  console.log(`PDF: ${outPath}`)
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`)
  process.exitCode = 1
})
