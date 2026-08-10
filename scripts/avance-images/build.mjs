#!/usr/bin/env node
/**
 * Genera las imágenes informativas de avance de obra del Barrio Santa Catalina.
 *
 * Los datos salen de lib/avance.json (fuente única de verdad: para el reporte
 * del mes siguiente se edita SOLO ese archivo y se vuelve a correr esto).
 * El render usa Chrome headless, ya instalado en el sistema — el proyecto no
 * incorpora puppeteer ni playwright sólo para esto.
 *
 * Uso:
 *   node scripts/avance-images/build.mjs
 *   node scripts/avance-images/build.mjs --formato 9x16 --pieza vial
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { FORMATS, PIEZAS, renderPieza } from './template.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]

function findChrome() {
  const found = CHROME_CANDIDATES.find(p => existsSync(p))
  if (!found) {
    throw new Error('No encontré Chrome ni Edge. Instalá alguno o ajustá CHROME_CANDIDATES.')
  }
  return found
}

function parseArgs(argv) {
  const opts = {}
  for (let i = 0; i < argv.length; i += 2) {
    opts[argv[i].replace(/^--/, '')] = argv[i + 1]
  }
  return opts
}

function render(chrome, htmlPath, outPath, f) {
  const common = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-sandbox',
    '--force-device-scale-factor=1',
    // Le da tiempo a la fuente web a cargar antes de capturar.
    '--virtual-time-budget=4000',
  ]

  const args = f.print
    ? [...common, '--no-pdf-header-footer', `--print-to-pdf=${outPath}`, `file://${htmlPath}`]
    : [...common, `--window-size=${f.w},${f.h}`, `--screenshot=${outPath}`, `file://${htmlPath}`]

  execFileSync(chrome, args, { stdio: 'pipe' })
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  const chrome = findChrome()

  const data = JSON.parse(readFileSync(path.join(ROOT, 'lib', 'avance.json'), 'utf8'))

  const formatos = !opts.formato || opts.formato === 'todos'
    ? Object.keys(FORMATS)
    : [opts.formato]
  const piezas = !opts.pieza || opts.pieza === 'todas'
    ? PIEZAS
    : [opts.pieza]

  const outDir = path.join(ROOT, 'out', `avance-${data.mes}`)
  mkdirSync(outDir, { recursive: true })

  const tmp = path.join(tmpdir(), `avance-${process.pid}`)
  mkdirSync(tmp, { recursive: true })

  console.log(`Navegador: ${path.basename(chrome)}`)
  console.log(`Salida:    ${outDir}\n`)

  let ok = 0
  for (const formato of formatos) {
    const f = FORMATS[formato]
    if (!f) throw new Error(`Formato desconocido: ${formato}. Válidos: ${Object.keys(FORMATS).join(', ')}`)

    for (const pieza of piezas) {
      const html = renderPieza(pieza, formato, data)
      const htmlPath = path.join(tmp, `${pieza}-${formato}.html`)
      writeFileSync(htmlPath, html, 'utf8')

      const ext = f.print ? 'pdf' : 'png'
      const outPath = path.join(outDir, `${data.mes}-${pieza}-${formato}.${ext}`)

      render(chrome, htmlPath, outPath, f)
      console.log(`  OK ${path.basename(outPath)}  (${f.print ? 'A4' : `${f.w}x${f.h}`})`)
      ok++
    }
  }

  rmSync(tmp, { recursive: true, force: true })
  console.log(`\n${ok} archivo(s) generado(s).`)
}

main()
