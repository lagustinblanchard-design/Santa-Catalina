'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { SITE } from '@/lib/data'
import { countByStatus, type Lot } from '@/lib/lots'

// Hero de la home (V4 pasó a ser la versión oficial y única de cara al
// público — ver git log de app/page.tsx; el Hero viejo, components/Hero.tsx,
// se borró al quedar sin uso). Mismo video/CTA de siempre, con la píldora de
// disponibilidad en vivo que dispara la narrativa del sticky de abajo
// (TimelineStage).
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: 'easeOut' as const },
})

type NetworkInformation = { saveData?: boolean; effectiveType?: string }

export default function HeroV4({ lots }: { lots: Lot[] }) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const disponibles = countByStatus(lots).DISPONIBLE ?? 0
  const waHref = `https://wa.me/${SITE.WA_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(SITE.WA_MESSAGE)}`
  // El Hero sigue montado (no es el sticky) mientras el usuario recorre las
  // 7 pantallas de abajo — sin esto el video queda decodificando en loop para
  // siempre, compitiendo por el hilo principal con el resto de la página.
  const heroInView = useInView(sectionRef, { margin: '200px 0px 200px 0px' })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const nav = navigator as Navigator & { connection?: NetworkInformation }
    const conn = nav.connection
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isSlowConnection = conn?.saveData === true || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g' || conn?.effectiveType === '3g'
    // El ancho de pantalla ya no bloquea el video (antes sólo cargaba en
    // desktop) — sólo elige la fuente: liviana en celular (~1,4 MB), la de
    // siempre en desktop (~3,8 MB). reduced-motion/conexión lenta sí siguen
    // dejando el poster fijo, en cualquier viewport.
    if (prefersReducedMotion || isSlowConnection) return

    if (!video.querySelector('source')) {
      const source = document.createElement('source')
      source.src = isDesktop ? '/hero-video.mp4' : '/hero-video-mobile.mp4'
      source.type = 'video/mp4'
      video.appendChild(source)
      video.load()
      // Si el primer play() (abajo) se rechaza por falta de datos, reintentar
      // una vez cuando el video ya tenga buffer suficiente.
      video.addEventListener('canplay', () => { if (heroInView) video.play().catch(() => {}) }, { once: true })
    }
    if (heroInView) video.play().catch(() => {})
    else video.pause()
  }, [heroInView])

  return (
    <section id="inicio" ref={sectionRef} className="relative flex h-screen items-center justify-center overflow-hidden" style={{ background: '#2E2A26' }}>
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
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%)' }} />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
        <motion.div {...fadeUp(0.1)} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full" style={{ background: '#4ADE80' }} />
          <span className="font-bold text-white">{disponibles} de {lots.length}</span>
          <span style={{ color: 'rgba(242,236,224,0.75)' }}>lotes disponibles hoy</span>
          <span style={{ color: 'rgba(242,236,224,0.5)' }}>·</span>
          <span style={{ color: 'rgba(242,236,224,0.55)' }}>actualizado en vivo</span>
        </motion.div>

        <motion.h1 {...fadeUp(0.25)} className="mb-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl" style={{ letterSpacing: '-0.025em' }}>
          Distrito Payé.
          <br />
          <span style={{ color: '#AA1120' }}>Santa Catalina se expande.</span>
        </motion.h1>

        {/* Copy pedido explícitamente en este orden y en líneas separadas —
            pensado sobre todo para celular, donde la versión anterior (una
            sola oración larga) envolvía mal. El texto de la ordenanza acá es
            más corto ("ordenanza N° 7403") que SITE.ordinance ("Ord. N.º
            7403", usado en el resto del sitio) a propósito, sólo para el Hero. */}
        <motion.p {...fadeUp(0.45)} className="mx-auto mb-10 max-w-2xl text-base sm:text-lg" style={{ color: 'rgba(242,236,224,0.8)' }}>
          {SITE.stage}
          <br />
          {SITE.totalBlocks} Mz aprobadas por ordenanza N° 7403.
          <br />
          A 2 minutos de Av. Maipú
          <br />
          Santa Catalina, Corrientes Capital
        </motion.p>

        {/* Escritorio: los mismos 2 CTA de siempre, sin cambios — el recorrido
            3D ya está siempre visible ahí, en el Navbar (destacado). */}
        <motion.div {...fadeUp(0.6)} className="hidden items-center justify-center gap-4 sm:flex">
          <a
            href="#lotes"
            className="rounded-full px-8 py-4 text-base font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#AA1120' }}
          >
            Ver lotes disponibles
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/40 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            Hablar por WhatsApp
          </a>
        </motion.div>

        {/* Celular: reordenado a pedido explícito — el recorrido 3D pasa a ser
            el primer botón y el destacado (toma el tratamiento sólido que
            antes tenía "Ver lotes disponibles"; en desktop el 3D ya es
            prominente vía el Navbar, acá en celular queda escondido detrás
            del menú hamburguesa, así que se lo destaca acá). "Ver lotes" baja
            al 2° lugar y WhatsApp al 3°, los dos con el mismo tratamiento
            secundario (borde). */}
        <motion.div {...fadeUp(0.6)} className="flex flex-col items-center gap-4 sm:hidden">
          <Link
            href="/mapa-3d"
            className="rounded-full px-8 py-4 text-base font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#AA1120' }}
          >
            Recorrer el loteo en 3D
          </Link>
          <a
            href="#lotes"
            className="rounded-full border border-white/40 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            Ver lotes disponibles
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/40 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            Hablar por WhatsApp
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center"
      >
        <div className="mx-auto mb-2 h-8 w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(242,236,224,0.5))' }} />
        <p className="text-xs" style={{ color: 'rgba(242,236,224,0.55)' }}>
          Bajá: el terreno se queda quieto, el tiempo avanza.
        </p>
      </motion.div>
    </section>
  )
}
