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
        scrolled ? 'bg-white/97 shadow-sm backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo Desarrollos Payé */}
        <a href="#inicio" className="flex items-center gap-3">
          <img
            src="/logo_paye.png.png"
            alt="Desarrollos Payé"
            height={40}
            style={{ height: 40, width: 'auto', filter: scrolled ? 'none' : 'brightness(0) invert(1)' }}
          />
          <span
            className="text-xs font-semibold"
            style={{ color: scrolled ? '#6B6660' : 'rgba(242,236,224,0.75)' }}
          >
            Santa Catalina
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: scrolled ? '#2E2A26' : 'rgba(242,236,224,0.9)' }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contacto"
            className="rounded-full px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#AA1120' }}
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
            className="h-6 w-6"
            style={{ color: scrolled ? '#2E2A26' : '#fff' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
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
        <div className="border-t px-6 py-4 md:hidden" style={{ background: '#fff', borderColor: '#D8D2C7' }}>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-sm font-medium"
              style={{ color: '#2E2A26', borderBottom: '1px solid #F2ECE0' }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contacto"
            onClick={() => setMenuOpen(false)}
            className="mt-3 block rounded-xl px-4 py-3 text-center text-sm font-bold text-white"
            style={{ backgroundColor: '#AA1120' }}
          >
            Consultar ahora
          </a>
        </div>
      )}
    </nav>
  )
}
