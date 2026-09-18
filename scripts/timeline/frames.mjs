// Manifest de la línea de tiempo del sticky de /v4 (ver plan en
// C:\Users\agusj\.claude\plans\...). Fuente única para build.mjs.
//
// Cada frame define de dónde sale y, si la fuente no calza 16:9 ya centrada
// (como el ortomosaico real, que tiene un rombo transparente rotado), un
// `crop` en píxeles de la imagen ORIGINAL, medido a mano con build.mjs --check.
//
// Fases 7-8 del guion (extrusión 3D + lotes por estado) NO son stills: las
// cubre LotScene en Fase 3. Este manifest sólo cubre las etapas 1-6
// (reconstrucción de obra + la bisagra "hoy" del ortomosaico real).
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(__dirname, '..', '..')
export const TMP = path.join(ROOT, '.tmp', 'timelapse')
export const PUB = path.join(ROOT, 'public')

export const FRAMES = [
  {
    id: 'campo',
    src: path.join(TMP, 'K-1b-verde.png'),
    kicker: 'Antes',
    title: 'Antes, un predio nativo.',
    body: 'Hoy, una extensión urbana.',
  },
  {
    id: 'suelo',
    src: path.join(TMP, 'K0-suelo.png'),
    kicker: 'Obra',
    title: 'Inicio de obra.',
    body: 'Relevamiento y movimiento de suelo.',
  },
  {
    id: 'redes',
    src: path.join(TMP, 'K2-redes.png'),
    kicker: 'Redes',
    title: 'La construcción que no se ve.',
    body: 'Infraestructura subterránea — red de agua y cloaca.',
  },
  {
    id: 'cordon',
    src: path.join(TMP, 'K3-cordon.png'),
    kicker: 'Vial',
    title: 'Transitabilidad.',
    body: 'Destape y apertura de calles.',
  },
  {
    id: 'ripio',
    src: path.join(TMP, 'K5-ripio.png'),
    kicker: 'Calles',
    title: 'Obra vial.',
    body: 'Cordón cuneta y enripiado.',
  },
  {
    id: 'hoy',
    src: path.join(PUB, 'ortho-2607.webp'),
    // El ortomosaico real es un rombo rotado sobre fondo transparente
    // (4096x2267). Este recorte (verificado sin canal alpha en los bordes,
    // ver .tmp/crop-candidates3.mjs de la sesión que lo eligió) centra un
    // cruce de calles recién abiertas y anchas (con acopio de material para
    // cordón cuneta a un costado) — pedido explícito: que se note la apertura
    // de calles, no sólo manzanas con pasto. Recorte anterior (400,470,2867,1350)
    // mostraba manzanas y un auto pero las calles no se leían como "abiertas".
    crop: { left: 2050, top: 900, width: 1900, height: 950 },
    kicker: 'Hoy — 29/07/2026',
    title: 'Esto no es un render.',
    body: 'Vuelo de dron propio, georreferenciado. De acá para abajo, todo lo que veas está proyectado.',
    isReal: true,
  },
]

// Assets fuera de la línea de tiempo pero que salen del mismo pipeline.
export const EXTRAS = [
  {
    id: 'agrimensor',
    src: path.join(TMP, 'B0-agrimensor.png'),
    out: 'closing',
  },
]

// Renders del barrio terminado (sección 8) — llevan el rótulo quemado.
export const RENDERS = [
  {
    id: 'render-ripio',
    src: path.join(PUB, 'higgsfield-renders', 'distrito-paye-loteo-terminado-v1.png'),
  },
  {
    id: 'render-parque',
    src: path.join(PUB, 'higgsfield-renders', 'distrito-paye-loteo-terminado-v2-reservas-parque.png'),
  },
]

export const SIZES = [
  { w: 2560, h: 1440, suffix: '' },
  { w: 1280, h: 720, suffix: '-m' },
]
