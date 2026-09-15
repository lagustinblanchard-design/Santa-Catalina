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
    title: 'Acá no había nada.',
    body: 'Campo abierto sobre el eje de expansión de Corrientes.',
  },
  {
    id: 'suelo',
    src: path.join(TMP, 'K0-suelo.png'),
    kicker: 'Obra',
    title: 'Primero se mueve la tierra.',
    body: 'Nivelación y apertura de traza.',
  },
  {
    id: 'redes',
    src: path.join(TMP, 'K2-redes.png'),
    kicker: 'Redes',
    title: 'Lo que no se ve es lo que más cuesta.',
    body: 'Agua y cloaca: hoy, 90% ejecutadas.',
  },
  {
    id: 'cordon',
    src: path.join(TMP, 'K3-cordon.png'),
    kicker: 'Vial',
    title: 'Cordón cuneta.',
    body: '8 de las 16 manzanas ya lo tienen.',
  },
  {
    id: 'ripio',
    src: path.join(TMP, 'K5-ripio.png'),
    kicker: 'Calles',
    title: 'Se puede entrar en auto.',
    body: 'Apertura y ripio en ejecución, sector oeste.',
  },
  {
    id: 'hoy',
    src: path.join(PUB, 'ortho-2607.webp'),
    // El ortomosaico real es un rombo rotado sobre fondo transparente
    // (4096x2267). Este recorte (verificado sin canal alpha en los bordes,
    // ver .tmp/crop-candidates2.mjs de la sesión que lo eligió) muestra varias
    // manzanas con calles cruzadas y lotes distinguibles — el recorte anterior
    // (614,390,2867,1406) centraba el "hoy" en un cruce de calles vacío que en
    // portrait mobile (object-cover corta ~74% del ancho) se veía como campo
    // abierto, no como un barrio en desarrollo.
    crop: { left: 400, top: 470, width: 2867, height: 1350 },
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
