#!/usr/bin/env node
/**
 * Deriva los assets de la línea de tiempo de /v4 a partir de los PNG de IA
 * (.tmp/timelapse/, no versionado) y del ortomosaico real (public/).
 *
 * Salida: public/timeline/{id}[-m].{avif,webp} + lib/timeline/frames.generated.json
 * (id, w, h, lqip en base64). Todo bajo /public → sirve desde 'self', no
 * toca la CSP de next.config.ts.
 *
 * Uso:
 *   node scripts/timeline/build.mjs           # genera los assets finales
 *   node scripts/timeline/build.mjs --check   # además, overlays de alineación
 *                                              # en .tmp/timeline-check/
 */
import sharp from 'sharp'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { FRAMES, EXTRAS, RENDERS, SIZES, ROOT } from './frames.mjs'

const CHECK = process.argv.includes('--check')

const OUT_PUBLIC = path.join(ROOT, 'public', 'timeline')
const OUT_LIB = path.join(ROOT, 'lib', 'timeline')
const OUT_CHECK = path.join(ROOT, '.tmp', 'timeline-check')
mkdirSync(OUT_PUBLIC, { recursive: true })
mkdirSync(OUT_LIB, { recursive: true })
if (CHECK) mkdirSync(OUT_CHECK, { recursive: true })

function baseImage(frame) {
  let img = sharp(frame.src)
  if (frame.crop) img = img.extract(frame.crop)
  return img
}

async function lqip(frame) {
  const buf = await baseImage(frame).resize(24, 14, { fit: 'cover' }).webp({ quality: 40 }).toBuffer()
  return `data:image/webp;base64,${buf.toString('base64')}`
}

async function deriveSizes(frame, destDir, id) {
  const results = []
  for (const size of SIZES) {
    const resized = () => baseImage(frame).resize(size.w, size.h, { fit: 'cover' })
    const avifPath = path.join(destDir, `${id}${size.suffix}.avif`)
    const webpPath = path.join(destDir, `${id}${size.suffix}.webp`)
    await resized().avif({ quality: 50, effort: 4 }).toFile(avifPath)
    await resized().webp({ quality: 72 }).toFile(webpPath)
    results.push({ w: size.w, h: size.h, suffix: size.suffix })
    console.log(`  ${id}${size.suffix}: ${size.w}x${size.h} OK`)
  }
  return results
}

function labelSvg(w, h) {
  const pad = Math.round(w * 0.018)
  const fontSize = Math.round(w * 0.014)
  const text = 'Render ilustrativo · no contractual'
  const textW = Math.round(text.length * fontSize * 0.56)
  const boxW = textW + pad * 2
  const boxH = Math.round(fontSize * 2.2)
  const x = w - boxW - pad
  const y = h - boxH - pad
  return Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="${boxH / 2}"
            fill="#2E2A26" fill-opacity="0.82" />
      <text x="${x + boxW / 2}" y="${y + boxH / 2}" text-anchor="middle" dominant-baseline="central"
            font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700"
            fill="#F2ECE0" letter-spacing="0.5">${text}</text>
    </svg>`)
}

async function deriveRenderSizes(renderDef, destDir, id) {
  for (const size of SIZES) {
    const svg = labelSvg(size.w, size.h)
    const composed = () =>
      sharp(renderDef.src)
        .resize(size.w, size.h, { fit: 'cover' })
        .composite([{ input: svg, top: 0, left: 0 }])
    await composed().avif({ quality: 55, effort: 4 }).toFile(path.join(destDir, `${id}${size.suffix}.avif`))
    await composed().webp({ quality: 78 }).toFile(path.join(destDir, `${id}${size.suffix}.webp`))
    console.log(`  ${id}${size.suffix}: ${size.w}x${size.h} OK (rotulado)`)
  }
}

async function main() {
  for (const f of FRAMES) {
    if (!existsSync(f.src)) throw new Error(`Falta la fuente: ${f.src}`)
  }

  console.log('== Línea de tiempo (etapas 1-6) ==')
  const manifest = []
  for (const frame of FRAMES) {
    const sizes = await deriveSizes(frame, OUT_PUBLIC, frame.id)
    manifest.push({
      id: frame.id,
      kicker: frame.kicker,
      title: frame.title,
      body: frame.body,
      isReal: frame.isReal ?? false,
      lqip: await lqip(frame),
      sizes,
    })
  }
  writeFileSync(
    path.join(OUT_LIB, 'frames.generated.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), frames: manifest }, null, 2)
  )
  console.log(`Manifest → ${path.relative(ROOT, path.join(OUT_LIB, 'frames.generated.json'))}`)

  console.log('\n== Extras (cierre) ==')
  for (const extra of EXTRAS) {
    if (!existsSync(extra.src)) { console.log(`  (falta ${extra.src}, salteado)`); continue }
    await deriveSizes({ src: extra.src }, OUT_PUBLIC, extra.out)
  }

  console.log('\n== Renders del barrio terminado (rotulados) ==')
  for (const render of RENDERS) {
    if (!existsSync(render.src)) { console.log(`  (falta ${render.src}, salteado)`); continue }
    await deriveRenderSizes(render, OUT_PUBLIC, render.id)
  }

  if (CHECK) {
    console.log('\n== Overlays de alineación (--check) ==')
    const ref = FRAMES[0]
    const refBuf = await baseImage(ref).resize(1280, 720, { fit: 'cover' }).toBuffer()
    for (const frame of FRAMES) {
      const overlay = await baseImage(frame).resize(1280, 720, { fit: 'cover' }).ensureAlpha(0.5).toBuffer()
      const outPath = path.join(OUT_CHECK, `${ref.id}-vs-${frame.id}.png`)
      await sharp(refBuf).composite([{ input: overlay }]).png().toFile(outPath)
      console.log(`  ${path.relative(ROOT, outPath)}`)
    }
  }

  console.log('\nOK.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
