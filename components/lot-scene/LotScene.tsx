'use client'

/**
 * Canvas 3D puro del showroom (deck.gl + cámara imperativa), SIN chrome — extraído de
 * components/LotMap3D.tsx. LotMap3D sigue teniendo toda su máquina de estados (portada,
 * tour, filtros, ficha de lote) y ahora renderiza esto adentro con un ref; components/v4
 * lo usa para manejar la cámara con el scroll (setViewState crudo, sin interpolador).
 *
 * Criterio de no-regresión: /mapa-3d y la captura ?reel=1 tienen que salir idénticas a
 * como salían antes de este refactor.
 */

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { DeckGL } from '@deck.gl/react'
import type { DeckGLRef } from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import type { MapViewState } from '@deck.gl/core'
import { type Lot } from '@/lib/lots'
import type { LotStatus } from '@/lib/data'
import { createLightingEffect, LABEL_MIN_ZOOM } from './constants'
import { flyTo as buildFlyTo, isSameCenter, ROTATE_DEG_PER_SEC } from './camera'
import { buildFeatures, type LotFeature } from './geometry'
import { buildLayers } from './layers'

export type { LotFeature }

export type LotSceneHandle = {
  /** Vuelo con interpolador (FlyToInterpolator o Linear+easing) — salta sin interpolador con reduced-motion. */
  flyTo: (view: MapViewState, durationMs?: number) => void
  /** Push crudo, sin interpolador — para el driver de scroll (un frame = una posición). */
  setViewState: (view: MapViewState) => void
  /** Deriva el bearing suavemente durante `ms` — no hace nada con reduced-motion. */
  startHoldDrift: (ms: number) => () => void
  getViewState: () => MapViewState
}

type ViewStateChangeInfo = {
  viewState: MapViewState
  interactionState: { isDragging?: boolean; isPanning?: boolean; isRotating?: boolean; isZooming?: boolean }
}

type LotSceneProps = {
  lots: Lot[]
  initialViewState: MapViewState
  controller?: boolean | Record<string, unknown>
  filter?: LotStatus | 'ALL'
  spotlight?: LotStatus | null
  showMesh?: boolean
  className?: string
  onLotClick?: (f: LotFeature) => void
  onViewStateChange?: (info: ViewStateChangeInfo) => void
}

const LotScene = forwardRef<LotSceneHandle, LotSceneProps>(function LotScene(
  { lots, initialViewState, controller = false, filter = 'ALL', spotlight = null, showMesh = false, className, onLotClick, onViewStateChange },
  ref
) {
  const deckRef = useRef<DeckGLRef>(null)
  const viewStateRef = useRef<MapViewState>(initialViewState)
  const [zoomedIn, setZoomedIn] = useState(false)
  const [hazeOpacity, setHazeOpacity] = useState(0)
  const lightingEffect = useMemo(() => createLightingEffect(), [])

  function applyHaze(pitch: number) {
    // Escalonado a 1/50 — evita re-renderizar React en cada frame de scroll.
    const next = Math.round(Math.min(1, Math.max(0, (pitch - 10) / 45)) * 50) / 50
    setHazeOpacity((prev) => (prev === next ? prev : next))
  }

  const reducedMotionRef = useRef(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionRef.current = mq.matches
    const handler = () => { reducedMotionRef.current = mq.matches }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useImperativeHandle(ref, () => ({
    flyTo(view, durationMs) {
      const target = reducedMotionRef.current
        ? { ...view }
        : buildFlyTo(view, durationMs, !isSameCenter(view, viewStateRef.current))
      viewStateRef.current = target
      deckRef.current?.deck?.setProps({ viewState: target })
    },
    setViewState(view) {
      viewStateRef.current = view
      deckRef.current?.deck?.setProps({ viewState: view })
      applyHaze(view.pitch ?? 0)
    },
    startHoldDrift(ms) {
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
    },
    getViewState() {
      return viewStateRef.current
    },
  }))

  const features = useMemo(() => buildFeatures(lots), [lots])

  const layers = useMemo(
    () => buildLayers({ features, filter, spotlight, zoomedIn, showMesh, onLotClick }),
    [features, filter, spotlight, zoomedIn, showMesh, onLotClick]
  )

  function handleViewStateChange(info: ViewStateChangeInfo) {
    const vs = info.viewState
    viewStateRef.current = vs
    // Eco manual: una vez que cualquier deck.setProps({viewState}) explícito ocurrió,
    // deck.gl deja de auto-aplicar los cambios de interacción por su cuenta (sólo lo hace
    // mientras nunca se le pasó viewState como prop controlada). Repetirlo acá es gratis
    // cuando no hace falta y necesario cuando sí — no pasa por React, no re-renderiza.
    deckRef.current?.deck?.setProps({ viewState: vs })
    setZoomedIn((prev) => {
      const next = vs.zoom >= LABEL_MIN_ZOOM
      return prev === next ? prev : next
    })
    applyHaze(vs.pitch ?? 0)
    onViewStateChange?.(info)
  }

  return (
    <div
      className={className ?? 'relative h-full w-full overflow-hidden'}
      // deck.gl pone `touch-action: none` en su wrapper interno (.deck-events-root)
      // para poder decidir él mismo qué hacer con cada gesto — necesario cuando
      // `controller` maneja pan/zoom por touch (/mapa-3d). Pero con
      // `controller={false}` (el mapa embebido en el sticky de /v4, que no es
      // interactivo) ese `none` seguía ahí, así que un swipe vertical sobre el
      // canvas no scrolleaba la página — sólo funcionaba tocando la angosta
      // barra de scroll del navegador. La regla de abajo (ver globals.css) lo
      // habilita de nuevo, sólo cuando no hay controller.
      data-deck-controller={controller ? 'true' : 'false'}
    >
      {/* Cielo de hora dorada, detrás del canvas (se ve en bordes y mientras cargan los tiles) */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #2b2440 0%, #7a4a5a 45%, #d98a5f 75%, #f0b878 100%)' }}
      />

      {/* Bruma atmosférica: crece con el pitch (en cenital no hay horizonte, no molesta). */}
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
        initialViewState={initialViewState}
        onViewStateChange={(info) => handleViewStateChange(info as unknown as ViewStateChangeInfo)}
        controller={controller}
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
    </div>
  )
})

export default LotScene
