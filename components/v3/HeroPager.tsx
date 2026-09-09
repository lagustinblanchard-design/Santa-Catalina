'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { EASE_OUT } from '@/lib/motion'

type DragInfo = { offset: { x: number; y: number }; velocity: { x: number; y: number } }

// Pager horizontal genérico: mide el ancho real del contenedor (no hay
// carousel lib instalada) para animar/arrastrar en píxeles reales. Controlado
// desde afuera (index/onIndexChange) en vez de dueño de su propio estado,
// para que un botón fuera del pager (la flecha con bounce de la intro) pueda
// avanzar de página sin necesitar una ref imperativa.
export default function HeroPager({
  pages,
  index,
  onIndexChange,
  disabled = false,
  ariaLabel,
}: {
  pages: ReactNode[]
  index: number
  onIndexChange: (i: number) => void
  disabled?: boolean
  ariaLabel: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const reduceMotion = useReducedMotion()
  const count = pages.length

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function goTo(i: number) {
    onIndexChange(Math.max(0, Math.min(count - 1, i)))
  }

  function handleDragEnd(_: unknown, info: DragInfo) {
    const farEnough = Math.abs(info.offset.x) > width * 0.2
    const fastEnough = Math.abs(info.velocity.x) > 500
    if (!farEnough && !fastEnough) return
    goTo(index + (info.offset.x < 0 ? 1 : -1))
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (disabled) return
    if (e.key === 'ArrowRight') goTo(index + 1)
    else if (e.key === 'ArrowLeft') goTo(index - 1)
  }

  return (
    <div
      ref={containerRef}
      role="group"
      aria-roledescription="carrusel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative h-full w-full overflow-hidden outline-none"
    >
      <motion.div
        className="flex h-full"
        drag={width > 0 && !disabled ? 'x' : false}
        dragConstraints={{ left: -(count - 1) * width, right: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
        animate={{ x: -index * width }}
        transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE_OUT }}
      >
        {pages.map((page, i) => (
          <div key={i} className="h-full shrink-0" style={{ width }} aria-hidden={i !== index}>
            {page}
          </div>
        ))}
      </motion.div>

      {/* Flechas — sólo desktop, el gesto principal es el arrastre/swipe */}
      <button
        onClick={() => goTo(index - 1)}
        disabled={index === 0}
        aria-label="Página anterior"
        className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full p-3 text-xl transition-opacity disabled:opacity-20 sm:flex"
        style={{ background: 'rgba(255,255,255,0.08)', color: '#F2ECE0' }}
      >
        ‹
      </button>
      <button
        onClick={() => goTo(index + 1)}
        disabled={index === count - 1}
        aria-label="Página siguiente"
        className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full p-3 text-xl transition-opacity disabled:opacity-20 sm:flex"
        style={{ background: 'rgba(255,255,255,0.08)', color: '#F2ECE0' }}
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-2">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ir a la página ${i + 1}`}
            aria-current={i === index}
            className="h-1.5 rounded-full transition-all duration-200 ease-out"
            style={{
              width: i === index ? 28 : 8,
              background: i === index ? '#AA1120' : 'rgba(242,236,224,0.35)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
