'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { SITE } from '@/lib/data'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: 'easeOut' as const },
})

// Network Information API — no está en el lib.dom.d.ts estándar. Sólo la usamos para
// negar la carga (saveData / conexiones lentas), nunca para exigirla: si el navegador
// no la expone (Safari, Firefox), asumimos que puede cargar el video.
type NetworkInformation = { saveData?: boolean; effectiveType?: string }

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const nav = navigator as Navigator & { connection?: NetworkInformation }
    const conn = nav.connection
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isSlowConnection = conn?.saveData === true || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g' || conn?.effectiveType === '3g'

    // En mobile, con reduced-motion, o con conexión lenta/saveData: el hero se queda
    // en el poster estático. El <video> nunca descarga los ~5,7 MB.
    if (!isDesktop || prefersReducedMotion || isSlowConnection) return

    const source = document.createElement('source')
    source.src = '/hero-video.mp4'
    source.type = 'video/mp4'
    video.appendChild(source)
    video.load()
    video.play().catch(() => {
      // autoplay bloqueado por el navegador — el poster se queda de fondo, sin error visible
    })
  }, [])

  return (
    <section
      id="inicio"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: '#2E2A26' }}
    >
      {/* Aerial background video — el <source> se agrega en runtime sólo en desktop
          (ver useEffect arriba). preload="none" evita cualquier descarga hasta entonces. */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        poster="/hero-poster.webp"
        preload="none"
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)' }} />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">

        <motion.div {...fadeUp(0.1)} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
          <span style={{ color: 'rgba(242,236,224,0.65)' }}>Comercializado por</span>
          <span className="font-bold" style={{ color: '#FF1200' }}>RE/MAX</span>
          <span className="font-semibold text-white">PAYÉ</span>
          <span style={{ color: 'rgba(242,236,224,0.5)' }}>·</span>
          <span style={{ color: 'rgba(242,236,224,0.65)' }}>Corrientes Capital</span>
        </motion.div>

        <motion.h1 {...fadeUp(0.25)} className="mb-4 text-5xl font-black tracking-tight md:text-7xl" style={{ letterSpacing: '-0.025em' }}>
          Extensión Urbana
          <br />
          <span style={{ color: '#AA1120' }}>Santa Catalina</span>
        </motion.h1>

        <motion.p {...fadeUp(0.4)} className="mb-2 text-xl font-semibold text-white/90 md:text-2xl">
          {SITE.stage}
        </motion.p>

        <motion.p {...fadeUp(0.5)} className="mb-10 text-base md:text-lg" style={{ color: 'rgba(242,236,224,0.75)' }}>
          {SITE.location}
        </motion.p>

        <motion.div {...fadeUp(0.6)} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="#lotes"
            className="rounded-full px-8 py-4 text-base font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#AA1120' }}
          >
            Ver lotes disponibles
          </a>
          <a
            href="#precios"
            className="rounded-full border border-white/40 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            Ver precios
          </a>
        </motion.div>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-6 border-t pt-10"
          style={{ borderColor: 'rgba(242,236,224,0.15)' }}
        >
          {[
            { value: '14', label: 'Manzanas', color: '#AA1120' },
            { value: '312–467', label: 'm² por lote', color: '#fff' },
            { value: 'USD', label: 'Financiación disponible', color: '#fff' },
          ].map(({ value, label, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 + i * 0.12, duration: 0.5, ease: 'easeOut' as const }}
            >
              <p className="text-3xl font-black" style={{ color }}>{value}</p>
              <p className="text-sm" style={{ color: 'rgba(242,236,224,0.65)' }}>{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" style={{ color: 'rgba(242,236,224,0.4)' }}>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
