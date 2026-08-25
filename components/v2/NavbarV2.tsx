'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { EASE_OUT, DURATION } from '@/lib/motion'

const LINKS = [
  { href: '#proyecto', label: 'Proyecto' },
  { href: '#lotes',    label: 'Lotes' },
  { href: '/mapa-3d',  label: 'Recorrido 3D' },
  { href: '#precios',  label: 'Precios' },
  { href: '#financiacion', label: 'Financiación' },
  { href: '#galeria',  label: 'Galería' },
  { href: '#contacto', label: 'Contacto' },
]

const CINZEL  = "var(--font-cinzel), 'Cinzel', serif"
const JOSEFIN = "var(--font-josefin), 'Josefin Sans', sans-serif"

export default function NavbarV2() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: scrolled ? 'rgba(8,8,8,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid #1a1a1a' : 'none',
      transition: 'background 0.4s, border-color 0.4s',
    }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        <a href="#inicio" style={{ textDecoration: 'none' }}>
          <div style={{ lineHeight: 1 }}>
            <span style={{ display: 'block', fontFamily: JOSEFIN, fontSize: '0.55rem', letterSpacing: '0.35em', color: '#FF1200', textTransform: 'uppercase' }}>
              RE/MAX PAYÉ
            </span>
            <span style={{ display: 'block', fontFamily: CINZEL, fontSize: '0.9rem', letterSpacing: '0.15em', color: '#f5f0eb', textTransform: 'uppercase', marginTop: 3 }}>
              Santa Catalina
            </span>
          </div>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '2rem' }}>
          {LINKS.map(l => (
            <motion.a key={l.href} href={l.href} style={{
              fontFamily: JOSEFIN, fontSize: '0.65rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: '#666', textDecoration: 'none',
            }}
            whileHover={{ color: '#f5f0eb', transition: { duration: DURATION.hover, ease: EASE_OUT } }}
            >{l.label}</motion.a>
          ))}
          <motion.a href="#contacto" style={{
            fontFamily: JOSEFIN, fontSize: '0.65rem', letterSpacing: '0.15em',
            textTransform: 'uppercase', background: '#FF1200', color: '#fff',
            padding: '0.6rem 1.4rem', textDecoration: 'none',
          }}
          whileHover={{ opacity: 0.85, transition: { duration: DURATION.hover, ease: EASE_OUT } }}
          whileTap={{ scale: 0.97, transition: { duration: DURATION.press, ease: EASE_OUT } }}
          >Consultar</motion.a>
        </div>

        {/* Mobile button */}
        <motion.button className="md:hidden" onClick={() => setOpen(!open)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
          aria-label="Menú"
          whileTap={{ scale: 0.9, transition: { duration: DURATION.press, ease: EASE_OUT } }}
        >
          <svg width={22} height={22} fill="none" viewBox="0 0 24 24" stroke="#aaa" strokeWidth={1.5}>
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </motion.button>
      </div>

      {/* Mobile menu — barrido con clip-path (no height, que es propiedad de layout) para
          que la salida se anime igual que la entrada; antes desaparecía de golpe. */}
      <AnimatePresence>
        {open && (
          <motion.div
            style={{ background: '#080808', borderTop: '1px solid #1a1a1a', padding: '1.5rem', overflow: 'hidden' }}
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: DURATION.panel, ease: EASE_OUT }}
          >
            {LINKS.map(l => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
                display: 'block', fontFamily: JOSEFIN, fontSize: '0.7rem',
                letterSpacing: '0.15em', textTransform: 'uppercase', color: '#666',
                textDecoration: 'none', padding: '0.85rem 0', borderBottom: '1px solid #1a1a1a',
              }}>{l.label}</a>
            ))}
            <a href="#contacto" onClick={() => setOpen(false)} style={{
              display: 'block', marginTop: '1rem', fontFamily: JOSEFIN, fontSize: '0.7rem',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              background: '#FF1200', color: '#fff', textDecoration: 'none',
              padding: '0.9rem 1.5rem', textAlign: 'center',
            }}>Consultar ahora</a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
