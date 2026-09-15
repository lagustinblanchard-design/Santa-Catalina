#!/usr/bin/env node
/**
 * Deriva public/hero-video-mobile.mp4 a partir de public/hero-video.mp4 —
 * el original (1600x900, 3.8 MB) es el que carga desktop; celular necesita
 * algo bastante más liviano para no gastar datos en 4G (ver components/Hero.tsx
 * y components/v4/HeroV4.tsx, que eligen la fuente por matchMedia).
 *
 * 720p y no 540p: en un celular retina el <video> escala con object-cover
 * hacia arriba, y 540p se ve notablemente blando en pantallas de alta
 * densidad. crf 32 es agresivo (vs. el ~23 típico) porque es fondo
 * decorativo detrás de texto y overlay oscuro, no el foco de atención.
 *
 * Uso: node scripts/hero-video/build.mjs
 */
import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SRC = path.join(ROOT, 'public', 'hero-video.mp4')
const OUT = path.join(ROOT, 'public', 'hero-video-mobile.mp4')
const TARGET_BYTES = 1.5 * 1024 * 1024

execFileSync('ffmpeg', [
  '-y',
  '-i', SRC,
  '-vf', 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720',
  '-c:v', 'libx264',
  '-preset', 'slow',
  '-crf', '34',
  '-an', // el <video> siempre va muted, no hace falta bajar audio
  '-movflags', '+faststart',
  OUT,
], { stdio: 'inherit' })

const bytes = statSync(OUT).size
const mb = (bytes / (1024 * 1024)).toFixed(2)
console.log(`\n${OUT} → ${mb} MB`)
if (bytes > TARGET_BYTES) {
  console.warn(`⚠ por encima del objetivo de 1,5 MB — considerar subir el crf o revisar la duración del original.`)
}
