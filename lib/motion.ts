// Presets de Motion compartidos por /v2 y el showroom 3D (LotMap3D.tsx).
// Mismos valores que los tokens de app/globals.css (--ease-out, --ease-in-out,
// --duration-*) — si se ajusta uno, ajustar el otro. Gramática: revelado y barrido,
// no rebote (spring bounce 0–0.1); landing de marketing, así que las duraciones
// pueden pasar los 300ms que rigen para UI transaccional.

export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
export const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1]

export const DURATION = {
  press: 0.16,
  hover: 0.2,
  panel: 0.28,
  reveal: 0.7,
} as const

// Entrada estándar de sección/card: opacidad + leve desplazamiento vertical.
// direction 'none' sólo desvanece — para elementos que no deben moverse en pantalla.
export const revealUp = (delay = 0, direction: 'up' | 'none' = 'up') => ({
  initial: { opacity: 0, y: direction === 'up' ? 16 : 0 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION.reveal, delay, ease: EASE_OUT },
})

// Panel/resultado que reemplaza contenido (calculadora, filtros): opacidad +
// desplazamiento corto, para usar dentro de <AnimatePresence mode="wait">.
export const panelIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: DURATION.panel, ease: EASE_OUT },
}

// Feedback de presión — mantenerlo sutil (0.95–0.98), nunca scale(0).
export const press = { scale: 0.97 }
export const pressTransition = { duration: DURATION.press, ease: EASE_OUT }

// Stagger decorativo para mosaicos (gap: 1px) — nunca debe bloquear interacción.
export const staggerChildren = (step = 0.06) => ({
  animate: { transition: { staggerChildren: step } },
})
