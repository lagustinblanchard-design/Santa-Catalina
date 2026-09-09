'use client'

import { useEffect, useState, type PointerEvent } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import type { V3Banner, V3SectionKey } from '@/lib/v3-banners'
import { DURATION, EASE_OUT, press, pressTransition } from '@/lib/motion'

const TILT_MAX = 6
// Sin sobrepaso perceptible: la gramática del proyecto es revelado y barrido,
// no rebote (ver cabecera de lib/motion.ts).
const TILT_SPRING = { stiffness: 200, damping: 30 }

const BORDER_REST = 'rgba(242,236,224,0.14)'
const BORDER_HOVER = 'rgba(242,236,224,0.28)'
const SHADOW_REST = '0 18px 45px rgba(0,0,0,0.35)'
const SHADOW_HOVER = '0 28px 70px rgba(0,0,0,0.45)'

// Una tarjeta de vidrio de la grilla 2×2: flota sobre el video del Hero, se
// eleva e inclina hacia el cursor, y un brillo lo acompaña por adentro.
export default function SectionCard({
  banner,
  index,
  active,
  onOpen,
}: {
  banner: V3Banner
  index: number
  active: boolean
  onOpen: (key: V3SectionKey) => void
}) {
  const reduceMotion = useReducedMotion()
  const [finePointer, setFinePointer] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    setFinePointer(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  // Tilt y brillo sólo con mouse real: en touch, un pointermove durante el
  // swipe del pager haría bailar las tarjetas. Y reduced-motion los apaga —
  // MotionConfig del layout no cubre motion values manejados a mano.
  const interactive = finePointer && !reduceMotion

  const glowX = useMotionValue(0)
  const glowY = useMotionValue(0)
  const tiltX = useMotionValue(0) // -0.5 … 0.5 dentro de la tarjeta
  const tiltY = useMotionValue(0)

  const rotateY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-TILT_MAX, TILT_MAX]), TILT_SPRING)
  const rotateX = useSpring(useTransform(tiltY, [-0.5, 0.5], [TILT_MAX, -TILT_MAX]), TILT_SPRING)
  const glow = useMotionTemplate`radial-gradient(320px circle at ${glowX}px ${glowY}px, rgba(255,66,48,0.16), transparent 70%)`

  function handlePointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!interactive) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    glowX.set(x)
    glowY.set(y)
    tiltX.set(x / rect.width - 0.5)
    tiltY.set(y / rect.height - 0.5)
  }

  const hoverState = interactive
    ? { y: -8, borderColor: BORDER_HOVER, boxShadow: SHADOW_HOVER, transition: { duration: DURATION.hover, ease: EASE_OUT } }
    : { borderColor: BORDER_HOVER, transition: { duration: DURATION.hover, ease: EASE_OUT } }

  return (
    <motion.button
      type="button"
      tabIndex={active ? 0 : -1}
      onTap={() => onOpen(banner.key)}
      onPointerMove={handlePointerMove}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => {
        setHovered(false)
        tiltX.set(0)
        tiltY.set(0)
      }}
      whileHover={hoverState}
      whileFocus={{ y: -8, borderColor: BORDER_HOVER, boxShadow: SHADOW_HOVER, transition: { duration: DURATION.hover, ease: EASE_OUT } }}
      whileTap={{ ...press, transition: pressTransition }}
      initial={{ opacity: 0, y: 24 }}
      animate={{
        opacity: active ? 1 : 0,
        y: active ? 0 : 24,
        borderColor: BORDER_REST,
        boxShadow: SHADOW_REST,
      }}
      transition={{ duration: DURATION.reveal, delay: active ? index * 0.07 : 0, ease: EASE_OUT }}
      style={{
        rotateX: interactive ? rotateX : 0,
        rotateY: interactive ? rotateY : 0,
        transformStyle: 'preserve-3d',
        background: 'linear-gradient(160deg, rgba(46,42,38,0.50), rgba(46,42,38,0.34))',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 20,
      }}
      className="relative overflow-hidden p-6 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2ECE0] sm:p-8"
    >
      {/* Brillo que sigue al cursor */}
      {interactive && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: glow }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: DURATION.hover, ease: EASE_OUT }}
        />
      )}

      {/* Numeral fantasma — profundidad, recortado por el overflow-hidden */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-1 z-0 font-black leading-none"
        style={{ fontSize: '9rem', color: 'rgba(242,236,224,0.06)' }}
      >
        {banner.index}
      </span>

      <div className="relative z-10 flex h-full flex-col">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em]">
          <span style={{ color: '#FF4230' }}>{banner.index}</span>
          <span style={{ color: 'rgba(242,236,224,0.55)' }}> · {banner.title}</span>
        </p>

        <p className="mt-auto pt-6 font-black text-white" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', lineHeight: 1 }}>
          {banner.hook.value}
          {banner.hook.unit && (
            <span className="ml-1 text-[0.4em] font-bold" style={{ color: '#D8D2C7' }}>{banner.hook.unit}</span>
          )}
        </p>

        <p className="mt-2 max-w-[24ch] text-xs sm:text-sm" style={{ color: 'rgba(242,236,224,0.7)' }}>
          {banner.hook.caption}
        </p>

        <span className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider" style={{ color: 'rgba(242,236,224,0.65)' }}>
          Ver más
          <motion.span
            animate={{ x: hovered ? 3 : 0, y: hovered ? -3 : 0 }}
            transition={{ duration: DURATION.hover, ease: EASE_OUT }}
          >
            ↗
          </motion.span>
        </span>
      </div>
    </motion.button>
  )
}
