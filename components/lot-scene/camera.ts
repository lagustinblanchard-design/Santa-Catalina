// Matemática de cámara del showroom 3D — extraído de components/LotMap3D.tsx sin
// cambiar ningún valor (mismo criterio de no-regresión que constants.ts).
import { FlyToInterpolator, LinearInterpolator } from '@deck.gl/core'
import type { MapViewState } from '@deck.gl/core'

export const INTRO_DURATION_MS = 4200

// ~11m de margen a esta latitud — separa "misma posición, sólo cambia zoom/pitch/bearing"
// de un salto real de centro, para elegir el interpolador (ver isSameCenter/flyTo).
const SAME_CENTER_EPS = 0.0001

export function isSameCenter(a: MapViewState, b: MapViewState): boolean {
  return Math.abs(a.longitude - b.longitude) < SAME_CENTER_EPS && Math.abs(a.latitude - b.latitude) < SAME_CENTER_EPS
}

// Ease-in-out cúbico — misma familia que --ease-in-out de app/globals.css (fuerte,
// simétrico). deck.gl pide una función (t)=>number para transitionEasing, no un string
// CSS, así que no se reusa el token literal, pero el carácter del movimiento es el mismo.
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
}

// FlyToInterpolator (arco de Van Wijk) sólo tiene sentido cuando el centro se traslada
// — sin traslación, el arco degenera. Las paradas que comparten centro (sólo cambia
// zoom/pitch/bearing) usan LinearInterpolator con un ease-in-out cúbico: desplazamiento
// deliberado, no un vuelo. El easing sólo se aplica ahí — sobre FlyToInterpolator alteraría
// su propia curva interna (curve/speed), ya afinada.
export function flyTo(view: MapViewState, durationMs = INTRO_DURATION_MS, translates = true): MapViewState {
  return {
    ...view,
    transitionDuration: durationMs,
    transitionInterpolator: translates
      ? new FlyToInterpolator({ curve: 1.3, speed: 0.9 })
      : new LinearInterpolator({ transitionProps: ['zoom', 'pitch', 'bearing'] }),
    transitionEasing: translates ? undefined : easeInOutCubic,
  }
}

export const ROTATE_DEG_PER_SEC = 2.4 // vuelta completa cada ~150s
export const HOLD_MS = 400 // margen entre el fin de un vuelo y el próximo — ver startHoldDrift
