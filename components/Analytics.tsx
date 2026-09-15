'use client'

/**
 * Google Analytics 4 — no hace nada hasta que se cumplan dos condiciones:
 *
 * 1. Que exista NEXT_PUBLIC_GA_ID (vacío hoy — no rompe nada, el componente
 *    renderiza null). Se activa pegando el Measurement ID (G-XXXXXXX) en las
 *    env vars de Vercel; no hace falta tocar código.
 * 2. Que el usuario haya aceptado el banner de cookies (components/CookieBanner.tsx).
 *    Cargar gtag antes de eso pondría una cookie de terceros sin consentimiento,
 *    lo cual el banner (hoy sólo "cookies propias") ya no podría prometer.
 */

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_EVENT } from '@/lib/consent'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function Analytics() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (!GA_ID) return
    try {
      if (localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted') setAllowed(true)
    } catch {
      // localStorage no disponible — se queda sin analítica, no es crítico
    }
    const onAccept = () => setAllowed(true)
    window.addEventListener(COOKIE_CONSENT_EVENT, onAccept)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onAccept)
  }, [])

  if (!GA_ID || !allowed) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  )
}
