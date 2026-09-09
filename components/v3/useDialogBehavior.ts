'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

// Comportamiento de diálogo accesible: foco atrapado, Escape global, scroll
// lock del body y restauración de foco. No hay ningún modal nativo del que
// partir — esto se escribe desde cero.
//
// El cleanup corre cuando `isOpen` pasa a false, no cuando el componente se
// desmonta: con AnimatePresence el nodo sigue vivo ~280ms después del cierre
// (la animación de salida), así que atar la restauración de foco al
// desmontaje la dejaría atrasada. Atarla a `isOpen` la dispara al instante.
export function useDialogBehavior(isOpen: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    const body = document.body
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = body.style.overflow
    const prevPaddingRight = body.style.paddingRight
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      body.style.overflow = prevOverflow
      body.style.paddingRight = prevPaddingRight
      previouslyFocused?.focus?.()
    }
  }, [isOpen, onClose])

  return { panelRef }
}
