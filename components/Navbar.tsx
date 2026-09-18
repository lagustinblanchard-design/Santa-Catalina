'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const NAV_ITEMS = {
  proyecto:     { href: '#proyecto',     label: 'El proyecto' },
  galeria:      { href: '#galeria',      label: 'Galería' },
  lotes:        { href: '#lotes',        label: 'Lotes' },
  precios:      { href: '#precios',      label: 'Precios' },
  financiacion: { href: '#financiacion', label: 'Financiación' },
  zonificacion: { href: '#zonificacion', label: 'Uso de suelo' },
  contacto:     { href: '#contacto',     label: 'Contacto' },
} as const

type NavKey = keyof typeof NAV_ITEMS | 'recorrido3d'

// 'recorrido3d' no está en NAV_ITEMS: es /mapa-3d (ruta, no ancla de esta misma
// página), así que se renderiza aparte como <Link>. Va acá sólo como marcador
// de posición dentro del orden.
//
// Escritorio y celular tienen ÓRDENES DISTINTOS (pedido explícito del owner):
// en escritorio, Galería / El proyecto / Recorrido 3D van primero (con el 3D
// destacado); en la hamburguesa el orden es otro y ninguno lleva tratamiento
// especial.
const DESKTOP_ORDER: NavKey[] = ['galeria', 'proyecto', 'recorrido3d', 'lotes', 'precios', 'financiacion', 'zonificacion', 'contacto']
const MOBILE_ORDER: NavKey[] = ['proyecto', 'galeria', 'recorrido3d', 'zonificacion', 'lotes', 'precios', 'financiacion', 'contacto']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      {/* Logo Desarrollos Payé — marca de agua fija en la esquina, fuera de la
          barra del nav (z-50 > nav's z-40 para quedar siempre por delante,
          incluso con el fondo blanco del nav al scrollear). */}
      <a
        href="#inicio"
        className="fixed top-2 left-3 z-50 sm:top-3 sm:left-4"
        aria-label="Ir al inicio"
      >
        <Image
          src="/logo-paye.png"
          alt="Desarrollos Payé"
          width={712}
          height={400}
          priority
          className="h-14 w-auto sm:h-20"
          style={{ filter: scrolled ? 'none' : 'brightness(0) invert(1)' }}
        />
      </a>

      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'bg-white/97 shadow-sm backdrop-blur-sm' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between py-4 pl-32 pr-6 sm:pl-44">
          <a href="#inicio" className="flex items-center gap-3">
            <span
              className="text-xs font-semibold"
              style={{ color: scrolled ? '#6B6660' : 'rgba(242,236,224,0.75)' }}
            >
              Inicio
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden items-center gap-6 md:flex">
            {DESKTOP_ORDER.map((key) =>
              key === 'recorrido3d' ? (
                <Link
                  key={key}
                  href="/mapa-3d"
                  className="rounded-full border px-3 py-1.5 text-sm font-bold transition-colors hover:opacity-80"
                  style={{
                    borderColor: '#AA1120',
                    color: '#AA1120',
                    background: scrolled ? 'rgba(170,17,32,0.06)' : 'rgba(255,255,255,0.12)',
                  }}
                >
                  ▶ Recorrido 3D
                </Link>
              ) : (
                <a
                  key={key}
                  href={NAV_ITEMS[key].href}
                  className="text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: scrolled ? '#2E2A26' : 'rgba(242,236,224,0.9)' }}
                >
                  {NAV_ITEMS[key].label}
                </a>
              )
            )}
            <a
              href="#contacto"
              className="rounded-full px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#AA1120' }}
            >
              Consultar
            </a>
          </div>

          {/* Mobile menu button — p-2.5 + -m-2.5 llevan el target táctil a 44×44
              (mínimo de Apple) sin mover el ícono ni el layout del resto de la barra. */}
          <button
            className="-m-2.5 p-2.5 md:hidden"
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
            {MOBILE_ORDER.map((key) =>
              key === 'recorrido3d' ? (
                <Link
                  key={key}
                  href="/mapa-3d"
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-sm font-medium"
                  style={{ color: '#2E2A26', borderBottom: '1px solid #F2ECE0' }}
                >
                  Recorrido 3D
                </Link>
              ) : (
                <a
                  key={key}
                  href={NAV_ITEMS[key].href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-sm font-medium"
                  style={{ color: '#2E2A26', borderBottom: '1px solid #F2ECE0' }}
                >
                  {NAV_ITEMS[key].label}
                </a>
              )
            )}
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
    </>
  )
}
