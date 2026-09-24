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
} as const

type NavKey = keyof typeof NAV_ITEMS | 'recorrido3d'

// 'recorrido3d' no está en NAV_ITEMS: es /mapa-3d (ruta, no ancla de esta misma
// página), así que se renderiza aparte como <Link>. Va acá sólo como marcador
// de posición dentro del orden.
//
// "Contacto" salió de los dos órdenes (era un link redundante: el botón
// "Consultar"/"Consultar ahora", que ya se renderiza inmediatamente después de
// este .map(), hace exactamente lo mismo — scrollea a #contacto). 'recorrido3d'
// pasa a ser el ÚLTIMO de cada orden a propósito: al ser lo último antes de
// ese botón, queda pegado a "Consultar"/"Consultar ahora" sin tocar el JSX de
// abajo.
//
// Escritorio y celular siguen con ÓRDENES DISTINTOS (pedido explícito del
// owner) para el resto de los items.
const DESKTOP_ORDER: NavKey[] = ['galeria', 'proyecto', 'lotes', 'precios', 'financiacion', 'zonificacion', 'recorrido3d']
const MOBILE_ORDER: NavKey[] = ['proyecto', 'galeria', 'zonificacion', 'lotes', 'precios', 'financiacion', 'recorrido3d']

// Secciones con link propio en el nav — se trackean con IntersectionObserver
// para resaltar cuál está a la vista (scroll-spy). "contacto" no entra: ya no
// tiene link propio. "inicio" tampoco: no hay nada que resaltar ahí.
const TRACKED_IDS = ['proyecto', 'lotes', 'precios', 'financiacion', 'zonificacion', 'galeria']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Scroll-spy: qué sección está "activa" mientras se scrollea, para resaltar
  // su link en el nav. rootMargin angosto al centro del viewport en vez de
  // medir qué sección ocupa más pantalla — las secciones tienen altos muy
  // dispares (el sticky de TimelineStage mide 480-760vh y no tiene id propio),
  // así que medir proporción de intersección siempre favorecería a las cortas.
  // La franja central es el truco estándar de scroll-spy, independiente del
  // alto de cada sección.
  useEffect(() => {
    const els = TRACKED_IDS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null)
    if (els.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting)
        if (hit) setActiveId(hit.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Mismo acento que ya usa el resto del sitio para "seleccionado" (ver
  // PriceCalculator.tsx: color #AA1120 + fontWeight 700 en la tipología activa).
  const isActive = (key: keyof typeof NAV_ITEMS) => NAV_ITEMS[key].href === `#${activeId}`

  // Escritorio: el fondo de la barra cambia con `scrolled` (transparente sobre
  // el video / blanco al scrollear), así que el color por defecto depende de eso.
  function desktopLinkStyle(key: keyof typeof NAV_ITEMS) {
    if (isActive(key)) return { color: '#AA1120', fontWeight: 700 }
    return { color: scrolled ? '#2E2A26' : 'rgba(242,236,224,0.9)' }
  }

  // Celular: el menú desplegado siempre tiene fondo blanco (ver className más
  // abajo), sin importar `scrolled` — a diferencia del de escritorio, acá el
  // color por defecto es fijo.
  function mobileLinkStyle(key: keyof typeof NAV_ITEMS) {
    if (isActive(key)) return { color: '#AA1120', fontWeight: 700 }
    return { color: '#2E2A26' }
  }

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
        {/* min-h-[100px]: el logo watermark mide 80px y arranca a 12px del borde
            (top-3) → 92px de punta a punta. Si esta fila fuera más baja, el
            fondo del nav (blanco al scrollear) no llega a cubrirlo entero y se
            ve lo que hay detrás asomando por debajo del logo. */}
        <div className="mx-auto flex min-h-[100px] max-w-6xl items-center justify-between pl-32 pr-6 sm:pl-44">
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
                  style={desktopLinkStyle(key)}
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
                  style={{ ...mobileLinkStyle(key), borderBottom: '1px solid #F2ECE0' }}
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
