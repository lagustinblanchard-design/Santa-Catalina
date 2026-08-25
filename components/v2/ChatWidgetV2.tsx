'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// BotpressPanel es el único módulo que importa '@botpress/webchat' (~40 dependencias).
// ssr:false + carga diferida hasta el primer click mantienen ese árbol fuera del
// bundle inicial de /v2 — ver components/v2/BotpressPanel.tsx.
const BotpressPanel = dynamic(() => import('./BotpressPanel'), { ssr: false })

export default function ChatWidgetV2() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  function handleToggle() {
    if (!hasLoaded) {
      setHasLoaded(true)
    }
    setIsOpen(prev => !prev)
  }

  return (
    <>
      {hasLoaded && <BotpressPanel isOpen={isOpen} />}

      <button
        type="button"
        onClick={handleToggle}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
        aria-expanded={isOpen}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          background: '#0C0C0C',
          border: '1px solid #1a1a1a',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          outlineColor: '#FF1200',
        }}
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#f5f0eb" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#f5f0eb" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm3.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm3.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.5-1.185A8.214 8.214 0 0 1 3 12C3 7.444 7.03 3.75 12 3.75S21 7.444 21 12Z"
            />
          </svg>
        )}
      </button>
    </>
  )
}
