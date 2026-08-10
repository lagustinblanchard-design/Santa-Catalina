'use client'

import Image from 'next/image'
import { useState } from 'react'

type GalleryItem =
  | { kind: 'photo'; src: string; alt: string }
  | { kind: 'video'; src: string; poster: string; alt: string }

// Fotos y video reales del vuelo de dron del 29/07/2026 (mismo vuelo que el
// ortomosaico de /mapa-3d — ver lib/ortho.ts), bajados de Drive y procesados
// con sharp/ffmpeg sin tocar los originales:
// - Fotos: 7,4 MB -> ~0,5 MB c/u (resize 2400px + jpeg q82).
// - Video: sin audio (sólo pista de video + telemetría del dron). Los 4 clips
//   originales (2720x1530 @ 60fps, ~80 Mbps, 1,7 GB en total) se bajaron a
//   1080p/30fps h264 crf23 para que el peso sea razonable en la página.
const DRONE_PHOTO_ALT = 'Vista aérea del loteo en plena apertura de calles — barrio PROCREAR de fondo (dron, 29/07/2026)'
const DRONE_VIDEO_ALT = 'Sobrevuelo del loteo en plena apertura de calles (dron, 29/07/2026)'

const PHOTOS: GalleryItem[] = Array.from({ length: 10 }, (_, i) => ({
  kind: 'photo',
  src: `/gallery/dron-${String(i + 1).padStart(2, '0')}.jpg`,
  alt: DRONE_PHOTO_ALT,
}))

const VIDEOS: GalleryItem[] = Array.from({ length: 4 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0')
  return { kind: 'video', src: `/gallery/dron-video-${n}.mp4`, poster: `/gallery/dron-video-${n}-poster.jpg`, alt: DRONE_VIDEO_ALT }
})

const ITEMS: GalleryItem[] = [...PHOTOS, ...VIDEOS]

export default function Gallery() {
  const [active, setActive] = useState(0)

  if (ITEMS.length === 0) {
    return (
      <section id="galeria" className="bg-gray-900 py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/60">
            Galería
          </span>
          <h2 className="text-4xl font-black text-white mb-6">Fotos del desarrollo</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 py-20 text-white/40">
            <p className="text-lg font-medium">Fotos de dron próximamente</p>
            <p className="mt-2 text-sm">
              Colocá las fotos en <code className="bg-white/10 rounded px-1 py-0.5 text-white/60">public/gallery/</code> y
              registralas en <code className="bg-white/10 rounded px-1 py-0.5 text-white/60">components/Gallery.tsx</code>
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="galeria" className="bg-gray-900 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/60">
            Galería
          </span>
          <h2 className="text-4xl font-black text-white">Fotos del desarrollo</h2>
        </div>

        {/* Main media */}
        <div className="relative mb-4 overflow-hidden rounded-2xl" style={{ aspectRatio: '16/9' }}>
          {ITEMS[active].kind === 'video' ? (
            <video
              key={ITEMS[active].src}
              src={ITEMS[active].src}
              poster={ITEMS[active].poster}
              controls
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Image
              src={ITEMS[active].src}
              alt={ITEMS[active].alt}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 768px) 100vw, 1152px"
            />
          )}
        </div>

        {/* Thumbnails */}
        {ITEMS.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {ITEMS.map((item, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  active === i ? 'border-red-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-80'
                }`}
              >
                <Image
                  src={item.kind === 'video' ? item.poster : item.src}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
                {item.kind === 'video' && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current text-gray-900">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <p className="mt-4 text-center text-sm text-white/40">
          {ITEMS[active].alt} · {active + 1} / {ITEMS.length}
        </p>
      </div>
    </section>
  )
}
