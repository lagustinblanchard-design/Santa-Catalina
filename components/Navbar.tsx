'use client'

import { useState, useEffect } from 'react'

const LINKS = [
  { href: '#proyecto',     label: 'El proyecto' },
  { href: '#lotes',        label: 'Lotes' },
  { href: '#precios',      label: 'Precios' },
  { href: '#financiacion', label: 'Financiación' },
  { href: '#galeria',      label: 'Galería' },
  { href: '#contacto',     label: 'Contacto' },
]

// Globo RE/MAX según Manual de Marca 2025
function RemaxGlobe({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 28 31" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Mitad izquierda superior — rojo oscuro */}
      <path d="M14 1 A13 13 0 0 0 1 14 L14 14 Z" fill="#660000"/>
      {/* Mitad derecha superior — rojo primario */}
      <path d="M14 1 A13 13 0 0 1 27 14 L14 14 Z" fill="#FF1200"/>
      {/* Franja blanca central */}
      <path d="M1 14 L27 14 L27 18 L1 18 Z" fill="#FFFFFF"/>
      {/* Mitad izquierda inferior — azul oscuro */}
      <path d="M1 18 L14 18 L14 30 Q7 28 2 22 Z" fill="#000E35"/>
      {/* Mitad derecha inferior — azul primario */}
      <path d="M27 18 L14 18 L14 30 Q21 28 26 22 Z" fill="#0043FF"/>
    </svg>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-white/95 shadow-sm backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo RE/MAX PAYÉ */}
        <a href="#inicio" className="flex items-center gap-2">
          <RemaxGlobe size={26} />
          <div className="flex flex-col leading-none">
            <span
              className={`text-base font-black tracking-tight transition-colors ${
                scrolled ? 'text-gray-900' : 'text-white'
              }`}
            >
              REMAX <span className={scrolled ? 'text-gray-500' : 'text-white/70'}>PAYÉ</span>
            </span>
            <span className="text-xs font-semibold" style={{ color: '#FF1200' }}>
              Santa Catalina
            </span>
          </div>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:opacity-80 ${
                scrolled ? 'text-gray-700' : 'text-white/90'
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contacto"
            className="rounded-full px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#FF1200' }}
          >
            Consultar
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <svg
            className={`h-6 w-6 ${scrolled ? 'text-gray-900' : 'text-white'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-6 py-4 md:hidden">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-sm font-medium text-gray-700"
              style={{ borderBottom: '1px solid #f3f4f6' }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contacto"
            onClick={() => setMenuOpen(false)}
            className="mt-3 block rounded-xl px-4 py-3 text-center text-sm font-bold text-white"
            style={{ backgroundColor: '#FF1200' }}
          >
            Consultar ahora
          </a>
        </div>
      )}
    </nav>
  )
}
