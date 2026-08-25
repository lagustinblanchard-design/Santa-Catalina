'use client'

import { Webchat } from '@botpress/webchat'
import { SITE } from '@/lib/data'

type BotpressPanelProps = {
  isOpen: boolean
}

// Único archivo que importa '@botpress/webchat' — mantenerlo así.
// La librería arrastra ~40 dependencias (react-markdown, motion, zustand, radix, etc.);
// aislarla en su propio módulo es lo que permite a ChatWidgetV2 diferir la carga con
// next/dynamic({ ssr: false }) y mantener esas dependencias fuera del bundle inicial de /v2.
export default function BotpressPanel({ isOpen }: BotpressPanelProps) {
  const clientId = process.env.NEXT_PUBLIC_BOTPRESS_CLIENT_ID

  if (!clientId) {
    return null
  }

  return (
    <Webchat
      clientId={clientId}
      configuration={{
        botName: SITE.name,
        botDescription: SITE.tagline,
      }}
      style={{
        position: 'fixed',
        bottom: '6rem',
        right: '1.5rem',
        width: '380px',
        height: '600px',
        maxHeight: 'calc(100vh - 8rem)',
        display: isOpen ? 'flex' : 'none',
        zIndex: 50,
      }}
    />
  )
}
