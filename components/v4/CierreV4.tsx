'use client'

import { motion } from 'motion/react'
import { SITE } from '@/lib/data'
import { EASE_OUT, DURATION } from '@/lib/motion'

// Cierre de /v4: el keyframe del agrimensor — único plano humano y terrestre
// de todo el material (el resto de la línea de tiempo y los renders son
// cenitales). Cambiar de perspectiva en el último momento es deliberado.
export default function CierreV4() {
  const waHref = `https://wa.me/${SITE.WA_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(SITE.WA_MESSAGE)}`

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden py-24 text-center">
      <picture>
        <source media="(max-width: 767px)" type="image/avif" srcSet="/timeline/closing-m.avif" />
        <source media="(max-width: 767px)" type="image/webp" srcSet="/timeline/closing-m.webp" />
        <source type="image/avif" srcSet="/timeline/closing.avif" />
        <source type="image/webp" srcSet="/timeline/closing.webp" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/timeline/closing.webp"
          alt="Agrimensor midiendo el terreno con teodolito, con el barrio PROCREAR de fondo"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      </picture>
      <div className="absolute inset-0" style={{ background: 'rgba(46,42,38,0.6)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(46,42,38,0.9) 0%, rgba(46,42,38,0.2) 60%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: DURATION.reveal, ease: EASE_OUT }}
        className="relative z-10 mx-auto max-w-2xl px-6"
      >
        <p className="mx-auto max-w-lg text-lg sm:text-xl" style={{ color: 'rgba(242,236,224,0.85)' }}>
          {SITE.name} lo desarrolla {SITE.developer} y lo comercializa {SITE.broker}.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
            Escribinos por WhatsApp
          </a>
        </div>
      </motion.div>
    </section>
  )
}
