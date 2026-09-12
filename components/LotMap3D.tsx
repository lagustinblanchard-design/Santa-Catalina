'use client'

/**
 * Showpiece 3D del loteo Santa Catalina.
 * El canvas (deck.gl + cámara imperativa) vive en components/lot-scene/LotScene.tsx —
 * este archivo es sólo el "chrome": portada, tour guiado, filtros, ficha de lote,
 * atribución. Ver components/lot-scene/ para capas/geometría/constantes compartidas
 * con el driver de scroll de /v4 (mismos datos, misma calibración, un solo lugar).
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
import type { MapViewState } from '@deck.gl/core'
import { type Lot } from '@/lib/lots'
import { STATUS_LABELS, SITE, PROJECT_PHASES, SURROUNDINGS, type LotStatus } from '@/lib/data'
import { EASE_OUT, DURATION } from '@/lib/motion'
import LotScene, { type LotSceneHandle, type LotFeature } from '@/components/lot-scene/LotScene'
import { STATUS_HEX, HAS_TERRAIN_MESH } from '@/components/lot-scene/constants'
import { ROTATE_DEG_PER_SEC, HOLD_MS } from '@/components/lot-scene/camera'
import { buildFeatures } from '@/components/lot-scene/geometry'

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

const STATUSES = Object.keys(STATUS_LABELS) as LotStatus[]

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

const IDLE_MS = 3200 // sin interacción → retoma la rotación automática

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
  // Toggle entre el mapa de disponibilidad (satélite Esri) y la malla real del dron.
  // Sin malla cargada (HAS_TERRAIN_MESH=false) queda fijo en 'disponibilidad'.
  const [photoMode, setPhotoMode] = useState<'disponibilidad' | 'fotorrealista'>('disponibilidad')
  const sceneRef = useRef<LotSceneHandle>(null)

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

  // prefers-reduced-motion: sólo gatea el loop de rotación automática de acá abajo — el
  // vuelo cinemático (flyTo) y el drift entre paradas (startHoldDrift) ya lo respetan
  // adentro de LotScene, sin que este componente tenga que saberlo.
  const reducedMotionRef = useRef(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionRef.current = mq.matches
    const handler = () => { reducedMotionRef.current = mq.matches }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

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

  const counts = useMemo(
    () =>
      Object.fromEntries(STATUSES.map((s) => [s, lots.filter((l) => l.status === s).length])) as Record<
        LotStatus,
        number
      >,
    [lots],
  )

  // Sólo para apuntar el waypoint de "disponibles" — LotScene calcula sus propios
  // features para dibujar; acá alcanza con el centroide de los disponibles.
  const dispCenter = useMemo<[number, number]>(() => {
    const d = buildFeatures(lots).filter((f) => f.status === 'DISPONIBLE')
    if (!d.length) return [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude]
    return [
      d.reduce((a, f) => a + f.position[0], 0) / d.length,
      d.reduce((a, f) => a + f.position[1], 0) / d.length,
    ]
  }, [lots])

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
  // La cámara (sceneRef.flyTo) y el drift del hold corren fuera de React — sólo setTourStep()
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
      sceneRef.current?.flyTo(wp.view, wp.duration)
      timer = setTimeout(() => {
        if (cancelled) return
        // Hold: la cámara ya llegó, pero no se congela en seco — deriva suave hasta que
        // arranca la próxima parada. Ninguna duración del guion cambia por esto.
        stopDrift = sceneRef.current?.startHoldDrift(HOLD_MS) ?? null
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
  // portada. Corre fuera de React (sceneRef.setViewState directo) — antes esto renderizaba
  // el árbol completo de overlays hasta 60 veces por segundo mientras rotaba.
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
        const current = sceneRef.current?.getViewState()
        if (current) {
          sceneRef.current?.setViewState({
            ...current,
            bearing: ((current.bearing ?? 0) + speed * dt) % 360,
          })
        }
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
    sceneRef.current?.flyTo(INITIAL_VIEW_STATE, 1600)
  }

  // Durante el tour/reel el "spotlight" del waypoint manda; fuera manda el filtro del usuario.
  const spotlight: LotStatus | null =
    mode === 'tour' || mode === 'reel' ? activeWaypoints[tourStep]?.spotlight ?? null : null

  const showMesh = HAS_TERRAIN_MESH && photoMode === 'fotorrealista'

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900">
        <p className="text-sm text-gray-400">Cargando mapa 3D…</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <LotScene
        ref={sceneRef}
        lots={lots}
        initialViewState={START_VIEW_STATE}
        controller={{ dragRotate: true, touchRotate: true, inertia: 300 }}
        filter={filter}
        spotlight={spotlight}
        showMesh={showMesh}
        onLotClick={(f) => {
          if (modeRef.current !== 'free') return
          setSelected(f)
        }}
        onViewStateChange={({ interactionState }) => {
          const { isDragging, isPanning, isRotating, isZooming } = interactionState
          if (isDragging || isPanning || isRotating || isZooming) {
            lastInteractionRef.current = Date.now()
            // Si el usuario toma el control durante el tour, lo cortamos a modo libre.
            if (modeRef.current === 'tour') {
              setMode('free')
              setTourStep(0)
            }
          }
        }}
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
              sceneRef.current?.flyTo(INITIAL_VIEW_STATE, 1800)
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
