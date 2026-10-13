'use client'

import { useEffect } from 'react'
import { AGENTS, REF_STORAGE_KEY, getStoredRef } from '@/lib/agents'

// Asociación lead → agente (ver lib/agents.ts). Guarda ?ref= al entrar y, en vez
// de tocar cada botón de WhatsApp del sitio, reescribe el link wa.me en el click
// (fase de captura, antes de que el navegador navegue): mismo patrón que el
// listener de Contact en MetaPixel.tsx.
export default function AgentRef() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('ref')?.toLowerCase()
    if (code && Object.hasOwn(AGENTS, code)) {
      try {
        localStorage.setItem(REF_STORAGE_KEY, JSON.stringify({ code, ts: Date.now() }))
      } catch {
        // localStorage no disponible — el ref vale solo si clickea sin recargar, no es crítico
      }
    }

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a')
      if (!a?.href.includes('wa.me/')) return
      const ref = getStoredRef() ?? (code && Object.hasOwn(AGENTS, code) ? code : null)
      if (!ref) return
      const url = new URL(a.href)
      const tag = `(Ref: ${ref.toUpperCase()})`
      const text = url.searchParams.get('text') ?? ''
      // encodeURIComponent y no searchParams.set: este último codifica espacios como "+",
      // que WhatsApp puede mostrar literal en el mensaje.
      const finalText = text.includes(tag) ? text : `${text} ${tag}`.trim()
      const phone = AGENTS[ref].phone?.replace(/\D/g, '') ?? url.pathname.slice(1)
      a.href = `https://wa.me/${phone}?text=${encodeURIComponent(finalText)}`
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
