'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'santa-catalina-cookie-consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      // localStorage no disponible (modo privado, etc.) — no mostramos el banner
    }
  }, [])

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted')
    } catch {
      // ignorar — el banner se vuelve a mostrar en la próxima visita, no es crítico
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-4 py-4 sm:px-6"
      style={{ background: '#2E2A26' }}
      role="region"
      aria-label="Aviso de cookies"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm" style={{ color: '#D8D2C7' }}>
          Usamos cookies propias para mejorar tu experiencia en el sitio. Más información en nuestra{' '}
          <Link href="/privacidad" className="underline" style={{ color: '#fff' }}>
            Política de privacidad
          </Link>.
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-full px-6 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#AA1120' }}
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}
