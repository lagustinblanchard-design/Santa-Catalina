'use client'

import { useMemo, useRef, useState } from 'react'
import { motion, useInView, useMotionTemplate, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from 'motion/react'
import framesData from '@/lib/timeline/frames.generated.json'
import type { Lot } from '@/lib/lots'
import { countByStatus } from '@/lib/lots'
import { useStageOpacity } from './useStageOpacity'
import Live3DStage from './Live3DStage'

type Frame = {
  id: string
  kicker: string
  title: string
  body: string
  isReal: boolean
  lqip: string
}

const FRAMES = framesData.frames as Frame[]

// Peso relativo de cada etapa (no todas duran lo mismo). El mapa 3D en vivo
// (última) pesa más que cualquier imagen: es el clímax de la secuencia — dos
// beats propios (306 lotes → 125 disponibles) antes de soltar el sticky.
const STAGE_WEIGHTS = [1.2, 1, 0.9, 0.9, 0.9, 1.4, 1.6]
const STAGE_KEYS = [...FRAMES.map((f) => f.id), 'live3d']

// Último tramo del track sin cambio visual, para que soltar el sticky no
// se sienta como un tirón (ver plan: "la última etapa termina antes del
// final del track").
const DEAD_ZONE = 0.08
const EFFECTIVE_END = 1 - DEAD_ZONE

function useStageBounds() {
  return useMemo(() => {
    const total = STAGE_WEIGHTS.reduce((a, b) => a + b, 0)
    let acc = 0
    return STAGE_WEIGHTS.map((w) => {
      const start = (acc / total) * EFFECTIVE_END
      acc += w
      const end = (acc / total) * EFFECTIVE_END
      return { start, end }
    })
  }, [])
}

function StageFrame({
  frame,
  index,
  scrollYProgress,
  bounds,
  live,
}: {
  frame: Frame
  index: number
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress']
  bounds: { start: number; end: number }
  live: boolean
}) {
  const opacity = useStageOpacity(scrollYProgress, bounds, index, false)
  const reduceMotion = useReducedMotion()
  // Ken Burns lento, sólo mientras la etapa está en pantalla — clamp fuera
  // de rango hace que no importe el valor una vez invisible. Con reduced-motion
  // queda fijo en 1: el crossfade (cambio de contenido) se conserva, el
  // movimiento continuo no.
  const scale = useTransform(scrollYProgress, [bounds.start, bounds.end], reduceMotion ? [1, 1] : [1, 1.045])
  const bg = useMotionTemplate`url(${frame.lqip})`

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity, visibility: live ? 'visible' : 'hidden' }}
    >
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        // Sin `live` el scale queda fijo en 1 (sin useTransform aplicado vía
        // style) — sacarle el transform a una etapa invisible evita que el
        // navegador la siga promoviendo a capa de compositor propia.
        style={live ? { scale, backgroundImage: bg } : { backgroundImage: bg }}
      >
        <picture>
          <source media="(max-width: 767px)" type="image/avif" srcSet={`/timeline/${frame.id}-m.avif`} />
          <source media="(max-width: 767px)" type="image/webp" srcSet={`/timeline/${frame.id}-m.webp`} />
          <source type="image/avif" srcSet={`/timeline/${frame.id}.avif`} />
          <source type="image/webp" srcSet={`/timeline/${frame.id}.webp`} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/timeline/${frame.id}.webp`}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority={index === 0 ? 'high' : 'low'}
          />
        </picture>
      </motion.div>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(46,42,38,0.85) 0%, rgba(46,42,38,0.1) 45%, transparent 70%),' +
            ' linear-gradient(rgba(0,0,0,0.32), rgba(0,0,0,0.32))',
        }}
      />
      {frame.isReal && (
        <span
          className="absolute right-6 top-20 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest sm:right-10 sm:top-24"
          style={{ background: 'rgba(46,42,38,0.75)', color: '#F2ECE0', backdropFilter: 'blur(6px)' }}
        >
          Vuelo real de dron
        </span>
      )}
    </motion.div>
  )
}

export default function TimelineStage({ lots }: { lots: Lot[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [live3dPhase, setLive3dPhase] = useState<'lotes' | 'disponibles'>('lotes')
  const bounds = useStageBounds()
  const live3dBounds = bounds[FRAMES.length]

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const live3dProgress = useTransform(scrollYProgress, [live3dBounds.start, live3dBounds.end], [0, 1])

  // Una vez que el track quedó atrás, activeIndex se clava en la última etapa
  // (nada vuelve a bajar el índice) — sin esto deckActive quedaría en true
  // para siempre después de pasar el sticky una vez.
  const trackInView = useInView(trackRef, { margin: '200px 0px 200px 0px' })
  // El canvas de deck.gl arranca una etapa antes de necesitarse (en "ripio")
  // para llegar con los tiles pedidos, y se desmonta apenas el track sale de
  // vista — ver plan: el bug de "negro al subir" era este canvas y su rAF
  // quedando vivos para siempre en toda la página.
  const deckActive = trackInView && activeIndex >= FRAMES.length - 2

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    let idx = 0
    for (let i = 0; i < bounds.length; i++) {
      if (v >= bounds[i].start) idx = i
    }
    setActiveIndex((prev) => (prev === idx ? prev : idx))
  })

  useMotionValueEvent(live3dProgress, 'change', (v) => {
    const next = v > 0.5 ? 'disponibles' : 'lotes'
    setLive3dPhase((prev) => (prev === next ? prev : next))
  })

  function skipToLotes() {
    const el = trackRef.current
    if (!el) return
    window.scrollTo({ top: el.offsetTop + el.offsetHeight, behavior: 'smooth' })
  }

  const disponibles = countByStatus(lots).DISPONIBLE ?? 0

  const LIVE3D_CAPTIONS = {
    lotes: {
      kicker: 'Etapa 1',
      title: `${lots.length} lotes. 16 manzanas.`,
      body: 'Las dos Reservas Municipales quedan como espacio verde.',
    },
    disponibles: {
      kicker: 'En vivo',
      title: `${disponibles} están disponibles hoy.`,
      body: 'Dato tomado de nuestra planilla de comercialización.',
    },
  } as const

  const active = activeIndex < FRAMES.length ? FRAMES[activeIndex] : LIVE3D_CAPTIONS[live3dPhase]

  return (
    <section
      ref={trackRef}
      className="relative h-[480vh] md:h-[760vh]"
      // Clases responsive (`md:`) y `motion-reduce:` compilan ambas a media
      // queries — su precedencia en el CSS generado la decide el orden
      // interno de Tailwind, no el className, así que a veces `md:` ganaba
      // en desktop con reduced-motion activo. El style inline es la única
      // forma de que reduced-motion gane siempre, sin depender de eso.
      style={reduceMotion ? { height: '300vh' } : undefined}
    >
      <div className="sticky top-0 h-svh overflow-hidden" style={{ background: '#2E2A26' }}>
        {FRAMES.map((frame, i) => (
          <StageFrame
            key={frame.id}
            frame={frame}
            index={i}
            scrollYProgress={scrollYProgress}
            bounds={bounds[i]}
            live={Math.abs(i - activeIndex) <= 1}
          />
        ))}

        <Live3DStage
          lots={lots}
          scrollYProgress={scrollYProgress}
          bounds={live3dBounds}
          index={FRAMES.length}
          spotlight={live3dPhase === 'disponibles' ? 'DISPONIBLE' : null}
          active={deckActive}
          live={activeIndex >= FRAMES.length - 1}
        />

        {/* Texto de la etapa activa */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-6 pb-16 sm:px-10 sm:pb-20">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: 'rgba(242,236,224,0.6)' }}>
            {active.kicker}
          </p>
          <h2 className="max-w-xl text-3xl font-black text-white sm:text-5xl" style={{ letterSpacing: '-0.02em' }}>
            {active.title}
          </h2>
          <p className="mt-3 max-w-md text-sm sm:text-base" style={{ color: 'rgba(242,236,224,0.8)' }}>
            {active.body}
          </p>
        </div>

        {/* Riel de progreso */}
        <div className="pointer-events-none absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex sm:right-10">
          <span className="text-xs font-bold" style={{ color: 'rgba(242,236,224,0.5)' }}>
            {String(activeIndex + 1).padStart(2, '0')} / {String(STAGE_KEYS.length).padStart(2, '0')}
          </span>
          <div className="flex flex-col gap-2">
            {STAGE_KEYS.map((key, i) => (
              <span
                key={key}
                className="h-6 w-1.5 rounded-full transition-colors duration-300"
                style={{ background: i === activeIndex ? '#AA1120' : 'rgba(242,236,224,0.25)' }}
              />
            ))}
          </div>
        </div>

        {/* Contador móvil — top-20, no top-6: el Navbar es fixed con z-40 y tapa
            cualquier badge del sticky que quede por encima de esa cota (mismo
            bug que ya pasó con el back-button de /v3 y el badge "Vuelo real
            de dron" de esta misma página). */}
        <div className="pointer-events-none absolute right-6 top-20 z-10 text-xs font-bold sm:hidden" style={{ color: 'rgba(242,236,224,0.7)' }}>
          {String(activeIndex + 1).padStart(2, '0')} / {String(STAGE_KEYS.length).padStart(2, '0')}
        </div>

        {/* Saltar el sticky — nunca puede sentirse secuestro */}
        <button
          type="button"
          onClick={skipToLotes}
          className="absolute bottom-6 left-6 z-10 rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-white/10 sm:left-10"
          style={{ borderColor: 'rgba(242,236,224,0.35)', color: '#F2ECE0' }}
        >
          Saltar a los lotes ↓
        </button>
      </div>
    </section>
  )
}
