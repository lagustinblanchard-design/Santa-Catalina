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
import { DeckGL } from '@deck.gl/react'
import { MapView, LightingEffect, AmbientLight, DirectionalLight, FlyToInterpolator } from '@deck.gl/core'
import type { MapViewState } from '@deck.gl/core'
import { PolygonLayer, BitmapLayer, TextLayer } from '@deck.gl/layers'
import { TileLayer, Tile3DLayer } from '@deck.gl/geo-layers'
import { ScenegraphLayer } from '@deck.gl/mesh-layers'
import { CesiumIonLoader } from '@loaders.gl/3d-tiles'
import { type Lot } from '@/lib/lots'
import { STATUS_LABELS, SITE, type LotStatus } from '@/lib/data'
import GEO from '@/lib/lot_geometry.json'
import { ORTHO_URL, ORTHO_BOUNDS } from '@/lib/ortho'

// ---------- Georreferenciado (idéntico a GoogleMapsLotMap) ----------
const REF_SVG_X = 860.5
const REF_SVG_Y = 303.4
const REF_LAT = -27.528473
const REF_LNG = -58.808283
const A = 0.06245549
const B = 0.41846104
const M_PER_DEG_LNG = 111320 * Math.cos((REF_LAT * Math.PI) / 180)

function svgToLngLat(x: number, y: number): [number, number] {
  const dx = x - REF_SVG_X
  const dy = y - REF_SVG_Y
  const dE = A * dx + B * dy
  const dN = B * dx - A * dy
  return [REF_LNG + dE / M_PER_DEG_LNG, REF_LAT + dN / 111320] // [lng, lat]
}

function rectToPolygon(c: [number, number, number, number]): [number, number][] {
  const [x0, y0, x1, y1] = c
  return [svgToLngLat(x0, y0), svgToLngLat(x1, y0), svgToLngLat(x1, y1), svgToLngLat(x0, y1)]
}

function centroid(c: [number, number, number, number]): [number, number] {
  return svgToLngLat((c[0] + c[2]) / 2, (c[1] + c[3]) / 2)
}

const LOTS_GEO = GEO.lots as unknown as Record<string, [number, number, number, number]>

// ---------- Estilos ----------
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
const INITIAL_VIEW_STATE = {
  longitude: -58.805462,
  latitude: -27.5302,
  zoom: 16.2,
  pitch: 42,
  bearing: -18,
  minZoom: 14,
  maxZoom: 20,
}

// Arranque del vuelo cinemático: mismo centro, en picada desde arriba.
const START_VIEW_STATE = {
  ...INITIAL_VIEW_STATE,
  zoom: 13.6,
  pitch: 0,
  bearing: 40,
}

const INTRO_DURATION_MS = 4200
const IDLE_MS = 3200 // sin interacción → retoma la rotación automática
const ROTATE_DEG_PER_SEC = 2.4 // vuelta completa cada ~150s
const LABEL_MIN_ZOOM = 16.4 // etiquetas de lote sólo al acercarse

function flyTo(view: MapViewState, durationMs = INTRO_DURATION_MS): MapViewState {
  return {
    ...view,
    transitionDuration: durationMs,
    transitionInterpolator: new FlyToInterpolator({ curve: 1.3, speed: 0.9 }),
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
  title: string
  sub: string
  spotlight?: LotStatus
  duration: number
}

export default function LotMap3D({ lots }: { lots: Lot[] }) {
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'portada' | 'tour' | 'free'>('portada')
  const [tourStep, setTourStep] = useState(0)
  const [filter, setFilter] = useState<LotStatus | 'ALL'>('ALL')
  const [selected, setSelected] = useState<LotFeature | null>(null)
  const [viewState, setViewState] = useState<MapViewState>(START_VIEW_STATE)
  const [zoomedIn, setZoomedIn] = useState(false)
  // Toggle entre el mapa de disponibilidad (satélite Esri) y la malla real del dron.
  // Sin malla cargada (HAS_TERRAIN_MESH=false) queda fijo en 'disponibilidad'.
  const [photoMode, setPhotoMode] = useState<'disponibilidad' | 'fotorrealista'>('disponibilidad')
  const deckRef = useRef<unknown>(null)

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

  useEffect(() => setMounted(true), [])

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
    const base = { minZoom: 14, maxZoom: 20 }
    return [
      {
        view: { ...base, longitude: INITIAL_VIEW_STATE.longitude, latitude: INITIAL_VIEW_STATE.latitude, zoom: 15.3, pitch: 35, bearing: 28 },
        title: 'Predios Santa Catalina', sub: 'Corrientes Capital · Ord. N.º 7403', duration: 4200,
      },
      {
        view: { ...base, ...INITIAL_VIEW_STATE },
        title: '14 manzanas · 306 lotes', sub: 'Segunda preventa', duration: 4200,
      },
      {
        view: { ...base, longitude: dispCenter[0], latitude: dispCenter[1], zoom: 17, pitch: 52, bearing: 8 },
        title: `${counts.DISPONIBLE} lotes disponibles`, sub: 'Desde USD 16.450 · financiación en cuotas',
        spotlight: 'DISPONIBLE' as LotStatus, duration: 4800,
      },
      {
        view: { ...base, longitude: INITIAL_VIEW_STATE.longitude, latitude: INITIAL_VIEW_STATE.latitude, zoom: 16.6, pitch: 63, bearing: -55 },
        title: 'A 10 minutos del centro', sub: 'Escuelas, salud y transporte cerca', duration: 4800,
      },
    ]
  }, [dispCenter, counts])

  // Driver del tour: al entrar en modo tour, secuencia TODAS las paradas con un único timer
  // encadenado (no un efecto por paso — eso se re-ejecutaba y adelantaba el tiempo).
  useEffect(() => {
    if (mode !== 'tour') return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const run = (step: number) => {
      if (cancelled) return
      if (step >= WAYPOINTS.length) {
        setMode('free')
        lastInteractionRef.current = Date.now()
        return
      }
      const wp = WAYPOINTS[step]
      setTourStep(step)
      setViewState(flyTo(wp.view, wp.duration))
      timer = setTimeout(() => run(step + 1), wp.duration + 400)
    }
    run(0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [mode, WAYPOINTS])

  // Rotación automática: lenta en modo libre (tras inactividad, sin lote abierto) y en la portada.
  useEffect(() => {
    let raf = 0
    let lastT = performance.now()
    const tick = (t: number) => {
      const dt = (t - lastT) / 1000
      lastT = t
      const m = modeRef.current
      const idle = Date.now() - lastInteractionRef.current > IDLE_MS
      const rotate = m === 'portada' || (m === 'free' && idle && !selectedRef.current)
      if (rotate) {
        const speed = m === 'portada' ? 1.1 : ROTATE_DEG_PER_SEC
        setViewState((v) => ({ ...v, bearing: ((v.bearing ?? 0) + speed * dt) % 360 }))
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
    setViewState(flyTo(INITIAL_VIEW_STATE, 1600))
  }

  // Durante el tour el "spotlight" del waypoint manda; fuera del tour manda el filtro del usuario.
  const spotlight: LotStatus | null = mode === 'tour' ? WAYPOINTS[tourStep]?.spotlight ?? null : null
  const isDim = (s: LotStatus) => (spotlight ? s !== spotlight : filter !== 'ALL' && s !== filter)

  const showMesh = HAS_TERRAIN_MESH && photoMode === 'fotorrealista'

  const layers = useMemo(() => {
    // Satélite Esri — capa base en modo disponibilidad, o fallback si no hay malla real todavía.
    const base = showMesh
      ? null
      : new TileLayer({
          id: 'esri-satellite',
          data: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          minZoom: 0,
          maxZoom: 19,
          tileSize: 256,
          renderSubLayers: (props) => {
            // @ts-expect-error tile.bbox existe en modo geoespacial
            const { west, south, east, north } = props.tile.bbox
            return new BitmapLayer(props, {
              data: undefined,
              image: props.data,
              bounds: [west, south, east, north],
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
        // En vista fotorrealista los lotes van translúcidos para no tapar la malla.
        const base = showMesh ? 90 : 210
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

      <DeckGL
        ref={deckRef as never}
        views={new MapView({ repeat: true })}
        viewState={viewState}
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
          setZoomedIn((prev) => {
            const next = vs.zoom >= LABEL_MIN_ZOOM
            return prev === next ? prev : next
          })
          setViewState(vs)
        }}
        controller={{ dragRotate: true, touchRotate: true, inertia: 300 }}
        effects={[lightingEffect]}
        layers={layers}
        getCursor={({ isDragging, isHovering }) => (isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab')}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Viñeta cinemática (oscurece bordes, foco al centro) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 180px 40px rgba(0,0,0,0.45)' }}
      />

      {/* Título + filtros (arriba izq.) — sólo en modo libre */}
      {mode === 'free' && (
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] flex-col gap-3">
          <div className="pointer-events-auto rounded-2xl bg-black/55 px-4 py-3 text-white backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#FF4230' }}>
              Loteo en 3D
            </p>
            <p className="text-lg font-black leading-tight">Barrio Santa Catalina</p>
          </div>
          <div className="pointer-events-auto flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-colors ${
                filter === 'ALL' ? 'border-white bg-white text-gray-900' : 'border-white/30 bg-black/40 text-white hover:bg-black/60'
              }`}
            >
              Todos <span className="tabular-nums opacity-70">{lots.length}</span>
            </button>
            {STATUSES.filter((s) => counts[s] > 0).map((s) => (
              <button
                key={s}
                onClick={() => setFilter((p) => (p === s ? 'ALL' : s))}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-colors ${
                  filter === s ? 'border-white bg-white text-gray-900' : 'border-white/30 bg-black/40 text-white hover:bg-black/60'
                }`}
              >
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_HEX[s] }} />
                {STATUS_LABELS[s]} <span className="tabular-nums opacity-70">{counts[s]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controles arriba der. — según modo */}
      {mode === 'free' && (
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          {HAS_TERRAIN_MESH && (
            <button
              onClick={() => setPhotoMode((p) => (p === 'disponibilidad' ? 'fotorrealista' : 'disponibilidad'))}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-colors ${
                photoMode === 'fotorrealista'
                  ? 'border-white bg-white text-gray-900'
                  : 'border-white/30 bg-black/40 text-white hover:bg-black/60'
              }`}
            >
              🛰 Vista real (dron)
            </button>
          )}
          <button
            onClick={startTour}
            className="rounded-full border border-white/30 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/60"
          >
            ▶ Recorrido
          </button>
          <button
            onClick={() => {
              lastInteractionRef.current = Date.now()
              setViewState(flyTo(INITIAL_VIEW_STATE, 1800))
            }}
            className="rounded-full border border-white/30 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/60"
          >
            Reencuadrar
          </button>
        </div>
      )}
      {mode === 'tour' && (
        <button
          onClick={skipToFree}
          className="absolute right-4 top-4 z-20 rounded-full border border-white/30 bg-black/40 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/60"
        >
          Saltar ⏭
        </button>
      )}

      {/* Caption del tour + progreso (abajo centro) */}
      {mode === 'tour' && WAYPOINTS[tourStep] && (
        <div className="pointer-events-none absolute inset-x-0 bottom-14 z-20 flex flex-col items-center gap-3 px-6">
          <div key={tourStep} className="lot3d-caption rounded-2xl bg-black/55 px-6 py-4 text-center backdrop-blur-md">
            <p className="text-xl font-black text-white">{WAYPOINTS[tourStep].title}</p>
            <p className="mt-1 text-sm text-white/75">{WAYPOINTS[tourStep].sub}</p>
          </div>
          <div className="flex gap-1.5">
            {WAYPOINTS.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === tourStep ? 20 : 6, background: i === tourStep ? '#fff' : 'rgba(255,255,255,0.4)' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Portada (cover) */}
      {mode === 'portada' && (
        <div
          className="lot3d-portada absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-paye.png" alt="Payé" className="mb-6 h-16 w-auto drop-shadow-2xl" />
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: '#FF4230' }}>
            Recorrido virtual
          </p>
          <h1 className="mt-2 text-4xl font-black text-white drop-shadow-lg md:text-5xl">Predios Santa Catalina</h1>
          <p className="mt-3 max-w-md text-sm text-white/80 md:text-base">
            Corrientes Capital · 306 lotes · Segunda preventa
          </p>
          <button
            onClick={startTour}
            className="mt-8 flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white shadow-xl transition-transform hover:scale-105"
            style={{ background: '#dc2626' }}
          >
            ▶ Ver presentación
          </button>
          <button
            onClick={skipToFree}
            className="mt-4 text-xs font-semibold text-white/60 underline underline-offset-2 hover:text-white/90"
          >
            Explorar el mapa directo
          </button>
        </div>
      )}

      {/* Animaciones de la capa showroom */}
      <style>{`
        @keyframes lot3dCaptionIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .lot3d-caption { animation: lot3dCaptionIn 0.6s ease both }
        @keyframes lot3dPortadaIn { from { opacity: 0 } to { opacity: 1 } }
        .lot3d-portada { animation: lot3dPortadaIn 0.8s ease both }
      `}</style>

      {/* Ficha del lote seleccionado (abajo izq.) */}
      {selected && (
        <div className="absolute bottom-4 left-4 z-10 w-64 overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3" style={{ background: STATUS_HEX[selected.status] }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/75">
                Manzana {selected.block} · Lote {selected.lot}
              </p>
              <p className="text-sm font-black text-white">{STATUS_LABELS[selected.status]}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-white/80 hover:text-white" aria-label="Cerrar">
              ✕
            </button>
          </div>
          <div className="space-y-2 px-4 py-3">
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Medidas</p>
                <p className="text-sm font-bold text-gray-800">{selected.dims} m</p>
              </div>
              <div className="flex-1 rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Superficie</p>
                <p className="text-sm font-bold text-gray-800">{selected.sqm} m²</p>
              </div>
            </div>
            {selected.status === 'DISPONIBLE' && selected.price && (
              <div className="rounded-lg border border-red-100 bg-red-50/60 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Precio contado</p>
                <p className="text-lg font-black" style={{ color: '#dc2626' }}>
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
                className="block rounded-lg py-2 text-center text-xs font-bold text-white"
                style={{ background: '#dc2626' }}
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
