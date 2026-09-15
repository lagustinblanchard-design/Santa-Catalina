'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import AnimateIn from '@/components/AnimateIn'
import { EASE_OUT, DURATION } from '@/lib/motion'

// Los renders IA del barrio terminado — ya derivados con el rótulo "Render
// ilustrativo · no contractual" QUEMADO en el archivo servido (ver
// scripts/timeline/build.mjs), no en un <div> encima: alguien va a capturar
// la pantalla y usarla como prueba de venta. Fondo grafito a propósito — el
// resto de la página es hueso; el cambio de fondo avisa que acá empieza la
// proyección, no la obra real (esa fue la etapa "hoy" del sticky, y las
// fotos de #galeria).
const VIEWS = [
  {
    id: 'render-ripio',
    label: 'Calles y arbolado',
    caption: 'Con las calles de acceso terminadas y el arbolado ya crecido.',
  },
  {
    id: 'render-parque',
    label: 'Reservas como parque',
    caption: 'Las dos Reservas Municipales convertidas en parque, con senderos.',
  },
] as const

export default function RendersV4() {
  const [active, setActive] = useState<(typeof VIEWS)[number]['id']>('render-ripio')
  const view = VIEWS.find((v) => v.id === active)!

  return (
    <section id="renders" className="py-20 sm:py-28" style={{ background: '#2E2A26' }}>
      <div className="mx-auto max-w-6xl px-6">
        <AnimateIn>
          <span
            className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white"
            style={{ backgroundColor: '#AA1120' }}
          >
            Proyección
          </span>
          <h2 className="max-w-2xl text-4xl font-black text-white sm:text-5xl" style={{ letterSpacing: '-0.02em' }}>
            Así lo imaginamos.
          </h2>
          <p className="mt-4 max-w-xl text-base" style={{ color: 'rgba(242,236,224,0.75)' }}>
            Es una proyección, no una promesa contractual — la obra real la mostramos en la sección de arriba,
            con fotos sin retocar.
          </p>
        </AnimateIn>

        <div className="mt-10 overflow-hidden rounded-2xl" style={{ aspectRatio: '16/9' }}>
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DURATION.reveal, ease: EASE_OUT }}
            className="relative h-full w-full"
          >
            <picture>
              <source media="(max-width: 767px)" type="image/avif" srcSet={`/timeline/${view.id}-m.avif`} />
              <source media="(max-width: 767px)" type="image/webp" srcSet={`/timeline/${view.id}-m.webp`} />
              <source type="image/avif" srcSet={`/timeline/${view.id}.avif`} />
              <source type="image/webp" srcSet={`/timeline/${view.id}.webp`} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/timeline/${view.id}.webp`}
                alt={`Render ilustrativo, no contractual — ${view.caption}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </picture>
          </motion.div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm" style={{ color: 'rgba(242,236,224,0.65)' }}>{view.caption}</p>
          <div className="flex flex-wrap gap-2">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setActive(v.id)}
                className="rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
                style={{
                  background: active === v.id ? '#AA1120' : 'transparent',
                  border: '1px solid rgba(242,236,224,0.3)',
                  color: '#F2ECE0',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
