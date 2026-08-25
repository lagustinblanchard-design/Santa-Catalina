'use client'

import { motion } from 'motion/react'
import { EASE_OUT, DURATION } from '@/lib/motion'

const JOSEFIN = "var(--font-josefin), 'Josefin Sans', sans-serif"

// El filete rojo que abre cada sección de /v2 — antes repetido a mano en 6 archivos
// (ProjectInfoV2, PriceCalculatorV2, FinancingV2, ZoningV2, GalleryV2, ContactFormV2).
// Se dibuja con un barrido desde la izquierda (transformOrigin: 'left'); la etiqueta
// entra 120ms después. transform como string, no el atajo scaleX, para que corra en GPU.
export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
      <motion.div
        style={{ width: 32, height: 1, background: '#FF1200', transformOrigin: 'left' }}
        initial={{ transform: 'scaleX(0)' }}
        whileInView={{ transform: 'scaleX(1)' }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: DURATION.reveal, ease: EASE_OUT }}
      />
      <motion.span
        style={{ fontFamily: JOSEFIN, fontSize: '0.58rem', letterSpacing: '0.3em', color: '#FF1200', textTransform: 'uppercase' }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: DURATION.hover, delay: 0.12, ease: EASE_OUT }}
      >
        {children}
      </motion.span>
    </div>
  )
}
