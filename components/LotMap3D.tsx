'use client'

/**
 * Showpiece 3D del loteo Santa Catalina.
 * deck.gl standalone sobre satelital de Esri (gratis, sin API key ni Map ID de Google).
 * Reutiliza el georreferenciado ya calibrado (svgToLatLng) y lot_geometry.json.
 * Los dúplex futuros se enchufan como modelos glTF en MODELS (ScenegraphLayer) — hoy vacío.
 *
 * Terreno fotorrealista (malla de dron): hook dormido hasta tener una captura real.
 * Ver plan `para-el-terreno-fotorrealista-tranquil-newell.md`. Cuando exista el asset en
 * Cesium ion, cargar NEXT_PUBLIC_CESIUM_ION_ASSET_ID / NEXT_PUBLIC_CESIUM_ION_TOKEN en
 * .env.local (ver .env.example) — sin esas vars este bloque no hace nada (HAS_TERRAIN_MESH
 * = false) y el showroom se comporta exactamente igual que antes.
 *
 * Aislado del componente 2D de producción (GoogleMapsLotMap). Se renderiza en /mapa-3d.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { DeckGL } from '@deck.gl/react'
import type { DeckGLRef } from '@deck.gl/react'
import { MapView, LightingEffect, AmbientLight, DirectionalLight, FlyToInterpolator, LinearInterpolator } from '@deck.gl/core'
import type { MapViewState } from '@deck.gl/core'
import { PolygonLayer, BitmapLayer, TextLayer } from '@deck.gl/layers'
import { TileLayer, Tile3DLayer } from '@deck.gl/geo-layers'
import { ScenegraphLayer } from '@deck.gl/mesh-layers'
import { CesiumIonLoader } from '@loaders.gl/3d-tiles'
import { type Lot } from '@/lib/lots'
import { STATUS_LABELS, SITE, PROJECT_PHASES, SURROUNDINGS, type LotStatus } from '@/lib/data'
import GEO from '@/lib/lot_geometry.json'
import { ORTHO_URL, ORTHO_BOUNDS } from '@/lib/ortho'
import { svgToLngLat } from '@/lib/geo/calibration'
import { FeatherExtension } from '@/lib/geo/feather-extension'
import { EASE_OUT, DURATION } from '@/lib/motion'

const featherExtension = new FeatherExtension()

// ---------- Georreferenciado (ver lib/geo/calibration.ts) ----------

function rectToPolygon(c: [number, number, number, number]): [number, number][] {
  const [x0, y0, x1, y1] = c
  return [svgToLngLat(x0, y0), svgToLngLat(x1, y0), svgToLngLat(x1, y1), svgToLngLat(x0, y1)]
}

function centroid(c: [number, number, number, number]): [number, number] {
  return svgToLngLat((c[0] + c[2]) / 2, (c[1] + c[3]) / 2)
}

const LOTS_GEO = GEO.lots as unknown as Record<string, [number, number, number, number]>

// ---------- Estilos ----------
// Tipografía del recorrido 3D: Helvetica Bold en todo el chrome de overlay (títulos,
// microetiquetas, botones) — reemplaza el par Cinzel/Josefin heredado de /v2 a pedido
// del owner. Es system font (sin @next/font de por medio), así que no hay costo de carga.
const HELVETICA = "'Helvetica Neue', Helvetica, Arial, sans-serif"

// Chip de filtro/toggle en el vocabulario de v2: bordes rectos, hairline de 1px, único
// acento #FF1200 — reemplaza el rounded-full + bg-black/40 heredado de v1.
function chipStyle(active: boolean): React.CSSProperties {
  return {
    fontFamily: HELVETICA,
    fontWeight: 700,
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '0.45rem 0.9rem',
    backdropFilter: 'blur(6px)',
    cursor: 'pointer',
    background: active ? '#FF1200' : 'rgba(12,12,12,0.55)',
    color: active ? '#fff' : '#ccc',
    border: active ? '1px solid #FF1200' : '1px solid rgba(255,255,255,0.2)',
    transition: 'background-color 150ms, border-color 150ms, color 150ms',
  }
}

const STATUS_RGB: Record<LotStatus, [number, number, number]> = {
  DISPONIBLE: [22, 163, 74],
  RESERVADO: [202, 138, 4],
  VENDIDO: [220, 38, 38],
  FIDEICOMISO: [147, 51, 234],
  NO_COMERCIALIZABLE: [156, 163, 175],
}
const STATUS_HEX: Record<LotStatus, string> = {
  DISPONIBLE: '#16a34a',
  RESERVADO: '#ca8a04',
  VENDIDO: '#dc2626',
  FIDEICOMISO: '#9333ea',
  NO_COMERCIALIZABLE: '#9ca3af',
}
const STATUS_ELEV: Record<LotStatus, number> = {
  DISPONIBLE: 4,
  RESERVADO: 3,
  VENDIDO: 2,
  FIDEICOMISO: 2,
  NO_COMERCIALIZABLE: 1.5,
}
const STATUSES = Object.keys(STATUS_LABELS) as LotStatus[]

const RESERVES: { name: string; coords: [number, number, number, number] }[] = [
  { name: 'Reserva Municipal 1', coords: [537.7, 1447.2, 879.9, 1592.4] },
  { name: 'Reserva Municipal 2', coords: [153.5, 1446.5, 489.7, 1591.7] },
]

// ---------- Terreno fotorrealista (malla de dron, vía Cesium ion) ----------
// Dormido hasta que exista la captura real. Con las env vars vacías, HAS_TERRAIN_MESH
// es false y todo lo demás en este archivo se comporta exactamente igual que hoy.
const ION_ASSET_ID = process.env.NEXT_PUBLIC_CESIUM_ION_ASSET_ID
const ION_TOKEN = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN
const HAS_TERRAIN_MESH = Boolean(ION_ASSET_ID && ION_TOKEN)
// Offset de cota para asentar los lotes sobre la malla real (Corrientes es muy plano;
// alcanza con una constante — afinar a ojo cuando la malla esté cargada).
const TERRAIN_BASE_ELEV = Number(process.env.NEXT_PUBLIC_TERRAIN_BASE_ELEV ?? 0)

// ---------- Dúplex futuros (se completa cuando lleguen los modelos ~2 meses) ----------
// Cada entrada posiciona un .glb sobre un lote. Ejemplo:
//   { lotId: 'M8-L14', url: '/modelos/duplex-a.glb', heading: 90, tipologia: 'Dúplex 3 amb.' }
type DuplexModel = { lotId: string; url: string; heading?: number; sizeScale?: number; tipologia?: string }
const MODELS: DuplexModel[] = []

// ---------- Vista ----------
// zoom/pitch recalibrados contra la huella real del ortomosaico (788 x 492 m): a mayor
// pitch, más pantalla ocupa el satélite de fondo, así que la regla es vista amplia = pitch
// bajo, y pitch alto sólo cuando la cámara ya está encima de la imagen de dron. minZoom
// 15.3 (~4.9 km de ancho) corta el alejamiento al vacío plano pero conserva el centro de
// Corrientes; maxZoom 19.5 empareja el tope de zoom con la resolución real del ortomosaico
// (19.2 cm/px) para no acercarse más allá de lo que el dato entrega nítido.
const INITIAL_VIEW_STATE = {
  longitude: -58.805462,
  latitude: -27.5302,
  zoom: 17.1,
  pitch: 40,
  bearing: -18,
  minZoom: 15.3,
  maxZoom: 19.5,
}

// Arranque del vuelo cinemático: mismo centro, en picada desde arriba. Cenital a propósito
// — sin horizonte no hay plano lejano feo que fugue, aunque el ortomosaico sea chico en cuadro.
const START_VIEW_STATE = {
  ...INITIAL_VIEW_STATE,
  zoom: 15.8,
  pitch: 0,
  bearing: 40,
}

const INTRO_DURATION_MS = 4200
const IDLE_MS = 3200 // sin interacción → retoma la rotación automática
const ROTATE_DEG_PER_SEC = 2.4 // vuelta completa cada ~150s
const LABEL_MIN_ZOOM = 16.4 // etiquetas de lote sólo al acercarse
const HOLD_MS = 400 // margen entre el fin de un vuelo y el próximo — ver startHoldDrift
// ~11m de margen a esta latitud — separa "misma posición, sólo cambia zoom/pitch/bearing"
// de un salto real de centro, para elegir el interpolador (ver isSameCenter/flyCamera).
const SAME_CENTER_EPS = 0.0001

// Ease-in-out cúbico — misma familia que --ease-in-out de app/globals.css (fuerte,
// simétrico). deck.gl pide una función (t)=>number para transitionEasing, no un string
// CSS, así que no se reusa el token literal, pero el carácter del movimiento es el mismo.
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
}

function isSameCenter(a: MapViewState, b: MapViewState): boolean {
  return Math.abs(a.longitude - b.longitude) < SAME_CENTER_EPS && Math.abs(a.latitude - b.latitude) < SAME_CENTER_EPS
}

// FlyToInterpolator (arco de Van Wijk) sólo tiene sentido cuando el centro se traslada
// — sin traslación, el arco degenera. Las paradas que comparten centro (sólo cambia
// zoom/pitch/bearing) usan LinearInterpolator con un ease-in-out cúbico: desplazamiento
// deliberado, no un vuelo. El easing sólo se aplica ahí — sobre FlyToInterpolator alteraría
// su propia curva interna (curve/speed), ya afinada.
function flyTo(view: MapViewState, durationMs = INTRO_DURATION_MS, translates = true): MapViewState {
  return {
    ...view,
    transitionDuration: durationMs,
    transitionInterpolator: translates
      ? new FlyToInterpolator({ curve: 1.3, speed: 0.9 })
      : new LinearInterpolator({ transitionProps: ['zoom', 'pitch', 'bearing'] }),
    transitionEasing: translates ? undefined : easeInOutCubic,
  }
}

// Iluminación "hora dorada": luz cálida rasante + relleno frío tenue + sombra proyectada.
const lightingEffect = new LightingEffect({
  ambient: new AmbientLight({ color: [180, 200, 230], intensity: 0.55 }),
  sun: new DirectionalLight({
    color: [255, 190, 130],
    intensity: 1.0,
    direction: [-0.75, -0.55, -0.25],
  }),
})

type LotFeature = {
  id: string
  block: number
  lot: number
  dims: string
  sqm: number
  status: LotStatus
  price?: number
  polygon: [number, number][]
  position: [number, number]
}

type Waypoint = {
  view: MapViewState
  title?: string
  sub?: string
  spotlight?: LotStatus
  duration: number
}

// Guion del reel de 10s para redes/WhatsApp (?reel=1) — mismo patrón que WAYPOINTS pero
// centrado en avance de obra, no en venta. El texto no se redacta a mano: sale de SITE.stage
// y de PROJECT_PHASES (misma fuente que la sección #proyecto de la home), así que si el
// avance se actualiza el mes que viene, el próximo reel sale con el dato nuevo solo.
const PROGRESS_CAPTION_OBRA = (
  PROJECT_PHASES.find((p) => p.label === 'Infraestructura de servicios')?.detail ?? ''
)
  .split(';')[0]
  .trim()

const PROGRESS_WAYPOINTS: Waypoint[] = (() => {
  const base = { minZoom: INITIAL_VIEW_STATE.minZoom, maxZoom: INITIAL_VIEW_STATE.maxZoom }
  const { longitude, latitude } = INITIAL_VIEW_STATE
  // Duraciones más largas que el diseño original (3000/3000/3200): en la práctica, varios
  // segundos del reel transcurren "invisibles" mientras cargan las texturas (satélite Esri +
  // ortomosaico), así que la ventana con contenido limpio (ya cargado, antes de que termine
  // el reel) queda más corta que la duración interna. Medido con capturas: quedaba en ~8,2s
  // limpios sobre 10,4s internos — se estira acá para asegurar 10s limpios reales.
  return [
    { view: { ...base, longitude, latitude, zoom: 16.8, pitch: 42, bearing: -10 }, duration: 4200 },
    { view: { ...base, longitude, latitude, zoom: 18.0, pitch: 55, bearing: -25 }, title: SITE.stage, duration: 4000 },
    // Duración larga a propósito: para cuando se llega acá todo ya está cargado hace rato,
    // así que estirar este último paso da margen de sobra sin arriesgar el arranque (medido:
    // con 4200 el modo libre ya aparecía a los ~15s, muy pegado a la ventana de 10s limpios).
    { view: { ...base, longitude, latitude, zoom: 17.6, pitch: 48, bearing: 35 }, title: PROGRESS_CAPTION_OBRA, duration: 7500 },
  ]
})()

export default function LotMap3D({ lots }: { lots: Lot[] }) {
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'portada' | 'tour' | 'free' | 'reel'>('portada')
  const [tourStep, setTourStep] = useState(0)
  const [filter, setFilter] = useState<LotStatus | 'ALL'>('ALL')
  const [selected, setSelected] = useState<LotFeature | null>(null)
  // La posición de cámara ya NO vive en React state — antes cada tick de rotación
  // automática y cada frame de vuelo llamaba setViewState, re-renderizando este
  // componente (10 bloques de overlay) hasta 60 veces por segundo. Ahora vive en un ref
  // y se empuja al canvas con deck.setProps directo (ver flyCamera/viewStateRef más abajo);
  // React sólo se entera cuando algo derivado (zoomedIn, la bruma) cruza un umbral.
  const [zoomedIn, setZoomedIn] = useState(false)
  const [hazeOpacity, setHazeOpacity] = useState(0)
  // Toggle entre el mapa de disponibilidad (satélite Esri) y la malla real del dron.
  // Sin malla cargada (HAS_TERRAIN_MESH=false) queda fijo en 'disponibilidad'.
  const [photoMode, setPhotoMode] = useState<'disponibilidad' | 'fotorrealista'>('disponibilidad')
  const deckRef = useRef<DeckGLRef>(null)
  const viewStateRef = useRef<MapViewState>(START_VIEW_STATE)

  // Estado de la cámara cinemática vive en refs (no re-render) para que el loop de
  // rAF pueda leerlo cada frame sin reiniciarse cuando cambian filter/selected/mode.
  const lastInteractionRef = useRef(Date.now())
  const selectedRef = useRef<LotFeature | null>(null)
  const modeRef = useRef(mode)
  useEffect(() => {
    selectedRef.current = selected
  }, [selected])
  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  // prefers-reduced-motion: antes ni el comentario de globals.css (falso — ese bloque CSS
  // nunca llega a esta cámara) ni el código lo respetaban. reducedMotionRef espeja el
  // estado para que el loop de rotación y flyCamera lo lean sin re-suscribirse.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const reducedMotionRef = useRef(false)
  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion
  }, [prefersReducedMotion])
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = () => setPrefersReducedMotion(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Mueve la cámara de forma imperativa (sin setState): actualiza el ref y lo empuja al
  // canvas con deck.setProps. Con reduced-motion, salta directo al encuadre final sin
  // vuelo — ni FlyToInterpolator ni LinearInterpolator entran en el objeto.
  const flyCamera = (view: MapViewState, durationMs?: number) => {
    const target = reducedMotionRef.current
      ? { ...view }
      : flyTo(view, durationMs, !isSameCenter(view, viewStateRef.current))
    viewStateRef.current = target
    deckRef.current?.deck?.setProps({ viewState: target })
  }

  // Sostiene un drift lento de bearing durante el margen entre paradas del tour (HOLD_MS)
  // para que la cámara nunca se congele en seco — sin tocar ninguna duración calibrada
  // del guion. Con reduced-motion no hace nada (la cámara se queda quieta, como corresponde).
  const startHoldDrift = (ms: number): (() => void) => {
    if (reducedMotionRef.current) return () => {}
    let raf = 0
    const startT = performance.now()
    let lastT = startT
    const tick = (t: number) => {
      const dt = (t - lastT) / 1000
      lastT = t
      viewStateRef.current = {
        ...viewStateRef.current,
        bearing: ((viewStateRef.current.bearing ?? 0) + ROTATE_DEG_PER_SEC * dt) % 360,
      }
      deckRef.current?.deck?.setProps({ viewState: viewStateRef.current })
      if (t - startT < ms) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }

  useEffect(() => setMounted(true), [])

  // Disparador del reel de 10s (?reel=1) para el script de captura con Playwright — salta
  // la portada y arranca directo. Usa window.location.search en vez de useSearchParams
  // para no forzar un Suspense boundary en /mapa-3d (hoy es una ruta estática con ISR).
  // ?reel=1 no se linkea desde ningún lado de la UI, es sólo para la captura.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (new URLSearchParams(window.location.search).get('reel') !== '1') return
    setSelected(null)
    setTourStep(0)
    setMode('reel')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const features = useMemo<LotFeature[]>(() => {
    return lots
      .map((l) => {
        const rect = LOTS_GEO[l.id]
        if (!rect) return null
        return {
          id: l.id,
          block: l.block,
          lot: l.lot,
          dims: l.dims,
          sqm: l.sqm,
          status: l.status,
          price: l.price,
          polygon: rectToPolygon(rect),
          position: centroid(rect),
        } as LotFeature
      })
      .filter(Boolean) as LotFeature[]
  }, [lots])

  const counts = useMemo(
    () =>
      Object.fromEntries(STATUSES.map((s) => [s, lots.filter((l) => l.status === s).length])) as Record<
        LotStatus,
        number
      >,
    [lots],
  )

  // Centroide de los lotes disponibles → hacia dónde apunta el waypoint de "disponibles".
  const dispCenter = useMemo<[number, number]>(() => {
    const d = features.filter((f) => f.status === 'DISPONIBLE')
    if (!d.length) return [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude]
    return [
      d.reduce((a, f) => a + f.position[0], 0) / d.length,
      d.reduce((a, f) => a + f.position[1], 0) / d.length,
    ]
  }, [features])

  // Guion del recorrido guiado: cada parada = encuadre + texto + (opcional) spotlight de estado.
  const WAYPOINTS = useMemo<Waypoint[]>(() => {
    const base = { minZoom: INITIAL_VIEW_STATE.minZoom, maxZoom: INITIAL_VIEW_STATE.maxZoom }
    return [
      {
        view: { ...base, longitude: INITIAL_VIEW_STATE.longitude, latitude: INITIAL_VIEW_STATE.latitude, zoom: 16.4, pitch: 20, bearing: 28 },
        title: SITE.name, sub: 'Corrientes Capital · Ord. N.º 7403', duration: 4200,
      },
      {
        // Encuadre calculado para que los 306 lotes (693 m de ancho) entren completos:
        // a zoom 17.3 la vista mide ~1240 m de ancho, el loteo ocupa ~56% del cuadro.
        view: { ...base, ...INITIAL_VIEW_STATE, zoom: 17.3, pitch: 35 },
        title: `${SITE.totalBlocks} manzanas · 306 lotes`, sub: SITE.stage, duration: 4200,
      },
      {
        view: { ...base, longitude: dispCenter[0], latitude: dispCenter[1], zoom: 17.9, pitch: 50, bearing: 8 },
        title: `${counts.DISPONIBLE} lotes disponibles`, sub: 'Desde USD 16.450 · financiación en cuotas',
        spotlight: 'DISPONIBLE' as LotStatus, duration: 4800,
      },
      {
        // El mensaje acá es el contexto urbano, así que el pitch se mantiene bajo a
        // propósito (antes 63°, el más alto de todos) para no exponer el satélite plano
        // justo en la parada que más depende de él.
        view: { ...base, longitude: INITIAL_VIEW_STATE.longitude, latitude: INITIAL_VIEW_STATE.latitude, zoom: 16.2, pitch: 30, bearing: -55 },
        title: `A ${SURROUNDINGS.travelTimes.find(t => t.label === 'Centro de Corrientes')?.time.split(' ')[0]} minutos del centro`, sub: 'Escuelas, salud y transporte cerca', duration: 4800,
      },
    ]
  }, [dispCenter, counts])

  // 'reel' usa el guion de avance de obra (PROGRESS_WAYPOINTS); 'tour' usa el de venta.
  const activeWaypoints = mode === 'reel' ? PROGRESS_WAYPOINTS : WAYPOINTS

  // Driver del tour/reel: al entrar en modo tour o reel, secuencia TODAS las paradas con un
  // único timer encadenado (no un efecto por paso — eso se re-ejecutaba y adelantaba el tiempo).
  // La cámara (flyCamera) y el drift del hold corren fuera de React — sólo setTourStep()
  // re-renderiza, y sólo para cambiar el caption/los dots, no la posición de la cámara.
  useEffect(() => {
    if (mode !== 'tour' && mode !== 'reel') return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    let stopDrift: (() => void) | null = null
    const run = (step: number) => {
      if (cancelled) return
      if (step >= activeWaypoints.length) {
        setMode('free')
        lastInteractionRef.current = Date.now()
        return
      }
      const wp = activeWaypoints[step]
      setTourStep(step)
      flyCamera(wp.view, wp.duration)
      timer = setTimeout(() => {
        if (cancelled) return
        // Hold: la cámara ya llegó, pero no se congela en seco — deriva suave hasta que
        // arranca la próxima parada. Ninguna duración del guion cambia por esto.
        stopDrift = startHoldDrift(HOLD_MS)
        timer = setTimeout(() => {
          stopDrift?.()
          stopDrift = null
          run(step + 1)
        }, HOLD_MS)
      }, wp.duration)
    }
    run(0)
    return () => {
      cancelled = true
      clearTimeout(timer)
      stopDrift?.()
    }
  }, [mode, activeWaypoints])

  // Rotación automática: lenta en modo libre (tras inactividad, sin lote abierto) y en la
  // portada. Corre fuera de React (deck.setProps directo vía viewStateRef) — antes esto
  // renderizaba el árbol completo de overlays hasta 60 veces por segundo mientras rotaba.
  useEffect(() => {
    let raf = 0
    let lastT = performance.now()
    const tick = (t: number) => {
      const dt = (t - lastT) / 1000
      lastT = t
      const m = modeRef.current
      const idle = Date.now() - lastInteractionRef.current > IDLE_MS
      const rotate = !reducedMotionRef.current && (m === 'portada' || (m === 'free' && idle && !selectedRef.current))
      if (rotate) {
        const speed = m === 'portada' ? 1.1 : ROTATE_DEG_PER_SEC
        viewStateRef.current = {
          ...viewStateRef.current,
          bearing: ((viewStateRef.current.bearing ?? 0) + speed * dt) % 360,
        }
        deckRef.current?.deck?.setProps({ viewState: viewStateRef.current })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const startTour = () => {
    setSelected(null)
    setTourStep(0)
    setMode('tour')
  }
  const skipToFree = () => {
    setMode('free')
    setTourStep(0)
    lastInteractionRef.current = Date.now()
    flyCamera(INITIAL_VIEW_STATE, 1600)
  }

  // Durante el tour/reel el "spotlight" del waypoint manda; fuera manda el filtro del usuario.
  const spotlight: LotStatus | null =
    mode === 'tour' || mode === 'reel' ? activeWaypoints[tourStep]?.spotlight ?? null : null
  const isDim = (s: LotStatus) => (spotlight ? s !== spotlight : filter !== 'ALL' && s !== filter)

  const showMesh = HAS_TERRAIN_MESH && photoMode === 'fotorrealista'

  // hazeOpacity ya viene derivado y throttleado del pitch en onViewStateChange (ver
  // <DeckGL> más abajo) — no se recalcula acá para no depender de un viewState en React.

  const layers = useMemo(() => {
    // Satélite Esri — capa base en modo disponibilidad, o fallback si no hay malla real todavía.
    const base = showMesh
      ? null
      : new TileLayer({
          id: 'esri-satellite',
          data: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          minZoom: 0,
          // 19 dejaba huecos rosa/malva en el horizonte lejano (se veía el <div> de cielo
          // detrás): @deck.gl/geo-layers, con pitch <= 60, fija la selección de tiles en
          // maxZoom sin permitir tiles más gruesos de respaldo (tile-2d-traversal.js:146),
          // así que el horizonte necesitaría una cantidad impracticable de tiles z19.
          // 17 ≈ 1,06 m/px, casi 1:1 con la vista por defecto (zoom 17,1) — nítido donde se
          // ve, y 16x menos tiles que z19 para cubrir el horizonte (verificar con capturas
          // que el hueco no vuelva; si vuelve, ver SHOWROOM-3D-NOTES.md para el plan B).
          maxZoom: 17,
          tileSize: 256,
          renderSubLayers: (props) => {
            // @ts-expect-error tile.bbox existe en modo geoespacial
            const { west, south, east, north } = props.tile.bbox
            return new BitmapLayer(props, {
              data: undefined,
              image: props.data,
              bounds: [west, south, east, north],
              // El satélite es el entorno, no el producto: algo desaturado para no competir
              // con el ortomosaico del dron. Antes llevaba tintColor cálido — pero tintColor
              // sólo puede oscurecer (es multiplicativo) y el satélite YA es ~2x más oscuro
              // que el dron (medido: dron RGB 103,102,85 vs Esri 52,64,34) — el tinte
              // agrandaba la diferencia en vez de cerrarla, así que se sacó. 0.8 y 0.6 fueron
              // demasiado agresivos para cuando el satélite era "piso de maqueta" bajo
              // volúmenes 3D (revertidos — ver SHOWROOM-3D-NOTES.md); sin esos volúmenes el
              // entorno puede leerse más natural. 0.35 sigue apagándolo sin perder textura.
              desaturate: 0.35,
            })
          },
        })

    // Ortomosaico real del vuelo (ver lib/ortho.ts) — se dibuja sobre el satélite Esri,
    // pero sólo cubre su propia huella de vuelo; fuera de ese rectángulo se sigue viendo
    // Esri debajo. No tiene sentido combinarlo con la malla 3D (esa vista ya trae su
    // propia textura real), así que se apaga en modo 'fotorrealista'.
    const orthophoto = showMesh
      ? null
      : new BitmapLayer({
          id: 'ortho-dron',
          image: ORTHO_URL,
          bounds: ORTHO_BOUNDS,
          pickable: false,
          // Difumina el borde para que no corte duro contra el satélite de abajo
          // (ver lib/geo/feather-extension.ts).
          extensions: [featherExtension],
        })

    // Malla real capturada con dron (Cesium ion) — sólo si hay asset configurado y el
    // usuario prendió el toggle "Vista fotorrealista". Dormida (null) en el resto de los casos.
    const terrainMesh = showMesh
      ? new Tile3DLayer({
          id: 'terreno-dron',
          data: `https://assets.ion.cesium.com/${ION_ASSET_ID}/tileset.json`,
          loaders: [CesiumIonLoader],
          loadOptions: { 'cesium-ion': { accessToken: ION_TOKEN } },
          pickable: false,
        })
      : null

    const reserves = new PolygonLayer<{ name: string; coords: [number, number, number, number] }>({
      id: 'reservas',
      data: RESERVES,
      getPolygon: (d) => rectToPolygon(d.coords),
      extruded: true,
      getElevation: 1,
      getFillColor: [34, 197, 94, 90],
      getLineColor: [21, 128, 61, 200],
      getLineWidth: 1,
      lineWidthMinPixels: 1,
      stroked: true,
      pickable: false,
    })

    const lotsLayer = new PolygonLayer<LotFeature>({
      id: 'lotes',
      data: features,
      extruded: true,
      wireframe: true,
      getPolygon: (d) => d.polygon,
      // Sobre la malla real, sumar el offset de terreno para que los lotes se asienten
      // en el piso capturado en vez de flotar/enterrarse en el plano lat/lng.
      getElevation: (d) => STATUS_ELEV[d.status] + (showMesh ? TERRAIN_BASE_ELEV : 0),
      getFillColor: (d) => {
        const [r, g, b] = STATUS_RGB[d.status]
        // Antes 210 (82% opaco): el color de estado tapaba casi del todo el ortomosaico
        // de abajo, así que el loteo se leía como una calcomanía sólida contra el resto
        // de Corrientes sin overlay. Más translúcido deja ver la textura real debajo del
        // color y suaviza ese contraste. En vista fotorrealista sigue aún más translúcido
        // para no tapar la malla.
        const base = showMesh ? 90 : 130
        return [r, g, b, isDim(d.status) ? (showMesh ? 15 : 40) : base]
      },
      getLineColor: (d) => {
        const [r, g, b] = STATUS_RGB[d.status]
        return [r, g, b, isDim(d.status) ? 60 : 255]
      },
      getLineWidth: 0.5,
      lineWidthMinPixels: 1,
      stroked: true,
      material: { ambient: 0.45, diffuse: 0.85, shininess: 24, specularColor: [255, 224, 190] },
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 120],
      onClick: (info) => {
        if (modeRef.current !== 'free') return
        const f = info.object as LotFeature | undefined
        if (f && !isDim(f.status)) setSelected(f)
      },
      updateTriggers: {
        getFillColor: [filter, spotlight, showMesh],
        getLineColor: [filter, spotlight],
        getElevation: [showMesh],
      },
      // Cuando cambia el filtro o el spotlight del tour, el color salta de un frame al
      // otro. Transición de atributo nativa de deck.gl (GPU, sin costo de React) — 600ms,
      // el mismo orden de magnitud que --duration-panel/--duration-reveal del resto del sitio.
      transitions: { getFillColor: 600, getLineColor: 600 },
    })

    // Dúplex glTF — solo si hay modelos cargados
    const modelLayers = MODELS.length
      ? [
          new ScenegraphLayer<DuplexModel>({
            id: 'duplex-models',
            data: MODELS.filter((m) => LOTS_GEO[m.lotId]),
            scenegraph: (d: DuplexModel) => d.url,
            getPosition: (d: DuplexModel) => centroid(LOTS_GEO[d.lotId]),
            getOrientation: (d: DuplexModel) => [0, d.heading ?? 0, 90],
            sizeScale: 1,
            _lighting: 'pbr',
            pickable: true,
          }),
        ]
      : []

    // Etiquetas de lote — sólo al acercarse (evita empapelar el plano en la vista general).
    const labels = zoomedIn
      ? [
          new TextLayer<LotFeature>({
            id: 'lot-labels',
            data: features.filter((f) => !isDim(f.status)),
            getPosition: (d) => [...d.position, STATUS_ELEV[d.status] + 1.2] as [number, number, number],
            getText: (d) => String(d.lot),
            getSize: 11,
            sizeUnits: 'pixels',
            getColor: [255, 255, 255, 230],
            background: true,
            getBackgroundColor: [20, 20, 20, 110],
            backgroundPadding: [3, 1],
            getPixelOffset: [0, -2],
            billboard: true,
            pickable: false,
          }),
        ]
      : []

    return [base, orthophoto, terrainMesh, reserves, lotsLayer, ...modelLayers, ...labels].filter(Boolean)
  }, [features, filter, zoomedIn, spotlight, showMesh])

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900">
        <p className="text-sm text-gray-400">Cargando mapa 3D…</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Cielo de hora dorada, detrás del canvas (se ve en bordes y mientras cargan los tiles) */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #2b2440 0%, #7a4a5a 45%, #d98a5f 75%, #f0b878 100%)' }}
      />

      {/* Bruma atmosférica: crece con el pitch, que es cuando más plano lejano entra al
          cuadro (en cenital no hay horizonte, así que no molesta). */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: hazeOpacity,
          background:
            'linear-gradient(180deg,' +
            ' rgba(240,184,120,0.60) 0%,' +
            ' rgba(217,138,95,0.30) 16%,' +
            ' rgba(217,138,95,0.11) 32%,' +
            ' rgba(217,138,95,0.00) 52%)',
          transition: 'opacity 400ms ease-out',
        }}
      />

      <DeckGL
        ref={deckRef}
        views={new MapView({ repeat: true })}
        initialViewState={START_VIEW_STATE}
        onViewStateChange={({ viewState: vs, interactionState }) => {
          const { isDragging, isPanning, isRotating, isZooming } = interactionState
          if (isDragging || isPanning || isRotating || isZooming) {
            lastInteractionRef.current = Date.now()
            // Si el usuario toma el control durante el tour, lo cortamos a modo libre.
            if (modeRef.current === 'tour') {
              setMode('free')
              setTourStep(0)
            }
          }
          viewStateRef.current = vs as MapViewState
          // Eco manual: una vez que cualquier deck.setProps({viewState}) explícito ocurrió
          // (tour, reencuadrar, rotación), deck.gl deja de auto-aplicar los cambios de
          // interacción por su cuenta (sólo lo hace mientras nunca se le pasó viewState
          // como prop controlada). Repetirlo aquí es gratis cuando no hace falta y
          // necesario cuando sí — no pasa por React, así que no re-renderiza.
          deckRef.current?.deck?.setProps({ viewState: vs })
          setZoomedIn((prev) => {
            const next = vs.zoom >= LABEL_MIN_ZOOM
            return prev === next ? prev : next
          })
          // Bruma de horizonte, throttleada a pasos de 1/50 (basta para que el ojo no note
          // la cuantización, y evita recalcular el estado de React en cada frame de vuelo).
          const nextHaze = Math.round(Math.min(1, Math.max(0, ((vs.pitch ?? 0) - 10) / 45)) * 50) / 50
          setHazeOpacity((prev) => (prev === nextHaze ? prev : nextHaze))
        }}
        controller={{ dragRotate: true, touchRotate: true, inertia: 300 }}
        effects={[lightingEffect]}
        layers={layers}
        getCursor={({ isDragging, isHovering }) => (isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab')}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Viñeta cinemática (oscurece bordes, foco al centro) — entibiada para no cortar
          contra la bruma cálida de arriba con un borde frío. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 200px 50px rgba(60,30,20,0.42)' }}
      />

      {/* Volver al sitio + título/filtros (arriba izq.). El botón de volver queda montado en
          todos los modos salvo 'reel' (esa vista es sólo para la captura automática con
          Playwright — ver el useEffect de ?reel=1 más arriba — y debe quedar limpia de UI).
          z-40 para quedar por encima de la portada (z-30), así también se puede salir desde ahí. */}
      {mode !== 'reel' && (
        <div className="pointer-events-none absolute left-4 top-4 z-40 flex max-w-[calc(100%-2rem)] flex-col gap-3">
          <Link href="/" className="pointer-events-auto w-fit" style={chipStyle(false)}>
            ← Volver al sitio
          </Link>
          {mode === 'free' && (
            <>
              <div
                className="pointer-events-auto px-4 py-3 text-white backdrop-blur-md"
                style={{ background: 'rgba(12,12,12,0.72)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <p style={{ fontFamily: HELVETICA, fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.3em', color: '#FF1200', textTransform: 'uppercase' }}>
                  Loteo en 3D
                </p>
                <p style={{ fontFamily: HELVETICA, fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.15, marginTop: '0.2rem' }}>
                  Barrio Santa Catalina
                </p>
              </div>
              <div className="pointer-events-auto flex flex-wrap gap-2">
                <button onClick={() => setFilter('ALL')} style={chipStyle(filter === 'ALL')}>
                  Todos <span style={{ opacity: 0.7 }} className="tabular-nums">{lots.length}</span>
                </button>
                {STATUSES.filter((s) => counts[s] > 0).map((s) => (
                  <button key={s} onClick={() => setFilter((p) => (p === s ? 'ALL' : s))} style={chipStyle(filter === s)} className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2" style={{ backgroundColor: STATUS_HEX[s] }} />
                    {STATUS_LABELS[s]} <span style={{ opacity: 0.7 }} className="tabular-nums">{counts[s]}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Controles arriba der. — según modo */}
      {mode === 'free' && (
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          {HAS_TERRAIN_MESH && (
            <button
              onClick={() => setPhotoMode((p) => (p === 'disponibilidad' ? 'fotorrealista' : 'disponibilidad'))}
              style={chipStyle(photoMode === 'fotorrealista')}
            >
              🛰 Vista real (dron)
            </button>
          )}
          <button onClick={startTour} style={chipStyle(false)}>▶ Recorrido</button>
          <button
            onClick={() => {
              lastInteractionRef.current = Date.now()
              flyCamera(INITIAL_VIEW_STATE, 1800)
            }}
            style={chipStyle(false)}
          >
            Reencuadrar
          </button>
        </div>
      )}
      {mode === 'tour' && (
        <button onClick={skipToFree} className="absolute right-4 top-4 z-20" style={chipStyle(false)}>
          Saltar ⏭
        </button>
      )}

      {/* Caption del tour/reel + progreso (abajo centro). El contenedor queda montado todo
          el tour/reel (no sólo cuando hay título) para que AnimatePresence pueda animar la
          SALIDA del caption — si el contenedor entero se desmonta con él, no hay salida que
          animar. Efecto secundario menor y deliberado: los dots ya se ven desde la primera
          parada del reel, aunque esa parada no tenga título (antes no se veía nada ahí). */}
      {(mode === 'tour' || mode === 'reel') && (
        <div className="pointer-events-none absolute inset-x-0 bottom-14 z-20 flex flex-col items-center gap-3 px-6">
          <AnimatePresence mode="wait">
            {activeWaypoints[tourStep]?.title && (
              <motion.div
                key={tourStep}
                className="px-6 py-4 text-center backdrop-blur-md"
                style={{ background: 'rgba(12,12,12,0.72)', border: '1px solid rgba(255,255,255,0.12)' }}
                initial={{ opacity: 0, transform: 'translateY(12px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                exit={{ opacity: 0, transform: 'translateY(-12px)' }}
                transition={{ duration: DURATION.panel, ease: EASE_OUT }}
              >
                <p style={{ fontFamily: HELVETICA, fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>
                  {activeWaypoints[tourStep].title}
                </p>
                {activeWaypoints[tourStep].sub && (
                  <p style={{ fontFamily: HELVETICA, fontWeight: 700, fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', marginTop: '0.25rem' }}>
                    {activeWaypoints[tourStep].sub}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex gap-1.5">
            {activeWaypoints.map((_, i) => (
              // scaleX en vez de width: la pastilla activa/inactiva es la misma caja de 20px,
              // sólo se achica desde la izquierda — no anima una propiedad de layout.
              <span
                key={i}
                className="h-1.5 rounded-full"
                style={{
                  width: 20,
                  transform: `scaleX(${i === tourStep ? 1 : 0.3})`,
                  transformOrigin: 'left',
                  transition: 'transform 200ms ease-out, background-color 200ms ease-out',
                  background: i === tourStep ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Portada (cover) */}
      {mode === 'portada' && (
        <motion.div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-paye.png" alt="Payé" className="mb-6 h-16 w-auto drop-shadow-2xl" />
          <p style={{ fontFamily: HELVETICA, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.3em', color: '#FF1200', textTransform: 'uppercase' }}>
            Recorrido virtual
          </p>
          <h1
            className="mt-2 text-4xl drop-shadow-lg md:text-5xl"
            style={{ fontFamily: HELVETICA, fontWeight: 700, color: '#F5F0EB', textTransform: 'uppercase' }}
          >
            {SITE.name}
          </h1>
          <p style={{ fontFamily: HELVETICA, fontWeight: 700, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.75rem', maxWidth: 420 }}>
            Corrientes Capital · 306 lotes · {SITE.stage}
          </p>
          <motion.button
            onClick={startTour}
            className="mt-8 flex items-center gap-2 px-7 py-3 text-white"
            style={{ fontFamily: HELVETICA, fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: '#FF1200' }}
            whileHover={{ opacity: 0.85, transition: { duration: DURATION.hover, ease: EASE_OUT } }}
            whileTap={{ scale: 0.97, transition: { duration: DURATION.press, ease: EASE_OUT } }}
          >
            ▶ Ver presentación
          </motion.button>
          <button
            onClick={skipToFree}
            className="mt-4 underline underline-offset-2 hover:text-white/90"
            style={{ fontFamily: HELVETICA, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}
          >
            Explorar el mapa directo
          </button>
        </motion.div>
      )}

      {/* Ficha del lote seleccionado (abajo izq.) */}
      {selected && (
        <div className="absolute bottom-4 left-4 z-10 w-64 overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ background: STATUS_HEX[selected.status] }}>
            <div>
              <p style={{ fontFamily: HELVETICA, fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>
                Manzana {selected.block} · Lote {selected.lot}
              </p>
              <p style={{ fontFamily: HELVETICA, fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{STATUS_LABELS[selected.status]}</p>
            </div>
            <button onClick={() => setSelected(null)} style={{ color: 'rgba(255,255,255,0.8)' }} aria-label="Cerrar">
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-2 px-4 py-3">
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2" style={{ background: '#0C0C0C' }}>
                <p style={{ fontFamily: HELVETICA, fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase' }}>Medidas</p>
                <p style={{ fontFamily: HELVETICA, fontSize: '0.85rem', fontWeight: 700, color: '#F5F0EB' }}>{selected.dims} m</p>
              </div>
              <div className="flex-1 px-3 py-2" style={{ background: '#0C0C0C' }}>
                <p style={{ fontFamily: HELVETICA, fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase' }}>Superficie</p>
                <p style={{ fontFamily: HELVETICA, fontSize: '0.85rem', fontWeight: 700, color: '#F5F0EB' }}>{selected.sqm} m²</p>
              </div>
            </div>
            {selected.status === 'DISPONIBLE' && selected.price && (
              <div className="px-3 py-2" style={{ border: '1px solid rgba(255,18,0,0.3)', background: 'rgba(255,18,0,0.08)' }}>
                <p style={{ fontFamily: HELVETICA, fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase' }}>Precio contado</p>
                <p style={{ fontFamily: HELVETICA, fontSize: '1.3rem', fontWeight: 700, color: '#FF1200' }}>
                  USD {selected.price.toLocaleString('es-AR')}
                </p>
              </div>
            )}
            {selected.status === 'DISPONIBLE' && (
              <a
                href={`https://wa.me/${SITE.WA_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hola, me interesa el Lote ${selected.lot} de la Manzana ${selected.block} — Santa Catalina.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-2 text-center"
                style={{ fontFamily: HELVETICA, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: '#FF1200', color: '#fff' }}
              >
                Consultar por WhatsApp →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Atribución imagery (requerido por Esri) */}
      <div className="absolute bottom-1 right-2 z-10 text-[9px] text-white/60" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
        Imagery © Esri, Maxar, Earthstar Geographics
      </div>
    </div>
  )
}
