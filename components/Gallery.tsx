'use client'

import Image from 'next/image'
import { useState } from 'react'

// Add your drone photo filenames here (place files in public/gallery/)
const PHOTOS: { src: string; alt: string }[] = [
  // Example: { src: '/gallery/dron-01.jpg', alt: 'Vista aérea del desarrollo' },
  // Example: { src: '/gallery/dron-02.jpg', alt: 'Manzanas del loteo' },
]

export default function Gallery() {
  const [active, setActive] = useState(0)

  if (PHOTOS.length === 0) {
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

        {/* Main image */}
        <div className="relative mb-4 overflow-hidden rounded-2xl" style={{ aspectRatio: '16/9' }}>
          <Image
            src={PHOTOS[active].src}
            alt={PHOTOS[active].alt}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 768px) 100vw, 1152px"
          />
        </div>

        {/* Thumbnails */}
        {PHOTOS.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {PHOTOS.map((photo, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  active === i ? 'border-red-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-80'
                }`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </button>
            ))}
          </div>
        )}

        <p className="mt-4 text-center text-sm text-white/40">
          {PHOTOS[active].alt} · {active + 1} / {PHOTOS.length}
        </p>
      </div>
    </section>
  )
}
