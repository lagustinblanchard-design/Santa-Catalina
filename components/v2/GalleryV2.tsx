'use client'

import Image from 'next/image'
import { useState } from 'react'

const CINZEL  = "var(--font-cinzel), 'Cinzel', serif"
const JOSEFIN = "var(--font-josefin), 'Josefin Sans', sans-serif"

const PHOTOS: { src: string; alt: string }[] = [
  // { src: '/gallery/dron-01.jpg', alt: 'Vista aérea del desarrollo' },
]

export default function GalleryV2() {
  const [active, setActive] = useState(0)

  return (
    <section id="galeria" style={{ background: '#111', padding: '7rem 1.5rem' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <div style={{ width: 32, height: 1, background: '#FF1200' }} />
          <span style={{ fontFamily: JOSEFIN, fontSize: '0.58rem', letterSpacing: '0.3em', color: '#FF1200', textTransform: 'uppercase' }}>
            Galería
          </span>
        </div>

        <h2 style={{ fontFamily: CINZEL, fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, color: '#F5F0EB', marginBottom: '3rem' }}>
          Fotos del desarrollo
        </h2>

        {PHOTOS.length === 0 ? (
          <div style={{
            border: '1px solid #1a1a1a', background: '#0C0C0C',
            aspectRatio: '16/9', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '1rem',
          }}>
            <svg width={40} height={40} fill="none" viewBox="0 0 24 24" stroke="#2a2a2a" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            <p style={{ fontFamily: CINZEL, fontSize: '1rem', color: '#2a2a2a' }}>Fotos de dron próximamente</p>
            <p style={{ fontFamily: JOSEFIN, fontSize: '0.65rem', color: '#1a1a1a', letterSpacing: '0.1em' }}>
              Colocá las fotos en <code style={{ background: '#111', padding: '0.1rem 0.4rem', color: '#333' }}>public/gallery/</code>
            </p>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <Image src={PHOTOS[active].src} alt={PHOTOS[active].alt} fill className="object-cover" sizes="100vw" />
            </div>
            {PHOTOS.length > 1 && (
              <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {PHOTOS.map((photo, i) => (
                  <button key={i} onClick={() => setActive(i)} style={{
                    position: 'relative', flexShrink: 0, width: 120, height: 72,
                    overflow: 'hidden', border: 'none', cursor: 'pointer',
                    outline: active === i ? '2px solid #FF1200' : 'none',
                    opacity: active === i ? 1 : 0.5, transition: 'opacity 0.2s',
                  }}>
                    <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="120px" />
                  </button>
                ))}
              </div>
            )}
            <p style={{ fontFamily: JOSEFIN, fontSize: '0.65rem', color: '#333', letterSpacing: '0.1em', marginTop: '1rem', textAlign: 'center' }}>
              {PHOTOS[active].alt} · {active + 1} / {PHOTOS.length}
            </p>
          </>
        )}
      </div>
    </section>
  )
}
