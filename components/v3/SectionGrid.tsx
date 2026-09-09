'use client'

import type { V3Banner, V3SectionKey } from '@/lib/v3-banners'
import SectionCard from './SectionCard'

// Segunda página del Hero: los 4 botones de sección flotando sobre el video
// del Hero, como tarjetas de vidrio en grilla 2×2 — no un tablero opaco de
// borde a borde. `active` gatea la entrada escalonada (y su reverso al volver
// a la intro) y el tabIndex de cada tarjeta (ver SectionCard).
export default function SectionGrid({
  banners,
  active,
  onOpen,
}: {
  banners: V3Banner[]
  active: boolean
  onOpen: (key: V3SectionKey) => void
}) {
  return (
    <div className="relative h-full w-full">
      <p
        className="pointer-events-none absolute left-6 top-20 z-10 text-xs font-bold uppercase tracking-[0.3em] sm:left-10 sm:top-24"
        style={{ color: 'rgba(242,236,224,0.5)' }}
      >
        Explorá el proyecto
      </p>

      <div
        className="grid h-full grid-cols-2 grid-rows-2 gap-4 px-5 pb-20 pt-24 sm:gap-6 sm:px-10 sm:pb-24 sm:pt-28"
        style={{ perspective: 1200 }}
      >
        {banners.map((b, i) => (
          <SectionCard key={b.key} banner={b} index={i} active={active} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}
