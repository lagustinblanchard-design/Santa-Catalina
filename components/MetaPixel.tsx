'use client'

/**
 * Píxel de Meta (dataset "RE/MAX Payé", del portafolio REMAX PAYE) — mismo criterio que
 * Analytics.tsx: no carga nada hasta que el usuario acepta el banner de cookies, porque
 * el píxel pone cookies de terceros con fines publicitarios.
 *
 * Eventos:
 * - PageView: al cargar y en cada cambio de ruta (App Router no recarga la página).
 * - Contact: click en cualquier link a wa.me (Hero, Cierre, botón flotante) — un solo
 *   listener acá en vez de tocar cada componente.
 * - Lead: lo dispara ContactForm al confirmar el envío, vía trackMeta().
 *
 * NEXT_PUBLIC_META_PIXEL_ID permite cambiarlo desde Vercel; el ID no es secreto.
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_EVENT } from '@/lib/consent'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1073694507423162'

type Fbq = (...args: unknown[]) => void

/** Dispara un evento estándar del píxel si está cargado; si no (sin consentimiento), no hace nada. */
export function trackMeta(event: string, params?: Record<string, unknown>) {
  const fbq = (window as unknown as { fbq?: Fbq }).fbq
  if (fbq) fbq('track', event, params)
}

export default function MetaPixel() {
  const [allowed, setAllowed] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    try {
      if (localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted') setAllowed(true)
    } catch {
      // localStorage no disponible — se queda sin píxel, no es crítico
    }
    const onAccept = () => setAllowed(true)
    window.addEventListener(COOKIE_CONSENT_EVENT, onAccept)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onAccept)
  }, [])

  // PageView en navegación del lado del cliente (el init del script ya manda el primero).
  const [firstPath] = useState(pathname)
  useEffect(() => {
    if (allowed && pathname !== firstPath) trackMeta('PageView')
  }, [allowed, pathname, firstPath])

  useEffect(() => {
    if (!allowed) return
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a')
      if (a?.href.includes('wa.me/')) trackMeta('Contact', { content_name: 'WhatsApp' })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [allowed])

  if (!allowed) return null

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${PIXEL_ID}');
        fbq('track', 'PageView');
      `}
    </Script>
  )
}
