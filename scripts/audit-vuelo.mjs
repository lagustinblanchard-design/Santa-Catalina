#!/usr/bin/env node
/**
 * Auditoría del set de fotogrametría antes de procesarlo con ODM.
 *
 *   node scripts/audit-vuelo.mjs <carpeta-con-jpg>
 *
 * Una corrida de ODM son horas. Esto son segundos y evita descubrir a mitad de camino
 * que faltan fotos, que alguna no tiene geotag, o que el solape no alcanza.
 *
 * NO chequea los campos drone-dji:Gimbal*Degree. En el DJI Mini 2 (FC7703) valen +0.00
 * en todas las fotos aunque la cámara esté a nadir — son placeholders vacíos del
 * firmware, no una medición. Verificado sobre el vuelo del 29/07: los tres ejes del
 * gimbal daban 0.00 mientras FlightYawDegree variaba entre -79.9 y +101.1. Chequearlos
 * marcaría como fallado un vuelo perfectamente bueno. El ángulo se verifica mirando
 * una foto.
 */

import { readdirSync, openSync, readSync, closeSync } from 'node:fs'
import { join } from 'node:path'

const HEADER_BYTES = 120_000 // EXIF + XMP viven en los primeros KB; no hace falta leer 8 MB
const ALT_TOLERANCE_M = 5
const MAX_SPACING_M = 16 // 80% de solape frontal a ~79 m con el Mini 2
const FOOTPRINT_MARGIN_M = 54 // media huella: cada foto ve ~108 m de ancho en el suelo

// ---------- lectura de metadatos ----------

function readHeader(path) {
  const fd = openSync(path, 'r')
  try {
    const buf = Buffer.alloc(HEADER_BYTES)
    const n = readSync(fd, buf, 0, HEADER_BYTES, 0)
    return buf.subarray(0, n)
  } finally {
    closeSync(fd)
  }
}

function findExifTiff(b) {
  let p = 2
  while (p < b.length - 4) {
    if (b[p] !== 0xff) { p++; continue }
    const marker = b[p + 1]
    const len = b.readUInt16BE(p + 2)
    if (marker === 0xe1 && b.toString('latin1', p + 4, p + 10) === 'Exif\0\0') return p + 10
    p += 2 + len
  }
  return -1
}

function parseExif(b) {
  const tiff = findExifTiff(b)
  if (tiff < 0) return null

  const le = b.toString('latin1', tiff, tiff + 2) === 'II'
  const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o))
  const u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o))
  const rational = (o) => u32(o) / u32(o + 4)

  const readIfd = (off) => {
    const entries = {}
    const count = u16(off)
    for (let i = 0; i < count; i++) {
      const e = off + 2 + i * 12
      entries[u16(e)] = { value: u32(e + 8), valueOffset: e + 8 }
    }
    return entries
  }

  const ifd0 = readIfd(tiff + u32(tiff + 4))
  const out = { lat: null, lng: null, iso: null, exposure: null }

  const gpsPointer = ifd0[0x8825]
  if (gpsPointer) {
    const gps = readIfd(tiff + gpsPointer.value)
    if (gps[2] && gps[4]) {
      const dms = (tag) => {
        const o = tiff + gps[tag].value
        return rational(o) + rational(o + 8) / 60 + rational(o + 16) / 3600
      }
      const ref = (tag) => (gps[tag] ? b.toString('latin1', gps[tag].valueOffset, gps[tag].valueOffset + 1) : '')
      out.lat = ref(1) === 'S' ? -dms(2) : dms(2)
      out.lng = ref(3) === 'W' ? -dms(4) : dms(4)
    }
  }

  const exifPointer = ifd0[0x8769]
  if (exifPointer) {
    const exif = readIfd(tiff + exifPointer.value)
    if (exif[0x8827]) out.iso = exif[0x8827].value
    if (exif[0x829a]) out.exposure = Math.round(1 / rational(tiff + exif[0x829a].value))
  }

  return out
}

function parseRelativeAltitude(b) {
  const m = b.toString('latin1').match(/drone-dji:RelativeAltitude="([+-]?[\d.]+)"/)
  return m ? parseFloat(m[1]) : null
}

// ---------- geometría ----------

const M_PER_DEG_LAT = 111320
const mPerDegLng = (lat) => M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180)

function metersBetween(a, b) {
  const dx = (b.lng - a.lng) * mPerDegLng(a.lat)
  const dy = (b.lat - a.lat) * M_PER_DEG_LAT
  return Math.hypot(dx, dy)
}

function median(nums) {
  const s = [...nums].sort((x, y) => x - y)
  return s[Math.floor(s.length / 2)]
}

// El bbox del loteo, proyectando lot_geometry.json con la calibración de lib/geo/calibration.ts.
// Duplicado a propósito: este script tiene que poder correr sin levantar el bundle de Next.
// Si estos números cambian ahí, actualizar acá a mano (Node no compila el .ts standalone).
const CAL = { x: 860.5, y: 303.4, lat: -27.5283803, lng: -58.8082423, a: 0.06351723, b: 0.42557488 }

async function loteoBBox() {
  const geo = (await import('../lib/lot_geometry.json', { with: { type: 'json' } })).default
  const m = mPerDegLng(CAL.lat)
  const toLngLat = (x, y) => {
    const dx = x - CAL.x
    const dy = y - CAL.y
    return [CAL.lng + (CAL.a * dx + CAL.b * dy) / m, CAL.lat + (CAL.b * dx - CAL.a * dy) / M_PER_DEG_LAT]
  }
  const lats = []
  const lngs = []
  for (const [x0, y0, x1, y1] of Object.values(geo.lots)) {
    for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) {
      const [lng, lat] = toLngLat(x, y)
      lngs.push(lng)
      lats.push(lat)
    }
  }
  return { latMin: Math.min(...lats), latMax: Math.max(...lats), lngMin: Math.min(...lngs), lngMax: Math.max(...lngs) }
}

// ---------- reporte ----------

const results = []
const check = (name, pass, detail) => results.push({ name, pass, detail })

async function main() {
  const dir = process.argv[2]
  if (!dir) {
    console.error('Uso: node scripts/audit-vuelo.mjs <carpeta-con-jpg>')
    process.exit(1)
  }

  const files = readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).sort()
  if (files.length === 0) {
    console.error(`No hay JPG en ${dir}`)
    process.exit(1)
  }

  console.log(`Leyendo ${files.length} fotos de ${dir}\n`)

  const photos = []
  const unreadable = []
  for (const f of files) {
    const header = readHeader(join(dir, f))
    const exif = parseExif(header)
    if (!exif) { unreadable.push(f); continue }
    photos.push({ file: f, ...exif, relAlt: parseRelativeAltitude(header) })
  }

  // 1. Continuidad de la numeración
  const nums = files.map((f) => f.match(/(\d+)\.jpe?g$/i)?.[1]).filter(Boolean).map(Number)
  if (nums.length === files.length) {
    const lo = Math.min(...nums)
    const hi = Math.max(...nums)
    const have = new Set(nums)
    const missing = []
    for (let n = lo; n <= hi; n++) if (!have.has(n)) missing.push(n)
    check(
      'Continuidad',
      missing.length === 0,
      missing.length === 0
        ? `${nums.length} fotos, ${lo}–${hi}, sin huecos`
        : `faltan ${missing.length} de ${hi - lo + 1} (rango ${lo}–${hi}) — ODM parte el mapa en los huecos`,
    )
  }

  // 2. Geotag — una sola foto sin GPS rompe la corrida
  const noGeo = photos.filter((p) => p.lat === null)
  check(
    'Geotag',
    noGeo.length === 0 && unreadable.length === 0,
    noGeo.length === 0 && unreadable.length === 0
      ? `las ${photos.length} tienen GPS`
      : `${noGeo.length} sin GPS, ${unreadable.length} sin EXIF legible`,
  )

  const geo = photos.filter((p) => p.lat !== null)
  if (geo.length < 2) {
    report()
    return
  }

  // 3. Cobertura del loteo
  const flight = {
    latMin: Math.min(...geo.map((p) => p.lat)), latMax: Math.max(...geo.map((p) => p.lat)),
    lngMin: Math.min(...geo.map((p) => p.lng)), lngMax: Math.max(...geo.map((p) => p.lng)),
  }
  const mLng = mPerDegLng(flight.latMin)
  const site = await loteoBBox()
  const gaps = {
    N: (flight.latMax - site.latMax) * M_PER_DEG_LAT,
    S: (site.latMin - flight.latMin) * M_PER_DEG_LAT,
    O: (site.lngMin - flight.lngMin) * mLng,
    E: (flight.lngMax - site.lngMax) * mLng,
  }
  const worst = Math.min(...Object.values(gaps))
  check(
    'Cobertura',
    worst + FOOTPRINT_MARGIN_M > 0,
    `vuelo ${((flight.lngMax - flight.lngMin) * mLng).toFixed(0)}×${((flight.latMax - flight.latMin) * M_PER_DEG_LAT).toFixed(0)} m · ` +
      `márgenes N ${gaps.N.toFixed(0)} S ${gaps.S.toFixed(0)} E ${gaps.E.toFixed(0)} O ${gaps.O.toFixed(0)} m ` +
      `(+${FOOTPRINT_MARGIN_M} m de huella)`,
  )

  // 4. Altura constante
  const alts = photos.map((p) => p.relAlt).filter((a) => a !== null)
  if (alts.length) {
    const med = median(alts)
    const off = alts.filter((a) => Math.abs(a - med) > ALT_TOLERANCE_M)
    check(
      'Altura',
      off.length === 0,
      `mediana ${med.toFixed(1)} m, rango ${Math.min(...alts).toFixed(1)}–${Math.max(...alts).toFixed(1)} m` +
        (off.length ? ` · ${off.length} fuera de ±${ALT_TOLERANCE_M} m` : ''),
    )
  }

  // 5. Solape entre disparos consecutivos.
  // El salto de una pasada a la otra es legítimamente largo, así que se mide la mediana:
  // si ella se pasa de 16 m, el solape frontal no alcanza en toda la grilla.
  const spacings = []
  for (let i = 1; i < geo.length; i++) spacings.push(metersBetween(geo[i - 1], geo[i]))
  const medSpacing = median(spacings)
  check(
    'Solape',
    medSpacing <= MAX_SPACING_M,
    `mediana ${medSpacing.toFixed(1)} m entre disparos (límite ${MAX_SPACING_M} m para 80% frontal)`,
  )

  // 6. Exposición pareja — evita costuras visibles en el ortomosaico
  const isos = new Set(photos.map((p) => p.iso).filter(Boolean))
  const exps = new Set(photos.map((p) => p.exposure).filter(Boolean))
  check(
    'Exposición',
    isos.size === 1 && exps.size === 1,
    `ISO ${[...isos].join('/')} · velocidad ${[...exps].map((e) => `1/${e}`).join(' ')}` +
      (isos.size > 1 || exps.size > 1 ? ' — variable, puede dejar costuras' : ''),
  )

  report()
}

function report() {
  const width = Math.max(...results.map((r) => r.name.length))
  for (const r of results) {
    console.log(`${r.pass ? 'PASA  ' : 'FALLA '} ${r.name.padEnd(width)}  ${r.detail}`)
  }
  const failed = results.filter((r) => !r.pass)
  console.log('')
  if (failed.length === 0) {
    console.log('El set está listo para procesar.')
  } else {
    console.log(`Revisar antes de procesar: ${failed.map((r) => r.name).join(', ')}.`)
    process.exitCode = 1
  }
}

main()
