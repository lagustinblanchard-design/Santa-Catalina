'use client'

import { useEffect, useRef } from 'react'
import { useMotionValueEvent, useReducedMotion, type MotionValue } from 'motion/react'
import type { MapViewState } from '@deck.gl/core'
import type { LotSceneHandle } from '@/components/lot-scene/LotScene'

// Interpola el bearing por el camino corto — sin esto, ir de -18° a 340°
// da una vuelta entera en vez de un giro de 22°.
function lerpBearingShort(a: number, b: number, t: number) {
  const diff = ((b - a + 540) % 360) - 180
  return a + diff * t
}

function lerpView(a: MapViewState, b: MapViewState, t: number): MapViewState {
  return {
    ...a,
    ...b,
    longitude: (a.longitude ?? 0) + ((b.longitude ?? 0) - (a.longitude ?? 0)) * t,
    latitude: (a.latitude ?? 0) + ((b.latitude ?? 0) - (a.latitude ?? 0)) * t,
    zoom: (a.zoom ?? 0) + ((b.zoom ?? 0) - (a.zoom ?? 0)) * t,
    pitch: (a.pitch ?? 0) + ((b.pitch ?? 0) - (a.pitch ?? 0)) * t,
    bearing: lerpBearingShort(a.bearing ?? 0, b.bearing ?? 0, t),
  }
}

const TAU = 0.11 // suavizado exponencial (segundos) — no es un spring, no hay overshoot

// Umbral bajo el cual la cámara se considera "ya llegó" — evita empujar
// deck.setProps() (que fuerza un redraw sincrónico) frame tras frame cuando
// el usuario dejó de scrollear y el lerp ya convergió.
const EPS = 1e-4
function viewsClose(a: MapViewState, b: MapViewState) {
  return (
    Math.abs((a.longitude ?? 0) - (b.longitude ?? 0)) < EPS &&
    Math.abs((a.latitude ?? 0) - (b.latitude ?? 0)) < EPS &&
    Math.abs((a.zoom ?? 0) - (b.zoom ?? 0)) < EPS &&
    Math.abs((a.pitch ?? 0) - (b.pitch ?? 0)) < EPS &&
    Math.abs((a.bearing ?? 0) - (b.bearing ?? 0)) < EPS
  )
}

/**
 * Maneja la cámara de un LotScene con el progreso de scroll: `viewState`
 * crudo por frame, sin el interpolador de deck.gl (ese es para vuelos
 * temporizados — acá un frame de scroll es una posición, no una animación).
 *
 * rAF propio, no useSpring: useMotionValueEvent guarda el target en un ref
 * (no re-renderiza React) y un único rAF lee ese ref, suaviza y empuja la
 * cámara una vez por frame. useSpring no garantiza un push por frame y se
 * "duerme" al llegar al reposo, lo que acá dejaría la cámara pegada un frame
 * atrás del scroll.
 */
export function useScrollCamera(
  sceneRef: React.RefObject<LotSceneHandle | null>,
  progress: MotionValue<number>,
  from: MapViewState,
  to: MapViewState,
  active: boolean
) {
  const targetRef = useRef(0)
  const currentRef = useRef<MapViewState>(from)
  const reduceMotion = useReducedMotion()

  useMotionValueEvent(progress, 'change', (v) => {
    targetRef.current = Math.max(0, Math.min(1, v))
  })

  useEffect(() => {
    if (!active) return
    let raf = 0
    let lastT = performance.now()
    const tick = (t: number) => {
      const dt = Math.min((t - lastT) / 1000, 0.1)
      lastT = t
      const targetView = lerpView(from, to, targetRef.current)
      // Con reduced-motion no hay inercia: la cámara salta directo al target
      // (k=1) — el scroll ya es el gesto del usuario, lo que se saca es el
      // rezago de la suavización exponencial, no el vínculo con el scroll.
      const k = reduceMotion ? 1 : 1 - Math.exp(-dt / TAU)
      const next = lerpView(currentRef.current, targetView, k)
      if (!viewsClose(next, currentRef.current)) {
        currentRef.current = next
        sceneRef.current?.setViewState(next)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduceMotion])
}
