'use client'

import { motion } from 'motion/react'
import { SITE } from '@/lib/data'
import { EASE_IN_OUT, EASE_OUT, DURATION } from '@/lib/motion'

const CINZEL  = "var(--font-cinzel), 'Cinzel', serif"
const JOSEFIN = "var(--font-josefin), 'Josefin Sans', sans-serif"

export default function HeroV2() {
  return (
    <section id="inicio" style={{
      minHeight: '100svh', background: '#0C0C0C',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      padding: '6rem 1.5rem 4rem',
    }}>
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* Red vertical accent */}
      <div style={{ position: 'absolute', left: '6%', top: '15%', bottom: '15%', width: 1, background: 'linear-gradient(to bottom, transparent, #FF1200, transparent)' }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 960 }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
          border: '1px solid #1a1a1a', padding: '0.5rem 1.25rem', marginBottom: '3.5rem',
        }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, background: '#FF1200', borderRadius: '50%' }} />
          <span style={{ fontFamily: JOSEFIN, fontSize: '0.6rem', letterSpacing: '0.3em', color: '#aaa', textTransform: 'uppercase' }}>
            RE/MAX PAYÉ · Corrientes Capital
          </span>
        </div>

        {/* Main title — cada línea entra en cortina: el wrapper recorta (overflow: hidden)
            mientras el h1 sube de translateY(100%) a 0, con 80ms de stagger entre líneas.
            Se lee como una página impresa que se destapa. */}
        {[
          { text: 'Predios',  color: '#F5F0EB', marginBottom: '1rem' },
          { text: 'Santa',    color: '#FF1200', marginBottom: '1rem' },
          { text: 'Catalina', color: '#F5F0EB', marginBottom: '3rem' },
        ].map((line, i) => (
          <div key={line.text} style={{ overflow: 'hidden', marginBottom: line.marginBottom }}>
            <motion.h1
              style={{
                fontFamily: CINZEL,
                fontSize: 'clamp(3.5rem, 13vw, 12rem)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 0.88,
                color: line.color,
                textTransform: 'uppercase',
              }}
              initial={{ transform: 'translateY(100%)' }}
              animate={{ transform: 'translateY(0%)' }}
              transition={{ duration: 0.9, delay: i * 0.08, ease: EASE_OUT }}
            >
              {line.text}
            </motion.h1>
          </div>
        ))}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ flex: 1, maxWidth: 80, height: 1, background: '#1a1a1a' }} />
          <span style={{ fontFamily: JOSEFIN, fontSize: '0.6rem', letterSpacing: '0.3em', color: '#888', textTransform: 'uppercase' }}>
            {SITE.stage}
          </span>
          <div style={{ flex: 1, maxWidth: 80, height: 1, background: '#1a1a1a' }} />
        </div>

        <p style={{
          fontFamily: JOSEFIN, fontSize: '0.75rem', letterSpacing: '0.2em',
          color: '#aaa', textTransform: 'uppercase', marginBottom: '3.5rem',
          maxWidth: 440, margin: '0 auto 3.5rem',
        }}>
          {SITE.location}
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '5rem' }}>
          <motion.a
            href="#lotes"
            style={{
              fontFamily: JOSEFIN, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase',
              background: '#FF1200', color: '#fff', padding: '1rem 2.5rem', textDecoration: 'none',
            }}
            whileHover={{ opacity: 0.85, transition: { duration: DURATION.hover, ease: EASE_OUT } }}
            whileTap={{ scale: 0.97, transition: { duration: DURATION.press, ease: EASE_OUT } }}
          >Ver lotes disponibles</motion.a>
          <motion.a
            href="#precios"
            style={{
              fontFamily: JOSEFIN, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase',
              background: '#111', color: '#666', padding: '1rem 2.5rem', textDecoration: 'none',
              border: '1px solid #1a1a1a',
            }}
            whileHover={{ color: '#f5f0eb', transition: { duration: DURATION.hover, ease: EASE_OUT } }}
            whileTap={{ scale: 0.97, transition: { duration: DURATION.press, ease: EASE_OUT } }}
          >Ver precios</motion.a>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0, borderTop: '1px solid #1a1a1a', paddingTop: '2.5rem',
        }}>
          {[
            { val: String(SITE.totalBlocks), sub: 'Manzanas' },
            { val: '312–520', sub: 'm² por lote' },
            { val: 'USD',     sub: 'Financiación' },
          ].map((s, i) => (
            // Stagger decorativo (60ms), no bloquea nada — entra después de la cortina
            // del título (delay base 0.5s, cuando esa animación ya se leyó).
            <motion.div
              key={s.sub}
              style={{ paddingRight: i < 2 ? '2rem' : 0, borderRight: i < 2 ? '1px solid #1a1a1a' : 'none', paddingLeft: i > 0 ? '2rem' : 0 }}
              initial={{ opacity: 0, transform: 'translateY(12px)' }}
              animate={{ opacity: 1, transform: 'translateY(0px)' }}
              transition={{ duration: DURATION.reveal, delay: 0.5 + i * 0.06, ease: EASE_OUT }}
            >
              <p style={{ fontFamily: CINZEL, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, color: '#F5F0EB', marginBottom: '0.25rem' }}>
                {s.val}
              </p>
              <p style={{ fontFamily: JOSEFIN, fontSize: '0.55rem', letterSpacing: '0.2em', color: '#888', textTransform: 'uppercase' }}>
                {s.sub}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll hint — desplazamiento chico con ease-in-out en loop, no el animate-bounce
          de Tailwind (su fase de subida es un ease-in, que arranca lento donde el ojo
          más lo nota). */}
      <motion.div
        style={{ position: 'absolute', bottom: '2rem', left: '50%' }}
        animate={{ transform: ['translate(-50%, 0px)', 'translate(-50%, 6px)', 'translate(-50%, 0px)'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: EASE_IN_OUT }}
      >
        <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="#2a2a2a" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </motion.div>
    </section>
  )
}
