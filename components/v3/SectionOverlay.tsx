'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { V3Banner } from '@/lib/v3-banners'
import { waLink } from '@/lib/v3-banners'
import { DURATION, EASE_OUT, staggerChildren, panelIn } from '@/lib/motion'
import { useDialogBehavior } from './useDialogBehavior'

// Viñeta genérica superpuesta al Hero — estilo glass (translúcida + blur) en
// vez del hueso sólido de la primera versión: acá no hay una fila de banners
// de la que "colgar" el panel, así que va centrada sobre el botón-página que
// la abrió, que sigue oscuro/con video detrás.
export default function SectionOverlay({ banner, onClose }: { banner: V3Banner | null; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isOpen = banner !== null
  const { panelRef } = useDialogBehavior(isOpen, onClose)
  const reduceMotion = useReducedMotion()
  const titleId = useId()

  function handleViewSection() {
    if (!banner) return
    const anchor = banner.anchor
    onClose()
    // requestAnimationFrame, no el cleanup de useDialogBehavior: el scroll debe
    // disparar apenas se cierra, sin esperar la animación de salida (~280ms).
    requestAnimationFrame(() => {
      window.location.hash = anchor
    })
  }

  if (!mounted) return null

  const panelVariants = {
    initial: { opacity: 0, scale: reduceMotion ? 1 : 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: reduceMotion ? 1 : 0.96 },
    transition: { duration: reduceMotion ? DURATION.panel : 0.42, ease: EASE_OUT },
  }

  return createPortal(
    <AnimatePresence>
      {banner && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.panel, ease: EASE_OUT }}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative flex w-full max-h-[85vh] flex-col overflow-hidden outline-none sm:w-[min(880px,92vw)]"
            style={{
              background: 'rgba(46,42,38,0.55)',
              backdropFilter: 'blur(20px) saturate(140%)',
              WebkitBackdropFilter: 'blur(20px) saturate(140%)',
              border: '1px solid rgba(242,236,224,0.15)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              borderRadius: 24,
            }}
            {...panelVariants}
          >
            {/* Barra superior */}
            <div className="flex shrink-0 items-center justify-between border-b px-5" style={{ height: 52, borderColor: 'rgba(242,236,224,0.15)' }}>
              <p id={titleId} className="text-xs font-bold tracking-widest" style={{ color: '#F2ECE0' }}>
                {banner.index} · {banner.title.toUpperCase()}
              </p>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-11 w-11 items-center justify-center text-lg"
                style={{ color: 'rgba(242,236,224,0.7)' }}
              >
                ×
              </button>
            </div>

            {/* Cuerpo */}
            <motion.div
              className="grid flex-1 gap-6 overflow-y-auto p-6 sm:grid-cols-5"
              style={{ overscrollBehavior: 'contain' }}
              {...staggerChildren(0.05)}
            >
              <div className="sm:col-span-3">
                <motion.p {...panelIn} className="text-base leading-relaxed text-white/90">
                  {banner.lead}
                </motion.p>
                <motion.div {...panelIn} className="mt-5 grid grid-cols-2 gap-4">
                  {banner.highlights.map((h) => (
                    <div key={h.label}>
                      <p className="text-2xl font-black" style={{ color: '#FF4230' }}>{h.value}</p>
                      <p className="text-xs" style={{ color: 'rgba(242,236,224,0.65)' }}>{h.label}</p>
                    </div>
                  ))}
                </motion.div>
              </div>

              <motion.ul
                {...panelIn}
                className="space-y-2 border-t pt-4 text-sm sm:col-span-2 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0"
                style={{ borderColor: 'rgba(242,236,224,0.15)', color: 'rgba(242,236,224,0.85)' }}
              >
                {banner.bullets.map((bullet) => (
                  <li key={bullet} className="leading-snug">
                    {bullet}
                  </li>
                ))}
              </motion.ul>
            </motion.div>

            {/* Pie */}
            <div className="flex shrink-0 flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'rgba(242,236,224,0.15)' }}>
              <button
                onClick={handleViewSection}
                className="rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#AA1120' }}
              >
                Ver sección completa →
              </button>
              <a
                href={waLink(banner.waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border px-6 py-3 text-center text-sm font-semibold transition-colors hover:bg-white/10"
                style={{ borderColor: 'rgba(242,236,224,0.4)', color: '#F2ECE0' }}
              >
                Consultar por WhatsApp
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
