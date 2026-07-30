'use client'

import { SITE } from '@/lib/data'

const CINZEL  = "var(--font-cinzel), 'Cinzel', serif"
const JOSEFIN = "var(--font-josefin), 'Josefin Sans', sans-serif"

export default function HeroV2() {
  return (
    <section id="inicio" style={{
      minHeight: '100svh', background: '#0C0C0C',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      padding: '6rem 1.5rem 4rem',
    }}>
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* Red vertical accent */}
      <div style={{ position: 'absolute', left: '6%', top: '15%', bottom: '15%', width: 1, background: 'linear-gradient(to bottom, transparent, #FF1200, transparent)' }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 960 }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
          border: '1px solid #1a1a1a', padding: '0.5rem 1.25rem', marginBottom: '3.5rem',
        }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, background: '#FF1200', borderRadius: '50%' }} />
          <span style={{ fontFamily: JOSEFIN, fontSize: '0.6rem', letterSpacing: '0.3em', color: '#aaa', textTransform: 'uppercase' }}>
            RE/MAX PAYÉ · Corrientes Capital
          </span>
        </div>

        {/* Main title */}
        <h1 style={{
          fontFamily: CINZEL,
          fontSize: 'clamp(3.5rem, 13vw, 12rem)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 0.88,
          color: '#F5F0EB',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}>
          Predios
        </h1>
        <h1 style={{
          fontFamily: CINZEL,
          fontSize: 'clamp(3.5rem, 13vw, 12rem)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 0.88,
          color: '#FF1200',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}>
          Santa
        </h1>
        <h1 style={{
          fontFamily: CINZEL,
          fontSize: 'clamp(3.5rem, 13vw, 12rem)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 0.88,
          color: '#F5F0EB',
          textTransform: 'uppercase',
          marginBottom: '3rem',
        }}>
          Catalina
        </h1>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ flex: 1, maxWidth: 80, height: 1, background: '#1a1a1a' }} />
          <span style={{ fontFamily: JOSEFIN, fontSize: '0.6rem', letterSpacing: '0.3em', color: '#888', textTransform: 'uppercase' }}>
            {SITE.stage}
          </span>
          <div style={{ flex: 1, maxWidth: 80, height: 1, background: '#1a1a1a' }} />
        </div>

        <p style={{
          fontFamily: JOSEFIN, fontSize: '0.75rem', letterSpacing: '0.2em',
          color: '#aaa', textTransform: 'uppercase', marginBottom: '3.5rem',
          maxWidth: 440, margin: '0 auto 3.5rem',
        }}>
          {SITE.location}
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '5rem' }}>
          <a href="#lotes" style={{
            fontFamily: JOSEFIN, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase',
            background: '#FF1200', color: '#fff', padding: '1rem 2.5rem', textDecoration: 'none', transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >Ver lotes disponibles</a>
          <a href="#precios" style={{
            fontFamily: JOSEFIN, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase',
            background: '#111', color: '#666', padding: '1rem 2.5rem', textDecoration: 'none', transition: 'color 0.2s',
            border: '1px solid #1a1a1a',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f5f0eb')}
          onMouseLeave={e => (e.currentTarget.style.color = '#666')}
          >Ver precios</a>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0, borderTop: '1px solid #1a1a1a', paddingTop: '2.5rem',
        }}>
          {[
            { val: '14',      sub: 'Manzanas' },
            { val: '312–450', sub: 'm² por lote' },
            { val: 'USD',     sub: 'Financiación' },
          ].map((s, i) => (
            <div key={s.sub} style={{ paddingRight: i < 2 ? '2rem' : 0, borderRight: i < 2 ? '1px solid #1a1a1a' : 'none', paddingLeft: i > 0 ? '2rem' : 0 }}>
              <p style={{ fontFamily: CINZEL, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, color: '#F5F0EB', marginBottom: '0.25rem' }}>
                {s.val}
              </p>
              <p style={{ fontFamily: JOSEFIN, fontSize: '0.55rem', letterSpacing: '0.2em', color: '#888', textTransform: 'uppercase' }}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div className="animate-bounce" style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)' }}>
        <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="#2a2a2a" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
